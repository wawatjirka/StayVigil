use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Tier thresholds in base units (6 decimals, pump.fun standard)
pub const BRONZE_THRESHOLD: u64 = 1_000 * 1_000_000;      // 1,000 tokens
pub const SILVER_THRESHOLD: u64 = 5_000 * 1_000_000;      // 5,000 tokens
pub const GOLD_THRESHOLD: u64 = 25_000 * 1_000_000;       // 25,000 tokens
pub const PLATINUM_THRESHOLD: u64 = 100_000 * 1_000_000;  // 100,000 tokens

pub const UNSTAKE_COOLDOWN: i64 = 7 * 24 * 60 * 60; // 7 days in seconds

// Slash distribution: 60% challenger, 20% bounty vault, 20% burned (stays in vault)
pub const SLASH_CHALLENGER_BPS: u64 = 6000;
pub const SLASH_BOUNTY_BPS: u64 = 2000;

#[program]
pub mod vigil_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.vigil_token_mint = ctx.accounts.vigil_token_mint.key();
        config.challenge_program = Pubkey::default();
        config.bounty_vault = Pubkey::default();
        config.total_stakers = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn set_challenge_program(ctx: Context<AdminConfig>, program_id: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.challenge_program = program_id;
        Ok(())
    }

    pub fn set_bounty_vault(ctx: Context<AdminConfig>, vault_address: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.bounty_vault = vault_address;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::ZeroAmount);

        // Transfer tokens from auditor to vault PDA
        let cpi_accounts = Transfer {
            from: ctx.accounts.auditor_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.auditor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        let stake_info = &mut ctx.accounts.stake_info;
        let was_new = stake_info.amount == 0 && !stake_info.is_registered;

        stake_info.auditor = ctx.accounts.auditor.key();
        stake_info.amount = stake_info.amount.checked_add(amount).unwrap();
        stake_info.is_registered = true;
        stake_info.bump = ctx.bumps.stake_info;

        if was_new {
            let config = &mut ctx.accounts.config;
            config.total_stakers = config.total_stakers.checked_add(1).unwrap();
        }

        emit!(StakeEvent {
            auditor: ctx.accounts.auditor.key(),
            amount,
            total_staked: stake_info.amount,
            tier: calculate_tier(stake_info.amount),
        });

        Ok(())
    }

    pub fn request_unstake(ctx: Context<RequestUnstake>, amount: u64) -> Result<()> {
        let stake_info = &mut ctx.accounts.stake_info;
        require!(amount > 0, ErrorCode::ZeroAmount);
        require!(amount <= stake_info.amount, ErrorCode::InsufficientStake);

        let clock = Clock::get()?;
        stake_info.unstake_request_time = clock.unix_timestamp;
        stake_info.unstake_request_amount = amount;

        emit!(UnstakeRequestEvent {
            auditor: ctx.accounts.auditor.key(),
            amount,
            available_at: clock.unix_timestamp + UNSTAKE_COOLDOWN,
        });

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let stake_info = &mut ctx.accounts.stake_info;
        require!(stake_info.unstake_request_amount > 0, ErrorCode::NoUnstakeRequest);

        let clock = Clock::get()?;
        let elapsed = clock.unix_timestamp - stake_info.unstake_request_time;
        require!(elapsed >= UNSTAKE_COOLDOWN, ErrorCode::CooldownNotElapsed);

        let amount = stake_info.unstake_request_amount;

        // Transfer tokens back from vault to auditor
        let config_key = ctx.accounts.config.key();
        let seeds = &[
            b"vault",
            config_key.as_ref(),
            &[ctx.accounts.config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.auditor_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds),
            amount,
        )?;

        stake_info.amount = stake_info.amount.checked_sub(amount).unwrap();
        stake_info.unstake_request_time = 0;
        stake_info.unstake_request_amount = 0;

        if stake_info.amount == 0 {
            stake_info.is_registered = false;
            let config = &mut ctx.accounts.config;
            config.total_stakers = config.total_stakers.saturating_sub(1);
        }

        emit!(UnstakeEvent {
            auditor: ctx.accounts.auditor.key(),
            amount,
            remaining: stake_info.amount,
        });

        Ok(())
    }

    /// Slash an auditor's stake. Called by authority in same tx as challenge resolve.
    /// Distribution: 60% to challenger, 20% to bounty vault, 20% stays (burned).
    pub fn slash(
        ctx: Context<Slash>,
        amount: u64,
    ) -> Result<()> {
        let stake_info = &mut ctx.accounts.stake_info;
        let actual_slash = amount.min(stake_info.amount);
        require!(actual_slash > 0, ErrorCode::InsufficientStake);

        let challenger_share = actual_slash * SLASH_CHALLENGER_BPS / 10000;
        let bounty_share = actual_slash * SLASH_BOUNTY_BPS / 10000;
        // Remaining 20% stays in vault (effectively burned from auditor's perspective)

        let config_key = ctx.accounts.config.key();
        let seeds = &[
            b"vault",
            config_key.as_ref(),
            &[ctx.accounts.config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer challenger's share
        if challenger_share > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.challenger_token_account.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer_seeds,
                ),
                challenger_share,
            )?;
        }

        // Transfer bounty vault's share
        if bounty_share > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.bounty_token_account.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer_seeds,
                ),
                bounty_share,
            )?;
        }

        stake_info.amount = stake_info.amount.checked_sub(actual_slash).unwrap();

        emit!(SlashEvent {
            auditor: stake_info.auditor,
            total_slashed: actual_slash,
            challenger_received: challenger_share,
            bounty_received: bounty_share,
            burned: actual_slash - challenger_share - bounty_share,
        });

        Ok(())
    }
}

// --- Accounts ---

#[account]
pub struct StakingConfig {
    pub authority: Pubkey,
    pub vigil_token_mint: Pubkey,
    pub challenge_program: Pubkey,
    pub bounty_vault: Pubkey,
    pub total_stakers: u64,
    pub bump: u8,
}

impl StakingConfig {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 32 + 8 + 1;
}

#[account]
pub struct StakeInfo {
    pub auditor: Pubkey,
    pub amount: u64,
    pub unstake_request_time: i64,
    pub unstake_request_amount: u64,
    pub is_registered: bool,
    pub bump: u8,
}

impl StakeInfo {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 1 + 1;
}

pub fn calculate_tier(amount: u64) -> u8 {
    if amount >= PLATINUM_THRESHOLD {
        4
    } else if amount >= GOLD_THRESHOLD {
        3
    } else if amount >= SILVER_THRESHOLD {
        2
    } else if amount >= BRONZE_THRESHOLD {
        1
    } else {
        0
    }
}

// --- Contexts ---

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = StakingConfig::SIZE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, StakingConfig>,
    pub vigil_token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, StakingConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, StakingConfig>,
    #[account(
        init_if_needed,
        payer = auditor,
        space = StakeInfo::SIZE,
        seeds = [b"stake", auditor.key().as_ref()],
        bump,
    )]
    pub stake_info: Account<'info, StakeInfo>,
    #[account(mut)]
    pub auditor: Signer<'info>,
    #[account(
        mut,
        constraint = auditor_token_account.owner == auditor.key(),
        constraint = auditor_token_account.mint == config.vigil_token_mint,
    )]
    pub auditor_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_account.mint == config.vigil_token_mint,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RequestUnstake<'info> {
    #[account(
        mut,
        seeds = [b"stake", auditor.key().as_ref()],
        bump = stake_info.bump,
        has_one = auditor,
    )]
    pub stake_info: Account<'info, StakeInfo>,
    pub auditor: Signer<'info>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, StakingConfig>,
    #[account(
        mut,
        seeds = [b"stake", auditor.key().as_ref()],
        bump = stake_info.bump,
        has_one = auditor,
    )]
    pub stake_info: Account<'info, StakeInfo>,
    #[account(mut)]
    pub auditor: Signer<'info>,
    #[account(
        mut,
        constraint = auditor_token_account.owner == auditor.key(),
        constraint = auditor_token_account.mint == config.vigil_token_mint,
    )]
    pub auditor_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_account.mint == config.vigil_token_mint,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for vault transfers
    #[account(
        seeds = [b"vault", config.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, StakingConfig>,
    #[account(
        mut,
        seeds = [b"stake", stake_info.auditor.as_ref()],
        bump = stake_info.bump,
    )]
    pub stake_info: Account<'info, StakeInfo>,
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = vault_token_account.mint == config.vigil_token_mint,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub challenger_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub bounty_token_account: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for vault transfers
    #[account(
        seeds = [b"vault", config.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

// --- Events ---

#[event]
pub struct StakeEvent {
    pub auditor: Pubkey,
    pub amount: u64,
    pub total_staked: u64,
    pub tier: u8,
}

#[event]
pub struct UnstakeRequestEvent {
    pub auditor: Pubkey,
    pub amount: u64,
    pub available_at: i64,
}

#[event]
pub struct UnstakeEvent {
    pub auditor: Pubkey,
    pub amount: u64,
    pub remaining: u64,
}

#[event]
pub struct SlashEvent {
    pub auditor: Pubkey,
    pub total_slashed: u64,
    pub challenger_received: u64,
    pub bounty_received: u64,
    pub burned: u64,
}

// --- Errors ---

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("No pending unstake request")]
    NoUnstakeRequest,
    #[msg("Unstake cooldown period has not elapsed (7 days)")]
    CooldownNotElapsed,
}

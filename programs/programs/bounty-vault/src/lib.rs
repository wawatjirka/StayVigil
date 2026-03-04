use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("9RK1q3G3oJX5eFPRGLMgV6JdWbczjWkY4aRq6LcaF5dm");

#[program]
pub mod bounty_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.vigil_token_mint = ctx.accounts.vigil_token_mint.key();
        config.reward_count = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::ZeroAmount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.depositor_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            amount,
        )?;

        emit!(DepositEvent {
            depositor: ctx.accounts.depositor.key(),
            amount,
        });

        Ok(())
    }

    /// Authority creates a reward entry for a challenge winner.
    pub fn create_reward(
        ctx: Context<CreateReward>,
        recipient: Pubkey,
        amount: u64,
        challenge_id: u64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::ZeroAmount);

        let config = &mut ctx.accounts.config;
        let reward_id = config.reward_count;
        config.reward_count = config.reward_count.checked_add(1).unwrap();

        let reward = &mut ctx.accounts.reward;
        reward.reward_id = reward_id;
        reward.recipient = recipient;
        reward.amount = amount;
        reward.claimed = false;
        reward.challenge_id = challenge_id;
        reward.bump = ctx.bumps.reward;

        emit!(RewardCreatedEvent {
            reward_id,
            recipient,
            amount,
            challenge_id,
        });

        Ok(())
    }

    /// Recipient claims their bounty reward.
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let reward = &mut ctx.accounts.reward;
        require!(!reward.claimed, ErrorCode::AlreadyClaimed);

        let config_key = ctx.accounts.config.key();
        let seeds = &[
            b"bounty_vault_auth",
            config_key.as_ref(),
            &[ctx.accounts.config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer_seeds,
            ),
            reward.amount,
        )?;

        reward.claimed = true;

        emit!(RewardClaimedEvent {
            reward_id: reward.reward_id,
            recipient: ctx.accounts.recipient.key(),
            amount: reward.amount,
        });

        Ok(())
    }
}

// --- Accounts ---

#[account]
pub struct VaultConfig {
    pub authority: Pubkey,
    pub vigil_token_mint: Pubkey,
    pub reward_count: u64,
    pub bump: u8,
}

impl VaultConfig {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 1;
}

#[account]
pub struct BountyReward {
    pub reward_id: u64,
    pub recipient: Pubkey,
    pub amount: u64,
    pub claimed: bool,
    pub challenge_id: u64,
    pub bump: u8,
}

impl BountyReward {
    pub const SIZE: usize = 8 + 8 + 32 + 8 + 1 + 8 + 1;
}

// --- Contexts ---

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = VaultConfig::SIZE,
        seeds = [b"vault_config"],
        bump,
    )]
    pub config: Account<'info, VaultConfig>,
    pub vigil_token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        seeds = [b"vault_config"],
        bump = config.bump,
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(
        mut,
        constraint = depositor_token_account.owner == depositor.key(),
        constraint = depositor_token_account.mint == config.vigil_token_mint,
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_account.mint == config.vigil_token_mint,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateReward<'info> {
    #[account(
        mut,
        seeds = [b"vault_config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(
        init,
        payer = authority,
        space = BountyReward::SIZE,
        seeds = [b"reward", config.reward_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub reward: Account<'info, BountyReward>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        seeds = [b"vault_config"],
        bump = config.bump,
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(
        mut,
        constraint = reward.recipient == recipient.key() @ ErrorCode::UnauthorizedRecipient,
    )]
    pub reward: Account<'info, BountyReward>,
    pub recipient: Signer<'info>,
    #[account(
        mut,
        constraint = recipient_token_account.owner == recipient.key(),
        constraint = recipient_token_account.mint == config.vigil_token_mint,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_account.mint == config.vigil_token_mint,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for vault transfers
    #[account(
        seeds = [b"bounty_vault_auth", config.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

// --- Events ---

#[event]
pub struct DepositEvent {
    pub depositor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardCreatedEvent {
    pub reward_id: u64,
    pub recipient: Pubkey,
    pub amount: u64,
    pub challenge_id: u64,
}

#[event]
pub struct RewardClaimedEvent {
    pub reward_id: u64,
    pub recipient: Pubkey,
    pub amount: u64,
}

// --- Errors ---

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Reward has already been claimed")]
    AlreadyClaimed,
    #[msg("Only the designated recipient can claim")]
    UnauthorizedRecipient,
}

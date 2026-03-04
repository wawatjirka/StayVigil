use anchor_lang::prelude::*;
use vigil_staking::StakeInfo;

declare_id!("HmbTLCmaGtYhSJaoxkmkN8CZqC9i5WhznDGQpsJHnUre");

pub const DISPUTE_WINDOW: i64 = 48 * 60 * 60; // 48 hours in seconds

#[program]
pub mod vigil_challenge {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.staking_program = ctx.accounts.staking_program.key();
        config.challenge_count = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        skill_id: String,
        proof_hash: [u8; 32],
    ) -> Result<()> {
        // Verify auditor has an active stake
        let stake_info = &ctx.accounts.auditor_stake_info;
        require!(stake_info.is_registered, ErrorCode::AuditorNotStaked);
        require!(stake_info.amount > 0, ErrorCode::AuditorNotStaked);

        let config = &mut ctx.accounts.config;
        let challenge_id = config.challenge_count;
        config.challenge_count = config.challenge_count.checked_add(1).unwrap();

        let challenge = &mut ctx.accounts.challenge;
        let clock = Clock::get()?;

        challenge.challenge_id = challenge_id;
        challenge.challenger = ctx.accounts.challenger.key();
        challenge.auditor = stake_info.auditor;
        challenge.skill_id = skill_id;
        challenge.proof_hash = proof_hash;
        challenge.counter_proof_hash = [0u8; 32];
        challenge.created_at = clock.unix_timestamp;
        challenge.responded_at = 0;
        challenge.status = ChallengeStatus::Open;
        challenge.slash_amount = 0;
        challenge.bump = ctx.bumps.challenge;

        emit!(ChallengeCreatedEvent {
            challenge_id,
            challenger: ctx.accounts.challenger.key(),
            auditor: stake_info.auditor,
            skill_id: challenge.skill_id.clone(),
        });

        Ok(())
    }

    pub fn respond(
        ctx: Context<Respond>,
        counter_proof_hash: [u8; 32],
    ) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        require!(challenge.status == ChallengeStatus::Open, ErrorCode::ChallengeNotOpen);

        let clock = Clock::get()?;
        let elapsed = clock.unix_timestamp - challenge.created_at;
        require!(elapsed <= DISPUTE_WINDOW, ErrorCode::DisputeWindowClosed);

        challenge.counter_proof_hash = counter_proof_hash;
        challenge.responded_at = clock.unix_timestamp;
        challenge.status = ChallengeStatus::Responded;

        emit!(ChallengeRespondedEvent {
            challenge_id: challenge.challenge_id,
            auditor: ctx.accounts.auditor.key(),
        });

        Ok(())
    }

    /// Authority resolves the challenge. If should_slash is true,
    /// the authority must also call staking::slash in the same transaction.
    pub fn resolve(
        ctx: Context<Resolve>,
        should_slash: bool,
        slash_amount: u64,
    ) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        require!(
            challenge.status == ChallengeStatus::Open || challenge.status == ChallengeStatus::Responded,
            ErrorCode::ChallengeNotOpen,
        );

        if should_slash {
            challenge.status = ChallengeStatus::Slashed;
            challenge.slash_amount = slash_amount;
        } else {
            challenge.status = ChallengeStatus::Dismissed;
        }

        emit!(ChallengeResolvedEvent {
            challenge_id: challenge.challenge_id,
            status: challenge.status,
            slash_amount: challenge.slash_amount,
        });

        Ok(())
    }
}

// --- Accounts ---

#[account]
pub struct ChallengeConfig {
    pub authority: Pubkey,
    pub staking_program: Pubkey,
    pub challenge_count: u64,
    pub bump: u8,
}

impl ChallengeConfig {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 1;
}

#[account]
pub struct Challenge {
    pub challenge_id: u64,
    pub challenger: Pubkey,
    pub auditor: Pubkey,
    pub skill_id: String,    // Max 128 bytes
    pub proof_hash: [u8; 32],
    pub counter_proof_hash: [u8; 32],
    pub created_at: i64,
    pub responded_at: i64,
    pub status: ChallengeStatus,
    pub slash_amount: u64,
    pub bump: u8,
}

impl Challenge {
    // 8 discriminator + 8 id + 32 challenger + 32 auditor + (4+128) skill_id
    // + 32 proof + 32 counter_proof + 8 created + 8 responded + 1 status + 8 slash + 1 bump
    pub const SIZE: usize = 8 + 8 + 32 + 32 + (4 + 128) + 32 + 32 + 8 + 8 + 1 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ChallengeStatus {
    Open,
    Responded,
    Slashed,
    Dismissed,
}

// --- Contexts ---

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = ChallengeConfig::SIZE,
        seeds = [b"challenge_config"],
        bump,
    )]
    pub config: Account<'info, ChallengeConfig>,
    /// CHECK: Staking program ID for reference
    pub staking_program: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateChallenge<'info> {
    #[account(
        mut,
        seeds = [b"challenge_config"],
        bump = config.bump,
    )]
    pub config: Account<'info, ChallengeConfig>,
    #[account(
        init,
        payer = challenger,
        space = Challenge::SIZE,
        seeds = [b"challenge", config.challenge_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub challenge: Account<'info, Challenge>,
    /// The auditor's StakeInfo PDA from the staking program — read-only verification
    #[account(
        owner = config.staking_program,
    )]
    pub auditor_stake_info: Account<'info, StakeInfo>,
    #[account(mut)]
    pub challenger: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Respond<'info> {
    #[account(
        mut,
        constraint = challenge.auditor == auditor.key() @ ErrorCode::UnauthorizedAuditor,
    )]
    pub challenge: Account<'info, Challenge>,
    pub auditor: Signer<'info>,
}

#[derive(Accounts)]
pub struct Resolve<'info> {
    #[account(
        seeds = [b"challenge_config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, ChallengeConfig>,
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    pub authority: Signer<'info>,
}

// --- Events ---

#[event]
pub struct ChallengeCreatedEvent {
    pub challenge_id: u64,
    pub challenger: Pubkey,
    pub auditor: Pubkey,
    pub skill_id: String,
}

#[event]
pub struct ChallengeRespondedEvent {
    pub challenge_id: u64,
    pub auditor: Pubkey,
}

#[event]
pub struct ChallengeResolvedEvent {
    pub challenge_id: u64,
    pub status: ChallengeStatus,
    pub slash_amount: u64,
}

// --- Errors ---

#[error_code]
pub enum ErrorCode {
    #[msg("Auditor does not have an active stake")]
    AuditorNotStaked,
    #[msg("Challenge is not in an open state")]
    ChallengeNotOpen,
    #[msg("Dispute window has closed (48 hours)")]
    DisputeWindowClosed,
    #[msg("Only the challenged auditor can respond")]
    UnauthorizedAuditor,
}

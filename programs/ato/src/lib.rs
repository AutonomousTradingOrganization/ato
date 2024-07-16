use anchor_lang::prelude::*;

mod constants; pub use constants::*;
mod states;    pub use states::*;

#[macro_use]
mod macros;

pub mod instructions;  use instructions::*;

mod errors;		//pub use errors::AtoError;

declare_id!("6Xqiy6ZcCm54aSbNd5uXrDko3tMZGf5zVhBYykzNHkJJ");

#[program]
pub mod ato {

	use super::*;

	pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
		initialize::call(ctx)
	}

	pub fn set_scheduler(ctx: Context<SetScheduler>, key: Pubkey) -> Result<()> {
		set_scheduler::call(ctx, key)
	}

	pub fn set_pause(ctx: Context<SetPause>, to: bool) -> Result<()> {
		set_pause::call(ctx, to)
	}

	pub fn proposal_create(
		ctx        : Context<ProposalCreate>,
		title      : String,
		description: String,
		mode       : u8,
		threshold  : u64,
		deadline   : u64,
	 ) -> Result<()> {
		proposal_create::call(ctx, title, description, mode, threshold, deadline)
	}

	pub fn vote(
		ctx : Context<Vote>,
		vote: bool,
	) -> Result<()> {
		vote::call(ctx, vote)
	}


}


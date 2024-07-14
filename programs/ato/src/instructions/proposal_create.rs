use anchor_lang::prelude::*;
use std::time::SystemTime;

use crate::constants;   pub use constants::*;
use crate::states;      pub use states::*;
use crate::errors;      pub use errors::AtoError;


pub fn call(
	ctx        : Context<ProposalCreate>,
	title      : String,
	description: String,
	mode       : u8,
	threshold  : u64,
	deadline   : u64,

) -> Result<()> {
	admin_only!(ctx);
	pausable!(ctx);

	// sanity checks !
	require_gt!(AtoProposalMode::MAX as u8, mode, AtoError::IncorrectProposalMode);
	//-require_gt!(AtoProposalStatus::MAX as u8, mode, AtoError::IncorrectProposalStatus);

	let now = SystemTime::now();
	let now = now.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u64;

	let timestamp: u64 = match mode.into() {
		AtoProposalMode::Minutes => now + deadline * 60,
		AtoProposalMode::Hours   => now + deadline * 60 * 60,
		AtoProposalMode::Days    => now + deadline * 60 * 60 * 24,
		_                        => 0,
	};

	let ato_data: &mut Account<AtoData>       = &mut ctx.accounts.ato_data;
	let props_data: &mut Account<AtoProposal> = &mut ctx.accounts.props_data;

	props_data.deadline = deadline;

	Ok(())
}
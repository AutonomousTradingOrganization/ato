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
	deadline   : u8,
) -> Result<()> {
	admin_only!(ctx);
	pausable!(ctx);

	// sanity checks !
	require_gt!(AtoProposalMode::MAX as u8, mode,   AtoError::IncorrectProposalMode);
	require_gte!(STR_SIZE_TITLE, title.len(),       AtoError::IncorrectTitleLenght);
	require_gte!(STR_SIZE_DESCR, description.len(), AtoError::IncorrectDescriptionLenght);
	require_gt!(AtoProposalMode::MAX as u8, mode,   AtoError::IncorrectProposalMode);
	require_gte!(DEADLINE_MIN, deadline,            AtoError::TooSmallDeadline);
	require_gte!(DEADLINE_MAX, deadline,            AtoError::TooBigDeadline);

	let multiplier: u64 = match mode.into() {
		AtoProposalMode::Minutes => 60,
		AtoProposalMode::Hours   => 60 * 60,
		AtoProposalMode::Days    => 60 * 60 * 24,
		_                        => 0,
	};

	let ato_data: &mut Account<AtoData>       = &mut ctx.accounts.ato_data;
	let props_data: &mut Account<AtoProposal> = &mut ctx.accounts.props_data;

	let now: u64 = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs();

	props_data.signer    = ctx.accounts.signer.key();
	props_data.deadline  = now + ((deadline as u64) * multiplier);
	props_data.mode      = mode;
	props_data.threshold = threshold;
	// props_data.title.copy_from_slice(&title.as_bytes());
	// props_data.description.copy_from_slice(&description.as_bytes());
	string_to_u8!(title, props_data.title);
	string_to_u8!(description, props_data.description);
	props_data.status    = AtoProposalStatus::Waiting as u8;

// debug purpose
	msg!("{:?}", props_data.title);
	msg!("{:?}", props_data.description);
	msg!("{:?}", props_data.mode);
	msg!("{:?}", props_data.deadline);
// debug purpose

	// one more proposal pending...
	ato_data.proposal_index_tail += 1;
	ato_data.status               = AtoProposalStatus::Waiting as u8;

	Ok(())

}
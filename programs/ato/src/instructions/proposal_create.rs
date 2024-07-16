use anchor_lang::prelude::*;

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
// {
// 	msg!("{}", line!());
// 	msg!("{}", title);
// 	let props_data: &mut Account<AtoProposal> = &mut ctx.accounts.props_data;
// 	msg!("{:?}", props_data.key());
// }
//	admin_only!(ctx);	// <-- useless, resolve by constraint (see states.rs)

	// sanity checks !
	require_gt!(AtoProposalMode::MAX as u8, mode,   AtoError::IncorrectProposalMode);
	require_gte!(STR_SIZE_TITLE, title.len(),       AtoError::IncorrectTitleLenght);
	require_gte!(STR_SIZE_DESCR, description.len(), AtoError::IncorrectDescriptionLenght);
	require_gt!(AtoProposalMode::MAX as u8, mode,   AtoError::IncorrectProposalMode);
	require_gte!(deadline, DEADLINE_MIN,            AtoError::TooSmallDeadline);
	require_gte!(DEADLINE_MAX, deadline,            AtoError::TooBigDeadline);
	//-msg!("{}", line!());

	let ato_data: &mut Account<AtoData>       = &mut ctx.accounts.ato_data;
	let props_data: &mut Account<AtoProposal> = &mut ctx.accounts.props_data;

	props_data.signer    = ctx.accounts.signer.key();
	props_data.deadline  = deadline;
	props_data.mode      = mode;
	props_data.threshold = threshold;
	props_data.vote_yes  = 0;	// no YES
	props_data.vote_no   = 0;	// no NO
	string_to_u8!(title, props_data.title);
	string_to_u8!(description, props_data.description);
	props_data.status    = AtoProposalStatus::Waiting as u8;

// debug purpose
	// msg!("{:?}", props_data.title);
	// msg!("{:?}", props_data.description);
	// msg!("{:?}", props_data.mode);
	// msg!("{:?}", props_data.deadline);
// debug purpose

	// one more proposal pending...
	ato_data.proposal_index_tail += 1;
	ato_data.status               = AtoProposalStatus::Waiting as u8;

	Ok(())

}
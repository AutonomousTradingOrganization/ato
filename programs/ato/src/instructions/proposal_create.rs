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
	// 	let prop_data: &mut Account<AtoProposal> = &mut ctx.accounts.prop_data;
	// 	msg!("{:?}", prop_data.key());
	// }

	// debug purpose
	// {
	// 	// let prop_data: &mut Account<AtoProposal> = &mut ctx.accounts.prop_data;
	// 	msg!("{:?}", title);
	// 	msg!("{:?}", mode);
	// 	msg!("{:?}", title.len());
	// 	msg!("{:?}", deadline);
	// }
	// debug purpose

	// sanity checks !
	admin_only!(ctx);
	require_gt!(AtoProposalMode::MAX as u8, mode,   AtoError::IncorrectProposalMode);
	require_gte!(STR_SIZE_TITLE, title.len(),       AtoError::IncorrectTitleLenght);
	require_gte!(STR_SIZE_DESCR, description.len(), AtoError::IncorrectDescriptionLenght);
	require_gt!(AtoProposalMode::MAX as u8, mode,   AtoError::IncorrectProposalMode);
	require_gte!(deadline, DEADLINE_MIN,            AtoError::TooSmallDeadline);
	require_gte!(DEADLINE_MAX, deadline,            AtoError::TooBigDeadline);
	//-msg!("{}", line!());

	let ato_data: &mut Account<AtoData>      = &mut ctx.accounts.ato_data;
	let prop_data: &mut Account<AtoProposal> = &mut ctx.accounts.prop_data;

	prop_data.signer          = ctx.accounts.signer.key();
	prop_data.deadline        = deadline;
	prop_data.mode            = mode;
	prop_data.threshold       = threshold;
	prop_data.amount          = 0;
	prop_data.vote_yes        = 0; // 0 YES
	prop_data.vote_no         = 0; // 0 NO
	prop_data.vote_index_tail = 0;
	string_to_u8!(title, prop_data.title);
	string_to_u8!(description, prop_data.description);
	prop_data.status = AtoProposalStatus::Waiting as u8;
	prop_data.trade  = false;

	// debug purpose
	// msg!("{:?}", prop_data.title);
	// msg!("{:?}", prop_data.description);
	// msg!("{:?}", prop_data.mode);
	// msg!("{:?}", prop_data.deadline);
	// debug purpose

	// one more proposal pending...
	prop_data.index = ato_data.proposal_index_tail;
	// debug purpose
	//msg!("proposal {} / {}", title, prop_data.index);	// debug purpose
	// debug purpose
	ato_data.proposal_index_tail += 1;
	check_index!(ato_data.proposal_index_tail);

	Ok(())

}
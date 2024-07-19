use anchor_lang::prelude::*;

use crate::constants;   pub use constants::*;
use crate::states;      pub use states::*;
use crate::errors;      pub use errors::AtoError;


pub fn call(
	ctx   : Context<Vote>,
	vote  : bool,
	amount: u64,
	now   : u64,
) -> Result<()> {
	pausable!(ctx);
	let ato_data: &mut Account<AtoData>      = &mut ctx.accounts.ato_data;
	let prop_data: &mut Account<AtoProposal> = &mut ctx.accounts.prop_data;
	let vote_data: &mut Account<AtoVote>     = &mut ctx.accounts.vote_data;
	let voter_data: &mut Account<AtoVoter>   = &mut ctx.accounts.voter_data;

	// debug purpose
	// {
	// 	msg!("pausable      {:?}", ato_data.paused);
	// 	msg!("ato status    {:?}", ato_data.status);
	// 	msg!("head index    {:?}", ato_data.proposal_index_head);
	// 	msg!("tail index    {:?}", ato_data.proposal_index_tail);
	// 	msg!("props status  {:?}", prop_data.status);
	// 	msg!("amount        {:?}", amount);
	// 	msg!("now           {:?}", now);
	// 	msg!("deadline      {:?}", prop_data.deadline);
	// }
	// debug purpose

	require_eq!(ato_data.status, AtoStatus::Ready as u8, AtoError::IncorrectProposalStatus);
	require_eq!(prop_data.status, AtoProposalStatus::Opened as u8, AtoError::IncorrectProposalStatus);
	require_gt!(amount, ATO_AMOUNT_LAMPORTS_MIN, AtoError::IncorrectAmount);
	require_gt!(prop_data.deadline, now, AtoError::OverDeadline);

	vote_data.voter = ctx.accounts.voter.key();
	//voter_data.voter           = ctx.accounts.prop_data.signer.key();
	vote_data.amount    = amount;
	vote_data.timestamp = now;
	vote_data.vote      = vote;
	// debug purpose
	//vote_data.leet1          = 4916;
	//vote_data.leet2          = 4919;
	vote_data.proposal_index   = prop_data.index;
	vote_data.voter_index      = voter_data.index;
	vote_data.vote_index       = prop_data.vote_index_tail;
	prop_data.vote_index_tail += 1;

	// debug purpose
	// msg!("{}", vote_data.proposal_index);
	// msg!("{}", vote_data.voter_index);
	// msg!("{}", vote_data.vote_index);
	// debug purpose

	match vote {
		true  => { prop_data.vote_yes +=1;},
		false => { prop_data.vote_no  +=1;}
	}
	// debug purpose
	// msg!("{}", prop_data.vote_yes);
	// msg!("{}", prop_data.vote_no);
	// debug purpose

	prop_data.amount += amount;

	Ok(())
}
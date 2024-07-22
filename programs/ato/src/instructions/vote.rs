use anchor_lang::prelude::*;

use crate::constants; pub use constants::*;
use crate::states;    pub use states::*;
use crate::errors;    pub use errors::AtoError;


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

	require_eq!(ato_data.status, AtoStatus::Ready as u8, AtoError::IncorrectProposalStatus);
	require_eq!(prop_data.status, AtoProposalStatus::Opened as u8, AtoError::IncorrectProposalStatus);

	let mode: AtoProposalMode = prop_data.mode.into();
	match mode {
		AtoProposalMode::Timing => {
			require_gt!(prop_data.deadline, now, AtoError::OverDeadline);
		},
		_ => {
			require_gt!(amount, ATO_AMOUNT_LAMPORTS_MIN, AtoError::IncorrectAmount);
		},
	}

	vote_data.voter     = ctx.accounts.voter.key();
	vote_data.amount    = amount;
	vote_data.timestamp = now;
	vote_data.vote      = vote;

	vote_data.proposal_index   = prop_data.index;
	vote_data.voter_index      = voter_data.index;
	vote_data.vote_index       = prop_data.vote_index_tail;
	check_index!(prop_data.vote_index_tail);
	prop_data.vote_index_tail += 1;

	match vote {
		true  => { prop_data.vote_yes +=1;},
		false => { prop_data.vote_no  +=1;}
	}

	prop_data.amount += amount;

	Ok(())
}
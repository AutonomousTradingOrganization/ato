use anchor_lang::{
	prelude::*,
	/*solana_program::pubkey*/
};
use std::mem::size_of;

use crate::constants;
pub use constants::*;

#[account]
#[derive(InitSpace)]
pub struct AtoData {
	pub admin              : Pubkey,
	pub scheduler          : Pubkey,
	pub proposal_index_head: u16,
	pub proposal_index_tail: u16,
	pub status             : u8,
	pub paused             : bool,
}


#[derive(Accounts)]
pub struct Initialize<'info> {
	#[account(
		init,
		payer = signer,
		space = size_of::<AtoData>() + 8
	)]
	pub ato_data: Account<'info, AtoData>,

	#[account(mut)]
	pub signer: Signer<'info>,

	pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SetScheduler<'info> {

	#[account(
		mut,
	)]
	pub ato_data: Account<'info, AtoData>,

	#[account(
		mut,
		//constraint = signer.key() == ato_data.admin	//ADMIN ONLY
	)]
	pub signer: Signer<'info>,

	pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SetPause<'info> {

	#[account(
		mut,
	)]
	pub ato_data: Account<'info, AtoData>,

	#[account(
		mut,
		//constraint = signer.key() == ato_data.admin	//ADMIN ONLY
	)]
	pub signer: Signer<'info>,

	pub system_program: Program<'info, System>,
}



#[account]
#[derive(InitSpace)]
pub struct AtoProposal {
	pub signer     : Pubkey,
	pub deadline   : u64,
	pub threshold  : u64,
	pub vote_yes   : u16,
	pub vote_no    : u16,
	pub title      : [u8; STR_SIZE_TITLE],
	pub description: [u8; STR_SIZE_DESCR],
	pub mode       : u8,
	pub status     : u8,
}

#[derive(Accounts)]
pub struct ProposalCreate<'info> {

	#[account(
		init,
		seeds = [
			ATO_LABEL_PROPOSAL.as_ref(),
			signer.key().as_ref(),
			ato_data.proposal_index_tail.to_le_bytes().as_ref(),
		],
		bump,
		payer = signer,
		space = size_of::<AtoProposal>() + 8
	)]
	pub props_data: Account<'info, AtoProposal>,

	#[account(
		mut,
	)]
	pub ato_data: Account<'info, AtoData>,
	
	#[account(
		mut,
		//constraint = signer.key() == ato_data.admin	//ADMIN ONLY
	)]
	pub signer: Signer<'info>,

	pub system_program: Program<'info, System>,
}



#[account]
#[derive(InitSpace)]
pub struct AtoVote {
	//-pub voter         : Pubkey,
	pub amount        : u64,
	pub timestamp     : u64,
	//pub proposal_index: u16,
	pub vote          : bool,
	// false = no
	// true  = yes

}



#[derive(Accounts)]
pub struct Vote<'info> {

	#[account(
		init,
		seeds = [
			ATO_LABEL_VOTE.as_ref(),
			voter.key().as_ref(),
			props_data.key().as_ref(),
		],
		bump,
		payer = voter ,
		space = size_of::<AtoVote>() + 8 ,
	)]
	pub vote_data: Account<'info, AtoVote>,

	#[account(mut)]
	pub props_data: Account<'info, AtoProposal>,

	#[account(mut)]
	pub ato_data: Account<'info, AtoData>,
	
	#[account(
		mut,
	)]
	pub voter: Signer<'info>,

	pub system_program: Program<'info, System>,
}



#[derive(Accounts)]
//#[instruction(amount: u64)]
pub struct ProposalSetStatus<'info> {

	#[account(
		mut,
	)]
	pub props_data: Account<'info, AtoProposal>,
	
	#[account(
		mut,
	)]
	pub ato_data: Account<'info, AtoData>,

	#[account(
		mut,
	)]
	pub signer: Signer<'info>,

	pub system_program: Program<'info, System>,
}

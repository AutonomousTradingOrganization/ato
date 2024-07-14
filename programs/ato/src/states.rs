use anchor_lang::{
	prelude::*,
	/*solana_program::pubkey*/
};
use std::mem::size_of;

use crate::constants;
pub use constants::*;

#[account]
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

	#[account(mut)]
	pub signer: Signer<'info>,

	pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SetPause<'info> {

	#[account(
		mut,
	)]
	pub ato_data: Account<'info, AtoData>,

	#[account(mut)]
	pub signer: Signer<'info>,

	pub system_program: Program<'info, System>,
}



#[account]
pub struct AtoProposal {
	pub signer  : Pubkey,
	pub deadline: u64,
	pub mode    : bool,
}

#[derive(Accounts)]
pub struct ProposalCreate<'info> {

	#[account(
		init,
		seeds = [
			ATO_LABEL_PROPOSAL.as_ref(),	//b"ATO_PROP".as_ref(),
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
	
	#[account(mut)]
	pub signer: Signer<'info>,

	pub system_program: Program<'info, System>,
}
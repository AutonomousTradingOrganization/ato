use anchor_lang::{
	prelude::*,
	/*solana_program::pubkey*/
};
use std::mem::size_of;


#[account]
pub struct AtoData {
	pub admin    : Pubkey,
	pub scheduler: Pubkey,
	pub status   : u8,
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
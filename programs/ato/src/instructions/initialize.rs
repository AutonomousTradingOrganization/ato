use anchor_lang::prelude::*;

use crate::constants;   pub use constants::*;
use crate::states;      pub use states::*;
use crate::errors;      pub use errors::AtoError;


pub fn call(ctx: Context<Initialize>) -> Result<()> {
	let ato_data: &mut Account<AtoData> = &mut ctx.accounts.ato_data;

	ato_data.admin     = ctx.accounts.signer.key();
	ato_data.scheduler = Pubkey::default();
	ato_data.status    = AtoStatus::NotReady as u8;
	ato_data.paused    = false;

	Ok(())
}
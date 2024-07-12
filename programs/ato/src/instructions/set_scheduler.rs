use anchor_lang::prelude::*;

use crate::constants;	pub use constants::*;
use crate::states;		pub use states::*;
use crate::errors;		pub use errors::AtoError;

pub fn call(ctx: Context<SetScheduler>, key: Pubkey) -> Result<()> {
	let  ato_data: &mut Account<AtoData> = &mut ctx.accounts.ato_data;
	
	require_eq!(ato_data.admin, ctx.accounts.signer.key(), AtoError::AdminOnly);

	ato_data.scheduler = key;
	ato_data.status    = AtoStatus::Ready as u8;

	Ok(())
}
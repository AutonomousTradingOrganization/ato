use anchor_lang::prelude::*;

use crate::constants;   pub use constants::*;
use crate::states;      pub use states::*;
use crate::errors;      pub use errors::AtoError;


pub fn call(ctx: Context<SetPause>, to: bool) -> Result<()> {
	admin_only!(ctx);

	let ato_data: &mut Account<AtoData> = &mut ctx.accounts.ato_data;

	ato_data.paused = to;

	Ok(())
}
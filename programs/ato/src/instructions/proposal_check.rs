use anchor_lang::prelude::*;

use crate::constants; pub use constants::*;
use crate::states;    pub use states::*;
use crate::errors;    pub use errors::AtoError;


pub fn call(
	ctx   : Context<ProposalCheck>,
	amount: u64,
	now   : u64,
) -> Result<()> {
	//scheduler_only!(ctx);
	//let ato_data: &mut Account<AtoData>      = &mut ctx.accounts.ato_data;
	let prop_data: &mut Account<AtoProposal> = &mut ctx.accounts.prop_data;
	//mode = prop_data.mode;
	// TODO
	msg!("PROPOSAL CHECK");
	Ok(())
}
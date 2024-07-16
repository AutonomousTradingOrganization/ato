use anchor_lang::prelude::*;

use crate::constants;   pub use constants::*;
use crate::states;      pub use states::*;
use crate::errors;      pub use errors::AtoError;


pub fn call(
	ctx : Context<Vote>,
	vote: bool,
) -> Result<()> {
	pausable!(ctx);
	let ato_data: &mut Account<AtoData>       = &mut ctx.accounts.ato_data;
	let props_data: &mut Account<AtoProposal> = &mut ctx.accounts.props_data;
	let vote_data: &mut Account<AtoVote>      = &mut ctx.accounts.vote_data;
	Ok(())
}
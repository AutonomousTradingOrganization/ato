use anchor_lang::prelude::*;

use crate::constants;   pub use constants::*;
use crate::states;      pub use states::*;
use crate::errors;      pub use errors::AtoError;


pub fn call(ctx: Context<ProposalSetStatus>, status: u8) -> Result<()> {
	admin_only!(ctx);

	let prop_data: &mut Account<AtoProposal> = &mut ctx.accounts.prop_data;
	require_gt!(AtoProposalStatus::MAX as u8, prop_data.status, AtoError::IncorrectProposalStatus);
	//let ato_data: &mut Account<AtoData>       = &mut ctx.accounts.ato_data;
	prop_data.status = status;

	Ok(())
}
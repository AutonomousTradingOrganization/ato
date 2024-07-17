use anchor_lang::prelude::*;

use crate::constants;   pub use constants::*;
use crate::states;      pub use states::*;
use crate::errors;      pub use errors::AtoError;


pub fn call(ctx: Context<ProposalSetStatus>, status: u8) -> Result<()> {
	admin_only!(ctx);

	let props_data: &mut Account<AtoProposal> = &mut ctx.accounts.props_data;
	require_gt!(AtoProposalStatus::MAX as u8, props_data.status, AtoError::IncorrectProposalStatus);
	//let ato_data: &mut Account<AtoData>       = &mut ctx.accounts.ato_data;
	props_data.status = status;

	Ok(())
}
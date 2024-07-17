use anchor_lang::prelude::*;

use crate::constants;   pub use constants::*;
use crate::states;      pub use states::*;
use crate::errors;      pub use errors::AtoError;


pub fn call(
	ctx  : Context<VoterAdd>,
	name : String,
	email: String,
 ) -> Result<()> {
	pausable!(ctx);

	let voter_data: &mut Account<AtoVoter> = &mut ctx.accounts.voter_data;

	require_gte!(STR_SIZE_NAME,  name.len(),  AtoError::IncorrectNameLenght);
	string_to_u8!(name, voter_data.name);

	require_gte!(STR_SIZE_EMAIL, email.len(), AtoError::IncorrectEmailLenght);
	string_to_u8!(email, voter_data.email);

	voter_data.voter = ctx.accounts.voter.key();

	Ok(())
}
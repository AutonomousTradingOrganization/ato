use anchor_lang::error_code;

#[error_code]
pub enum AtoError {

	#[msg("Admin only operation.")]
	AdminOnly,
	
}
use anchor_lang::error_code;

#[error_code]
pub enum AtoError {

	#[msg("Admin only operation.")]
	AdminOnly,

	#[msg("Head index cannot exceed tail index.")]
	HeadIndexError,

	#[msg("Program paused.")]
	ProgramPaused,

	#[msg("Incorrect proposal status.")]
	IncorrectProposalStatus,

	#[msg("Incorrect proposal mode.")]
	IncorrectProposalMode,

}
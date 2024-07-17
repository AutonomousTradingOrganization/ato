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

	#[msg("Incorrect title lenght.")]
	IncorrectTitleLenght,

	#[msg("Incorrect description lenght.")]
	IncorrectDescriptionLenght,

	#[msg("Too big deadline.")]
	TooBigDeadline,

	#[msg("Too small deadline.")]
	TooSmallDeadline,

	#[msg("Over deadline.")]
	OverDeadline,

	#[msg("Incorrect amount.")]
	IncorrectAmount,

}
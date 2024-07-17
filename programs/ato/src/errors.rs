use anchor_lang::error_code;

#[error_code]
pub enum AtoError {

	#[msg("Admin only operation.")]
	AdminOnly,

	#[msg("Scheduler only operation.")]
	SchedulerOnly,

	#[msg("Head index cannot exceed tail index.")]
	HeadIndexError,

	#[msg("Program paused.")]
	ProgramPaused,

	#[msg("Incorrect proposal status.")]
	IncorrectProposalStatus,

	#[msg("Incorrect proposal mode.")]
	IncorrectProposalMode,

	#[msg("Incorrect title length.")]
	IncorrectTitleLenght,

	#[msg("Incorrect description length.")]
	IncorrectDescriptionLenght,

	#[msg("Incorrect name length.")]
	IncorrectNameLenght,

	#[msg("Incorrect email length.")]
	IncorrectEmailLenght,

	#[msg("Too big deadline.")]
	TooBigDeadline,

	#[msg("Too small deadline.")]
	TooSmallDeadline,

	#[msg("Over deadline.")]
	OverDeadline,

	#[msg("Incorrect amount.")]
	IncorrectAmount,

}
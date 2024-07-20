pub const PROPOSAL_MAX: u16 = 65000;
pub const DEADLINE_MIN: u64 = 1;	// 1 second
pub const DEADLINE_MAX: u64 = 60 * 60 * 24 * 30;	// 30 days

pub const ATO_LABEL_PROPOSAL: &[u8; 8] = b"ATO_PROP";
pub const ATO_LABEL_VOTER: &[u8; 9]    = b"ATO_VOTER";
pub const ATO_LABEL_VOTE: &[u8; 8]     = b"ATO_VOTE";

pub const ATO_AMOUNT_LAMPORTS_MIN: u64 = 100000;

pub const STR_SIZE_TITLE: usize = 32;
pub const STR_SIZE_DESCR: usize = 100;
pub const STR_SIZE_NAME: usize  = 64;
pub const STR_SIZE_EMAIL: usize = 64;

pub const ATO_INDEX_MAX: u16 = 65500;

pub enum AtoStatus {
	NotReady,	// Not totaly initialized (scheduler key ?)
	Ready,		// Yep, let's do it
	Paused,		// Admin says, we stop everything !
}

impl From<u8> for AtoStatus {
	fn from(value: u8) -> Self {
		match value {
			0 => AtoStatus::NotReady,
			1 => AtoStatus::Ready,
			//2 => AtoStatus::Paused,
			_ => panic!("Invalid AtoStatus value"),
		}
	}
}


pub enum AtoProposalStatus {
	Waiting,	// Presentation, you can't vote for it yet...
	Opened,		// Ready, you can vote for it
	Closed,		// Sorry, vote is over
	Paused,		// Damned !
	Canceled,	// Proposal is canceled, leave it !
	Error,		// PDA created but not initialized
	MAX,
}

impl From<u8> for AtoProposalStatus {
	fn from(value: u8) -> Self {
		match value {
			0 => AtoProposalStatus::Waiting,
			1 => AtoProposalStatus::Opened,
			2 => AtoProposalStatus::Closed,
			3 => AtoProposalStatus::Paused,
			4 => AtoProposalStatus::Canceled,
			5 => AtoProposalStatus::Error,
			_ => panic!("Invalid AtoProposalStatus value"),
		}
	}
}


pub enum AtoProposalMode {
	Over,
	Lower,
	Delay,
	MAX
}

impl From<u8> for AtoProposalMode {
	fn from(value: u8) -> Self {
		match value {
			0 => AtoProposalMode::Over,
			1 => AtoProposalMode::Lower,
			2 => AtoProposalMode::Delay,
			_ => panic!("Invalid AtoProposalMode value"),
		}
	}
}

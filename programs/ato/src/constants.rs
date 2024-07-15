pub const PROPOSAL_MAX: u16 = 65000;
pub const DEADLINE_MIN: u64 = 1;	// 1 second
pub const DEADLINE_MAX: u64 = 60 * 60 * 24 * 30;	// 30 days

pub const ATO_LABEL_PROPOSAL: &[u8; 8] = b"ATO_PROP";
pub const ATO_LABEL_VOTER: &[u8; 9]    = b"ATO_VOTER";
pub const ATO_LABEL_VOTE: &[u8; 8]     = b"ATO_VOTE";


pub const STR_SIZE_TITLE: usize = 32;
pub const STR_SIZE_DESCR: usize = 100;


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
			2 => AtoStatus::Paused,
			_ => panic!("Invalid AtoStatus value"),
		}
	}
}


pub enum AtoProposalStatus {
	Waiting,	// Presentation, you can't vote for it yet...
	Launched,	// Ready, you can vote for it
	Closed,		// Sorry, vote is over
	Paused,		// Damned !
	Canceled,	// Proposal is canceled, leave it !
	MAX,
}

impl From<u8> for AtoProposalStatus {
	fn from(value: u8) -> Self {
		match value {
			0 => AtoProposalStatus::Waiting,
			1 => AtoProposalStatus::Launched,
			2 => AtoProposalStatus::Closed,
			3 => AtoProposalStatus::Paused,
			4 => AtoProposalStatus::Canceled,
			_ => panic!("Invalid AtoProposalStatus value"),
		}
	}
}


pub enum AtoProposalMode {
	Over,
	Below,
	Minutes,
	Hours,
	Days,
	MAX
}

impl From<u8> for AtoProposalMode {
	fn from(value: u8) -> Self {
		match value {
			0 => AtoProposalMode::Over,
			1 => AtoProposalMode::Below,
			2 => AtoProposalMode::Minutes,
			3 => AtoProposalMode::Hours,
			4 => AtoProposalMode::Days,
			_ => panic!("Invalid AtoProposalMode value"),
		}
	}
}

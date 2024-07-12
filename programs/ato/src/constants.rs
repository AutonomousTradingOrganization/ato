
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

pub enum AtoStatus {
	NotReady,	// Not totaly initialized (scheduler key ?)
	Ready,		// Yep, let's do it
	Paused,		// Admin says, we stop everything !
}

#[macro_export]
macro_rules! compute_fn {
	($msg:expr=> $($tt:tt)*) => {
		anchor_lang::solana_program::msg!(concat!($msg, " {"));
		anchor_lang::solana_program::log::sol_log_compute_units();
		let res = { $($tt)* };
		anchor_lang::solana_program::log::sol_log_compute_units();
		anchor_lang::solana_program::msg!(concat!(" } // ", $msg));
		res
	};
}


macro_rules! admin_only {
	($ato_data:expr, $signer:expr) => {
		let ato_data = $ato_data;
		require_eq!(ato_data.admin, $signer.key(), AtoError::AdminOnly);
	};
}

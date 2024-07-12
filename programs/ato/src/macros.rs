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
	($ctx:expr) => {
		let ato_data = &mut $ctx.accounts.ato_data;
		let signer = &$ctx.accounts.signer;
		require_eq!(ato_data.admin, signer.key(), AtoError::AdminOnly);
	};
}

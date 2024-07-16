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

// not yet tested !
macro_rules! pausable {
	($ctx:expr) => {
		let ato_data = &mut $ctx.accounts.ato_data;
		if ato_data.paused { return Ok(())}
	};
}

macro_rules! string_to_u8 {
	($string:expr, $storage_title:expr) => {{
		let bytes: &[u8] = $string.as_bytes();
		let len = bytes.len().min($storage_title.len());
		$storage_title[..len].copy_from_slice(&bytes[..len]);
		//$storage_title
	}};
}

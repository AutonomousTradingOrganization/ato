# ATO : Autonomous Trading Organization

## Overview

### Components

1. Program & instructions
  - **DAO Initialization**: Initialize the DAO with the necessary configuration.
  - **Setting scheduler key**: Set the scheduler public key (used for vote checking).
  - **Pausable mode**: Pausable mode, to "freeze" the DAO.
  - **Create Proposal**: Create a new proposal for voting.
  - **Voter registration**: Register members as eligible voters.
  - **Change proposal status**: Update the status of proposals.
  - **Vote on Proposal**: Allow members to vote on the proposals.

2. Accounts

3. Structures

4. Macros

### Purpose
The purpose of this project is to create a DAO on the Solana blockchain where members can propose and vote on different proposals. The voting can be triggered based on a time duration or a threshold value obtained from an oracle.

### Testing the DAO
The project includes tests using `web3.js` and `chai` to ensure the functionalities work as expected. Example test scenarios include initializing the DAO, adding voters, creating and voting on proposals (and checking the results).


## Code structure

```bash
.
├── app
├── migrations
│   └── deploy.ts
├── programs
│   └── ato
│       ├── src
│       │   ├── instructions
│       │   │   ├── initialize.rs
│       │   │   ├── mod.rs
│       │   │   ├── proposal_check.rs
│       │   │   ├── proposal_create.rs
│       │   │   ├── proposal_set_status.rs
│       │   │   ├── set_pause.rs
│       │   │   ├── set_scheduler.rs
│       │   │   ├── voter_registration.rs
│       │   │   └── vote.rs
│       │   ├── constants.rs
│       │   ├── errors.rs
│       │   ├── lib.rs
│       │   ├── macros.rs
│       │   └── states.rs
│       ├── Cargo.toml
│       └── Xargo.toml
├── tests
│   └── ato.ts
├── Anchor.toml
├── Cargo.lock
├── Cargo.toml
├── package.json
├── README.md
├── tests_local_deploy.png
├── tsconfig.json
└── yarn.lock

7 directories, 26 files
```


## Launch

### Local validator

`solana-test-validator --reset`

⚠️ Beware it creates local files and directories at the current working directory.


### Real-time logs display

`solana logs`


### Local deploy and launch tests

`anchor test --skip-local-validator`

![](tests_local_deploy.png)


## Versions

``` 
rustc 1.79.0 (129f3b996 2024-06-10)
cargo 1.79.0 (ffa9cf99a 2024-06-03)
solana-cli 1.18.17 (src:b685182a; feat:4215500110, client:SolanaLabs)
anchor-cli 0.29.0
yarn 1.22.19
node v18.16.0
npm 9.6.7
``` 

`cargo build-sbf -V`
```
solana-cargo-build-sbf 1.18.17
platform-tools v1.41
rustc 1.75.0
```


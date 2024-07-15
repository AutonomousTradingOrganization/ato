import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ato } from "../target/types/ato";
import { expect } from "chai";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";


// this airdrops sol to an address
async function airdropSol(publicKey, amount) {
  let airdropTx = await anchor.getProvider().connection.requestAirdrop(publicKey, amount * anchor.web3.LAMPORTS_PER_SOL);
  await confirmTransaction(airdropTx);
}

async function confirmTransaction(tx) {
  const latestBlockHash = await anchor.getProvider().connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: tx,
  });
}

//-const newKeypair = anchor.web3.Keypair.generate();
//-await airdropSol(newKeypair.publicKey, 1); // 1 SOL


describe("ato", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const program        = anchor.workspace.Ato as Program<Ato>;
  const atoDataKeypair = anchor.web3.Keypair.generate();

  const walletIimposter = anchor.web3.Keypair.generate();
  const walletScheduler = anchor.web3.Keypair.generate();

  const ATO_STATUS_NOT_READY  = 0;
  const ATO_STATUS_READY      = 1;
  const PUBLICKEY_DEFAULT_STR = "11111111111111111111111111111111";


  it("initialized(): Is initialized!", async () => {
    //await airdropSol(walletIimposter.publicKey, 1); // 1 SOL
    //await airdropSol(walletScheduler.publicKey, 1); // 1 SOL

    const tx = await program.methods
      .initialize()
      .accounts({
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([atoDataKeypair])
      .rpc();


    const pausedValueToFalse = (
        await program.account.atoData.fetch(atoDataKeypair.publicKey)
      ).paused.valueOf();
    
    expect(pausedValueToFalse).to.equal(false);


    const getScheduler = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).scheduler.valueOf();

    expect(getScheduler.toString()).to.equal(PUBLICKEY_DEFAULT_STR);


    const getStatus = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).status.valueOf();

    expect(getStatus).to.equal(ATO_STATUS_NOT_READY);


    const getIndexHead = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).status.valueOf();

    expect(getIndexHead).to.equal(0);

    const getIndexTail = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).status.valueOf();
  
    expect(getIndexTail).to.equal(0);
  
  });


  it("initialized(): Can't be initialize again", async () => {
    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          atoData      : atoDataKeypair.publicKey,
          signer       : provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([atoDataKeypair])
        .rpc();

      expect.fail("The second transaction initialize() should have failed but it didn't.");

    } catch(err) {
      expect(err.message).to.include("Simulation failed");
    }

  });


  it("set_pause(): Check internal status", async () => {
    const pausedValueToFalse = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).paused.valueOf();
  
    expect(pausedValueToFalse).to.equal(false);

    const txPauseToTrue = await program.methods
      .setPause(true)
      .accounts({
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const pausedValueToTrue = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).paused.valueOf();
    
    expect(pausedValueToTrue).to.equal(true);

    const txPauseToFalsee = await program.methods
    .setPause(false)
    .accounts({
      atoData      : atoDataKeypair.publicKey,
      signer       : provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

    const pausedValueToFalseAgain = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).paused.valueOf();
  
    expect(pausedValueToFalseAgain).to.equal(false);

  });


  it("set_pause(): Check admin only", async () => {
    try {
      const txPauseToFalsee = await program.methods
      .setPause(false)
      .accounts({
        atoData      : atoDataKeypair.publicKey,
        signer       : walletIimposter.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletIimposter])
      .rpc();

      expect.fail("The transaction setPause() should have failed but it didn't.");

    } catch(err) {
      expect(err.message).to.include("Error Code: AdminOnly");
    }

  });


  it("set_scheduler(): Check internal status", async () => {
    const getSchedulerBefore = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).scheduler.valueOf();

    expect(getSchedulerBefore.toString()).to.equal(PUBLICKEY_DEFAULT_STR);


    const getStatusBefore = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).status.valueOf();

    expect(getStatusBefore).to.equal(ATO_STATUS_NOT_READY);


    const txPauseToFalsee = await program.methods
    .setScheduler(walletScheduler.publicKey)
    .accounts({
      atoData      : atoDataKeypair.publicKey,
      signer       : provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    //.signers([provider.wallet.publicKey])
    .rpc();


    const getSchedulerAfter = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).scheduler.valueOf();

    expect(getSchedulerAfter.toString()).to.equal(walletScheduler.publicKey.toString());


    const getStatusAfter = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).status.valueOf();

    expect(getStatusAfter).to.equal(ATO_STATUS_READY);

  });


  it("set_scheduler(): Check admin only", async () => {
    try {
      const txPauseToFalse = await program.methods
      .setScheduler(walletScheduler.publicKey)
      .accounts({
        atoData      : atoDataKeypair.publicKey,
        signer       : walletIimposter.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletIimposter])
      .rpc();

      expect.fail("The transaction set_scheduler() should have failed but it didn't.");

    } catch(err) {
      expect(err.message).to.include("Error Code: AdminOnly");
    }

  });

  it("proposal_create(): Check admin only", async () => {
    try {
      const title       = "Test proposal";
      const description = "This is a test proposal";
      const mode        = 0;
      const threshold   = 1;
      const deadline    = 60;

      const tx = await program.methods
      .proposalCreate(
        title,
        description,
        mode,
        new anchor.BN(threshold),
        deadline
      )
      .accounts({
        atoData      : atoDataKeypair.publicKey,
        signer       : walletIimposter.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletIimposter])
      .rpc();

      expect.fail("The transaction proposal_create() should have failed but it didn't.");

    } catch(err) {
      expect(err.message).to.include("Error Code: AdminOnly");
    }

  });

});

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

  const ATO_PROPS_MODE_OVER  = 0;
  const ATO_PROPS_MODE_LOWER = 1;
  const ATO_PROPS_MODE_DELAY = 2;

  it("initialized(): Is initialized!", async () => {
    await airdropSol(walletIimposter.publicKey, 1); // 1 SOL
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


  it("proposal_create(): attempt to create a proposal", async () => {
    const title       = "Test proposal #1";
    const description = "This is a test proposal";
    const mode        = ATO_PROPS_MODE_OVER;
    const threshold   = 1;
    const deadline    = 60;

    const tailIndex = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).proposalIndexTail.valueOf();
    console.log(tailIndex);
    const propsIndexBuffer = Buffer.allocUnsafe(2);
    propsIndexBuffer.writeUInt16LE(tailIndex, 0);
    console.log(propsIndexBuffer);

    // Calculer l'adresse de la PDA
    const [propsPubkey, propsBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_PROP"),
        provider.wallet.publicKey.toBuffer(),
        propsIndexBuffer,
      ],
      program.programId
    );

    let props = {
      pubkey: propsPubkey,
      bump  : propsBump,
    };

    let txProp1 = await program.methods
      .proposalCreate(
        title,
        description,
        mode,
        new anchor.BN(threshold),
        new anchor.BN(deadline)
      )
      .accounts({
        propsData    : props.pubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();

      console.log("");
      console.log("https://solana.fm/tx/"+txProp1);
      console.log("");

  });


  it("proposal_create(): attempt to create second proposal", async () => {
    const title       = "Test proposal #2";
    const description = "This is a test proposal";
    const mode        = ATO_PROPS_MODE_OVER;
    const threshold   = 1;
    const deadline    = 120;

    const tailIndex = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).proposalIndexTail.valueOf();
    console.log(tailIndex);
    const propsIndexBuffer = Buffer.allocUnsafe(2);
    propsIndexBuffer.writeUInt16LE(tailIndex, 0);
    console.log(propsIndexBuffer);

    // Calculer l'adresse de la PDA
    const [propsPubkey, propsBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_PROP"),
        provider.wallet.publicKey.toBuffer(),
        propsIndexBuffer,
      ],
      program.programId
    );

    let props = {
      pubkey: propsPubkey,
      bump  : propsBump,
    };

    let txProp1 = await program.methods
      .proposalCreate(
        title,
        description,
        mode,
        new anchor.BN(threshold),
        new anchor.BN(deadline)
      )
      .accounts({
        propsData    : props.pubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();

      console.log("");
      console.log("https://solana.fm/tx/"+txProp1);
      console.log("");

  });


  it("proposal_create(): Check admin only", async () => {

    try {
      const title       = "Test proposal imposter";
      const description = "This is a test proposal";
      const mode        = ATO_PROPS_MODE_OVER;
      const threshold   = 1;
      const deadline    = 120;

      const tailIndex = (
        await program.account.atoData.fetch(atoDataKeypair.publicKey)
      ).proposalIndexTail.valueOf();
      //console.log(tailIndex);
      const propsIndexBuffer = Buffer.allocUnsafe(2);
      propsIndexBuffer.writeUInt16LE(tailIndex, 0);
      //console.log(propsIndexBuffer);

      // Calculer l'adresse de la PDA
      const [propsPubkey, propsBump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("ATO_PROP"),
          walletIimposter.publicKey.toBuffer(),
          propsIndexBuffer,
        ],
        program.programId
      );

      let props = {
        pubkey: propsPubkey,
        bump  : propsBump,
      };

      let txProp1 = await program.methods
        .proposalCreate(
          title,
          description,
          mode,
          new anchor.BN(threshold),
          new anchor.BN(deadline)
        )
        .accounts({
          propsData    : props.pubkey,
          atoData      : atoDataKeypair.publicKey,
          signer       : walletIimposter.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([walletIimposter])
        .rpc();

      expect.fail("The transaction set_scheduler() should have failed but it didn't.");

    } catch(err) {
      // console.log("---");
      // console.log(err.message);
      // console.log("---");
      //expect(err.message).to.include("Error Code: AdminOnly");
      expect(err.message).to.include("Error Number: 2003. Error Message: A raw constraint was violated.");
      

      // console.log("");
      // console.log("https://solana.fm/tx/"+txProp1);
      // console.log("");

    }

  });

});

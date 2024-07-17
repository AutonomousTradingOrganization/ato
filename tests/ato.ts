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

async function createAccounts(nn: number, amount: number) {
  let accounts: any[] = [];
  let i = 0;

  for( i=0; i<nn; i++) {
    let account = anchor.web3.Keypair.generate();
    await airdropSol(account.publicKey, amount);
    // console.log(account.publicKey.toString());
    // const balance = await anchor.getProvider().connection.getBalance(account.publicKey);
    // console.log("Balance:", balance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
    accounts.push(account);
  }
  return accounts;
}


describe("ato", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const program        = anchor.workspace.Ato as Program<Ato>;
  const atoDataKeypair = anchor.web3.Keypair.generate();

  const walletIimposter = anchor.web3.Keypair.generate();
  const walletScheduler = anchor.web3.Keypair.generate();

  let walletAlain  : anchor.web3.Signer;
  let walletBernard: anchor.web3.Signer;

  const ATO_STATUS_NOT_READY  = 0;
  const ATO_STATUS_READY      = 1;
  const PUBLICKEY_DEFAULT_STR = "11111111111111111111111111111111";

  const ATO_PROPS_MODE_OVER  = 0;
  const ATO_PROPS_MODE_LOWER = 1;
  const ATO_PROPS_MODE_DELAY = 2;

  const ATO_PROPS_STATUS_WAITING  = 0;
  const ATO_PROPS_STATUS_OPENED   = 1;
  const ATO_PROPS_STATUS_CLOSED   = 2;
  const ATO_PROPS_STATUS_PAUSED   = 3;
  const ATO_PROPS_STATUS_CANCELED = 4;
  const ATO_PROPS_STATUS_ERROR    = 5;


  let prop1: { pubkey: anchor.web3.PublicKey; bump: number; };
  let prop2: { pubkey: anchor.web3.PublicKey; bump: number; };


  it("initialized(): Is initialized!", async () => {
    await airdropSol(walletIimposter.publicKey, 1); // 1 SOL
    await airdropSol(walletScheduler.publicKey, 1); // 1 SOL

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

    const txPauseToFalse = await program.methods
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
      const txPauseToFalse = await program.methods
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
      expect(err.message).to.include("Admin only operation.");
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


    const txPauseToFalse = await program.methods
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
      //console.log(err.message);
      expect(err.message).to.include("Admin only operation.");
    }

  });


  it("proposal_create(): attempt to create a proposal", async () => {
    const title       = "Test proposal #1";
    const description = "This is a test proposal";
    const mode        = ATO_PROPS_MODE_OVER;
    const threshold   = 1;
    const deadline    = 4919;// -> 1337 (hexa);

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
        provider.wallet.publicKey.toBuffer(),
        propsIndexBuffer,
      ],
      program.programId
    );

    let props = {
      pubkey: propsPubkey,
      bump  : propsBump,
    };

    prop1 = props;

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

      console.log("(prop #1) https://solana.fm/tx/"+txProp1);
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
    //console.log(tailIndex);
    const propsIndexBuffer = Buffer.allocUnsafe(2);
    propsIndexBuffer.writeUInt16LE(tailIndex, 0);
    //console.log(propsIndexBuffer);

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

    prop2 = props;

    let txProp2 = await program.methods
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

      console.log("(prop #2) https://solana.fm/tx/"+txProp2);
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

      expect.fail("The transaction proposal_create() should have failed but it didn't.");

    } catch(err) {
      // console.log("---");
      // console.log(err.message);
      // console.log("---");
      expect(err.message).to.include("Admin only operation.");

    }

  });


  it("vote(): attempt to vote", async () => {

    const accounts = await createAccounts(5, 2);

    walletAlain   = accounts[0];
    walletBernard = accounts[1];

    const propsIndex = 0;
    const propsIndexBuffer = Buffer.allocUnsafe(2);
    propsIndexBuffer.writeUInt16LE(propsIndex, 0);
    //console.log(propsIndexBuffer);

    const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_VOTE"),
        walletAlain.publicKey.toBuffer(),
        prop1.pubkey.toBuffer(),
      ],
      program.programId
    );

    let vote = {
      pubkey: votePubkey,
      bump  : voteBump,
    };


    const atoPaused = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).paused.valueOf();

    const atoStatus = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).status.valueOf();

    const amount = 200000;
    const now = 19;

    // console.log("ato paused  "+atoPaused);
    // console.log("ato status  "+atoStatus);
    // console.log("amount      "+amount);
    // console.log("timestamp   "+now);

    let txVote = await program.methods
      .vote(
        true,
        new anchor.BN(amount),  // amount (Lamports >= MIN)
        new anchor.BN(now)      // now (s < proposal deadline)
      )
      .accounts({
        voteData     : vote.pubkey,
        propsData    : prop1.pubkey,
        atoData      : atoDataKeypair.publicKey,
        voter        : walletAlain.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletAlain])
      .rpc();

      console.log("(Alain vote for prop #1) https://solana.fm/tx/"+txVote);
      console.log("");

    });


    it("vote(): try & fail to vote again (same voter)", async () => {

      try {
        const propsIndex = 0;
        const propsIndexBuffer = Buffer.allocUnsafe(2);
        propsIndexBuffer.writeUInt16LE(propsIndex, 0);
        //console.log(propsIndexBuffer);

        const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("ATO_VOTE"),
            walletAlain.publicKey.toBuffer(),
            prop1.pubkey.toBuffer(),
          ],
          program.programId
        );

        let vote = {
          pubkey: votePubkey,
          bump  : voteBump,
        };


        const atoPaused = (
          await program.account.atoData.fetch(atoDataKeypair.publicKey)
        ).paused.valueOf();

        const atoStatus = (
          await program.account.atoData.fetch(atoDataKeypair.publicKey)
        ).status.valueOf();

        const amount = 200000;
        const now    = 19;

        // console.log("ato paused  "+atoPaused);
        // console.log("ato status  "+atoStatus);
        // console.log("amount      "+amount);
        // console.log("timestamp   "+now);

        let txVote = await program.methods
          .vote(
            true,
            new anchor.BN(amount),  // amount (Lamports >= MIN)
            new anchor.BN(now)      // now (s < proposal deadline)
          )
          .accounts({
            voteData     : vote.pubkey,
            propsData    : prop1.pubkey,
            atoData      : atoDataKeypair.publicKey,
            voter        : walletAlain.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([walletAlain])
          .rpc();

          console.log("----");
          console.log("https://solana.fm/tx/"+txVote);
          console.log("----");
          expect.fail("The transaction vote() should have failed but it didn't.");

      } catch(err) {
        // console.log("---");
        // console.log(err.message);
        // console.log("---");
        expect(err.message).to.include("already in use");

      }

    });


    it("vote(): check pausable", async () => {
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

    try {

      const propsIndex = 1;
      const propsIndexBuffer = Buffer.allocUnsafe(2);
      propsIndexBuffer.writeUInt16LE(propsIndex, 0);
      //console.log(propsIndexBuffer);

      const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("ATO_VOTE"),
          walletAlain.publicKey.toBuffer(),
          prop2.pubkey.toBuffer(),
        ],
        program.programId
      );

      let vote = {
        pubkey: votePubkey,
        bump  : voteBump,
      };

      // const atoPaused = (
      //   await program.account.atoData.fetch(atoDataKeypair.publicKey)
      // ).paused.valueOf();
      // console.log("ato paused "+atoPaused);

      // const atoStatus = (
      //   await program.account.atoData.fetch(atoDataKeypair.publicKey)
      // ).status.valueOf();

      const amount = 200000;
      const now    = 19;

      let txVote = await program.methods
        .vote(
          true,
          new anchor.BN(amount),  // amount (Lamports >= MIN)
          new anchor.BN(now)      // now (s < proposal deadline)
        )
        .accounts({
          voteData     : vote.pubkey,
          propsData    : prop2.pubkey,
          atoData      : atoDataKeypair.publicKey,
          voter        : walletAlain.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([walletAlain])
        .rpc();

        console.log("https://solana.fm/tx/"+txVote);
        console.log("");

        expect.fail("The transaction vote() should have failed but it didn't.");

      } catch(err) {
        // console.log(err.message);
        // console.log("");
        expect(err.message).to.include("Program paused.");
  
      }
  
      const txPauseToFalse = await program.methods
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
    
      //console.log("p2");
      expect(pausedValueToFalseAgain).to.equal(false);
      //console.log("p2");

    });


    it("vote(): check amount value", async () => {

      try {

      const propsIndex = 1;
      const propsIndexBuffer = Buffer.allocUnsafe(2);
      propsIndexBuffer.writeUInt16LE(propsIndex, 0);
      //console.log(propsIndexBuffer);

      const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("ATO_VOTE"),
          walletBernard.publicKey.toBuffer(),
          prop2.pubkey.toBuffer(),
        ],
        program.programId
      );

      let vote = {
        pubkey: votePubkey,
        bump  : voteBump,
      };

      const amount = 20;
      const now    = 30;

      let txVote = await program.methods
        .vote(
          true,
          new anchor.BN(amount),  // amount (Lamports >= MIN)
          new anchor.BN(now)      // now (s < proposal deadline)
        )
        .accounts({
          voteData     : vote.pubkey,
          propsData    : prop2.pubkey,
          atoData      : atoDataKeypair.publicKey,
          voter        : walletBernard.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([walletBernard])
        .rpc();

        console.log("https://solana.fm/tx/"+txVote);
        console.log("");

        expect.fail("The transaction vote() should have failed but it didn't.");

      } catch(err) {
        // console.log(err.message);
        // console.log("----");
        expect(err.message).to.include("Incorrect amount.");
  
      }

    });


    it("vote(): check now/deadline values", async () => {

      try {

      const propsIndex = 1;
      const propsIndexBuffer = Buffer.allocUnsafe(2);
      propsIndexBuffer.writeUInt16LE(propsIndex, 0);
      //console.log(propsIndexBuffer);

      const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("ATO_VOTE"),
          walletBernard.publicKey.toBuffer(),
          prop2.pubkey.toBuffer(),
        ],
        program.programId
      );

      let vote = {
        pubkey: votePubkey,
        bump  : voteBump,
      };

      const amount = 200000;
      const now    = 100000;

      let txVote = await program.methods
        .vote(
          true,
          new anchor.BN(amount),  // amount (Lamports >= MIN)
          new anchor.BN(now)      // now (s < proposal deadline)
        )
        .accounts({
          voteData     : vote.pubkey,
          propsData    : prop2.pubkey,
          atoData      : atoDataKeypair.publicKey,
          voter        : walletBernard.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([walletBernard])
        .rpc();

        console.log("https://solana.fm/tx/"+txVote);
        console.log("");

        expect.fail("The transaction vote() should have failed but it didn't.");

      } catch(err) {
        // console.log(err.message);
        // console.log("----");
        expect(err.message).to.include("Over deadline.");
  
      }

    });


    it("vote() + proposal_set_status(): check prop #1 status", async () => {

      try {


        // set status of prop2 to AtoProposalStatus::Canceled
        // check it
        // 
        const txPauseToTrue = await program.methods
        .proposalSetStatus(ATO_PROPS_STATUS_CANCELED)
        .accounts({
          propsData    : prop2.pubkey,
          atoData      : atoDataKeypair.publicKey,
          signer       : provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

        const propsStatusAfter = (
          await program.account.atoProposal.fetch(prop2.pubkey)
        ).status.valueOf();
        expect(propsStatusAfter).to.equal(ATO_PROPS_STATUS_CANCELED);


        const propsIndex = 1;
        const propsIndexBuffer = Buffer.allocUnsafe(2);
        propsIndexBuffer.writeUInt16LE(propsIndex, 0);
        //console.log(propsIndexBuffer);

        const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("ATO_VOTE"),
            walletBernard.publicKey.toBuffer(),
            prop2.pubkey.toBuffer(),
          ],
          program.programId
        );

        let vote = {
          pubkey: votePubkey,
          bump  : voteBump,
        };

        const amount = 200000;
        const now    = 10;

        let txVote = await program.methods
          .vote(
            true,
            new anchor.BN(amount),  // amount (Lamports >= MIN)
            new anchor.BN(now)      // now (s < proposal deadline)
          )
          .accounts({
            voteData     : vote.pubkey,
            propsData    : prop2.pubkey,
            atoData      : atoDataKeypair.publicKey,
            voter        : walletBernard.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([walletBernard])
          .rpc();

          console.log("https://solana.fm/tx/"+txVote);
          console.log("");

          expect.fail("The transaction vote() should have failed but it didn't.");

      } catch(err) {
        // console.log(err.message);
        // console.log("----");
        expect(err.message).to.include("Incorrect proposal status.");
  
      }

      const txPauseToTrue = await program.methods
      .proposalSetStatus(ATO_PROPS_STATUS_OPENED)
      .accounts({
        propsData    : prop2.pubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

      const propsStatusAfter = (
        await program.account.atoProposal.fetch(prop2.pubkey)
      ).status.valueOf();
      expect(propsStatusAfter).to.equal(ATO_PROPS_STATUS_OPENED);

    });

  });

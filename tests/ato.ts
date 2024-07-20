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

async function monitor( program, comment) {

  console.log("");
  console.log(comment);
  
  let allAto = await program.account.atoData.all();
  console.log("root ");  console.log(allAto);
  console.log("");

  let allProp = await program.account.atoProposal.all();
  console.log("proposal "); console.log(allProp);
  console.log("");

  let allVoter = await program.account.atoVoter.all();
  console.log("voter "); console.log(allVoter);
  console.log("");

  let allVote = await program.account.atoVote.all();
  console.log("vote "); console.log(allVote);
  console.log("");
  //console.log("amount: ", allVote[1].account.amount);
}

async function showVoter( program: anchor.Program<Ato>, accounts: any[], indexArray: string | number) {
  const allVoter = await program.account.atoVoter.all();
  console.log("----------------");

  //console.log(allVoter[indexArray]);

  const index   = allVoter[indexArray].account.index;
  const name    = String.fromCharCode(...allVoter[indexArray].account.name.filter(charCode => charCode !== 0));
  const key     = allVoter[indexArray].account.voter;
  const balance = await anchor.getProvider().connection.getBalance(key);

  console.log("voter   # "+index);
  console.log("name    : "+name);
  console.log("pubkey  : "+key);
  console.log("balance : "+balance / anchor.web3.LAMPORTS_PER_SOL);

  console.log("----------------");
  console.log("");

}


async function showAllVoters( program: anchor.Program<Ato>, accounts: any[], atoDataKeypair: anchor.web3.Keypair) {
  const voterIndexTail = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).voterIndexTail.valueOf();
  console.log("================");
  console.log(voterIndexTail+" voters");

  for(let i=0; i<voterIndexTail; i++) {
    await showVoter(program, accounts, i);
  }
  console.log("");

}

async function showProposal( program, indexArray) {
  const allProp = await program.account.atoProposal.all();
  console.log("----------------");

  //console.log(allProp[indexArray]);

  const index     = allProp[indexArray].account.index;
  const title     = String.fromCharCode(...allProp[indexArray].account.title.filter(charCode => charCode !== 0));
  const key       = allProp[indexArray].account.voter;
  const amount    = allProp[indexArray].account.amount;
  const threshold = allProp[indexArray].account.threshold;
  const deadline  = allProp[indexArray].account.deadline;
  const voteYes   = allProp[indexArray].account.voteYes;
  const voteNo    = allProp[indexArray].account.voteNo;

  console.log("proposal  # "+index);
  console.log("title     : "+title);
  console.log("pubkey    : "+key);
  console.log("amount    : "+amount / anchor.web3.LAMPORTS_PER_SOL);
  console.log("threshold : "+threshold);
  console.log("deadline  : "+deadline);
  console.log("yes       : "+voteYes);
  console.log("no        : "+voteNo);
  console.log("amount    : "+amount);

  console.log("----------------");
  console.log("");

}

async function showAllProposals( program, atoDataKeypair: anchor.web3.Keypair) {

  console.log("================");

  const proposalIndexHead = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexHead.valueOf();
  //-console.log("prop  idx head : " + proposalIndexHead);

  const proposalIndexTail = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexTail.valueOf();
  //-console.log("prop  idx tail : " + proposalIndexTail);
  console.log("proposals : "+ (proposalIndexTail-proposalIndexHead) +" " + proposalIndexHead+" - " + (proposalIndexTail-1));

  for(let i=proposalIndexHead; i<proposalIndexTail; i++) {
    await showProposal(program, i);
  }

  console.log("");
}



describe("ato", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const program        = anchor.workspace.Ato as Program<Ato>;
  const atoDataKeypair = anchor.web3.Keypair.generate();

  const walletIimposter = anchor.web3.Keypair.generate();
  const walletScheduler = anchor.web3.Keypair.generate();

  let accounts: any[];
  
  let walletAlain     : anchor.web3.Signer;
  let voterAlain      : { pubkey: any; bump?: number; };
  let alainIndexBuffer: Buffer;
  
  let walletBernard     : anchor.web3.Signer;
  let voterBernard      : { pubkey: any; bump?: number; };
  let bernardIndexBuffer: Buffer;
  
  let walletCeline     : anchor.web3.Signer;
  let voterCeline      : { pubkey: any; bump?: number; };
  let celineIndexBuffer: Buffer;
  
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
      }).signers([atoDataKeypair])
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


    const getIndexTail = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).voterIndexTail.valueOf();
  
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
      }).rpc();

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
    }).rpc();

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
      }).signers([walletIimposter])
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
      ).accounts({
        propData    : props.pubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();

      // console.log("(prop #1) https://solana.fm/tx/"+txProp1);
      // console.log("");

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
        propData     : props.pubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();

      // console.log("(prop #2) https://solana.fm/tx/"+txProp2);
      // console.log("");

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
          propData     : props.pubkey,
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


  it("proposal_set_status() change status for both...", async () => {
    const opened = 1;
    let txStatus;
    let propPubkey;
    let propsIndex;

    txStatus = await program.methods
      .proposalSetStatus(
        opened,
      ).accounts({
        propData     : prop1.pubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();

      txStatus = await program.methods
      .proposalSetStatus(
        opened,
      ).accounts({
        propData     : prop2.pubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();

  });


  it("voter_registration(): do it...", async () => {
      accounts = await createAccounts(5, 2);

    walletAlain   = accounts[0];
    walletBernard = accounts[1];
    walletCeline  = accounts[2];

    let name : string;
    let email: string;

    name  = "Alain";
    email = "alain@gmail.com";

    // Calculer l'adresse de la PDA
    const [alainPubkey, alainBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_VOTER"),
        walletAlain.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    voterAlain = {
      pubkey: alainPubkey,
      bump  : alainBump,
    };

    let txVoterReg = await program.methods
      .voterRegistration(
        name,
        email,
      ).accounts({
        voterData    : voterAlain.pubkey,
        atoData      : atoDataKeypair.publicKey,
        voter        : walletAlain.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletAlain])
      .rpc();

    //console.log("(voter reg...) https://solana.fm/tx/"+txVoterReg);
    //console.log("");


    name  = "Bernard";
    email = "bernard@gmail.com";

    // Calculer l'adresse de la PDA
    const [bernardPubkey, bernardBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_VOTER"),
        walletBernard.publicKey.toBuffer(),
      ],
      program.programId
    );

    voterBernard = {
      pubkey: bernardPubkey,
      bump  : bernardBump,
    };

    txVoterReg = await program.methods
      .voterRegistration(
        name,
        email,
      ).accounts({
        voterData    : voterBernard.pubkey,
        atoData      : atoDataKeypair.publicKey,
        voter        : walletBernard.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletBernard])
      .rpc();

    // console.log("(voter reg...) https://solana.fm/tx/"+txVoterReg);
    // console.log("");

  });


  it("vote(): attempt to vote", async () => {

    const propsIndex = 0;
    const propsIndexBuffer = Buffer.allocUnsafe(2);
    propsIndexBuffer.writeUInt16LE(propsIndex, 0);
    //console.log("prop #1 "+propsIndexBuffer);

    const alainIndex = 0;
    alainIndexBuffer = Buffer.allocUnsafe(2);
    alainIndexBuffer.writeUInt16LE(alainIndex, 0);
    //console.log("alain "+alainIndexBuffer);

    /* */
    const voteTailIndex = 0;
    //console.log(tailIndex);
    const voteIndexBuffer = Buffer.allocUnsafe(2);
    voteIndexBuffer.writeUInt16LE(voteTailIndex, 0);
    //console.log(propsIndexBuffer);
    /* */

    const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_VOTE"),
        propsIndexBuffer,
        voteIndexBuffer,
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
        voterData    : voterAlain.pubkey,
        propData     : prop1.pubkey,
        atoData      : atoDataKeypair.publicKey,
        voter        : walletAlain.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletAlain])
      .rpc();

      // console.log("(Alain vote for prop #1) https://solana.fm/tx/"+txVote);
      // console.log("");

      //await monitor(program, "Alain vote for prop #1");

    });



    it("vote(): try to vote again (same voter, same proposal, different vote)", async () => {

        const propsIndex = 0;
        const propsIndexBuffer = Buffer.allocUnsafe(2);
        propsIndexBuffer.writeUInt16LE(propsIndex, 0);
        //console.log(propsIndexBuffer);

        /* */
        const voteTailIndex = 1;
        //console.log(tailIndex);
        const voteIndexBuffer = Buffer.allocUnsafe(2);
        voteIndexBuffer.writeUInt16LE(voteTailIndex, 0);
        //console.log(propsIndexBuffer);
        /* */

        const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("ATO_VOTE"),
            //walletAlain.publicKey.toBuffer(),
            //prop1.pubkey.toBuffer(),
            propsIndexBuffer,
            voteIndexBuffer,//alainIndexBuffer,
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
            voterData    : voterAlain.pubkey,
            propData     : prop1.pubkey,
            atoData      : atoDataKeypair.publicKey,
            voter        : walletAlain.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([walletAlain])
          .rpc();

        // console.log("https://solana.fm/tx/"+txVote);
        // console.log("");

        //await monitor(program, "vote(): try to vote again");


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

        /* */
        const voteTailIndex = 0;
        //console.log(tailIndex);
        const voteIndexBuffer = Buffer.allocUnsafe(2);
        voteIndexBuffer.writeUInt16LE(voteTailIndex, 0);
        //console.log(propsIndexBuffer);
        /* */

        const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("ATO_VOTE"),
          // walletAlain.publicKey.toBuffer(),
          // prop2.pubkey.toBuffer(),
          propsIndexBuffer,
          voteIndexBuffer,//alainIndexBuffer,
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
          voterData    : voterAlain.pubkey,
          propData     : prop2.pubkey,
          atoData      : atoDataKeypair.publicKey,
          voter        : walletAlain.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([walletAlain])
        .rpc();

        // console.log("https://solana.fm/tx/"+txVote);
        // console.log("");

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

      //await monitor(program, "vote(): check pausable");

    });


    it("vote(): check amount value", async () => {

      try {

        const propsIndex = 1;
        const propsIndexBuffer = Buffer.allocUnsafe(2);
        propsIndexBuffer.writeUInt16LE(propsIndex, 0);
        //console.log(propsIndexBuffer);

        /* */
        const voteTailIndex = 0;
        //console.log(tailIndex);
        const voteIndexBuffer = Buffer.allocUnsafe(2);
        voteIndexBuffer.writeUInt16LE(voteTailIndex, 0);
        //console.log(propsIndexBuffer);
        /* */

      const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("ATO_VOTE"),
          // walletBernard.publicKey.toBuffer(),
          // prop2.pubkey.toBuffer(),
          propsIndexBuffer,
          voteIndexBuffer,//alainIndexBuffer,
        ],
        program.programId
      );

      let vote = {
        pubkey: votePubkey,
        bump  : voteBump,
      };

      const amount = 20;
      const now    = 30;

      let txVote = await program.methods.vote(
          true,
          new anchor.BN(amount),  // amount (Lamports >= MIN)
          new anchor.BN(now)      // now (s < proposal deadline)
        ).accounts({
          voteData     : vote.pubkey,
          voterData    : voterAlain.pubkey,
          propData     : prop2.pubkey,
          atoData      : atoDataKeypair.publicKey,
          voter        : walletAlain.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([walletAlain])
        .rpc();

        // console.log("https://solana.fm/tx/"+txVote);
        // console.log("");

        expect.fail("The transaction vote() should have failed but it didn't.");

      } catch(err) {
        //console.log(err.message);
        //console.log("----");
        //await monitor(program, "vote(): check amount value");
        expect(err.message).to.include("Incorrect amount.");
  
      }

      //await monitor(program, "vote(): check amount value");

    });


    it("vote(): check now/deadline values", async () => {

      try {

        const propsIndex = 1;
        const propsIndexBuffer = Buffer.allocUnsafe(2);
        propsIndexBuffer.writeUInt16LE(propsIndex, 0);
        //console.log(propsIndexBuffer);

        /* */
        const voteTailIndex = 0;
        //console.log(tailIndex);
        const voteIndexBuffer = Buffer.allocUnsafe(2);
        voteIndexBuffer.writeUInt16LE(voteTailIndex, 0);
        //console.log(propsIndexBuffer);
        /* */

      const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("ATO_VOTE"),
          // walletBernard.publicKey.toBuffer(),
          // prop2.pubkey.toBuffer(),
          propsIndexBuffer,
          voteIndexBuffer,//alainIndexBuffer,
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
        ).accounts({
          voteData     : vote.pubkey,
          voterData    : voterAlain.pubkey,
          propData     : prop2.pubkey,
          atoData      : atoDataKeypair.publicKey,
          voter        : walletAlain.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([walletAlain])
        .rpc();

        // console.log("https://solana.fm/tx/"+txVote);
        // console.log("");

        expect.fail("The transaction vote() should have failed but it didn't.");

      } catch(err) {
        // console.log(err.message);
        // console.log("----");
        expect(err.message).to.include("Over deadline.");
  
      }

      //await monitor(program, "vote(): check now/deadline");

    });


    it("vote() + proposal_set_status(): check prop #1 status", async () => {

      try {


        // set status of prop2 to AtoProposalStatus::Canceled
        // check it
        // 
        const txPauseToTrue = await program.methods
        .proposalSetStatus(ATO_PROPS_STATUS_CANCELED)
        .accounts({
          propData     : prop2.pubkey,
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

        /* */
        const voteTailIndex = 0;
        //console.log(tailIndex);
        const voteIndexBuffer = Buffer.allocUnsafe(2);
        voteIndexBuffer.writeUInt16LE(voteTailIndex, 0);
        //console.log(propsIndexBuffer);
        /* */

        const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("ATO_VOTE"),
            // walletBernard.publicKey.toBuffer(),
            // prop2.pubkey.toBuffer(),
            propsIndexBuffer,
            voteIndexBuffer,//alainIndexBuffer,
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
          ).accounts({
            voteData     : vote.pubkey,
            voterData    : voterAlain.pubkey,
            propData     : prop2.pubkey,
            atoData      : atoDataKeypair.publicKey,
            voter        : walletAlain.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([walletAlain])
          .rpc();

          // console.log("https://solana.fm/tx/"+txVote);
          // console.log("");

          expect.fail("The transaction vote() should have failed but it didn't.");

      } catch(err) {
        // console.log(err.message);
        // console.log("----");
        expect(err.message).to.include("Incorrect proposal status.");
  
      }

      const txPauseToTrue = await program.methods
      .proposalSetStatus(ATO_PROPS_STATUS_OPENED)
      .accounts({
        propData     : prop2.pubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).rpc();

      const propsStatusAfter = (
        await program.account.atoProposal.fetch(prop2.pubkey)
      ).status.valueOf();
      expect(propsStatusAfter).to.equal(ATO_PROPS_STATUS_OPENED);

      //await monitor(program, "vote() + proposal_set_status()");

    });


    it("Voting is closed !", async () => {

      // const proposalIndexHead = (
      //   await program.account.atoData.fetch(atoDataKeypair.publicKey)
      // ).proposalIndexHead.valueOf();
      // console.log("prop  idx head : " + proposalIndexHead);

      // const proposalIndexTail = (
      //   await program.account.atoData.fetch(atoDataKeypair.publicKey)
      // ).proposalIndexTail.valueOf();
      // console.log("prop  idx tail : " + proposalIndexTail);

      // const voterIndexTail = (
      //   await program.account.atoData.fetch(atoDataKeypair.publicKey)
      // ).voterIndexTail.valueOf();
      // console.log("voter idx tail : " + voterIndexTail);

      // let allVote = await program.account.atoVote.all();
      // let amount = allVote[1].account.amount;
      // console.log(amount);
      // let voteIndex = allVote[1].account.voteIndex;
      // console.log(voteIndex);
      // console.log("amount: ", allVote[1].account.amount);

      //await monitor(program, "Voting is closed !");
      await showAllVoters( program, accounts, atoDataKeypair);
      await showAllProposals( program, atoDataKeypair);

    });

  });

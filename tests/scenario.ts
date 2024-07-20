import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ato } from "../target/types/ato";
import { expect } from "chai";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";

const ATO_PROPS_STATUS_WAITING  = 0;
const ATO_PROPS_STATUS_OPENED   = 1;
const ATO_PROPS_STATUS_CLOSED   = 2;
const ATO_PROPS_STATUS_PAUSED   = 3;
const ATO_PROPS_STATUS_CANCELED = 4;
const ATO_PROPS_STATUS_ERROR    = 5;

const ATO_PROPS_MODE_OVER  = 0;
const ATO_PROPS_MODE_LOWER = 1;
const ATO_PROPS_MODE_TIMING = 2;


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

async function showVault(atoDataKeypair: anchor.web3.Keypair) {
  let balance: number;

  console.log("================");
  const key = atoDataKeypair.publicKey;
  balance = await anchor.getProvider().connection.getBalance(key);
  console.log("vault : "+balance);
  console.log("");
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
  console.log(voterIndexTail+" voter(s)");

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
  const key       = allProp[indexArray].publicKey;
  const amount    = allProp[indexArray].account.amount;
  const threshold = allProp[indexArray].account.threshold;
  const deadline  = allProp[indexArray].account.deadline;
  const voteYes   = allProp[indexArray].account.voteYes;
  const voteNo    = allProp[indexArray].account.voteNo;
  const mode      = allProp[indexArray].account.mode;
  const status    = allProp[indexArray].account.status;

  console.log("proposal  # "+index);
  console.log("title     : "+title);
  console.log("amount    : "+amount / anchor.web3.LAMPORTS_PER_SOL);
  console.log("threshold : "+threshold);
  console.log("deadline  : "+deadline);
  console.log("yes       : "+voteYes);
  console.log("no        : "+voteNo);
  console.log("amount    : "+amount);
  console.log("pubkey    : "+key);

  const PropStatusString: string[] = [
    "Waiting",
    "Opened",
    "Closed",
    "Paused",
    "Canceled",
    "Error",
  ];
  console.log("status   : "+PropStatusString[status]);

  const PropModeString: string[] = [
    "Over",
    "Lower",
    "Timing",
  ];
  console.log("mode     : "+PropModeString[mode]);

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
  console.log("proposal(s) : "+ (proposalIndexTail-proposalIndexHead) +" [" + proposalIndexHead+" - " + (proposalIndexTail-1)+"]");

  for(let i=proposalIndexHead; i<proposalIndexTail; i++) {
    await showProposal(program, i);
  }

  console.log("");
}


async function checkProposal( program, indexArray, value, now) {
  const allProp = await program.account.atoProposal.all();
  const status    = allProp[indexArray].account.status;
  if(status != ATO_PROPS_STATUS_OPENED) { return;}

  console.log("----------------");

  //console.log(allProp[indexArray]);

  const index     = allProp[indexArray].account.index;
  const title     = String.fromCharCode(...allProp[indexArray].account.title.filter(charCode => charCode !== 0));
  const key       = allProp[indexArray].publicKey;
  const amount    = allProp[indexArray].account.amount;
  const threshold = allProp[indexArray].account.threshold;
  const deadline  = allProp[indexArray].account.deadline;
  const voteYes   = allProp[indexArray].account.voteYes;
  const voteNo    = allProp[indexArray].account.voteNo;
  const mode      = allProp[indexArray].account.mode;

  const PropStatusString: string[] = [
    "Waiting",
    "Opened",
    "Closed",
    "Paused",
    "Canceled",
    "Error",
  ];

  switch( mode) {
    case ATO_PROPS_MODE_OVER: {
      if( value >= threshold) {
        // TODO
      }
    }

    case ATO_PROPS_MODE_LOWER: {
      if( value <= threshold) {
        // TODO
      }
    }

    case ATO_PROPS_MODE_TIMING: {
       // TODO
    }

  }

  console.log("----------------");
  console.log("");

}

/*
changer :
- status proposal -> AtoProposalStatus::Closed
- trade flag proposal -> true

*/

async function check( program, atoDataKeypair: anchor.web3.Keypair, value, now) {

  console.log("================");

  const proposalIndexHead = (
  await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexHead.valueOf();
  //-console.log("prop  idx head : " + proposalIndexHead);

  const proposalIndexTail = (
  await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexTail.valueOf();
  //-console.log("prop  idx tail : " + proposalIndexTail);
  //console.log("proposal(s) : "+ (proposalIndexTail-proposalIndexHead) +" [" + proposalIndexHead+" - " + (proposalIndexTail-1)+"]");

  for(let i=proposalIndexHead; i<proposalIndexTail; i++) {
    await checkProposal(program, i, value, now);
  }

  console.log("");
}


async function showVote( program, /*accounts,*/ indexProp) {
  const allProp = await program.account.atoProposal.all();
  if(allProp[indexProp].account.voteIndexTail <= 0) {return;}

  const proposalIndex = allProp[indexProp].account.proposalIndex;
  const voterIndex    = allProp[indexProp].account.voterIndex;
  const voteIndex     = allProp[indexProp].account.index;

  const allVoter = await program.account.atoVoter.all();

  console.log("----------------");

  console.log("vote     # "+voteIndex);
  const voterName = "toto";
  const propName  = String.fromCharCode(...allProp[indexProp].account.title.filter(charCode => charCode !== 0));
  console.log(voterName+ " --> "+ propName);

  console.log("----------------");
  console.log("");
  
}


async function showAllVotes( program, /*accounts,*/ atoDataKeypair: anchor.web3.Keypair) {

  console.log("================");

  const proposalIndexHead = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexHead.valueOf();
  //-console.log("prop  idx head : " + proposalIndexHead);
  
  const proposalIndexTail = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexTail.valueOf();
  //-console.log("prop  idx tail : " + proposalIndexTail);
  //console.log("proposals : "+ (proposalIndexTail-proposalIndexHead) +" [" + proposalIndexHead+" - " + (proposalIndexTail-1)+"]");

  const allProp = await program.account.atoProposal.all();

  let totalNnVote: number = 0;

  for(let i=proposalIndexHead; i<proposalIndexTail; i++) {
	totalNnVote += allProp[i].account.voteIndexTail;
  }
  console.log(totalNnVote+" vote(s)");

  for(let i=proposalIndexHead; i<proposalIndexTail; i++) {
    await showVote(program, /*accounts,*/ i);
  }
  
  console.log("");
}



async function getPubkeyFromProposal(provider, program: anchor.Program<Ato>, index: number) {
  let propsIndexBuffer = Buffer.allocUnsafe(2);
  propsIndexBuffer.writeUInt16LE(index, 0);

  const seeds = [
    Buffer.from("ATO_PROP"),
    provider.wallet.publicKey.toBuffer(),
    propsIndexBuffer,
  ];

  const [pubkey, _bump] = await anchor.web3.PublicKey.findProgramAddress(
    seeds,
    program.programId
  );

  return pubkey;
}


describe("scenario", () => {
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
  let indexVoterAlain;

  let walletBernard     : anchor.web3.Signer;
  let voterBernard      : { pubkey: any; bump?: number; };
  let bernardIndexBuffer: Buffer;
  let indexVoterBernard;

  let walletCeline     : anchor.web3.Signer;
  let voterCeline      : { pubkey: any; bump?: number; };
  let celineIndexBuffer: Buffer;
  let indexVoterCeline;

  const ATO_STATUS_NOT_READY  = 0;
  const ATO_STATUS_READY      = 1;
  const PUBLICKEY_DEFAULT_STR = "11111111111111111111111111111111";

  // const ATO_PROPS_MODE_OVER  = 0;
  // const ATO_PROPS_MODE_LOWER = 1;
  // const ATO_PROPS_MODE_TIMING = 2;

  // const ATO_PROPS_STATUS_WAITING  = 0;
  // const ATO_PROPS_STATUS_OPENED   = 1;
  // const ATO_PROPS_STATUS_CLOSED   = 2;
  // const ATO_PROPS_STATUS_PAUSED   = 3;
  // const ATO_PROPS_STATUS_CANCELED = 4;
  // const ATO_PROPS_STATUS_ERROR    = 5;


  it("Is initialized!", async () => {

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

  it("Scheduler set !", async () => {
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

  it("STEP #1 - Proposals creation", async () => {

  let title       = "Proposal #1";
  let description = "Description for proposal #1";
  let mode        = ATO_PROPS_MODE_OVER;
  let threshold   = 1337;
  let deadline    = 120;

  let tailIndex: number;
  let props: { pubkey: any; bump?: number; };

  tailIndex = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexTail.valueOf();
  //console.log(">")
  //console.log(tailIndex);

  let propsIndexBuffer = Buffer.allocUnsafe(2);
  propsIndexBuffer.writeUInt16LE(tailIndex, 0);
  //console.log(">")
  //console.log(propsIndexBuffer);

  ;
  
  // Calculer l'adresse de la PDA
  let [propsPubkey, propsBump] = await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("ATO_PROP"),
      provider.wallet.publicKey.toBuffer(),
      propsIndexBuffer,
    ],
    program.programId
  );

  props = {
    pubkey: propsPubkey,
    bump  : propsBump,
  };
  
  let txProp = await program.methods
    .proposalCreate(
      title,
      description,
      mode,
      new anchor.BN(threshold),
      new anchor.BN(deadline)
    ).accounts({
      propData     : props.pubkey,
      atoData      : atoDataKeypair.publicKey,
      signer       : provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    //.signers([provider.wallet])
    .rpc();

  console.log("(prop #"+tailIndex+") https://solana.fm/tx/"+txProp);
  console.log("");


  tailIndex = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexTail.valueOf();
  //console.log(">")
  //console.log(tailIndex);

  title       = "Proposal #2";
  description = "Description for proposal #2";
  mode        = ATO_PROPS_MODE_TIMING;
  threshold   = 1;
  deadline    = 3000;

  propsIndexBuffer = Buffer.allocUnsafe(2);
  propsIndexBuffer.writeUInt16LE(tailIndex, 0);
  //console.log(">")
  //console.log(propsIndexBuffer);
  
  // Calculer l'adresse de la PDA
  [propsPubkey, propsBump] = await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("ATO_PROP"),
      provider.wallet.publicKey.toBuffer(),
      propsIndexBuffer,
    ],
    program.programId
  );

  props = {
    pubkey: propsPubkey,
    bump  : propsBump,
  };

  txProp = await program.methods
    .proposalCreate(
      title,
      description,
      mode,
      new anchor.BN(threshold),
      new anchor.BN(deadline)
    ).accounts({
      propData     : props.pubkey,
      atoData      : atoDataKeypair.publicKey,
      signer       : provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    //.signers([provider.wallet])
    .rpc();

  console.log("(prop #"+tailIndex+") https://solana.fm/tx/"+txProp);
  console.log("");


  tailIndex = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
  ).proposalIndexTail.valueOf();
  //console.log(">")
  //console.log(tailIndex);

  title       = "Proposal #3";
  description = "Description for proposal #2";
  mode        = ATO_PROPS_MODE_TIMING;
  threshold   = 1;
  deadline    = 5000;

  propsIndexBuffer = Buffer.allocUnsafe(2);
  propsIndexBuffer.writeUInt16LE(tailIndex, 0);
  //console.log(">")
  //console.log(propsIndexBuffer);
  
  // Calculer l'adresse de la PDA
  [propsPubkey, propsBump] = await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("ATO_PROP"),
      provider.wallet.publicKey.toBuffer(),
      propsIndexBuffer,
    ],
    program.programId
  );

  props = {
    pubkey: propsPubkey,
    bump  : propsBump,
  };

  txProp = await program.methods
    .proposalCreate(
      title,
      description,
      mode,
      new anchor.BN(threshold),
      new anchor.BN(deadline)
    ).accounts({
      propData     : props.pubkey,
      atoData      : atoDataKeypair.publicKey,
      signer       : provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    //.signers([provider.wallet])
    .rpc();

  console.log("(prop #"+tailIndex+") https://solana.fm/tx/"+txProp);
  console.log("");

  await showAllProposals( program, atoDataKeypair);

  });

  it("Voters registrations", async () => {

    accounts = await createAccounts(5, 2);

    walletAlain   = accounts[0];
    walletBernard = accounts[1];
    walletCeline  = accounts[2];
  
    let name       : string;
    let email      : string;
    let voter      : { pubkey: any; bump: number; };
    let txVoterReg : string;
    let wallet     : anchor.web3.Signer;
    let voterPubkey: any;
    let voterBump  : any;
    
    name            = "Alain";
    email           = "alain@gmail.com";
    wallet          = walletAlain;
    indexVoterAlain = 0;
  
    // Calculer l'adresse de la PDA
    [voterPubkey, voterBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_VOTER"),
        wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    voter = {
      pubkey: voterPubkey,
      bump  : voterBump,
    };

    voterAlain = voter;
  
    txVoterReg = await program.methods
    .voterRegistration(
      name,
      email,
    ).accounts({
      voterData    : voter.pubkey,
      atoData      : atoDataKeypair.publicKey,
      voter        : wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();
  
    console.log("(voter reg...) https://solana.fm/tx/"+txVoterReg);
    console.log("");
  
    name              = "Bernard";
    email             = "bernard@gmail.com";
    wallet            = walletBernard;
    indexVoterBernard = 1;

    // Calculer l'adresse de la PDA
    [voterPubkey, voterBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
      Buffer.from("ATO_VOTER"),
      wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    voter = {
      pubkey: voterPubkey,
      bump  : voterBump,
    };
  
    voterBernard = voter;
    
    txVoterReg = await program.methods
      .voterRegistration(
        name,
        email,
      ).accounts({
        voterData    : voter.pubkey,
        atoData      : atoDataKeypair.publicKey,
        voter        : wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();
    
    console.log("(voter reg...) https://solana.fm/tx/"+txVoterReg);
    console.log("");
    
    name             = "Céline";
    email            = "celine@gmail.com";
    wallet           = walletCeline;
    indexVoterCeline = 2;
    
    // Calculer l'adresse de la PDA
    [voterPubkey, voterBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_VOTER"),
        wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
      
    voter = {
      pubkey: voterPubkey,
      bump  : voterBump,
    };
  
    voterCeline = voter;
    
    txVoterReg = await program.methods
      .voterRegistration(
        name,
        email,
      ).accounts({
        voterData    : voter.pubkey,
        atoData      : atoDataKeypair.publicKey,
        voter        : wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();
  
    console.log("(voter reg...) https://solana.fm/tx/"+txVoterReg);
    console.log("");
  
    await showAllVoters( program, accounts, atoDataKeypair);

  });


  it("STEP 2 - Changement d'états ...", async () => {

    let status;
    let txStatus  : string;
    let propPubkey: anchor.web3.PublicKey;
    let propsIndex: number;


    propsIndex = 0;
    propPubkey = await getPubkeyFromProposal( provider, program, propsIndex);
    status = ATO_PROPS_STATUS_WAITING;

    txStatus = await program.methods
      .proposalSetStatus(
        status,
      ).accounts({
        propData     : propPubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();
  
    console.log("(prop status...) https://solana.fm/tx/"+txStatus);
    console.log("");
  

    propsIndex = 1;
    propPubkey = await getPubkeyFromProposal( provider, program, propsIndex);
    status = ATO_PROPS_STATUS_OPENED;

    txStatus = await program.methods
      .proposalSetStatus(
        status,
      ).accounts({
        propData     : propPubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();
  
    console.log("(prop status...) https://solana.fm/tx/"+txStatus);
    console.log("");
  

    propsIndex = 2;
    propPubkey = await getPubkeyFromProposal( provider, program, propsIndex);
    status = ATO_PROPS_STATUS_OPENED;

    txStatus = await program.methods
      .proposalSetStatus(
        status,
      ).accounts({
        propData     : propPubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();
  
    console.log("(prop status...) https://solana.fm/tx/"+txStatus);
    console.log("");
  
    await showAllProposals( program, atoDataKeypair);
  });


  it("STEP 3 - Alain vote Yes -> A", async () => {

    let propsIndex: number;
    let tailIndex : number;

    let propsIndexBuffer: Buffer;
    let tailIndexBuffer : Buffer;
    let propPubkey;

    const allProp = await program.account.atoProposal.all();


    propsIndex = 0;
    propsIndexBuffer = Buffer.allocUnsafe(2);
    propsIndexBuffer.writeUInt16LE(tailIndex, 0);

    tailIndex       = allProp[propsIndex].account.voteIndexTail;
    tailIndexBuffer = Buffer.allocUnsafe(2);
    tailIndexBuffer.writeUInt16LE(tailIndex, 0);
  
  
    const [votePubkey, voteBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("ATO_VOTE"),
        propsIndexBuffer,
        tailIndexBuffer,
      ],
      program.programId
    );

    let seeds = {
      pubkey: votePubkey,
      bump  : voteBump,
    };

    const amount = 200000;
    const now    = 19;

    propPubkey = await getPubkeyFromProposal( provider, program, propsIndex);

    try {
      let txVote = await program.methods
        .vote(
          true,
          new anchor.BN(amount),  // amount (Lamports >= MIN)
          new anchor.BN(now)      // now (s < proposal deadline)
        ).accounts({
          voteData     : seeds.pubkey,
          voterData    : voterAlain.pubkey,
          propData     : propPubkey,
          atoData      : atoDataKeypair.publicKey,
          voter        : walletAlain.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([walletAlain])
        .rpc();

        console.log("(vote) https://solana.fm/tx/"+txVote);
        console.log("");
    } catch(err) {
      const msg = "Incorrect proposal status.";
      expect(err.message).to.include(msg);
      console.log("    Fail to vote (Error message \""+msg+"\")");
    }

    await showVault(atoDataKeypair);

  });

  it("STEP 3 - Alain vote Yes -> A", async () => {

    let status;
    let txStatus  : string;
    let propPubkey: anchor.web3.PublicKey;
    let propsIndex: number;


    propsIndex = 0;
    propPubkey = await getPubkeyFromProposal( provider, program, propsIndex);
    status = ATO_PROPS_STATUS_OPENED;

    txStatus = await program.methods
      .proposalSetStatus(
        status,
      ).accounts({
        propData     : propPubkey,
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      //.signers([provider.wallet])
      .rpc();
  
    console.log("(prop status...) https://solana.fm/tx/"+txStatus);
    console.log("");
  
    await showAllProposals( program, atoDataKeypair);
  });

  it("STEP 4 - Check", async () => {

    const proposalIndexHead = (
      await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).proposalIndexHead.valueOf();
    //-console.log("prop  idx head : " + proposalIndexHead);
  
    const proposalIndexTail = (
    await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).proposalIndexTail.valueOf();
  
    for(let i=proposalIndexHead; i<proposalIndexTail; i++) {
      await showProposal(program, i);
    }
    
  });

});

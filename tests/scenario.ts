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
  console.log("proposals : "+ (proposalIndexTail-proposalIndexHead) +" [" + proposalIndexHead+" - " + (proposalIndexTail-1)+"]");

  for(let i=proposalIndexHead; i<proposalIndexTail; i++) {
    await showProposal(program, i);
  }

  console.log("");
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

    it("Proposals creation", async () => {

    let title       = "Proposal #1";
    let description = "Description for proposal #1";
    let mode        = ATO_PROPS_MODE_OVER;
    let threshold   = 1;
    let deadline    = 120;

    let tailIndex: number;

    tailIndex = (
        await program.account.atoData.fetch(atoDataKeypair.publicKey)
    ).proposalIndexTail.valueOf();
    //console.log(">")
    //console.log(tailIndex);

    let propsIndexBuffer = Buffer.allocUnsafe(2);
    propsIndexBuffer.writeUInt16LE(tailIndex, 0);
    //console.log(">")
    //console.log(propsIndexBuffer);

    // Calculer l'adresse de la PDA
    let [propsPubkey, propsBump] = await anchor.web3.PublicKey.findProgramAddress(
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
    console.log(tailIndex);

    title       = "Proposal #2";
    description = "Description for proposal #2";
    mode        = ATO_PROPS_MODE_OVER;
    threshold   = 1;
    deadline    = 120;


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
    //await showAllVoters( program, accounts, atoDataKeypair);

    });

});

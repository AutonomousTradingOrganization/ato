import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ato } from "../target/types/ato";
import { expect } from "chai";

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
//-await airdropSol(newKeypair.publicKey, 1e9); // 1 SOL

describe("ato", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const program        = anchor.workspace.Ato as Program<Ato>;
  const atoDataKeypair = anchor.web3.Keypair.generate();

  const imposterWallet = anchor.web3.Keypair.generate();

  it("initialized(): Is initialized!", async () => {
    await airdropSol(imposterWallet.publicKey, 1e9); // 1 SOL

    const tx = await program.methods
      .initialize()
      .accounts({
        atoData      : atoDataKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([atoDataKeypair])
      .rpc();

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

  it("Pausable: Check internal status", async () => {
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

  it("Pausable: Check admin only", async () => {
    try {
      const txPauseToFalsee = await program.methods
      .setPause(false)
      .accounts({
        atoData      : atoDataKeypair.publicKey,
        signer       : imposterWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([imposterWallet])
      .rpc();

      expect.fail("The transaction setPause() should have failed but it didn't.");

    } catch(err) {
      expect(err.message).to.include("Error Code: AdminOnly");
      // console.log("====");
      // console.log(err.message);
      // console.log("====");
    }

  });
  

});

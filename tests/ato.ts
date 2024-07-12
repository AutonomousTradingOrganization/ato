import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ato } from "../target/types/ato";
import { expect } from "chai";

describe("ato", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const program            = anchor.workspace.Ato as Program<Ato>;
  const dataAccountKeypair = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {

    const tx = await program.methods
      .initialize()
      .accounts({
        atoData      : dataAccountKeypair.publicKey,
        signer       : provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([dataAccountKeypair])
      .rpc();

  });

  it("Can't be initialize again", async () => {
    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          atoData      : dataAccountKeypair.publicKey,
          signer       : provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([dataAccountKeypair])
        .rpc();

      expect.fail("The second transaction initialize() should have failed but it didn't.");

    } catch(err) {
      expect(err.message).to.include("Simulation failed");
      // console.log("====");
      // console.log(err.message);
      // console.log("====");
    }

  });


});

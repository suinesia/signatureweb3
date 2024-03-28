import * as anchor from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Button } from 'antd';
import DSC_IDL from '@/types/digital_signatures_contract.json';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export default function CreateDocs() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const provider = new anchor.AnchorProvider(connection, wallet!, {});
  anchor.setProvider(provider);
  const program = new anchor.Program(DSC_IDL as anchor.Idl, DSC_IDL.metadata.address);
  const mintToken = new PublicKey('DKc1k886G6ZQgS4zZRZzLhJinQ7C3DBfw9sFcZwzhYXh');

  const init_storage = async () => {
    if (!wallet) return;
    const data_init = {
      id: '0',
      nameStorage: 'Digital_Signatures',
    };
    const [storePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('storage'), Buffer.from(data_init.id)],
      program.programId,
    );

    const txHash = await program.methods
      .initialize(data_init)
      .accounts({
        authority: wallet.publicKey,
        initStorage: storePDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`https://solscan.io/account/${txHash}?cluster=devnet`);

    const storage = await program.account.storage.fetch(storePDA);
    console.log('Storage: ', storage);
  };

  const create_doc = async () => {
    if (!wallet) return;

    const data = {
      id: '1',
      name: 'Digital Signature',
      url: 'https://firebasestorage.googleapis.com/v0/b/stroragefile.appspot.com/o/pdf%2F3f_%20Final%20Report.pdf?alt=media&token=c10c0981-c6d6-4638-9f36-991dccbaaff0',
      hashVerified: '0x123456789',
      state: 'pending',
    };

    const form_ata = getAssociatedTokenAddressSync(mintToken, wallet.publicKey);
    const to_ata = getAssociatedTokenAddressSync(
      mintToken,
      new PublicKey('38MK4mttAjuCCjXvrzSHReG72PmSRaoLiuWD5V6Sp5da'),
    );

    const [storePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('storage'), Buffer.from('0')],
      program.programId,
    );
    const [docPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('signature'), storePDA.toBuffer(), Buffer.from(data.id)],
      program.programId,
    );

    const txHash = await program.methods
      .createSignature(data)
      .accounts({
        authority: wallet.publicKey,
        storage: storePDA,
        signature: docPDA,
        signerAccount: wallet.publicKey,
        fromAta: form_ata,
        toAta: to_ata,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log(`https://solscan.io/account/${txHash}?cluster=devnet`);

    const doc = await program.account.signature.fetch(docPDA);

    console.log('Doc: ', doc);
  };

  const sign_doc = async () => {
    if (!wallet) return;

    const form_ata = getAssociatedTokenAddressSync(mintToken, wallet.publicKey);
    const to_ata = getAssociatedTokenAddressSync(
      mintToken,
      new PublicKey('38MK4mttAjuCCjXvrzSHReG72PmSRaoLiuWD5V6Sp5da'),
    );
    const [storePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('storage'), Buffer.from('0')],
      program.programId,
    );
    const [docPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('signature'), storePDA.toBuffer(), Buffer.from('1')],
      program.programId,
    );

    await program.methods
      .signLegalAgreement()
      .accounts({
        authority: wallet.publicKey,
        signature: docPDA,
        fromAta: form_ata,
        toAta: to_ata,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const doc = await program.account.signature.fetch(docPDA);
    console.log('Doc: ', doc);
  };

  return (
    <div className='flex space-x-1'>
      <Button onClick={init_storage}>Create Storage</Button>
      <Button onClick={create_doc}>Create DOCS</Button>
      <Button onClick={sign_doc}>SIGN POST</Button>
    </div>
  );
}

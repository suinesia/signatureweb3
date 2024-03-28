/* eslint-disable react-hooks/exhaustive-deps */
import { TSignature, TStorage } from '@/types';
import DSC_IDL from '@/types/digital_signatures_contract.json';
import * as anchor from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Card, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SignDoc() {
  const [loading, setLoading] = useState<boolean>(false);
  const [docs, setDocs] = useState<TSignature[]>([]);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const provider = new anchor.AnchorProvider(connection, wallet!, {});
  anchor.setProvider(provider);
  const program = new anchor.Program(DSC_IDL as anchor.Idl, DSC_IDL.metadata.address);

  const getAllDocs = async () => {
    if (!wallet) return;
    setLoading(true);
    const [storePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('storage'), Buffer.from('0')],
      program.programId,
    );

    const storage = (await program.account.storage.fetch(storePDA)) as TStorage;

    const docs = await Promise.all(
      Array.from({ length: storage.counter + 1 }, async (_, idx) => {
        try {
          const [docPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('signature'), storePDA.toBuffer(), Buffer.from(idx.toString())],
            program.programId,
          );
          const doc = (await program.account.signature.fetch(docPDA)) as TSignature;
          return doc;
        } catch (err) {
          console.error(err);
          return null;
        }
      }),
    );

    const results = docs.filter(
      (doc) =>
        doc !== null && doc.signatureAccount.toBase58() === wallet.publicKey.toBase58() && doc.state === 'unsigned',
    ) as TSignature[];

    setDocs(results);
    setLoading(false);
  };

  useEffect(() => {
    getAllDocs();
  }, [wallet]);

  return (
    <div>
      {loading ? (
        <div className='flex w-full h-96 items-center justify-center'>
          <Spin size='large' />
        </div>
      ) : (
        <div>
          <p className='text-xl font-medium'>Documents awaiting signature: {docs.length} docs</p>
          <div className='flex flex-col space-y-3 mt-4'>
            {docs.map((doc) => (
              <Card
                extra={
                  <Link to={`/signature/${doc.id}`} state={doc}>
                    Detail
                  </Link>
                }
                key={doc.id}
                title={doc.name}
              >
                <p>URL: {doc.url}</p>
                <p>Hash: {doc.hashVerified}</p>
                <p>State: {doc.state}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

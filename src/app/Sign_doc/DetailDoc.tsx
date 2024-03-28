import { TSignature } from '@/types';
import DSC_IDL from '@/types/digital_signatures_contract.json';
import * as anchor from '@coral-xyz/anchor';
import { Viewer } from '@react-pdf-viewer/core';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Button, Col, Result, Row, Spin, Watermark, notification } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function DetailDoc() {
  const param = useParams() as { id: string };
  const [loading, setLoading] = useState<boolean>(false);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const provider = new anchor.AnchorProvider(connection, wallet!, {});
  anchor.setProvider(provider);
  const program = new anchor.Program(DSC_IDL as anchor.Idl, DSC_IDL.metadata.address);
  const mintToken = new PublicKey('DKc1k886G6ZQgS4zZRZzLhJinQ7C3DBfw9sFcZwzhYXh');
  const [data, setData] = useState<TSignature>();

  const loadData = async () => {
    const [storePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('storage'), Buffer.from('0')],
      program.programId,
    );
    const [docPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('signature'), storePDA.toBuffer(), Buffer.from(param.id)],
      program.programId,
    );

    const doc = (await program.account.signature.fetch(docPDA)) as TSignature;

    setData(doc);
  };

  const handleSign = async () => {
    if (!wallet) return;
    setLoading(true);

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
      [Buffer.from('signature'), storePDA.toBuffer(), Buffer.from(data?.id ?? '0')],
      program.programId,
    );

    try {
      const tx = await program.methods
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
      notification.success({
        message: 'Success',
        description: `Transaction hash: ${tx}`,
      });

      const doc = (await program.account.signature.fetch(docPDA)) as TSignature;
      setData(doc);
    } catch (err) {
      notification.error({
        message: 'Error',
        description: "Can't sign this document",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {data ? (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Watermark
              content={data.state}
              font={{ fontSize: 30, color: data.state === 'unsigned' ? 'rgba(177,8,8,0.3)' : 'rgba(12,164,9,0.3)' }}
            >
              <div className='border border-gray-200 h-[800px] shadow-md'>
                <Viewer fileUrl={data.url} />
              </div>
            </Watermark>
          </Col>
          <Col span={12}>
            <div className='p-4'>
              <h1 className='text-xl font-bold'>{data.name}</h1>
              <p className='text-lg'>Hash: {data.hashVerified}</p>
              <p className='text-lg'>State: {data.state}</p>
            </div>
            <div className='flex items-center justify-center h-64'>
              {data.state === 'unsigned' ? (
                <Button disabled={loading} loading={loading} type='primary' onClick={handleSign} size='large'>
                  Signatures
                </Button>
              ) : (
                <Result status='success' title='Signed Successfully!' />
              )}
            </div>
          </Col>
        </Row>
      ) : (
        <Spin size='large' />
      )}
    </div>
  );
}

import { TStorage } from '@/types';
import DSC_IDL from '@/types/digital_signatures_contract.json';
import { FileAddOutlined } from '@ant-design/icons';
import * as anchor from '@coral-xyz/anchor';
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Button, Col, Form, Input, Row, Upload, UploadProps, message } from 'antd';
import CryptoJS from 'crypto-js';
import { useState } from 'react';

const { Dragger } = Upload;

type DataUploadRes = {
  data: {
    url: string;
    name: string;
  };
};

export default function CreateDocs() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const provider = new anchor.AnchorProvider(connection, wallet!, {});
  anchor.setProvider(provider);
  const program = new anchor.Program(DSC_IDL as anchor.Idl, DSC_IDL.metadata.address);
  const mintToken = new PublicKey('DKc1k886G6ZQgS4zZRZzLhJinQ7C3DBfw9sFcZwzhYXh');
  const [fileURL, setFileURL] = useState<string>('');
  const [fileHash, setFileHash] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    action: 'https://api.paperread.chuhung.com/api/v1/upload',
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) {
            const fileArrayBuffer = event.target.result as ArrayBuffer;
            const fileUint8Array = new Uint8Array(fileArrayBuffer);
            const file_word_array = CryptoJS.lib.WordArray.create(fileUint8Array);
            const hash = CryptoJS.SHA256(file_word_array).toString();
            console.log('Hash:', hash);
            setFileHash(hash);
            const res = info.file.response as DataUploadRes;
            setFileURL(res.data.url);
            setFileName(res.data.name);
          }
        };
        reader.readAsArrayBuffer(info.file.originFileObj as File);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  const handleCreate = async (value: { signerAccount: string }) => {
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

    const storage = (await program.account.storage.fetch(storePDA)) as TStorage;

    const data = {
      id: (storage.counter + 1).toString(),
      name: fileName,
      url: fileURL,
      hashVerified: fileHash,
      state: 'pending',
    };

    const [docPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('signature'), storePDA.toBuffer(), Buffer.from(data.id)],
      program.programId,
    );

    try {
      const txHash = await program.methods
        .createSignature(data)
        .accounts({
          authority: wallet.publicKey,
          storage: storePDA,
          signature: docPDA,
          signerAccount: new PublicKey(value.signerAccount),
          fromAta: form_ata,
          toAta: to_ata,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      message.success(`Success: Transaction hash: ${txHash}`);
    } catch (err) {
      message.error(`Error: Create signature failed!!!`);
    }
    setLoading(false);
  };

  // const init_storage = async () => {
  //   if (!wallet) return;
  //   const data_init = {
  //     id: '0',
  //     nameStorage: 'Digital_Signatures',
  //   };
  //   const [storePDA] = anchor.web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from('storage'), Buffer.from(data_init.id)],
  //     program.programId,
  //   );

  //   const txHash = await program.methods
  //     .initialize(data_init)
  //     .accounts({
  //       authority: wallet.publicKey,
  //       initStorage: storePDA,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //     })
  //     .rpc();

  //   console.log(`https://solscan.io/account/${txHash}?cluster=devnet`);

  //   const storage = await program.account.storage.fetch(storePDA);
  //   console.log('Storage: ', storage);
  // };

  return (
    <div>
      {/* <Button onClick={init_storage}>INIT</Button> */}
      {!fileURL && (
        <div className='my-4'>
          <Dragger {...props} accept='application/pdf,application/vnd.ms-excel'>
            <p className='ant-upload-drag-icon'>
              <FileAddOutlined />
            </p>
            <p className='ant-upload-text'>Click or drag file to this area to upload</p>
            <p className='ant-upload-hint'>Only support for PDF and Excel files</p>
          </Dragger>
        </div>
      )}
      {fileURL && (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div
              style={{
                border: '1px solid rgba(0, 0, 0, 0.3)',
                height: '750px',
              }}
            >
              <Viewer fileUrl={fileURL} />
            </div>
          </Col>
          <Col span={12}>
            <Form layout='vertical' onFinish={handleCreate}>
              <Form.Item name='signerAccount' label='Signer Public Key Address'>
                <Input type='text' />
              </Form.Item>
              <div className='flex items-center justify-end'>
                <Button disabled={loading} loading={loading} htmlType='submit' type='primary' size='large'>
                  Create
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      )}
    </div>
  );
}

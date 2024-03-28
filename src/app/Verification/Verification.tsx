import { TSignature } from '@/types';
import DSC_IDL from '@/types/digital_signatures_contract.json';
import * as anchor from '@coral-xyz/anchor';
import { Viewer } from '@react-pdf-viewer/core';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Col, Modal, Result, Row, Spin, Upload, UploadProps, message } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { FileAddOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

export default function Verification() {
  const param = useParams() as { id: string };
  const [data, setData] = useState<TSignature>();
  const [fileHash, setFileHash] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [originFileObj, setOriginFileObj] = useState<File | null>(null);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const provider = new anchor.AnchorProvider(connection, wallet!, {});
  anchor.setProvider(provider);
  const program = new anchor.Program(DSC_IDL as anchor.Idl, DSC_IDL.metadata.address);

  const props: UploadProps = {
    name: 'file',
    onChange(info) {
      message.success(`${info.file.name} file uploaded successfully.`);
      setOriginFileObj(info.file.originFileObj as File);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          const fileArrayBuffer = event.target.result as ArrayBuffer;
          const fileUint8Array = new Uint8Array(fileArrayBuffer);
          const file_word_array = CryptoJS.lib.WordArray.create(fileUint8Array);
          const hash = CryptoJS.SHA256(file_word_array).toString();
          console.log('Hash:', hash);
          setFileHash(hash);
        }
      };
      reader.readAsArrayBuffer(info.file.originFileObj as File);

      setOpen(true);
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

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

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {data ? (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className='border border-gray-200 h-[800px] shadow-md'>
              <Viewer fileUrl={data.url} />
            </div>
          </Col>
          <Col span={12}>
            {!originFileObj ? (
              <Dragger {...props} accept='application/pdf,application/vnd.ms-excel'>
                <p className='ant-upload-drag-icon'>
                  <FileAddOutlined />
                </p>
                <p className='ant-upload-text'>Click or drag file to compare</p>
                <p className='ant-upload-hint'>Only support for PDF</p>
              </Dragger>
            ) : (
              <div className='border border-gray-200 h-[800px] shadow-md'>
                <Viewer fileUrl={URL.createObjectURL(new Blob([originFileObj]))} />
              </div>
            )}
          </Col>
          <Modal
            centered
            width={'50%'}
            title='Compare result'
            open={open}
            onOk={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          >
            <p className='text-base'>Hash in system: {data.hashVerified}</p>
            <p className='text-base'>Hash of file: {fileHash}</p>

            {data.hashVerified === fileHash ? (
              <Result status='success' title='Verified file integrity' />
            ) : (
              <Result status='error' title='Do not match, it is possible that the file has been edited!' />
            )}
          </Modal>
        </Row>
      ) : (
        <Spin />
      )}
    </div>
  );
}

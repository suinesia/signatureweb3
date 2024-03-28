/* eslint-disable react-hooks/exhaustive-deps */
import { CompressOutlined, SignatureOutlined, FileAddOutlined } from '@ant-design/icons';
import * as anchor from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;
const SOL_ICON = 'https://cryptologos.cc/logos/solana-sol-logo.png';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Create', '/create', <FileAddOutlined />),
  getItem('Signature', '/signature', <SignatureOutlined />),
  getItem('Verification', '/verification', <CompressOutlined />),
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const provider = new anchor.AnchorProvider(connection, wallet!, {});
  anchor.setProvider(provider);

  const getTransactionAccount = async () => {
    if (!wallet) return;
    const lamports = await connection.getBalance(new PublicKey(wallet.publicKey));
    setSolBalance(Number((lamports / LAMPORTS_PER_SOL).toFixed(2)));
  };

  useEffect(() => {
    getTransactionAccount();
  }, [wallet]);

  const onClick: MenuProps['onClick'] = (e) => {
    navigate(e.key.toString());
  };

  return (
    <Layout className='h-[100vh]'>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className='my-2'>
          <p className='font-medium text-3xl text-white text-center'>{collapsed ? 'W3' : 'WEB3'}</p>
        </div>
        <Menu onClick={onClick} theme='dark' defaultSelectedKeys={[location.pathname]} mode='inline' items={items} />
      </Sider>
      <Layout className='h-full w-full'>
        <Header className='p-0 bg-white'>
          <div className='flex items-center justify-between px-4 h-full'>
            <h1 className='text-2xl font-semibold'>Digital Signatures</h1>
            <div className='flex items-center space-x-2'>
              <WalletMultiButton />
              {wallet && (
                <div className='flex items-center space-x-2'>
                  <div className='bg-slate-200 h-10 w-10 rounded-full flex items-center justify-center p-2 shadow-lg'>
                    <img src={SOL_ICON} alt='SOL ITEM' className='w-full h-full' />
                  </div>
                  <p className='font-bold'>{solBalance} SOL</p>
                </div>
              )}
            </div>
          </div>
        </Header>
        <Content className='mx-4 mt-2'>
          <main className='p-6 h-full w-full bg-white rounded-xl overflow-auto'>
            {/* <Alert message='This is demo, system run only on devnet' type='error' showIcon /> */}
            <Outlet />
          </main>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          WEB3 - DIGITAL SIGNATURES PROJECT ©{new Date().getFullYear()} Created by LegalChain Team
        </Footer>
      </Layout>
    </Layout>
  );
}

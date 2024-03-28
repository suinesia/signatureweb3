import WalletProviderContext from '@/contexts/WalletProvider/Wallet.provider';
import '@/styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router.tsx';
import { Worker } from '@react-pdf-viewer/core';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Worker workerUrl='https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js'>
      <WalletProviderContext>
        <RouterProvider router={router} />
      </WalletProviderContext>
    </Worker>
  </React.StrictMode>,
);

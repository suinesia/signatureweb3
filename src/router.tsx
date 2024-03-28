import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layout';
import CreateDocs from './app/Create_doc';
import SignDoc from './app/Sign_doc';
import DetailDoc from './app/Sign_doc/DetailDoc';
import VerificationDetail from './app/Verification/Verification';
import Verification from './app/Verification';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'create', element: <CreateDocs /> },
      { path: 'signature', element: <SignDoc /> },
      { path: 'verification', element: <Verification /> },
      { path: 'signature/:id', element: <DetailDoc /> },
      { path: 'verification/:id', element: <VerificationDetail /> },
    ],
  },
]);

export default router;

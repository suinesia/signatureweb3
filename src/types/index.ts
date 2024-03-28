import { PublicKey } from '@solana/web3.js';

export type TStorage = {
  id: string;
  nameStorage: string;
  counter: number;
};

export type TSignature = {
  id: string;
  name: string;
  url: string;
  hashVerified: string;
  state: string;
  creatorAccount: PublicKey;
  signatureAccount: PublicKey;
};

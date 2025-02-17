// App.jsx
import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

function WalletConnection() {
  const { connected, publicKey, disconnect } = useWallet();

  return (
    <div className="p-4">
      <WalletMultiButton /> {connected && <WalletDisconnectButton />}
    </div>
  );
}

function PKey() {
  const { publicKey } = useWallet();

  return (
    <>
      <span>
        PK: {publicKey?.toString()}
      </span>
      <br />
    </>
  );
}

export default function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-3">
                <h1 className="text-xl font-semibold">Solana Wallet Login</h1><PKey />
              </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6">
              <WalletConnection />
            </main>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}


import { useState, useEffect } from 'react';
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { Wallet, LogOut } from 'lucide-react';

// WalletConnect configuration
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

let walletKit = null;

const initWalletKit = async () => {
  if (walletKit) return walletKit;

  const core = new Core({
    projectId,
  });

  walletKit = await WalletKit.init({
    core,
    metadata: {
      name: 'STXVault - Deposit & Earn',
      description: 'Decentralized STX deposit and reward platform',
      url: window.location.origin,
      icons: [window.location.origin + '/logo.svg'],
    },
  });

  return walletKit;
};

export const WalletConnect = ({ onUserDataChange }) => {
  const [address, setAddress] = useState(null);
  const [session, setSession] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const kit = await initWalletKit();
        
        // Check for existing sessions
        const activeSessions = kit.getActiveSessions();
        if (Object.keys(activeSessions).length > 0) {
          const firstSession = Object.values(activeSessions)[0];
          setSession(firstSession);
          
          // Extract address from session
          const accounts = firstSession.namespaces?.eip155?.accounts || [];
          if (accounts.length > 0) {
            const addr = accounts[0].split(':')[2];
            setAddress(addr);
            onUserDataChange?.({ address: addr, session: firstSession });
          }
        }

        // Listen for session proposals
        kit.on('session_proposal', async (proposal) => {
          try {
            const approvedNamespaces = buildApprovedNamespaces({
              proposal: proposal.params,
              supportedNamespaces: {
                eip155: {
                  chains: ['eip155:1'],
                  methods: ['eth_sendTransaction', 'personal_sign'],
                  events: ['chainChanged', 'accountsChanged'],
                  accounts: ['eip155:1:0x0000000000000000000000000000000000000000']
                }
              }
            });

            const newSession = await kit.approveSession({
              id: proposal.id,
              namespaces: approvedNamespaces
            });

            setSession(newSession);
            const accounts = newSession.namespaces?.eip155?.accounts || [];
            if (accounts.length > 0) {
              const addr = accounts[0].split(':')[2];
              setAddress(addr);
              onUserDataChange?.({ address: addr, session: newSession });
            }
          } catch (error) {
            console.error('Session approval error:', error);
            await kit.rejectSession({
              id: proposal.id,
              reason: getSdkError('USER_REJECTED')
            });
          }
        });

        // Listen for session requests
        kit.on('session_request', async (event) => {
          console.log('Session request:', event);
          // Handle signing requests here
        });

        // Listen for session delete
        kit.on('session_delete', () => {
          setSession(null);
          setAddress(null);
          onUserDataChange?.(null);
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('WalletKit initialization error:', error);
      }
    };

    init();
  }, [onUserDataChange]);

  const connectWallet = async () => {
    try {
      const kit = await initWalletKit();
      // Generate pairing URI for QR code or deep link
      const uri = await kit.core.pairing.create();
      console.log('WalletConnect URI:', uri);
      
      // Display QR code or allow manual URI input
      alert(`Scan this URI with your wallet:\n\n${uri}`);
      
      await kit.pair({ uri });
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const disconnectWallet = async () => {
    if (session && walletKit) {
      try {
        await walletKit.disconnectSession({
          topic: session.topic,
          reason: getSdkError('USER_DISCONNECTED')
        });
        setSession(null);
        setAddress(null);
        onUserDataChange?.(null);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  };

  if (address) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-cyber-accent/20 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-cyber-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-cyber-text">{shortAddress}</p>
            <p className="text-xs text-cyber-text/50">Connected via WalletConnect</p>
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="p-2 hover:bg-cyber-border rounded-lg transition-colors"
          title="Disconnect"
        >
          <LogOut className="w-5 h-5 text-cyber-text/70" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={connectWallet} 
      className="btn-primary w-full flex items-center justify-center gap-2"
      disabled={!isInitialized}
    >
      <Wallet className="w-5 h-5" />
      {isInitialized ? 'Connect Wallet' : 'Initializing...'}
    </button>
  );
};

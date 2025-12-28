import { useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { Wallet, LogOut, Coins } from 'lucide-react';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export const WalletConnect = ({ onUserDataChange }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setUserData(data);
      onUserDataChange?.(data);
    }
  }, [onUserDataChange]);

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'STXVault - Deposit & Earn',
        icon: window.location.origin + '/logo.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        const data = userSession.loadUserData();
        setUserData(data);
        onUserDataChange?.(data);
      },
      userSession,
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setUserData(null);
    onUserDataChange?.(null);
  };

  if (userData) {
    const address = userData.profile.stxAddress.mainnet;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-cyber-accent/20 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-cyber-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-cyber-text">{shortAddress}</p>
            <p className="text-xs text-cyber-text/50">Connected</p>
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
    <button onClick={connectWallet} className="btn-primary w-full flex items-center justify-center gap-2">
      <Wallet className="w-5 h-5" />
      Connect Wallet
    </button>
  );
};

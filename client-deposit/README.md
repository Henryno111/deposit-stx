# STXVault - Deposit & Earn Platform

A futuristic decentralized application (dApp) for STX deposits, task management, and reward distribution on the Stacks blockchain.

## 🔗 Wallet Integration

### WalletConnect Integration

This dApp uses **WalletConnect Wallet SDK** (`@reown/walletkit`) for universal wallet connectivity.

**Setup Requirements:**
1. Create a project at [WalletConnect Dashboard](https://dashboard.walletconnect.com/)
2. Copy your Project ID
3. Add it to `.env` file as `VITE_WALLETCONNECT_PROJECT_ID`

### Supported Features

- ✅ Universal wallet pairing via QR code or deep link
- ✅ Session management and persistence
- ✅ Multi-chain support (EIP-155 for EVM chains)
- ✅ Secure transaction signing
- ✅ Event handling (accountsChanged, chainChanged)

### How It Works

1. **Initialize**: WalletKit initializes with your project ID
2. **Connect**: Generate pairing URI for QR code scanning
3. **Approve**: Handle session proposals with approved namespaces
4. **Sign**: Process transaction and signing requests
5. **Disconnect**: Clean session termination

## 🚀 Tech Stack

### Frontend
- **React 19** - Latest React with improved performance
- **Vite** (Rolldown) - Next-gen build tool with experimental bundler
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### Blockchain Integration
- **@reown/walletkit** - WalletConnect Wallet SDK
- **@walletconnect/core** - Core WalletConnect protocol
- **@walletconnect/utils** - Utility functions for namespaces
- **@stacks/transactions** - Transaction building & signing
- **@stacks/network** - Network configuration (Mainnet/Testnet)
- **Stacks Blockchain** - Layer 1 blockchain enabling Bitcoin DeFi

### Smart Contracts
- **Clarity 2** - Decidable smart contract language
- **Clarinet** - Development & testing framework
- **Epoch 3.0** - Latest Stacks blockchain features

## 📦 Installation

```bash
# Install dependencies
npm install

# Configure WalletConnect
# 1. Copy .env.example to .env
cp .env.example .env

# 2. Get project ID from https://dashboard.walletconnect.com/
# 3. Add your project ID to .env file

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Features

### Animated UI
- Floating orbs background animation
- Grid overlay with scan lines
- Smooth card transitions
- Cyberpunk/futuristic theme

### Wallet Features
- Connect/disconnect wallet
- Display shortened address
- Persistent session across refreshes
- Secure authentication flow

### Contract Interactions
- **Deposit STX**: Transfer STX to deposit pool
- **Withdraw STX**: Remove funds (when pool is unlocked)
- **Real-time Stats**: View total pool, depositor count, minimum deposit
- **Transaction Tracking**: Monitor pending/confirmed transactions

## 🔒 Security

- All transactions require wallet signature
- No private keys stored in dApp
- Read-only functions for data queries
- Contract validation on-chain
- 5% platform fee on rewards

## 📝 Smart Contracts

The dApp interacts with 5 deployed smart contracts on Stacks mainnet:

1. **deposit-pool** - Manages STX deposits and withdrawals
2. **task-manager** - Handles task creation and submissions
3. **reward-distributor** - Distributes rewards with platform fee
4. **deposit-pool-trait** - Interface for deposit pool
5. **task-manager-trait** - Interface for task manager

**Deployer Address**: `SPD7WQ5ZTDXV45D3ZCY00N1WTRF106SH9XA0D979`

## 🌐 Network Configuration

```javascript
import { StacksMainnet, StacksTestnet } from '@stacks/network';

// Mainnet (Production)
const network = new StacksMainnet();

// Testnet (Development)
const network = new StacksTestnet();
```

## 📚 Resources

- [WalletConnect Documentation](https://docs.walletconnect.network/)
- [WalletConnect Dashboard](https://dashboard.walletconnect.com/)
- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language](https://docs.stacks.co/clarity/)
- [Hiro Platform](https://www.hiro.so/)

## 🤝 Contributing

This is a production dApp. For questions or issues, please contact the development team.

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ on Stacks**

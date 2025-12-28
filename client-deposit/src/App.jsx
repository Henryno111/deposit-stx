import { useState } from 'react';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Logo } from './components/Logo';
import { WalletConnect } from './components/WalletConnect';
import { DepositCard } from './components/DepositCard';
import { StatsCard } from './components/StatsCard';
import { motion } from 'framer-motion';
import { Github, Twitter, Book } from 'lucide-react';

function App() {
  const [userData, setUserData] = useState(null);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-cyber-border/30 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <Logo />
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-cyber-card rounded-lg transition-colors"
                >
                  <Github className="w-5 h-5 text-cyber-text/70 hover:text-cyber-accent transition-colors" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-cyber-card rounded-lg transition-colors"
                >
                  <Twitter className="w-5 h-5 text-cyber-text/70 hover:text-cyber-accent transition-colors" />
                </a>
                <a
                  href="#"
                  className="p-2 hover:bg-cyber-card rounded-lg transition-colors"
                >
                  <Book className="w-5 h-5 text-cyber-text/70 hover:text-cyber-accent transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 py-12"
            >
              <h2 className="text-5xl md:text-6xl font-bold text-cyber-text">
                Deposit. <span className="text-cyber-accent">Earn.</span> Grow.
              </h2>
              <p className="text-xl text-cyber-text/60 max-w-2xl mx-auto">
                Stake your STX tokens in the vault, complete tasks, and earn rewards on the Stacks blockchain.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <StatsCard />
            </motion.div>

            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <WalletConnect onUserDataChange={setUserData} />
              
              {userData ? (
                <DepositCard userData={userData} />
              ) : (
                <div className="glass-card p-12 text-center">
                  <div className="w-16 h-16 bg-cyber-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-cyber-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-cyber-text mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-cyber-text/60">
                    Connect your Stacks wallet to start depositing and earning rewards
                  </p>
                </div>
              )}

              {/* Info Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card p-6 space-y-3 neon-border">
                  <h4 className="font-semibold text-cyber-accent">How It Works</h4>
                  <ol className="space-y-2 text-sm text-cyber-text/70">
                    <li>1. Connect your Stacks wallet</li>
                    <li>2. Deposit STX tokens to the vault</li>
                    <li>3. Complete tasks to earn rewards</li>
                    <li>4. Withdraw anytime with your earnings</li>
                  </ol>
                </div>

                <div className="glass-card p-6 space-y-3 neon-border">
                  <h4 className="font-semibold text-cyber-purple">Platform Fee</h4>
                  <p className="text-sm text-cyber-text/70">
                    5% platform fee on rewards
                  </p>
                  <p className="text-sm text-cyber-text/70">
                    95% goes directly to you
                  </p>
                  <p className="text-sm text-cyber-text/70">
                    No deposit or withdrawal fees
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-cyber-border/30 backdrop-blur-xl mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-sm text-cyber-text/50">
              <p>Powered by Stacks Blockchain • Built with React & Tailwind CSS</p>
              <p className="mt-2">
                Contract: {' '}
                <a
                  href="https://explorer.hiro.so/address/SPD7WQ5ZTDXV45D3ZCY00N1WTRF106SH9XA0D979?chain=mainnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-accent hover:underline"
                >
                  SPD7WQ...D979
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App

import { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';
import { 
  uintCV, 
  standardPrincipalCV,
  PostConditionMode 
} from '@stacks/transactions';
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';

const CONTRACT_ADDRESS = 'SPD7WQ5ZTDXV45D3ZCY00N1WTRF106SH9XA0D979';
const CONTRACT_NAME = 'deposit-pool';

export const DepositCard = ({ userData }) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txId, setTxId] = useState('');

  const handleDeposit = async () => {
    if (!amount || !userData) return;
    
    setIsLoading(true);
    setTxId('');

    try {
      const amountInMicroStx = Math.floor(parseFloat(amount) * 1000000);
      
      await openContractCall({
        network: new StacksMainnet(),
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'deposit',
        functionArgs: [uintCV(amountInMicroStx)],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          setTxId(data.txId);
          setAmount('');
          setIsLoading(false);
        },
        onCancel: () => {
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Deposit error:', error);
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !userData) return;
    
    setIsLoading(true);
    setTxId('');

    try {
      const amountInMicroStx = Math.floor(parseFloat(amount) * 1000000);
      
      await openContractCall({
        network: new StacksMainnet(),
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'withdraw',
        functionArgs: [uintCV(amountInMicroStx)],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          setTxId(data.txId);
          setAmount('');
          setIsLoading(false);
        },
        onCancel: () => {
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Withdraw error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-cyber-text/70 mb-2">
          Amount (STX)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="1"
          step="0.1"
          disabled={!userData || isLoading}
          className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 text-lg font-medium text-cyber-text placeholder:text-cyber-text/30 focus:outline-none focus:border-cyber-accent focus:shadow-[0_0_15px_rgba(0,217,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-cyber-text/50 mt-2">Minimum deposit: 1 STX</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleDeposit}
          disabled={!userData || !amount || isLoading || parseFloat(amount) < 1}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ArrowDownCircle className="w-5 h-5" />
              Deposit
            </>
          )}
        </button>

        <button
          onClick={handleWithdraw}
          disabled={!userData || !amount || isLoading}
          className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ArrowUpCircle className="w-5 h-5" />
              Withdraw
            </>
          )}
        </button>
      </div>

      {txId && (
        <div className="glass-card p-4 bg-cyber-accent/10 border-cyber-accent/30">
          <p className="text-xs font-medium text-cyber-accent mb-1">Transaction Submitted</p>
          <a
            href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyber-text/70 hover:text-cyber-accent transition-colors break-all"
          >
            {txId}
          </a>
        </div>
      )}
    </div>
  );
};

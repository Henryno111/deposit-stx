import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { TrendingUp, Users, Coins } from 'lucide-react';

const CONTRACT_ADDRESS = 'SPD7WQ5ZTDXV45D3ZCY00N1WTRF106SH9XA0D979';
const CONTRACT_NAME = 'deposit-pool';

export const StatsCard = () => {
  const [stats, setStats] = useState({
    totalPool: 0,
    depositorCount: 0,
    minDeposit: 1,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const network = new StacksMainnet();

        const [totalPoolResult, depositorCountResult, minDepositResult] = await Promise.all([
          callReadOnlyFunction({
            network,
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-total-pool',
            functionArgs: [],
            senderAddress: CONTRACT_ADDRESS,
          }),
          callReadOnlyFunction({
            network,
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-depositor-count',
            functionArgs: [],
            senderAddress: CONTRACT_ADDRESS,
          }),
          callReadOnlyFunction({
            network,
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-minimum-deposit',
            functionArgs: [],
            senderAddress: CONTRACT_ADDRESS,
          }),
        ]);

        setStats({
          totalPool: Number(cvToJSON(totalPoolResult).value) / 1000000,
          depositorCount: Number(cvToJSON(depositorCountResult).value),
          minDeposit: Number(cvToJSON(minDepositResult).value) / 1000000,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const statItems = [
    {
      icon: Coins,
      label: 'Total Pool',
      value: `${stats.totalPool.toLocaleString()} STX`,
      color: 'text-cyber-accent',
    },
    {
      icon: Users,
      label: 'Depositors',
      value: stats.depositorCount.toString(),
      color: 'text-cyber-purple',
    },
    {
      icon: TrendingUp,
      label: 'Min Deposit',
      value: `${stats.minDeposit} STX`,
      color: 'text-cyber-accent',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statItems.map((stat, index) => (
        <div key={index} className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${stat.color} bg-current/10 rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-cyber-text/50">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

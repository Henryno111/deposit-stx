# STX Deposit & Task Reward Platform

A Clarity smart contract system for managing STX deposits and distributing rewards to users who complete tasks.

## Overview

This project consists of multiple interconnected smart contracts that enable:
- Users to deposit STX into a communal pool
- Platform admins to create tasks with STX rewards
- Users to submit task completions
- Automated reward distribution to successful task completers

## Smart Contracts

### 1. deposit-pool.clar
Manages the deposit pool where users can stake their STX.

**Key Features:**
- Deposit STX with minimum amount validation
- Withdraw deposited funds
- Track total pool amount
- Pool locking mechanism for admin control
- Depositor tracking and indexing

**Main Functions:**
- `deposit(amount)` - Deposit STX into the pool
- `withdraw(amount)` - Withdraw STX from your deposit
- `set-pool-lock(locked)` - Admin function to lock/unlock the pool
- `get-deposit(user)` - View deposit information for a user
- `get-total-pool()` - View total amount in the pool

### 2. task-manager.clar
Handles task creation, submissions, and approvals.

**Key Features:**
- Create tasks with descriptions and reward amounts
- Submit task completions with proof/data
- Approve or reject submissions
- Cancel tasks
- Track task status and completion history

**Main Functions:**
- `create-task(title, description, reward-amount)` - Create a new task
- `submit-task(task-id, submission-data)` - Submit a task completion
- `approve-submission(task-id, submitter)` - Approve a submission
- `reject-submission(task-id, submitter)` - Reject a submission  
- `cancel-task(task-id)` - Cancel an active task

### 3. reward-distributor.clar
Distributes rewards to task completers with automatic platform fee deduction.

**Key Features:**
- Distribute rewards with automatic fee calculation (default 5%)
- Prevent duplicate claims
- Track total rewards paid per user
- Batch reward distribution
- Emergency withdrawal capability

**Main Functions:**
- `distribute-reward(task-id, recipient, reward-amount)` - Distribute reward to a user
- `batch-distribute-rewards(distributions)` - Distribute multiple rewards at once
- `set-platform-fee(new-fee)` - Update platform fee percentage (max 20%)
- `emergency-withdraw(amount, recipient)` - Admin emergency withdrawal

### 4. Trait Contracts
- `deposit-pool-trait.clar` - Interface definition for deposit pools
- `task-manager-trait.clar` - Interface definition for task managers

## Architecture

```
┌─────────────────┐
│ Users Deposit   │
│      STX        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deposit Pool   │
│   Contract      │
└─────────────────┘
         │
         │ Pool funds used for rewards
         │
         ▼
┌─────────────────┐
│ Task Manager    │◄──── Users submit completions
│   Contract      │
└────────┬────────┘
         │
         │ Approved submissions
         │
         ▼
┌─────────────────┐
│    Reward       │
│  Distributor    │──────► Rewards sent to users
│   Contract      │        (95% to user, 5% platform fee)
└─────────────────┘
```

## Workflow

1. **Deposit Phase**
   - Multiple users deposit STX into the pool
   - Minimum deposit: 1 STX (1,000,000 microSTX)
   - Deposits are tracked individually

2. **Task Creation**
   - Platform owner creates tasks with reward amounts
   - Tasks include title, description, and reward

3. **Task Completion**
   - Depositors (or any users) submit task completions
   - Submissions include proof/data of completion
   - Multiple users can submit for the same task

4. **Approval & Reward**
   - Owner reviews and approves/rejects submissions
   - Upon approval, reward is distributed
   - 95% goes to the task completer
   - 5% goes to the platform as fee

5. **Withdrawal**
   - Users can withdraw their original deposits at any time (when pool is unlocked)
   - Rewards are separate from deposits

## Testing

The project includes comprehensive tests:

```bash
npm install
npm test
```

Test coverage includes:
- **deposit-pool.test.ts** - Deposit and withdrawal functionality
- **task-manager.test.ts** - Task lifecycle and submissions
- **reward-distributor.test.ts** - Reward distribution and fees
- **integration.test.ts** - End-to-end workflows

## Contract Validation

All contracts pass Clarinet check:

```bash
clarinet check
```

Warnings about unchecked data are expected for admin functions and are acceptable for this use case.

## Configuration

### Epoch Settings
The project is configured to use Stacks epoch 3.0 for Clarity 2 support. See `settings/Devnet.toml` for epoch configuration.

### Platform Fee
Default platform fee: 5%
- Configurable up to 20%
- Changed via `set-platform-fee` function

### Minimum Deposit
Default minimum deposit: 1 STX
- Configurable by owner
- Changed via `set-minimum-deposit` function

## Development

### Prerequisites
- [Clarinet](https://github.com/hirosystems/clarinet) - Clarity development environment
- Node.js & npm - For running tests

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd stx-deposit

# Install dependencies
npm install

# Check contracts
clarinet check

# Run tests
npm test
```

## Security Considerations

1. **Access Control** - Critical functions are restricted to contract owner
2. **Pool Locking** - Owner can lock pool to prevent deposits/withdrawals during critical operations
3. **Duplicate Prevention** - Rewards cannot be claimed twice for the same task
4. **Fee Limits** - Platform fee is capped at 20% to prevent excessive fees

## Future Enhancements

Potential improvements:
- Multi-signature approval for large rewards
- Time-based task expiration
- Reputation system for frequent task completers
- Staking periods with bonus rewards
- Task categories and specialized pools
- Dispute resolution mechanism

## License

MIT

## Contributors

Built with ❤️ for the Stacks ecosystem

import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Integration Tests - Full Workflow", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  it("completes full deposit -> task -> reward workflow", () => {
    // Step 1: Multiple users deposit STX into the pool
    const deposit1 = 20000000; // 20 STX from wallet1
    const deposit2 = 15000000; // 15 STX from wallet2
    const deposit3 = 10000000; // 10 STX from wallet3
    
    simnet.callPublicFn(
      "deposit-pool",
      "deposit",
      [Cl.uint(deposit1)],
      wallet1
    );
    
    simnet.callPublicFn(
      "deposit-pool",
      "deposit",
      [Cl.uint(deposit2)],
      wallet2
    );
    
    simnet.callPublicFn(
      "deposit-pool",
      "deposit",
      [Cl.uint(deposit3)],
      wallet3
    );
    
    // Verify total pool
    const totalPool = simnet.callReadOnlyFn(
      "deposit-pool",
      "get-total-pool",
      [],
      deployer
    );
    expect(totalPool.result).toBeUint(deposit1 + deposit2 + deposit3);
    
    // Step 2: Owner creates a task
    const taskReward = 10000000; // 10 STX reward
    const createTaskResult = simnet.callPublicFn(
      "task-manager",
      "create-task",
      [
        Cl.stringAscii("Build feature X"),
        Cl.stringAscii("Implement the new feature as per specifications"),
        Cl.uint(taskReward),
      ],
      deployer
    );
    
    expect(createTaskResult.result).toBeOk(Cl.uint(0));
    
    // Step 3: Depositor submits task completion
    const submitResult = simnet.callPublicFn(
      "task-manager",
      "submit-task",
      [
        Cl.uint(0),
        Cl.stringAscii("Completed the feature. Here is the PR link and demo."),
      ],
      wallet1
    );
    
    expect(submitResult.result).toBeOk(Cl.bool(true));
    
    // Step 4: Owner approves the submission
    const approveResult = simnet.callPublicFn(
      "task-manager",
      "approve-submission",
      [Cl.uint(0), Cl.principal(wallet1)],
      deployer
    );
    
    expect(approveResult.result).toBeOk(Cl.bool(true));
    
    // Verify task is completed
    const taskInfo = simnet.callReadOnlyFn(
      "task-manager",
      "get-task",
      [Cl.uint(0)],
      deployer
    );
    
    const task = taskInfo.result.expectSome();
    expect(task).toHaveTupleField("status", Cl.stringAscii("completed"));
    expect(task).toHaveTupleField("completed-by", Cl.some(Cl.principal(wallet1)));
    
    // Step 5: Distribute reward to the winner
    const distributeResult = simnet.callPublicFn(
      "reward-distributor",
      "distribute-reward",
      [Cl.uint(0), Cl.principal(wallet1), Cl.uint(taskReward)],
      deployer
    );
    
    expect(distributeResult.result).toBeOk(
      Cl.tuple({
        "net-reward": Cl.uint(9500000), // 95% after 5% fee
        fee: Cl.uint(500000), // 5% platform fee
      })
    );
    
    // Verify reward was claimed
    const claimInfo = simnet.callReadOnlyFn(
      "reward-distributor",
      "get-reward-claim",
      [Cl.uint(0), Cl.principal(wallet1)],
      deployer
    );
    
    expect(claimInfo.result).toBeSome(
      Cl.tuple({
        amount: Cl.uint(9500000),
        "claimed-at": Cl.uint(simnet.blockHeight),
        claimed: Cl.bool(true),
      })
    );
  });

  it("handles multiple concurrent tasks and submissions", () => {
    // Deposit funds
    simnet.callPublicFn(
      "deposit-pool",
      "deposit",
      [Cl.uint(50000000)],
      wallet1
    );
    
    // Create multiple tasks
    const task1 = simnet.callPublicFn(
      "task-manager",
      "create-task",
      [
        Cl.stringAscii("Task 1"),
        Cl.stringAscii("Description 1"),
        Cl.uint(5000000),
      ],
      deployer
    );
    
    const task2 = simnet.callPublicFn(
      "task-manager",
      "create-task",
      [
        Cl.stringAscii("Task 2"),
        Cl.stringAscii("Description 2"),
        Cl.uint(7000000),
      ],
      deployer
    );
    
    expect(task1.result).toBeOk(Cl.uint(0));
    expect(task2.result).toBeOk(Cl.uint(1));
    
    // Different users submit for different tasks
    simnet.callPublicFn(
      "task-manager",
      "submit-task",
      [Cl.uint(0), Cl.stringAscii("Submission for task 1")],
      wallet1
    );
    
    simnet.callPublicFn(
      "task-manager",
      "submit-task",
      [Cl.uint(1), Cl.stringAscii("Submission for task 2")],
      wallet2
    );
    
    // Approve both submissions
    simnet.callPublicFn(
      "task-manager",
      "approve-submission",
      [Cl.uint(0), Cl.principal(wallet1)],
      deployer
    );
    
    simnet.callPublicFn(
      "task-manager",
      "approve-submission",
      [Cl.uint(1), Cl.principal(wallet2)],
      deployer
    );
    
    // Distribute rewards
    simnet.callPublicFn(
      "reward-distributor",
      "distribute-reward",
      [Cl.uint(0), Cl.principal(wallet1), Cl.uint(5000000)],
      deployer
    );
    
    simnet.callPublicFn(
      "reward-distributor",
      "distribute-reward",
      [Cl.uint(1), Cl.principal(wallet2), Cl.uint(7000000)],
      deployer
    );
    
    // Verify both received their rewards
    const totalPaidWallet1 = simnet.callReadOnlyFn(
      "reward-distributor",
      "get-total-rewards-paid",
      [Cl.principal(wallet1)],
      deployer
    );
    
    const totalPaidWallet2 = simnet.callReadOnlyFn(
      "reward-distributor",
      "get-total-rewards-paid",
      [Cl.principal(wallet2)],
      deployer
    );
    
    expect(totalPaidWallet1.result).toBeUint(4750000); // 95% of 5 STX
    expect(totalPaidWallet2.result).toBeUint(6650000); // 95% of 7 STX
  });

  it("allows depositor to withdraw after receiving rewards", () => {
    const initialDeposit = 20000000; // 20 STX
    
    // Deposit
    simnet.callPublicFn(
      "deposit-pool",
      "deposit",
      [Cl.uint(initialDeposit)],
      wallet1
    );
    
    // Create and complete task
    simnet.callPublicFn(
      "task-manager",
      "create-task",
      [
        Cl.stringAscii("Quick task"),
        Cl.stringAscii("Simple task"),
        Cl.uint(5000000),
      ],
      deployer
    );
    
    simnet.callPublicFn(
      "task-manager",
      "submit-task",
      [Cl.uint(0), Cl.stringAscii("Done")],
      wallet1
    );
    
    simnet.callPublicFn(
      "task-manager",
      "approve-submission",
      [Cl.uint(0), Cl.principal(wallet1)],
      deployer
    );
    
    simnet.callPublicFn(
      "reward-distributor",
      "distribute-reward",
      [Cl.uint(0), Cl.principal(wallet1), Cl.uint(5000000)],
      deployer
    );
    
    // Now withdraw original deposit
    const withdrawResult = simnet.callPublicFn(
      "deposit-pool",
      "withdraw",
      [Cl.uint(initialDeposit)],
      wallet1
    );
    
    expect(withdrawResult.result).toBeOk(Cl.bool(true));
    
    // Verify deposit is now inactive
    const depositInfo = simnet.callReadOnlyFn(
      "deposit-pool",
      "get-deposit",
      [Cl.principal(wallet1)],
      wallet1
    );
    
    expect(depositInfo.result).toBeSome(
      Cl.tuple({
        amount: Cl.uint(0),
        timestamp: Cl.uint(simnet.blockHeight),
        active: Cl.bool(false),
      })
    );
  });

  it("handles rejected submissions correctly", () => {
    // Create task
    simnet.callPublicFn(
      "task-manager",
      "create-task",
      [
        Cl.stringAscii("Complex task"),
        Cl.stringAscii("Very detailed requirements"),
        Cl.uint(10000000),
      ],
      deployer
    );
    
    // Submit with poor quality
    simnet.callPublicFn(
      "task-manager",
      "submit-task",
      [Cl.uint(0), Cl.stringAscii("Poor quality submission")],
      wallet1
    );
    
    // Reject submission
    const rejectResult = simnet.callPublicFn(
      "task-manager",
      "reject-submission",
      [Cl.uint(0), Cl.principal(wallet1)],
      deployer
    );
    
    expect(rejectResult.result).toBeOk(Cl.bool(true));
    
    // Verify submission is rejected
    const submission = simnet.callReadOnlyFn(
      "task-manager",
      "get-task-submission",
      [Cl.uint(0), Cl.principal(wallet1)],
      deployer
    );
    
    const submissionData = submission.result.expectSome();
    expect(submissionData).toHaveTupleField("status", Cl.stringAscii("rejected"));
    
    // Verify task is still active (can receive new submissions)
    const taskInfo = simnet.callReadOnlyFn(
      "task-manager",
      "get-task",
      [Cl.uint(0)],
      deployer
    );
    
    const task = taskInfo.result.expectSome();
    expect(task).toHaveTupleField("status", Cl.stringAscii("active"));
    
    // Another user can still submit
    const newSubmitResult = simnet.callPublicFn(
      "task-manager",
      "submit-task",
      [Cl.uint(0), Cl.stringAscii("Better submission from wallet2")],
      wallet2
    );
    
    expect(newSubmitResult.result).toBeOk(Cl.bool(true));
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Reward Distributor Contract", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Reward Distribution", () => {
    it("distributes rewards with platform fee deduction", () => {
      const taskId = 1;
      const rewardAmount = 10000000; // 10 STX
      const expectedFee = 500000; // 5% of 10 STX
      const expectedNetReward = 9500000; // 95% of 10 STX
      
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "distribute-reward",
        [Cl.uint(taskId), Cl.principal(wallet1), Cl.uint(rewardAmount)],
        deployer
      );
      
      expect(result).toBeOk(
        Cl.tuple({
          "net-reward": Cl.uint(expectedNetReward),
          fee: Cl.uint(expectedFee),
        })
      );
    });

    it("records reward claims correctly", () => {
      const taskId = 1;
      const rewardAmount = 10000000;
      
      simnet.callPublicFn(
        "reward-distributor",
        "distribute-reward",
        [Cl.uint(taskId), Cl.principal(wallet1), Cl.uint(rewardAmount)],
        deployer
      );
      
      const claimInfo = simnet.callReadOnlyFn(
        "reward-distributor",
        "get-reward-claim",
        [Cl.uint(taskId), Cl.principal(wallet1)],
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

    it("prevents duplicate claims for same task", () => {
      const taskId = 1;
      const rewardAmount = 10000000;
      
      simnet.callPublicFn(
        "reward-distributor",
        "distribute-reward",
        [Cl.uint(taskId), Cl.principal(wallet1), Cl.uint(rewardAmount)],
        deployer
      );
      
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "distribute-reward",
        [Cl.uint(taskId), Cl.principal(wallet1), Cl.uint(rewardAmount)],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(304)); // err-already-claimed
    });

    it("tracks total rewards paid to recipients", () => {
      const task1 = 1;
      const task2 = 2;
      const reward1 = 10000000;
      const reward2 = 5000000;
      
      simnet.callPublicFn(
        "reward-distributor",
        "distribute-reward",
        [Cl.uint(task1), Cl.principal(wallet1), Cl.uint(reward1)],
        deployer
      );
      
      simnet.callPublicFn(
        "reward-distributor",
        "distribute-reward",
        [Cl.uint(task2), Cl.principal(wallet1), Cl.uint(reward2)],
        deployer
      );
      
      const totalPaid = simnet.callReadOnlyFn(
        "reward-distributor",
        "get-total-rewards-paid",
        [Cl.principal(wallet1)],
        deployer
      );
      
      // 95% of (10 + 5) = 14.25 STX
      const expectedTotal = 9500000 + 4750000;
      expect(totalPaid.result).toBeUint(expectedTotal);
    });

    it("only allows owner to distribute rewards", () => {
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "distribute-reward",
        [Cl.uint(1), Cl.principal(wallet2), Cl.uint(10000000)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(300)); // err-owner-only
    });
  });

  describe("Fee Calculation", () => {
    it("calculates reward with fee correctly", () => {
      const rewardAmount = 10000000; // 10 STX
      
      const calculation = simnet.callReadOnlyFn(
        "reward-distributor",
        "calculate-reward-with-fee",
        [Cl.uint(rewardAmount)],
        deployer
      );
      
      expect(calculation.result).toBeTuple({
        fee: Cl.uint(500000), // 5%
        "net-reward": Cl.uint(9500000), // 95%
        "gross-reward": Cl.uint(10000000),
      });
    });

    it("returns current platform fee percentage", () => {
      const feePercentage = simnet.callReadOnlyFn(
        "reward-distributor",
        "get-platform-fee-percentage",
        [],
        deployer
      );
      
      expect(feePercentage.result).toBeUint(5); // Default 5%
    });
  });

  describe("Admin Functions", () => {
    it("allows owner to update platform fee", () => {
      const newFee = 10; // 10%
      
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "set-platform-fee",
        [Cl.uint(newFee)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
      
      const feePercentage = simnet.callReadOnlyFn(
        "reward-distributor",
        "get-platform-fee-percentage",
        [],
        deployer
      );
      
      expect(feePercentage.result).toBeUint(newFee);
    });

    it("prevents setting fee above 20%", () => {
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "set-platform-fee",
        [Cl.uint(25)],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(300)); // err-owner-only (used for validation)
    });

    it("allows owner to emergency withdraw", () => {
      const withdrawAmount = 5000000;
      
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "emergency-withdraw",
        [Cl.uint(withdrawAmount), Cl.principal(deployer)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from emergency withdraw", () => {
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "emergency-withdraw",
        [Cl.uint(5000000), Cl.principal(wallet1)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(300)); // err-owner-only
    });

    it("prevents non-owner from changing fee", () => {
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "set-platform-fee",
        [Cl.uint(10)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(300)); // err-owner-only
    });
  });

  describe("Batch Distribution", () => {
    it("allows batch reward distribution", () => {
      const distributions = [
        { "task-id": Cl.uint(1), recipient: Cl.principal(wallet1), amount: Cl.uint(5000000) },
        { "task-id": Cl.uint(2), recipient: Cl.principal(wallet2), amount: Cl.uint(3000000) },
      ];
      
      const { result } = simnet.callPublicFn(
        "reward-distributor",
        "batch-distribute-rewards",
        [Cl.list(distributions.map(d => Cl.tuple(d)))],
        deployer
      );
      
      expect(result).toBeOk(Cl.list([Cl.bool(true), Cl.bool(true)]));
    });
  });
});

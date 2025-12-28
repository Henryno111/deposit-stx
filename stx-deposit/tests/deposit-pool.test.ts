import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Deposit Pool Contract", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Deposit Functionality", () => {
    it("allows users to deposit STX", () => {
      const depositAmount = 5000000; // 5 STX
      
      const { result } = simnet.callPublicFn(
        "deposit-pool",
        "deposit",
        [Cl.uint(depositAmount)],
        wallet1
      );
      
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify deposit was recorded
      const depositInfo = simnet.callReadOnlyFn(
        "deposit-pool",
        "get-deposit",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(depositInfo.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(depositAmount),
          timestamp: Cl.uint(simnet.blockHeight),
          active: Cl.bool(true),
        })
      );
    });

    it("rejects deposits below minimum amount", () => {
      const depositAmount = 500000; // 0.5 STX (below minimum)
      
      const { result } = simnet.callPublicFn(
        "deposit-pool",
        "deposit",
        [Cl.uint(depositAmount)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(104)); // err-invalid-amount
    });

    it("allows multiple deposits from same user", () => {
      const firstDeposit = 2000000;
      const secondDeposit = 3000000;
      
      simnet.callPublicFn(
        "deposit-pool",
        "deposit",
        [Cl.uint(firstDeposit)],
        wallet1
      );
      
      simnet.callPublicFn(
        "deposit-pool",
        "deposit",
        [Cl.uint(secondDeposit)],
        wallet1
      );
      
      const depositInfo = simnet.callReadOnlyFn(
        "deposit-pool",
        "get-deposit",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(depositInfo.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(firstDeposit + secondDeposit),
          timestamp: Cl.uint(simnet.blockHeight),
          active: Cl.bool(true),
        })
      );
    });

    it("tracks total pool amount correctly", () => {
      const deposit1 = 2000000;
      const deposit2 = 3000000;
      
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
      
      const totalPool = simnet.callReadOnlyFn(
        "deposit-pool",
        "get-total-pool",
        [],
        deployer
      );
      
      expect(totalPool.result).toBeUint(deposit1 + deposit2);
    });
  });

  describe("Withdrawal Functionality", () => {
    it("allows users to withdraw their deposits", () => {
      const depositAmount = 5000000;
      const withdrawAmount = 2000000;
      
      simnet.callPublicFn(
        "deposit-pool",
        "deposit",
        [Cl.uint(depositAmount)],
        wallet1
      );
      
      const { result } = simnet.callPublicFn(
        "deposit-pool",
        "withdraw",
        [Cl.uint(withdrawAmount)],
        wallet1
      );
      
      expect(result).toBeOk(Cl.bool(true));
      
      const depositInfo = simnet.callReadOnlyFn(
        "deposit-pool",
        "get-deposit",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(depositInfo.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(depositAmount - withdrawAmount),
          timestamp: Cl.uint(simnet.blockHeight),
          active: Cl.bool(true),
        })
      );
    });

    it("rejects withdrawal exceeding deposit", () => {
      const depositAmount = 2000000;
      const withdrawAmount = 3000000;
      
      simnet.callPublicFn(
        "deposit-pool",
        "deposit",
        [Cl.uint(depositAmount)],
        wallet1
      );
      
      const { result } = simnet.callPublicFn(
        "deposit-pool",
        "withdraw",
        [Cl.uint(withdrawAmount)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(101)); // err-insufficient-balance
    });

    it("marks deposit as inactive when fully withdrawn", () => {
      const depositAmount = 5000000;
      
      simnet.callPublicFn(
        "deposit-pool",
        "deposit",
        [Cl.uint(depositAmount)],
        wallet1
      );
      
      simnet.callPublicFn(
        "deposit-pool",
        "withdraw",
        [Cl.uint(depositAmount)],
        wallet1
      );
      
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
  });

  describe("Admin Functionality", () => {
    it("allows owner to lock the pool", () => {
      const { result } = simnet.callPublicFn(
        "deposit-pool",
        "set-pool-lock",
        [Cl.bool(true)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
      
      const isLocked = simnet.callReadOnlyFn(
        "deposit-pool",
        "is-pool-locked",
        [],
        deployer
      );
      
      expect(isLocked.result).toBeBool(true);
    });

    it("prevents deposits when pool is locked", () => {
      simnet.callPublicFn(
        "deposit-pool",
        "set-pool-lock",
        [Cl.bool(true)],
        deployer
      );
      
      const { result } = simnet.callPublicFn(
        "deposit-pool",
        "deposit",
        [Cl.uint(5000000)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(105)); // err-pool-locked
    });

    it("only allows owner to change settings", () => {
      const { result } = simnet.callPublicFn(
        "deposit-pool",
        "set-minimum-deposit",
        [Cl.uint(2000000)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(100)); // err-owner-only
    });
  });
});

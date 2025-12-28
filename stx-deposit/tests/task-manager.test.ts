import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Task Manager Contract", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Task Creation", () => {
    it("allows owner to create a task", () => {
      const title = "Complete documentation";
      const description = "Write comprehensive documentation for the project";
      const rewardAmount = 10000000; // 10 STX
      
      const { result } = simnet.callPublicFn(
        "task-manager",
        "create-task",
        [
          Cl.stringAscii(title),
          Cl.stringAscii(description),
          Cl.uint(rewardAmount),
        ],
        deployer
      );
      
      expect(result).toBeOk(Cl.uint(0)); // First task ID is 0
      
      // Verify task was created
      const taskInfo = simnet.callReadOnlyFn(
        "task-manager",
        "get-task",
        [Cl.uint(0)],
        deployer
      );
      
      expect(taskInfo.result).toBeSome(
        Cl.tuple({
          creator: Cl.principal(deployer),
          title: Cl.stringAscii(title),
          description: Cl.stringAscii(description),
          "reward-amount": Cl.uint(rewardAmount),
          status: Cl.stringAscii("active"),
          "created-at": Cl.uint(simnet.blockHeight),
          "completed-by": Cl.none(),
          "completed-at": Cl.none(),
        })
      );
    });

    it("increments task nonce for each new task", () => {
      const title = "Task 1";
      const description = "Description 1";
      const rewardAmount = 5000000;
      
      const result1 = simnet.callPublicFn(
        "task-manager",
        "create-task",
        [
          Cl.stringAscii(title),
          Cl.stringAscii(description),
          Cl.uint(rewardAmount),
        ],
        deployer
      );
      
      const result2 = simnet.callPublicFn(
        "task-manager",
        "create-task",
        [
          Cl.stringAscii("Task 2"),
          Cl.stringAscii("Description 2"),
          Cl.uint(rewardAmount),
        ],
        deployer
      );
      
      expect(result1.result).toBeOk(Cl.uint(0));
      expect(result2.result).toBeOk(Cl.uint(1));
    });

    it("prevents non-owner from creating tasks", () => {
      const { result } = simnet.callPublicFn(
        "task-manager",
        "create-task",
        [
          Cl.stringAscii("Unauthorized task"),
          Cl.stringAscii("This should fail"),
          Cl.uint(5000000),
        ],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(200)); // err-owner-only
    });

    it("rejects task with zero reward", () => {
      const { result } = simnet.callPublicFn(
        "task-manager",
        "create-task",
        [
          Cl.stringAscii("Free task"),
          Cl.stringAscii("No reward"),
          Cl.uint(0),
        ],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(204)); // err-invalid-task-data
    });
  });

  describe("Task Submission", () => {
    beforeEach(() => {
      // Create a task for testing
      simnet.callPublicFn(
        "task-manager",
        "create-task",
        [
          Cl.stringAscii("Test task"),
          Cl.stringAscii("Test description"),
          Cl.uint(10000000),
        ],
        deployer
      );
    });

    it("allows users to submit task completion", () => {
      const taskId = 0;
      const submissionData = "Here is my submission with proof of completion";
      
      const { result } = simnet.callPublicFn(
        "task-manager",
        "submit-task",
        [Cl.uint(taskId), Cl.stringAscii(submissionData)],
        wallet1
      );
      
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify submission was recorded
      const submission = simnet.callReadOnlyFn(
        "task-manager",
        "get-task-submission",
        [Cl.uint(taskId), Cl.principal(wallet1)],
        wallet1
      );
      
      expect(submission.result).toBeSome(
        Cl.tuple({
          "submission-data": Cl.stringAscii(submissionData),
          "submitted-at": Cl.uint(simnet.blockHeight),
          status: Cl.stringAscii("pending"),
        })
      );
    });

    it("rejects submission for non-existent task", () => {
      const { result } = simnet.callPublicFn(
        "task-manager",
        "submit-task",
        [Cl.uint(999), Cl.stringAscii("Submission")],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(201)); // err-task-not-found
    });

    it("allows multiple users to submit for same task", () => {
      const taskId = 0;
      
      const result1 = simnet.callPublicFn(
        "task-manager",
        "submit-task",
        [Cl.uint(taskId), Cl.stringAscii("Submission from wallet1")],
        wallet1
      );
      
      const result2 = simnet.callPublicFn(
        "task-manager",
        "submit-task",
        [Cl.uint(taskId), Cl.stringAscii("Submission from wallet2")],
        wallet2
      );
      
      expect(result1.result).toBeOk(Cl.bool(true));
      expect(result2.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Submission Approval", () => {
    beforeEach(() => {
      // Create task and submit
      simnet.callPublicFn(
        "task-manager",
        "create-task",
        [
          Cl.stringAscii("Test task"),
          Cl.stringAscii("Test description"),
          Cl.uint(10000000),
        ],
        deployer
      );
      
      simnet.callPublicFn(
        "task-manager",
        "submit-task",
        [Cl.uint(0), Cl.stringAscii("My submission")],
        wallet1
      );
    });

    it("allows owner to approve submission", () => {
      const { result } = simnet.callPublicFn(
        "task-manager",
        "approve-submission",
        [Cl.uint(0), Cl.principal(wallet1)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify task is marked as completed
      const taskInfo = simnet.callReadOnlyFn(
        "task-manager",
        "get-task",
        [Cl.uint(0)],
        deployer
      );
      
      const task = taskInfo.result.expectSome();
      expect(task).toHaveTupleField("status", Cl.stringAscii("completed"));
      expect(task).toHaveTupleField("completed-by", Cl.some(Cl.principal(wallet1)));
    });

    it("allows owner to reject submission", () => {
      const { result } = simnet.callPublicFn(
        "task-manager",
        "reject-submission",
        [Cl.uint(0), Cl.principal(wallet1)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify submission status is rejected
      const submission = simnet.callReadOnlyFn(
        "task-manager",
        "get-task-submission",
        [Cl.uint(0), Cl.principal(wallet1)],
        deployer
      );
      
      expect(submission.result).toBeSome(
        Cl.tuple({
          "submission-data": Cl.stringAscii("My submission"),
          "submitted-at": Cl.uint(simnet.blockHeight - 1),
          status: Cl.stringAscii("rejected"),
        })
      );
    });

    it("prevents non-owner from approving submissions", () => {
      const { result } = simnet.callPublicFn(
        "task-manager",
        "approve-submission",
        [Cl.uint(0), Cl.principal(wallet1)],
        wallet2
      );
      
      expect(result).toBeErr(Cl.uint(200)); // err-owner-only
    });
  });

  describe("Task Cancellation", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "task-manager",
        "create-task",
        [
          Cl.stringAscii("Test task"),
          Cl.stringAscii("Test description"),
          Cl.uint(10000000),
        ],
        deployer
      );
    });

    it("allows owner to cancel active task", () => {
      const { result } = simnet.callPublicFn(
        "task-manager",
        "cancel-task",
        [Cl.uint(0)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify task status is cancelled
      const taskInfo = simnet.callReadOnlyFn(
        "task-manager",
        "get-task",
        [Cl.uint(0)],
        deployer
      );
      
      const task = taskInfo.result.expectSome();
      expect(task).toHaveTupleField("status", Cl.stringAscii("cancelled"));
    });

    it("prevents non-owner from cancelling tasks", () => {
      const { result } = simnet.callPublicFn(
        "task-manager",
        "cancel-task",
        [Cl.uint(0)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(200)); // err-owner-only
    });
  });
});

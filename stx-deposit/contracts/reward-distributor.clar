;; Reward Distribution Contract
;; Distributes rewards to task completers from the deposit pool

;; Traits
(use-trait deposit-pool-trait .deposit-pool-trait.deposit-pool-trait)
(use-trait task-manager-trait .task-manager-trait.task-manager-trait)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u300))
(define-constant err-no-funds (err u301))
(define-constant err-invalid-recipient (err u302))
(define-constant err-transfer-failed (err u303))
(define-constant err-already-claimed (err u304))
(define-constant err-not-eligible (err u305))

;; Data Variables
(define-data-var platform-fee-percentage uint u5) ;; 5% platform fee

;; Data Maps
(define-map reward-claims
    {task-id: uint, recipient: principal}
    {
        amount: uint,
        claimed-at: uint,
        claimed: bool
    }
)

(define-map total-rewards-paid principal uint)

;; Read-only functions
(define-read-only (get-reward-claim (task-id uint) (recipient principal))
    (map-get? reward-claims {task-id: task-id, recipient: recipient})
)

(define-read-only (get-total-rewards-paid (recipient principal))
    (default-to u0 (map-get? total-rewards-paid recipient))
)

(define-read-only (get-platform-fee-percentage)
    (var-get platform-fee-percentage)
)

(define-read-only (calculate-reward-with-fee (reward-amount uint))
    (let
        (
            (fee (/ (* reward-amount (var-get platform-fee-percentage)) u100))
            (net-reward (- reward-amount fee))
        )
        {fee: fee, net-reward: net-reward, gross-reward: reward-amount}
    )
)

;; Public functions
(define-public (distribute-reward (task-id uint) (recipient principal) (reward-amount uint))
    (let
        (
            (existing-claim (get-reward-claim task-id recipient))
            (reward-calc (calculate-reward-with-fee reward-amount))
            (net-reward (get net-reward reward-calc))
            (fee (get fee reward-calc))
        )
        ;; Validations
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> reward-amount u0) err-invalid-recipient)
        (asserts! (is-none existing-claim) err-already-claimed)
        
        ;; Transfer net reward to recipient
        (try! (as-contract (stx-transfer? net-reward tx-sender recipient)))
        
        ;; Transfer fee to contract owner (platform)
        (try! (as-contract (stx-transfer? fee tx-sender contract-owner)))
        
        ;; Record claim
        (map-set reward-claims
            {task-id: task-id, recipient: recipient}
            {
                amount: net-reward,
                claimed-at: block-height,
                claimed: true
            }
        )
        
        ;; Update total rewards paid
        (map-set total-rewards-paid 
            recipient 
            (+ (get-total-rewards-paid recipient) net-reward)
        )
        
        (ok {net-reward: net-reward, fee: fee})
    )
)

(define-public (batch-distribute-rewards (distributions (list 10 {task-id: uint, recipient: principal, amount: uint})))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ok (map distribute-single-reward distributions))
    )
)

;; Private functions
(define-private (distribute-single-reward (distribution {task-id: uint, recipient: principal, amount: uint}))
    (let
        (
            (task-id (get task-id distribution))
            (recipient (get recipient distribution))
            (amount (get amount distribution))
        )
        (match (distribute-reward task-id recipient amount)
            success true
            error false
        )
    )
)

;; Admin functions
(define-public (set-platform-fee (new-fee uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= new-fee u20) err-owner-only) ;; Max 20% fee
        (var-set platform-fee-percentage new-fee)
        (ok true)
    )
)

(define-public (emergency-withdraw (amount uint) (recipient principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (try! (as-contract (stx-transfer? amount tx-sender recipient)))
        (ok true)
    )
)

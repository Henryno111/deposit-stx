;; Deposit Pool Contract
;; Manages STX deposits from users into a pool

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-insufficient-balance (err u101))
(define-constant err-already-deposited (err u102))
(define-constant err-no-deposit-found (err u103))
(define-constant err-invalid-amount (err u104))
(define-constant err-pool-locked (err u105))

;; Data Variables
(define-data-var pool-locked bool false)
(define-data-var total-pool-amount uint u0)
(define-data-var minimum-deposit uint u1000000) ;; 1 STX in microSTX

;; Data Maps
(define-map deposits 
    principal 
    {
        amount: uint,
        timestamp: uint,
        active: bool
    }
)

(define-map depositor-list uint principal)
(define-data-var depositor-count uint u0)

;; Read-only functions
(define-read-only (get-deposit (user principal))
    (map-get? deposits user)
)

(define-read-only (get-total-pool)
    (var-get total-pool-amount)
)

(define-read-only (get-minimum-deposit)
    (var-get minimum-deposit)
)

(define-read-only (is-pool-locked)
    (var-get pool-locked)
)

(define-read-only (get-depositor-count)
    (var-get depositor-count)
)

(define-read-only (get-depositor-by-index (index uint))
    (map-get? depositor-list index)
)

;; Public functions
(define-public (deposit (amount uint))
    (let
        (
            (depositor tx-sender)
            (existing-deposit (get-deposit depositor))
        )
        ;; Validations
        (asserts! (not (var-get pool-locked)) err-pool-locked)
        (asserts! (>= amount (var-get minimum-deposit)) err-invalid-amount)
        
        ;; Transfer STX to contract
        (try! (stx-transfer? amount depositor (as-contract tx-sender)))
        
        ;; Update or create deposit record
        (match existing-deposit
            deposit-data
            ;; Update existing deposit
            (begin
                (map-set deposits depositor {
                    amount: (+ (get amount deposit-data) amount),
                    timestamp: block-height,
                    active: true
                })
                (var-set total-pool-amount (+ (var-get total-pool-amount) amount))
                (ok true)
            )
            ;; Create new deposit
            (begin
                (map-set deposits depositor {
                    amount: amount,
                    timestamp: block-height,
                    active: true
                })
                (map-set depositor-list (var-get depositor-count) depositor)
                (var-set depositor-count (+ (var-get depositor-count) u1))
                (var-set total-pool-amount (+ (var-get total-pool-amount) amount))
                (ok true)
            )
        )
    )
)

(define-public (withdraw (amount uint))
    (let
        (
            (depositor tx-sender)
            (deposit-data (unwrap! (get-deposit depositor) err-no-deposit-found))
        )
        ;; Validations
        (asserts! (not (var-get pool-locked)) err-pool-locked)
        (asserts! (get active deposit-data) err-no-deposit-found)
        (asserts! (>= (get amount deposit-data) amount) err-insufficient-balance)
        
        ;; Update deposit record
        (let
            (
                (new-amount (- (get amount deposit-data) amount))
            )
            (if (is-eq new-amount u0)
                ;; Mark as inactive if fully withdrawn
                (map-set deposits depositor {
                    amount: u0,
                    timestamp: block-height,
                    active: false
                })
                ;; Update with new amount
                (map-set deposits depositor {
                    amount: new-amount,
                    timestamp: block-height,
                    active: true
                })
            )
            
            ;; Transfer STX back to depositor
            (try! (as-contract (stx-transfer? amount tx-sender depositor)))
            (var-set total-pool-amount (- (var-get total-pool-amount) amount))
            (ok true)
        )
    )
)

;; Admin functions
(define-public (set-pool-lock (locked bool))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set pool-locked locked)
        (ok true)
    )
)

(define-public (set-minimum-deposit (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (<= amount u100000000000) err-invalid-amount) ;; Max 100k STX
        (var-set minimum-deposit amount)
        (ok true)
    )
)

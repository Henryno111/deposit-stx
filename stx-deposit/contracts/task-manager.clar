;; Task Management Contract
;; Manages tasks that depositors can complete to earn rewards

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-task-not-found (err u201))
(define-constant err-task-already-exists (err u202))
(define-constant err-task-not-active (err u203))
(define-constant err-invalid-task-data (err u204))
(define-constant err-not-authorized (err u205))
(define-constant err-task-already-completed (err u206))

;; Data Variables
(define-data-var task-nonce uint u0)

;; Data Maps
(define-map tasks
    uint ;; task-id
    {
        creator: principal,
        title: (string-ascii 100),
        description: (string-ascii 500),
        reward-amount: uint,
        status: (string-ascii 20), ;; "active", "completed", "cancelled"
        created-at: uint,
        completed-by: (optional principal),
        completed-at: (optional uint)
    }
)

(define-map task-submissions
    {task-id: uint, submitter: principal}
    {
        submission-data: (string-ascii 500),
        submitted-at: uint,
        status: (string-ascii 20) ;; "pending", "approved", "rejected"
    }
)

;; Read-only functions
(define-read-only (get-task (task-id uint))
    (map-get? tasks task-id)
)

(define-read-only (get-task-submission (task-id uint) (submitter principal))
    (map-get? task-submissions {task-id: task-id, submitter: submitter})
)

(define-read-only (get-task-nonce)
    (var-get task-nonce)
)

;; Public functions
(define-public (create-task (title (string-ascii 100)) (description (string-ascii 500)) (reward-amount uint))
    (let
        (
            (task-id (var-get task-nonce))
        )
        ;; Validations
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> reward-amount u0) err-invalid-task-data)
        (asserts! (> (len title) u0) err-invalid-task-data)
        
        ;; Create task
        (map-set tasks task-id {
            creator: tx-sender,
            title: title,
            description: description,
            reward-amount: reward-amount,
            status: "active",
            created-at: block-height,
            completed-by: none,
            completed-at: none
        })
        
        (var-set task-nonce (+ task-id u1))
        (ok task-id)
    )
)

(define-public (submit-task (task-id uint) (submission-data (string-ascii 500)))
    (let
        (
            (task (unwrap! (get-task task-id) err-task-not-found))
            (submitter tx-sender)
        )
        ;; Validations
        (asserts! (is-eq (get status task) "active") err-task-not-active)
        (asserts! (> (len submission-data) u0) err-invalid-task-data)
        
        ;; Create submission
        (map-set task-submissions 
            {task-id: task-id, submitter: submitter}
            {
                submission-data: submission-data,
                submitted-at: block-height,
                status: "pending"
            }
        )
        (ok true)
    )
)

(define-public (approve-submission (task-id uint) (submitter principal))
    (let
        (
            (task (unwrap! (get-task task-id) err-task-not-found))
            (submission (unwrap! (get-task-submission task-id submitter) err-task-not-found))
        )
        ;; Validations
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status task) "active") err-task-not-active)
        (asserts! (is-eq (get status submission) "pending") err-task-already-completed)
        
        ;; Update submission status
        (map-set task-submissions
            {task-id: task-id, submitter: submitter}
            {
                submission-data: (get submission-data submission),
                submitted-at: (get submitted-at submission),
                status: "approved"
            }
        )
        
        ;; Mark task as completed
        (map-set tasks task-id
            (merge task {
                status: "completed",
                completed-by: (some submitter),
                completed-at: (some block-height)
            })
        )
        (ok true)
    )
)

(define-public (reject-submission (task-id uint) (submitter principal))
    (let
        (
            (task (unwrap! (get-task task-id) err-task-not-found))
            (submission (unwrap! (get-task-submission task-id submitter) err-task-not-found))
        )
        ;; Validations
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status submission) "pending") err-task-already-completed)
        
        ;; Update submission status
        (map-set task-submissions
            {task-id: task-id, submitter: submitter}
            {
                submission-data: (get submission-data submission),
                submitted-at: (get submitted-at submission),
                status: "rejected"
            }
        )
        (ok true)
    )
)

(define-public (cancel-task (task-id uint))
    (let
        (
            (task (unwrap! (get-task task-id) err-task-not-found))
        )
        ;; Validations
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status task) "active") err-task-not-active)
        
        ;; Cancel task
        (map-set tasks task-id
            (merge task {status: "cancelled"})
        )
        (ok true)
    )
)

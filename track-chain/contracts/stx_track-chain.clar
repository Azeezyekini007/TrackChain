;; Supply Chain Tracking and Verification Smart Contract
;; Comprehensive blockchain-based supply chain management system

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-ALREADY-EXISTS (err u102))
(define-constant ERR-INVALID-STATUS (err u103))
(define-constant ERR-INVALID-STAKEHOLDER (err u104))
(define-constant ERR-PRODUCT-NOT-ACTIVE (err u105))
(define-constant ERR-INSUFFICIENT-VERIFICATION (err u106))
(define-constant ERR-INVALID-TRANSITION (err u107))
(define-constant ERR-EXPIRED-PRODUCT (err u108))
(define-constant ERR-INVALID-TEMPERATURE (err u109))
(define-constant ERR-INVALID-QUANTITY (err u110))

;; Stakeholder Types
(define-constant STAKEHOLDER-MANUFACTURER u1)
(define-constant STAKEHOLDER-SUPPLIER u2)
(define-constant STAKEHOLDER-DISTRIBUTOR u3)
(define-constant STAKEHOLDER-RETAILER u4)
(define-constant STAKEHOLDER-CONSUMER u5)
(define-constant STAKEHOLDER-VERIFIER u6)
(define-constant STAKEHOLDER-LOGISTICS u7)

;; Product Status
(define-constant STATUS-CREATED u1)
(define-constant STATUS-IN-PRODUCTION u2)
(define-constant STATUS-QUALITY-CHECK u3)
(define-constant STATUS-PACKAGED u4)
(define-constant STATUS-IN-TRANSIT u5)
(define-constant STATUS-AT-WAREHOUSE u6)
(define-constant STATUS-AT-RETAILER u7)
(define-constant STATUS-SOLD u8)
(define-constant STATUS-RECALLED u9)
(define-constant STATUS-EXPIRED u10)

;; Verification Types
(define-constant VERIFICATION-QUALITY u1)
(define-constant VERIFICATION-AUTHENTICITY u2)
(define-constant VERIFICATION-TEMPERATURE u3)
(define-constant VERIFICATION-QUANTITY u4)
(define-constant VERIFICATION-CERTIFICATION u5)

;; Data Variables
(define-data-var next-product-id uint u1)
(define-data-var next-batch-id uint u1)
(define-data-var next-verification-id uint u1)
(define-data-var contract-paused bool false)

;; Stakeholder Registry
(define-map stakeholders
    { stakeholder-address: principal }
    {
        stakeholder-type: uint,
        company-name: (string-ascii 64),
        contact-info: (string-ascii 256),
        certifications: (list 10 (string-ascii 32)),
        is-verified: bool,
        is-active: bool,
        registration-time: uint,
        verification-count: uint
    }
)

;; Product Information
(define-map products
    { product-id: uint }
    {
        product-name: (string-ascii 64),
        product-category: (string-ascii 32),
        manufacturer: principal,
        batch-id: uint,
        current-status: uint,
        current-location: (string-ascii 128),
        current-holder: principal,
        creation-time: uint,
        expiry-date: uint,
        origin-country: (string-ascii 32),
        product-description: (string-ascii 256),
        base-price: uint,
        is-recalled: bool,
        total-verifications: uint
    }
)

;; Batch Information
(define-map batches
    { batch-id: uint }
    {
        batch-number: (string-ascii 32),
        manufacturer: principal,
        production-date: uint,
        total-quantity: uint,
        remaining-quantity: uint,
        quality-grade: (string-ascii 16),
        production-location: (string-ascii 64),
        raw-materials: (list 20 (string-ascii 32)),
        certifications: (list 10 (string-ascii 32)),
        is-active: bool
    }
)

;; Product Journey/History
(define-map product-history
    { product-id: uint, sequence: uint }
    {
        from-stakeholder: principal,
        to-stakeholder: principal,
        status-change: uint,
        location: (string-ascii 128),
        timestamp: uint,
        temperature: (optional uint), ;; For temperature-sensitive products
        humidity: (optional uint),
        notes: (string-ascii 256),
        transaction-hash: (optional (buff 32)),
        verification-required: bool
    }
)

;; Product sequence counter for history
(define-map product-sequence-counter
    { product-id: uint }
    { next-sequence: uint }
)

;; Verification Records
(define-map verifications
    { verification-id: uint }
    {
        product-id: uint,
        verifier: principal,
        verification-type: uint,
        verification-result: bool,
        verification-data: (string-ascii 512),
        timestamp: uint,
        expiry-time: uint,
        certificate-hash: (optional (buff 32)),
        notes: (string-ascii 256)
    }
)

;; Product Verifications Mapping
(define-map product-verifications
    { product-id: uint }
    { verification-ids: (list 50 uint) }
)

;; Temperature Monitoring
(define-map temperature-logs
    { product-id: uint, log-sequence: uint }
    {
        temperature: uint,
        humidity: uint,
        location: (string-ascii 64),
        timestamp: uint,
        recorder: principal,
        is-within-range: bool,
        min-temp: uint,
        max-temp: uint
    }
)

;; Product Alerts
(define-map product-alerts
    { product-id: uint, alert-id: uint }
    {
        alert-type: (string-ascii 32),
        severity: uint, ;; 1=low, 2=medium, 3=high, 4=critical
        message: (string-ascii 256),
        timestamp: uint,
        is-resolved: bool,
        resolver: (optional principal)
    }
)

;; Recall Information
(define-map product-recalls
    { product-id: uint }
    {
        recall-reason: (string-ascii 256),
        recall-date: uint,
        affected-batches: (list 10 uint),
        severity-level: uint,
        recall-initiator: principal,
        recall-status: (string-ascii 32),
        consumer-notification: bool
    }
)

;; Consumer Feedback
(define-map consumer-feedback
    { product-id: uint, feedback-id: uint }
    {
        consumer: principal,
        rating: uint, ;; 1-5 stars
        feedback-text: (string-ascii 512),
        timestamp: uint,
        is-verified-purchase: bool,
        response: (optional (string-ascii 256))
    }
)

;; Access Control
(define-map stakeholder-permissions
    { stakeholder: principal, product-id: uint }
    { can-update: bool, can-verify: bool, can-view-detailed: bool }
)

;; Read-only functions

;; Get stakeholder information
(define-read-only (get-stakeholder (stakeholder principal))
    (map-get? stakeholders { stakeholder-address: stakeholder })
)

;; Get product information
(define-read-only (get-product (product-id uint))
    (map-get? products { product-id: product-id })
)

;; Get batch information
(define-read-only (get-batch (batch-id uint))
    (map-get? batches { batch-id: batch-id })
)

;; Get product history entry
(define-read-only (get-product-history (product-id uint) (sequence uint))
    (map-get? product-history { product-id: product-id, sequence: sequence })
)

;; Get verification details
(define-read-only (get-verification (verification-id uint))
    (map-get? verifications { verification-id: verification-id })
)

;; Get product verifications
(define-read-only (get-product-verifications (product-id uint))
    (map-get? product-verifications { product-id: product-id })
)

;; Get temperature log
(define-read-only (get-temperature-log (product-id uint) (log-sequence uint))
    (map-get? temperature-logs { product-id: product-id, log-sequence: log-sequence })
)

;; Check if stakeholder is authorized for product
(define-read-only (is-authorized-for-product (stakeholder principal) (product-id uint))
    (match (map-get? products { product-id: product-id })
        product-data
        (or 
            (is-eq stakeholder (get manufacturer product-data))
            (is-eq stakeholder (get current-holder product-data))
            (match (map-get? stakeholder-permissions { stakeholder: stakeholder, product-id: product-id })
                permissions (get can-update permissions)
                false
            )
        )
        false
    )
)

;; Verify product authenticity - FIXED
(define-read-only (verify-product-authenticity (product-id uint))
    (match (map-get? products { product-id: product-id })
        product-data
        (let (
            (verifications-data (map-get? product-verifications { product-id: product-id }))
            (verification-count (get total-verifications product-data))
        )
            {
                exists: true,
                manufacturer: (get manufacturer product-data),
                batch-id: (get batch-id product-data),
                status: (get current-status product-data),
                is-recalled: (get is-recalled product-data),
                verification-count: verification-count,
                authenticity-score: (min-uint u100 (* verification-count u10))
            }
        )
        {
            exists: false,
            manufacturer: 'SP000000000000000000002Q6VF78,
            batch-id: u0,
            status: u0,
            is-recalled: false,
            verification-count: u0,
            authenticity-score: u0
        }
    )
)

;; Get product supply chain summary - FIXED
(define-read-only (get-supply-chain-summary (product-id uint))
    (match (map-get? products { product-id: product-id })
        product-data
        {
            product-id: product-id,
            current-status: (get current-status product-data),
            current-location: (get current-location product-data),
            current-holder: (get current-holder product-data),
            manufacturer: (get manufacturer product-data),
            creation-time: (get creation-time product-data),
            total-verifications: (get total-verifications product-data),
            is-recalled: (get is-recalled product-data)
        }
        {
            product-id: product-id,
            current-status: u0,
            current-location: "",
            current-holder: 'SP000000000000000000002Q6VF78,
            manufacturer: 'SP000000000000000000002Q6VF78,
            creation-time: u0,
            total-verifications: u0,
            is-recalled: false
        }
    )
)

;; Helper function: min of two uints
(define-private (min-uint (a uint) (b uint))
    (if (<= a b) a b)
)

;; Helper function: get next sequence for product history
(define-private (get-next-sequence (product-id uint))
    (match (map-get? product-sequence-counter { product-id: product-id })
        counter-data (get next-sequence counter-data)
        u1
    )
)

;; Public functions

;; Register stakeholder
(define-public (register-stakeholder
    (stakeholder-type uint)
    (company-name (string-ascii 64))
    (contact-info (string-ascii 256))
    (certifications (list 10 (string-ascii 32)))
)
    (begin
        ;; Validate stakeholder type
        (asserts! (and (>= stakeholder-type u1) (<= stakeholder-type u7)) ERR-INVALID-STAKEHOLDER)
        
        ;; Check if already registered
        (asserts! (is-none (map-get? stakeholders { stakeholder-address: tx-sender })) ERR-ALREADY-EXISTS)
        
        ;; Register stakeholder
        (map-set stakeholders
            { stakeholder-address: tx-sender }
            {
                stakeholder-type: stakeholder-type,
                company-name: company-name,
                contact-info: contact-info,
                certifications: certifications,
                is-verified: false,
                is-active: true,
                registration-time: stacks-block-height,
                verification-count: u0
            }
        )
        
        (ok tx-sender)
    )
)

;; Verify stakeholder (admin only)
(define-public (verify-stakeholder (stakeholder principal))
    (let ((stakeholder-data (unwrap! (map-get? stakeholders { stakeholder-address: stakeholder }) ERR-NOT-FOUND)))
        ;; Only contract owner can verify
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        
        ;; Update verification status
        (map-set stakeholders
            { stakeholder-address: stakeholder }
            (merge stakeholder-data { is-verified: true })
        )
        
        (ok true)
    )
)

;; Create new batch
(define-public (create-batch
    (batch-number (string-ascii 32))
    (total-quantity uint)
    (quality-grade (string-ascii 16))
    (production-location (string-ascii 64))
    (raw-materials (list 20 (string-ascii 32)))
    (certifications (list 10 (string-ascii 32)))
)
    (let ((batch-id (var-get next-batch-id)))
        ;; Check if stakeholder is registered manufacturer
        (match (map-get? stakeholders { stakeholder-address: tx-sender })
            stakeholder-data
            (asserts! (is-eq (get stakeholder-type stakeholder-data) STAKEHOLDER-MANUFACTURER) ERR-NOT-AUTHORIZED)
            (err ERR-INVALID-STAKEHOLDER)
        )
        
        ;; Create batch
        (map-set batches
            { batch-id: batch-id }
            {
                batch-number: batch-number,
                manufacturer: tx-sender,
                production-date: stacks-block-height,
                total-quantity: total-quantity,
                remaining-quantity: total-quantity,
                quality-grade: quality-grade,
                production-location: production-location,
                raw-materials: raw-materials,
                certifications: certifications,
                is-active: true
            }
        )
        
        ;; Increment batch counter
        (var-set next-batch-id (+ batch-id u1))
        
        (ok batch-id)
    )
)

;; Create new product
(define-public (create-product
    (product-name (string-ascii 64))
    (product-category (string-ascii 32))
    (batch-id uint)
    (expiry-date uint)
    (origin-country (string-ascii 32))
    (product-description (string-ascii 256))
    (base-price uint)
    (initial-location (string-ascii 128))
)
    (let (
        (product-id (var-get next-product-id))
        (batch-data (unwrap! (map-get? batches { batch-id: batch-id }) ERR-NOT-FOUND))
    )
        ;; Verify batch ownership
        (asserts! (is-eq tx-sender (get manufacturer batch-data)) ERR-NOT-AUTHORIZED)
        
        ;; Check batch has remaining quantity
        (asserts! (> (get remaining-quantity batch-data) u0) ERR-INVALID-QUANTITY)
        
        ;; Create product
        (map-set products
            { product-id: product-id }
            {
                product-name: product-name,
                product-category: product-category,
                manufacturer: tx-sender,
                batch-id: batch-id,
                current-status: STATUS-CREATED,
                current-location: initial-location,
                current-holder: tx-sender,
                creation-time: stacks-block-height,
                expiry-date: expiry-date,
                origin-country: origin-country,
                product-description: product-description,
                base-price: base-price,
                is-recalled: false,
                total-verifications: u0
            }
        )
        
        ;; Initialize product sequence counter
        (map-set product-sequence-counter
            { product-id: product-id }
            { next-sequence: u1 }
        )
        
        ;; Update batch remaining quantity
        (map-set batches
            { batch-id: batch-id }
            (merge batch-data { 
                remaining-quantity: (- (get remaining-quantity batch-data) u1) 
            })
        )
        
        ;; Add initial history entry
        (add-product-history-entry
            product-id
            tx-sender
            tx-sender
            STATUS-CREATED
            initial-location
            none
            none
            "Product created"
            none
            false
        )
        
        ;; Increment product counter
        (var-set next-product-id (+ product-id u1))
        
        (ok product-id)
    )
)

;; Update product status and location
(define-public (update-product-status
    (product-id uint)
    (new-status uint)
    (new-location (string-ascii 128))
    (new-holder principal)
    (temperature (optional uint))
    (humidity (optional uint))
    (notes (string-ascii 256))
)
    (let (
        (product-data (unwrap! (map-get? products { product-id: product-id }) ERR-NOT-FOUND))
        (current-sequence (get-next-sequence product-id))
    )
        ;; Check authorization
        (asserts! (is-authorized-for-product tx-sender product-id) ERR-NOT-AUTHORIZED)
        
        ;; Validate status transition
        (asserts! (is-valid-status-transition (get current-status product-data) new-status) ERR-INVALID-TRANSITION)
        
        ;; Update product
        (map-set products
            { product-id: product-id }
            (merge product-data {
                current-status: new-status,
                current-location: new-location,
                current-holder: new-holder
            })
        )
        
        ;; Add history entry
        (add-product-history-entry
            product-id
            (get current-holder product-data)
            new-holder
            new-status
            new-location
            temperature
            humidity
            notes
            none
            false
        )
        
        (ok true)
    )
)

;; Add product history entry (internal function)
(define-private (add-product-history-entry
    (product-id uint)
    (from-stakeholder principal)
    (to-stakeholder principal)
    (status-change uint)
    (location (string-ascii 128))
    (temperature (optional uint))
    (humidity (optional uint))
    (notes (string-ascii 256))
    (transaction-hash (optional (buff 32)))
    (verification-required bool)
)
    (let ((sequence (get-next-sequence product-id)))
        ;; Add history entry
        (map-set product-history
            { product-id: product-id, sequence: sequence }
            {
                from-stakeholder: from-stakeholder,
                to-stakeholder: to-stakeholder,
                status-change: status-change,
                location: location,
                timestamp: stacks-block-height,
                temperature: temperature,
                humidity: humidity,
                notes: notes,
                transaction-hash: transaction-hash,
                verification-required: verification-required
            }
        )
        
        ;; Update sequence counter
        (map-set product-sequence-counter
            { product-id: product-id }
            { next-sequence: (+ sequence u1) }
        )
        
        (ok true)
    )
)

;; Validate status transition
(define-private (is-valid-status-transition (current-status uint) (new-status uint))
    (or
        ;; Allow progression through normal flow
        (and (is-eq current-status STATUS-CREATED) (is-eq new-status STATUS-IN-PRODUCTION))
        (and (is-eq current-status STATUS-IN-PRODUCTION) (is-eq new-status STATUS-QUALITY-CHECK))
        (and (is-eq current-status STATUS-QUALITY-CHECK) (is-eq new-status STATUS-PACKAGED))
        (and (is-eq current-status STATUS-PACKAGED) (is-eq new-status STATUS-IN-TRANSIT))
        (and (is-eq current-status STATUS-IN-TRANSIT) (is-eq new-status STATUS-AT-WAREHOUSE))
        (and (is-eq current-status STATUS-AT-WAREHOUSE) (is-eq new-status STATUS-IN-TRANSIT))
        (and (is-eq current-status STATUS-IN-TRANSIT) (is-eq new-status STATUS-AT-RETAILER))
        (and (is-eq current-status STATUS-AT-RETAILER) (is-eq new-status STATUS-SOLD))
        ;; Allow recall from any status
        (is-eq new-status STATUS-RECALLED)
        ;; Allow expiry from warehouse or retailer
        (and (or (is-eq current-status STATUS-AT-WAREHOUSE) (is-eq current-status STATUS-AT-RETAILER)) 
             (is-eq new-status STATUS-EXPIRED))
    )
)

;; Add product verification
(define-public (add-verification
    (product-id uint)
    (verification-type uint)
    (verification-result bool)
    (verification-data (string-ascii 512))
    (expiry-time uint)
    (certificate-hash (optional (buff 32)))
    (notes (string-ascii 256))
)
    (let (
        (verification-id (var-get next-verification-id))
        (product-data (unwrap! (map-get? products { product-id: product-id }) ERR-NOT-FOUND))
        (stakeholder-data (unwrap! (map-get? stakeholders { stakeholder-address: tx-sender }) ERR-INVALID-STAKEHOLDER))
    )
        ;; Check if stakeholder can verify
        (asserts! (or 
            (is-eq (get stakeholder-type stakeholder-data) STAKEHOLDER-VERIFIER)
            (is-eq (get stakeholder-type stakeholder-data) STAKEHOLDER-MANUFACTURER)
        ) ERR-NOT-AUTHORIZED)
        
        ;; Create verification record
        (map-set verifications
            { verification-id: verification-id }
            {
                product-id: product-id,
                verifier: tx-sender,
                verification-type: verification-type,
                verification-result: verification-result,
                verification-data: verification-data,
                timestamp: stacks-block-height,
                expiry-time: expiry-time,
                certificate-hash: certificate-hash,
                notes: notes
            }
        )
        
        ;; Update product verification list
        (match (map-get? product-verifications { product-id: product-id })
            existing-verifications
            (map-set product-verifications
                { product-id: product-id }
                { verification-ids: (unwrap-panic (as-max-len? 
                    (append (get verification-ids existing-verifications) verification-id) u50)) }
            )
            (map-set product-verifications
                { product-id: product-id }
                { verification-ids: (list verification-id) }
            )
        )
        
        ;; Update product verification count
        (map-set products
            { product-id: product-id }
            (merge product-data { 
                total-verifications: (+ (get total-verifications product-data) u1) 
            })
        )
        
        ;; Update stakeholder verification count
        (map-set stakeholders
            { stakeholder-address: tx-sender }
            (merge stakeholder-data { 
                verification-count: (+ (get verification-count stakeholder-data) u1) 
            })
        )
        
        ;; Increment verification counter
        (var-set next-verification-id (+ verification-id u1))
        
        (ok verification-id)
    )
)

;; Record temperature data
(define-public (record-temperature
    (product-id uint)
    (temperature uint)
    (humidity uint)
    (location (string-ascii 64))
    (min-temp uint)
    (max-temp uint)
)
    (let (
        (product-data (unwrap! (map-get? products { product-id: product-id }) ERR-NOT-FOUND))
        (log-sequence (get-next-sequence product-id))
        (is-within-range (and (>= temperature min-temp) (<= temperature max-temp)))
    )
        ;; Check authorization
        (asserts! (is-authorized-for-product tx-sender product-id) ERR-NOT-AUTHORIZED)
        
        ;; Record temperature log
        (map-set temperature-logs
            { product-id: product-id, log-sequence: log-sequence }
            {
                temperature: temperature,
                humidity: humidity,
                location: location,
                timestamp: stacks-block-height,
                recorder: tx-sender,
                is-within-range: is-within-range,
                min-temp: min-temp,
                max-temp: max-temp
            }
        )
        
        ;; Create alert if temperature is out of range
        (if (not is-within-range)
            (create-alert product-id "TEMPERATURE_ALERT" u3 
                "Temperature out of acceptable range" false)
            (ok true)
        )
    )
)

;; Create product alert (internal function)
(define-private (create-alert
    (product-id uint)
    (alert-type (string-ascii 32))
    (severity uint)
    (message (string-ascii 256))
    (auto-resolve bool)
)
    (let ((alert-id u1)) ;; Simplified - should be incremented
        (map-set product-alerts
            { product-id: product-id, alert-id: alert-id }
            {
                alert-type: alert-type,
                severity: severity,
                message: message,
                timestamp: stacks-block-height,
                is-resolved: auto-resolve,
                resolver: (if auto-resolve (some tx-sender) none)
            }
        )
        (ok true)
    )
)

;; Initiate product recall
(define-public (initiate-recall
    (product-id uint)
    (recall-reason (string-ascii 256))
    (affected-batches (list 10 uint))
    (severity-level uint)
)
    (let ((product-data (unwrap! (map-get? products { product-id: product-id }) ERR-NOT-FOUND)))
        ;; Only manufacturer or contract owner can initiate recall
        (asserts! (or 
            (is-eq tx-sender (get manufacturer product-data))
            (is-eq tx-sender CONTRACT-OWNER)
        ) ERR-NOT-AUTHORIZED)
        
        ;; Update product status to recalled
        (map-set products
            { product-id: product-id }
            (merge product-data { 
                current-status: STATUS-RECALLED,
                is-recalled: true 
            })
        )
        
        ;; Create recall record
        (map-set product-recalls
            { product-id: product-id }
            {
                recall-reason: recall-reason,
                recall-date: stacks-block-height,
                affected-batches: affected-batches,
                severity-level: severity-level,
                recall-initiator: tx-sender,
                recall-status: "ACTIVE",
                consumer-notification: true
            }
        )
        
        ;; Add recall history entry
        (add-product-history-entry
            product-id
            (get current-holder product-data)
            (get current-holder product-data)
            STATUS-RECALLED
            (get current-location product-data)
            none
            none
            recall-reason
            none
            true
        )
        
        (ok true)
    )
)

;; Transfer product ownership
(define-public (transfer-product
    (product-id uint)
    (new-owner principal)
    (new-location (string-ascii 128))
    (transfer-notes (string-ascii 256))
)
    (let ((product-data (unwrap! (map-get? products { product-id: product-id }) ERR-NOT-FOUND)))
        ;; Check current holder authorization
        (asserts! (is-eq tx-sender (get current-holder product-data)) ERR-NOT-AUTHORIZED)
        
        ;; Verify new owner is registered stakeholder
        (asserts! (is-some (map-get? stakeholders { stakeholder-address: new-owner })) ERR-INVALID-STAKEHOLDER)
        
        ;; Update product holder and location
        (map-set products
            { product-id: product-id }
            (merge product-data {
                current-holder: new-owner,
                current-location: new-location
            })
        )
        
        ;; Add transfer history
        (add-product-history-entry
            product-id
            tx-sender
            new-owner
            (get current-status product-data)
            new-location
            none
            none
            transfer-notes
            none
            false
        )
        
        (ok true)
    )
)

;; Grant product permissions
(define-public (grant-product-permissions
    (stakeholder principal)
    (product-id uint)
    (can-update bool)
    (can-verify bool)
    (can-view-detailed bool)
)
    (let ((product-data (unwrap! (map-get? products { product-id: product-id }) ERR-NOT-FOUND)))
        ;; Only manufacturer can grant permissions
        (asserts! (is-eq tx-sender (get manufacturer product-data)) ERR-NOT-AUTHORIZED)
        
        ;; Set permissions
        (map-set stakeholder-permissions
            { stakeholder: stakeholder, product-id: product-id }
            {
                can-update: can-update,
                can-verify: can-verify,
                can-view-detailed: can-view-detailed
            }
        )
        
        (ok true)
    )
)

;; Emergency pause contract (admin only)
(define-public (pause-contract)
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (var-set contract-paused true)
        (ok true)
    )
)

;; Resume contract (admin only)
(define-public (resume-contract)
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (var-set contract-paused false)
        (ok true)
    )
)
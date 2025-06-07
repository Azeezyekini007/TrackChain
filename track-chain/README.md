# Supply Chain Tracking and Verification Smart Contract

A comprehensive blockchain-based supply chain management system built on the Stacks blockchain using Clarity smart contracts. This system provides end-to-end traceability, verification, and monitoring of products throughout their entire supply chain journey.

## 🎯 Overview

This smart contract enables transparent, immutable tracking of products from manufacturing to consumer delivery. It supports multiple stakeholders, comprehensive verification systems, temperature monitoring for sensitive goods, and automated recall management.

## ✨ Key Features

### 🏭 Multi-Stakeholder Support
- **7 Stakeholder Types**: Manufacturer, Supplier, Distributor, Retailer, Consumer, Verifier, Logistics
- **Registration & Verification System**: Controlled stakeholder onboarding with admin verification
- **Permission Management**: Granular access control for product operations

### 📦 Product Lifecycle Management
- **10 Status Stages**: From creation to final sale or recall
- **Batch Management**: Link products to production batches with full traceability
- **Product History**: Immutable record of all status changes and transfers

### 🔍 Verification & Quality Control
- **5 Verification Types**: Quality, Authenticity, Temperature, Quantity, Certification
- **Multi-Verifier Support**: Independent third-party verification system
- **Authenticity Scoring**: Automated scoring based on verification count

### 🌡️ Environmental Monitoring
- **Temperature & Humidity Logging**: Critical for perishable goods
- **Range Monitoring**: Automatic alerts for out-of-range conditions
- **Location-Based Tracking**: GPS/location data integration

### 🚨 Alert & Recall System
- **Automated Alerts**: Temperature violations, quality issues
- **Product Recalls**: Manufacturer or admin-initiated recalls
- **Severity Levels**: 4-tier severity classification system

## 🏗️ Architecture

### Core Data Structures

#### Stakeholders
```clarity
{
  stakeholder-type: uint,        // 1-7 (Manufacturer to Logistics)
  company-name: string,
  contact-info: string,
  certifications: list,
  is-verified: bool,
  is-active: bool,
  registration-time: uint,
  verification-count: uint
}
```

#### Products
```clarity
{
  product-name: string,
  product-category: string,
  manufacturer: principal,
  batch-id: uint,
  current-status: uint,          // 1-10 (Created to Expired)
  current-location: string,
  current-holder: principal,
  creation-time: uint,
  expiry-date: uint,
  origin-country: string,
  product-description: string,
  base-price: uint,
  is-recalled: bool,
  total-verifications: uint
}
```

#### Batches
```clarity
{
  batch-number: string,
  manufacturer: principal,
  production-date: uint,
  total-quantity: uint,
  remaining-quantity: uint,
  quality-grade: string,
  production-location: string,
  raw-materials: list,
  certifications: list,
  is-active: bool
}
```

## 🚀 Getting Started

### Prerequisites
- Stacks blockchain development environment
- Clarinet CLI tool
- Stacks wallet for deployment

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd supply-chain-contract
   ```

2. **Install Clarinet**
   ```bash
   npm install -g @stacks/clarinet
   ```

3. **Initialize project**
   ```bash
   clarinet new supply-chain-project
   cd supply-chain-project
   ```

4. **Add the contract**
   - Copy the contract code to `contracts/supply-chain.clar`

### Testing

```bash
# Run contract tests
clarinet test

# Check syntax
clarinet check

# Console testing
clarinet console
```

## 📋 Usage Guide

### 1. Stakeholder Registration

First, stakeholders must register with the system:

```clarity
;; Register as a manufacturer
(contract-call? .supply-chain register-stakeholder 
  u1                           ;; STAKEHOLDER-MANUFACTURER
  "Acme Manufacturing Co."     ;; company-name
  "contact@acme.com"          ;; contact-info
  (list "ISO9001" "FDA")      ;; certifications
)
```

### 2. Create Production Batch

Manufacturers create production batches:

```clarity
;; Create a new batch
(contract-call? .supply-chain create-batch
  "BATCH-2024-001"            ;; batch-number
  u1000                       ;; total-quantity
  "Grade-A"                   ;; quality-grade
  "Factory-NY"                ;; production-location
  (list "Steel" "Aluminum")   ;; raw-materials
  (list "ISO9001")           ;; certifications
)
```

### 3. Create Products

Link individual products to batches:

```clarity
;; Create a product from the batch
(contract-call? .supply-chain create-product
  "Premium Widget"            ;; product-name
  "Electronics"              ;; product-category
  u1                         ;; batch-id
  u2000000                   ;; expiry-date (block height)
  "USA"                      ;; origin-country
  "High-quality electronic widget"  ;; description
  u50000                     ;; base-price (micro-STX)
  "Factory-NY-Line-1"        ;; initial-location
)
```

### 4. Track Product Movement

Update product status as it moves through the supply chain:

```clarity
;; Update product status to in-transit
(contract-call? .supply-chain update-product-status
  u1                         ;; product-id
  u5                         ;; STATUS-IN-TRANSIT
  "Highway I-95, Mile 150"   ;; new-location
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7  ;; new-holder
  (some u72)                 ;; temperature (optional)
  (some u45)                 ;; humidity (optional)
  "Shipped via TruckCorp"    ;; notes
)
```

### 5. Add Verifications

Third-party verifiers can add verification records:

```clarity
;; Add quality verification
(contract-call? .supply-chain add-verification
  u1                         ;; product-id
  u1                         ;; VERIFICATION-QUALITY
  true                       ;; verification-result
  "Passed all quality tests" ;; verification-data
  u2100000                   ;; expiry-time
  none                       ;; certificate-hash
  "Verified by QualityCorps" ;; notes
)
```

### 6. Monitor Temperature

For temperature-sensitive products:

```clarity
;; Record temperature reading
(contract-call? .supply-chain record-temperature
  u1                         ;; product-id
  u38                        ;; temperature (Celsius)
  u60                        ;; humidity (%)
  "Refrigerated Truck #123"  ;; location
  u35                        ;; min-temp
  u40                        ;; max-temp
)
```

## 🔍 Query Functions

### Get Product Information
```clarity
;; Get complete product details
(contract-call? .supply-chain get-product u1)

;; Get supply chain summary
(contract-call? .supply-chain get-supply-chain-summary u1)

;; Verify product authenticity
(contract-call? .supply-chain verify-product-authenticity u1)
```

### Track Product History
```clarity
;; Get specific history entry
(contract-call? .supply-chain get-product-history u1 u3)

;; Get all verifications for a product
(contract-call? .supply-chain get-product-verifications u1)
```

### Check Authorization
```clarity
;; Check if stakeholder can modify product
(contract-call? .supply-chain is-authorized-for-product 
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 u1)
```

## 🛡️ Security Features

### Access Control
- **Owner-only functions**: Contract pause/resume, stakeholder verification
- **Manufacturer privileges**: Product creation, permission granting, recalls
- **Holder-based permissions**: Only current holder can transfer ownership
- **Verifier restrictions**: Only verified stakeholders can add verifications

### Data Integrity
- **Immutable history**: All product movements permanently recorded
- **Status validation**: Enforced state transitions prevent invalid updates
- **Batch tracking**: Products linked to verified production batches
- **Timestamp verification**: All actions timestamped with block height

### Error Handling
The contract includes comprehensive error codes:
- `ERR-NOT-AUTHORIZED (u100)`: Insufficient permissions
- `ERR-NOT-FOUND (u101)`: Resource doesn't exist
- `ERR-ALREADY-EXISTS (u102)`: Duplicate registration
- `ERR-INVALID-STATUS (u103)`: Invalid status transition
- `ERR-PRODUCT-NOT-ACTIVE (u105)`: Product not active
- And more...

## 🔄 Product Status Flow

```
Created → In Production → Quality Check → Packaged → 
In Transit → At Warehouse → In Transit → At Retailer → Sold

Special States:
- Recalled (from any state)
- Expired (from warehouse/retailer)
```

## 📊 Stakeholder Types

| ID | Type | Permissions |
|----|------|-------------|
| 1 | Manufacturer | Create products, batches, grant permissions, initiate recalls |
| 2 | Supplier | Provide raw materials, verify supplies |
| 3 | Distributor | Warehouse management, bulk transfers |
| 4 | Retailer | Final sale, consumer interaction |
| 5 | Consumer | Purchase, feedback |
| 6 | Verifier | Independent verification, quality control |
| 7 | Logistics | Transportation, location updates |

## 🚨 Alert System

### Alert Types
- **TEMPERATURE_ALERT**: Out of range temperature
- **QUALITY_ALERT**: Quality verification failure
- **RECALL_ALERT**: Product recall notification
- **EXPIRY_ALERT**: Product approaching expiration

### Severity Levels
1. **Low**: Informational alerts
2. **Medium**: Attention required
3. **High**: Immediate action needed
4. **Critical**: Emergency response required

## 🔧 Advanced Features

### Recall Management
- **Batch-level recalls**: Affect multiple products
- **Severity classification**: 4-level severity system
- **Consumer notification**: Automatic notification system
- **Status tracking**: Monitor recall progress

### Permission System
```clarity
;; Grant specific permissions to stakeholders
(contract-call? .supply-chain grant-product-permissions
  'STAKEHOLDER-ADDRESS
  u1              ;; product-id
  true            ;; can-update
  false           ;; can-verify
  true            ;; can-view-detailed
)
```

### Temperature Monitoring
- **Continuous logging**: Regular temperature/humidity records
- **Range validation**: Automatic out-of-range detection
- **Alert generation**: Immediate alerts for violations
- **Historical tracking**: Complete environmental history

## 📈 Benefits

### For Manufacturers
- **Quality assurance**: Comprehensive tracking and verification
- **Recall efficiency**: Quick identification and notification
- **Compliance**: Automated regulatory compliance tracking
- **Brand protection**: Authenticity verification system

### For Retailers
- **Product verification**: Confirm authenticity before sale
- **Inventory management**: Real-time status tracking
- **Consumer confidence**: Transparent product history
- **Liability protection**: Immutable proof of proper handling

### For Consumers
- **Product transparency**: Complete supply chain visibility
- **Safety assurance**: Verified quality and safety records
- **Authenticity guarantee**: Blockchain-verified genuineness
- **Recall notifications**: Immediate safety alerts

### For Regulators
- **Compliance monitoring**: Real-time regulatory oversight
- **Audit trails**: Immutable records for investigations
- **Recall coordination**: Efficient recall management
- **Data integrity**: Tamper-proof record keeping

## 🔮 Future Enhancements

- **IoT Integration**: Direct sensor data integration
- **AI Analytics**: Predictive quality analysis
- **Cross-chain Support**: Multi-blockchain interoperability
- **Mobile Applications**: Consumer-facing mobile apps
- **API Gateway**: RESTful API for external integrations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Join our Discord community
- Check the documentation wiki

## 🙏 Acknowledgments

- Stacks Foundation for blockchain infrastructure
- Clarity language developers
- Open source community contributors
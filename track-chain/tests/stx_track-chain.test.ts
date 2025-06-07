import { describe, expect, it } from "vitest";

// Mock contract interaction functions
const mockContract = {
  stakeholders: new Map(),
  products: new Map(),
  batches: new Map(),
  productHistory: new Map(),
  verifications: new Map(),
  productVerifications: new Map(),
  temperatureLogs: new Map(),
  productAlerts: new Map(),
  productRecalls: new Map(),
  stakeholderPermissions: new Map(),
  productSequenceCounter: new Map(),
  nextProductId: 1,
  nextBatchId: 1,
  nextVerificationId: 1,
  contractPaused: false,
  contractOwner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",

  // Constants
  STAKEHOLDER_MANUFACTURER: 1,
  STAKEHOLDER_SUPPLIER: 2,
  STAKEHOLDER_DISTRIBUTOR: 3,
  STAKEHOLDER_RETAILER: 4,
  STAKEHOLDER_CONSUMER: 5,
  STAKEHOLDER_VERIFIER: 6,
  STAKEHOLDER_LOGISTICS: 7,

  STATUS_CREATED: 1,
  STATUS_IN_PRODUCTION: 2,
  STATUS_QUALITY_CHECK: 3,
  STATUS_PACKAGED: 4,
  STATUS_IN_TRANSIT: 5,
  STATUS_AT_WAREHOUSE: 6,
  STATUS_AT_RETAILER: 7,
  STATUS_SOLD: 8,
  STATUS_RECALLED: 9,
  STATUS_EXPIRED: 10,

  VERIFICATION_QUALITY: 1,
  VERIFICATION_AUTHENTICITY: 2,
  VERIFICATION_TEMPERATURE: 3,
  VERIFICATION_QUANTITY: 4,
  VERIFICATION_CERTIFICATION: 5,

  // Mock functions
  registerStakeholder(
    sender,
    stakeholderType,
    companyName,
    contactInfo,
    certifications
  ) {
    if (stakeholderType < 1 || stakeholderType > 7) {
      return { success: false, error: "ERR-INVALID-STAKEHOLDER" };
    }

    if (this.stakeholders.has(sender)) {
      return { success: false, error: "ERR-ALREADY-EXISTS" };
    }

    this.stakeholders.set(sender, {
      stakeholderType,
      companyName,
      contactInfo,
      certifications,
      isVerified: false,
      isActive: true,
      registrationTime: Date.now(),
      verificationCount: 0,
    });

    return { success: true, value: sender };
  },

  verifyStakeholder(sender, stakeholder) {
    if (sender !== this.contractOwner) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }

    const stakeholderData = this.stakeholders.get(stakeholder);
    if (!stakeholderData) {
      return { success: false, error: "ERR-NOT-FOUND" };
    }

    stakeholderData.isVerified = true;
    return { success: true, value: true };
  },

  createBatch(
    sender,
    batchNumber,
    totalQuantity,
    qualityGrade,
    productionLocation,
    rawMaterials,
    certifications
  ) {
    const stakeholder = this.stakeholders.get(sender);
    if (
      !stakeholder ||
      stakeholder.stakeholderType !== this.STAKEHOLDER_MANUFACTURER
    ) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }

    const batchId = this.nextBatchId++;
    this.batches.set(batchId, {
      batchNumber,
      manufacturer: sender,
      productionDate: Date.now(),
      totalQuantity,
      remainingQuantity: totalQuantity,
      qualityGrade,
      productionLocation,
      rawMaterials,
      certifications,
      isActive: true,
    });

    return { success: true, value: batchId };
  },

  createProduct(
    sender,
    productName,
    productCategory,
    batchId,
    expiryDate,
    originCountry,
    productDescription,
    basePrice,
    initialLocation
  ) {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return { success: false, error: "ERR-NOT-FOUND" };
    }

    if (sender !== batch.manufacturer) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }

    if (batch.remainingQuantity <= 0) {
      return { success: false, error: "ERR-INVALID-QUANTITY" };
    }

    const productId = this.nextProductId++;
    this.products.set(productId, {
      productName,
      productCategory,
      manufacturer: sender,
      batchId,
      currentStatus: this.STATUS_CREATED,
      currentLocation: initialLocation,
      currentHolder: sender,
      creationTime: Date.now(),
      expiryDate,
      originCountry,
      productDescription,
      basePrice,
      isRecalled: false,
      totalVerifications: 0,
    });

    // Update batch remaining quantity
    batch.remainingQuantity--;

    // Initialize sequence counter
    this.productSequenceCounter.set(productId, { nextSequence: 1 });

    // Add initial history entry
    this.addProductHistoryEntry(
      productId,
      sender,
      sender,
      this.STATUS_CREATED,
      initialLocation,
      null,
      null,
      "Product created",
      null,
      false
    );

    return { success: true, value: productId };
  },

  updateProductStatus(
    sender,
    productId,
    newStatus,
    newLocation,
    newHolder,
    temperature,
    humidity,
    notes
  ) {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: "ERR-NOT-FOUND" };
    }

    if (!this.isAuthorizedForProduct(sender, productId)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }

    if (!this.isValidStatusTransition(product.currentStatus, newStatus)) {
      return { success: false, error: "ERR-INVALID-TRANSITION" };
    }

    const oldHolder = product.currentHolder;
    product.currentStatus = newStatus;
    product.currentLocation = newLocation;
    product.currentHolder = newHolder;

    this.addProductHistoryEntry(
      productId,
      oldHolder,
      newHolder,
      newStatus,
      newLocation,
      temperature,
      humidity,
      notes,
      null,
      false
    );

    return { success: true, value: true };
  },

  addVerification(
    sender,
    productId,
    verificationType,
    verificationResult,
    verificationData,
    expiryTime,
    certificateHash,
    notes
  ) {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: "ERR-NOT-FOUND" };
    }

    const stakeholder = this.stakeholders.get(sender);
    if (
      !stakeholder ||
      (stakeholder.stakeholderType !== this.STAKEHOLDER_VERIFIER &&
        stakeholder.stakeholderType !== this.STAKEHOLDER_MANUFACTURER)
    ) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }

    const verificationId = this.nextVerificationId++;
    this.verifications.set(verificationId, {
      productId,
      verifier: sender,
      verificationType,
      verificationResult,
      verificationData,
      timestamp: Date.now(),
      expiryTime,
      certificateHash,
      notes,
    });

    // Update product verification list
    const existing = this.productVerifications.get(productId) || {
      verificationIds: [],
    };
    existing.verificationIds.push(verificationId);
    this.productVerifications.set(productId, existing);

    // Update product verification count
    product.totalVerifications++;

    // Update stakeholder verification count
    stakeholder.verificationCount++;

    return { success: true, value: verificationId };
  },

  initiateRecall(
    sender,
    productId,
    recallReason,
    affectedBatches,
    severityLevel
  ) {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: "ERR-NOT-FOUND" };
    }

    if (sender !== product.manufacturer && sender !== this.contractOwner) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }

    product.currentStatus = this.STATUS_RECALLED;
    product.isRecalled = true;

    this.productRecalls.set(productId, {
      recallReason,
      recallDate: Date.now(),
      affectedBatches,
      severityLevel,
      recallInitiator: sender,
      recallStatus: "ACTIVE",
      consumerNotification: true,
    });

    this.addProductHistoryEntry(
      productId,
      product.currentHolder,
      product.currentHolder,
      this.STATUS_RECALLED,
      product.currentLocation,
      null,
      null,
      recallReason,
      null,
      true
    );

    return { success: true, value: true };
  },

  transferProduct(sender, productId, newOwner, newLocation, transferNotes) {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: "ERR-NOT-FOUND" };
    }

    if (sender !== product.currentHolder) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }

    if (!this.stakeholders.has(newOwner)) {
      return { success: false, error: "ERR-INVALID-STAKEHOLDER" };
    }

    const oldHolder = product.currentHolder;
    product.currentHolder = newOwner;
    product.currentLocation = newLocation;

    this.addProductHistoryEntry(
      productId,
      oldHolder,
      newOwner,
      product.currentStatus,
      newLocation,
      null,
      null,
      transferNotes,
      null,
      false
    );

    return { success: true, value: true };
  },

  recordTemperature(
    sender,
    productId,
    temperature,
    humidity,
    location,
    minTemp,
    maxTemp
  ) {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: "ERR-NOT-FOUND" };
    }

    if (!this.isAuthorizedForProduct(sender, productId)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }

    const sequence = this.getNextSequence(productId);
    const isWithinRange = temperature >= minTemp && temperature <= maxTemp;

    const logKey = `${productId}-${sequence}`;
    this.temperatureLogs.set(logKey, {
      temperature,
      humidity,
      location,
      timestamp: Date.now(),
      recorder: sender,
      isWithinRange,
      minTemp,
      maxTemp,
    });

    if (!isWithinRange) {
      this.createAlert(
        productId,
        "TEMPERATURE_ALERT",
        3,
        "Temperature out of acceptable range"
      );
    }

    return { success: true, value: true };
  },

  // Helper functions
  isAuthorizedForProduct(stakeholder, productId) {
    const product = this.products.get(productId);
    if (!product) return false;

    if (
      stakeholder === product.manufacturer ||
      stakeholder === product.currentHolder
    ) {
      return true;
    }

    const permissions = this.stakeholderPermissions.get(
      `${stakeholder}-${productId}`
    );
    return permissions?.canUpdate || false;
  },

  isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = [
      [this.STATUS_CREATED, this.STATUS_IN_PRODUCTION],
      [this.STATUS_IN_PRODUCTION, this.STATUS_QUALITY_CHECK],
      [this.STATUS_QUALITY_CHECK, this.STATUS_PACKAGED],
      [this.STATUS_PACKAGED, this.STATUS_IN_TRANSIT],
      [this.STATUS_IN_TRANSIT, this.STATUS_AT_WAREHOUSE],
      [this.STATUS_AT_WAREHOUSE, this.STATUS_IN_TRANSIT],
      [this.STATUS_IN_TRANSIT, this.STATUS_AT_RETAILER],
      [this.STATUS_AT_RETAILER, this.STATUS_SOLD],
    ];

    // Allow recall from any status
    if (newStatus === this.STATUS_RECALLED) return true;

    // Allow expiry from warehouse or retailer
    if (
      (currentStatus === this.STATUS_AT_WAREHOUSE ||
        currentStatus === this.STATUS_AT_RETAILER) &&
      newStatus === this.STATUS_EXPIRED
    ) {
      return true;
    }

    return validTransitions.some(
      ([from, to]) => from === currentStatus && to === newStatus
    );
  },

  addProductHistoryEntry(
    productId,
    fromStakeholder,
    toStakeholder,
    statusChange,
    location,
    temperature,
    humidity,
    notes,
    transactionHash,
    verificationRequired
  ) {
    const counter = this.productSequenceCounter.get(productId) || {
      nextSequence: 1,
    };
    const sequence = counter.nextSequence;

    const historyKey = `${productId}-${sequence}`;
    this.productHistory.set(historyKey, {
      fromStakeholder,
      toStakeholder,
      statusChange,
      location,
      timestamp: Date.now(),
      temperature,
      humidity,
      notes,
      transactionHash,
      verificationRequired,
    });

    counter.nextSequence++;
    this.productSequenceCounter.set(productId, counter);
  },

  getNextSequence(productId) {
    const counter = this.productSequenceCounter.get(productId) || {
      nextSequence: 1,
    };
    return counter.nextSequence;
  },

  createAlert(productId, alertType, severity, message) {
    const alertKey = `${productId}-1`; // Simplified alert ID
    this.productAlerts.set(alertKey, {
      alertType,
      severity,
      message,
      timestamp: Date.now(),
      isResolved: false,
      resolver: null,
    });
  },

  // Read-only functions
  getStakeholder(stakeholder) {
    return this.stakeholders.get(stakeholder) || null;
  },

  getProduct(productId) {
    return this.products.get(productId) || null;
  },

  getBatch(batchId) {
    return this.batches.get(batchId) || null;
  },

  getProductHistory(productId, sequence) {
    return this.productHistory.get(`${productId}-${sequence}`) || null;
  },

  getVerification(verificationId) {
    return this.verifications.get(verificationId) || null;
  },

  getProductVerifications(productId) {
    return this.productVerifications.get(productId) || null;
  },

  verifyProductAuthenticity(productId) {
    const product = this.products.get(productId);
    if (!product) {
      return {
        exists: false,
        manufacturer: null,
        batchId: 0,
        status: 0,
        isRecalled: false,
        verificationCount: 0,
        authenticityScore: 0,
      };
    }

    return {
      exists: true,
      manufacturer: product.manufacturer,
      batchId: product.batchId,
      status: product.currentStatus,
      isRecalled: product.isRecalled,
      verificationCount: product.totalVerifications,
      authenticityScore: Math.min(100, product.totalVerifications * 10),
    };
  },

  getSupplyChainSummary(productId) {
    const product = this.products.get(productId);
    if (!product) {
      return {
        productId,
        currentStatus: 0,
        currentLocation: "",
        currentHolder: null,
        manufacturer: null,
        creationTime: 0,
        totalVerifications: 0,
        isRecalled: false,
      };
    }

    return {
      productId,
      currentStatus: product.currentStatus,
      currentLocation: product.currentLocation,
      currentHolder: product.currentHolder,
      manufacturer: product.manufacturer,
      creationTime: product.creationTime,
      totalVerifications: product.totalVerifications,
      isRecalled: product.isRecalled,
    };
  },
};

describe("Supply Chain Contract Tests", () => {
  const manufacturer = "ST1MANUFACTURER123456789ABCDEFGH";
  const supplier = "ST1SUPPLIER123456789ABCDEFGHIJ";
  const distributor = "ST1DISTRIBUTOR123456789ABCDEFG";
  const retailer = "ST1RETAILER123456789ABCDEFGHIJ";
  const verifier = "ST1VERIFIER123456789ABCDEFGHIJ";
  const consumer = "ST1CONSUMER123456789ABCDEFGHIJ";

  describe("Stakeholder Registration", () => {
    it("should register a new stakeholder successfully", () => {
      const result = mockContract.registerStakeholder(
        manufacturer,
        mockContract.STAKEHOLDER_MANUFACTURER,
        "Test Manufacturing Co",
        "contact@testmfg.com",
        ["ISO9001", "FDA"]
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe(manufacturer);

      const stakeholder = mockContract.getStakeholder(manufacturer);
      expect(stakeholder).toBeTruthy();
      expect(stakeholder.stakeholderType).toBe(
        mockContract.STAKEHOLDER_MANUFACTURER
      );
      expect(stakeholder.companyName).toBe("Test Manufacturing Co");
      expect(stakeholder.isVerified).toBe(false);
      expect(stakeholder.isActive).toBe(true);
    });

    it("should reject registration with invalid stakeholder type", () => {
      const result = mockContract.registerStakeholder(
        supplier,
        99, // Invalid type
        "Test Supplier",
        "contact@supplier.com",
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-INVALID-STAKEHOLDER");
    });

    it("should reject duplicate registration", () => {
      // First registration should succeed
      mockContract.registerStakeholder(
        distributor,
        mockContract.STAKEHOLDER_DISTRIBUTOR,
        "Test Distributor",
        "contact@distributor.com",
        []
      );

      // Second registration should fail
      const result = mockContract.registerStakeholder(
        distributor,
        mockContract.STAKEHOLDER_DISTRIBUTOR,
        "Another Company",
        "another@email.com",
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-ALREADY-EXISTS");
    });

    it("should allow contract owner to verify stakeholder", () => {
      // Register stakeholder first
      mockContract.registerStakeholder(
        retailer,
        mockContract.STAKEHOLDER_RETAILER,
        "Test Retailer",
        "contact@retailer.com",
        []
      );

      // Verify stakeholder
      const result = mockContract.verifyStakeholder(
        mockContract.contractOwner,
        retailer
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe(true);

      const stakeholder = mockContract.getStakeholder(retailer);
      expect(stakeholder.isVerified).toBe(true);
    });

    it("should reject verification from non-owner", () => {
      const result = mockContract.verifyStakeholder(manufacturer, retailer);

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-NOT-AUTHORIZED");
    });
  });

  describe("Batch Creation", () => {
    it("should create a new batch successfully", () => {
      // Register manufacturer first
      mockContract.registerStakeholder(
        manufacturer,
        mockContract.STAKEHOLDER_MANUFACTURER,
        "Test Manufacturing Co",
        "contact@testmfg.com",
        ["ISO9001"]
      );

      const result = mockContract.createBatch(
        manufacturer,
        "BATCH001",
        100,
        "A+",
        "Factory Floor 1",
        ["Raw Material 1", "Raw Material 2"],
        ["ISO9001", "FDA"]
      );

      expect(result.success).toBe(true);
      expect(typeof result.value).toBe("number");

      const batch = mockContract.getBatch(result.value);
      expect(batch).toBeTruthy();
      expect(batch.batchNumber).toBe("BATCH001");
      expect(batch.manufacturer).toBe(manufacturer);
      expect(batch.totalQuantity).toBe(100);
      expect(batch.remainingQuantity).toBe(100);
      expect(batch.isActive).toBe(true);
    });

    it("should reject batch creation from non-manufacturer", () => {
      // Register as supplier instead of manufacturer
      mockContract.registerStakeholder(
        supplier,
        mockContract.STAKEHOLDER_SUPPLIER,
        "Test Supplier",
        "contact@supplier.com",
        []
      );

      const result = mockContract.createBatch(
        supplier,
        "BATCH002",
        50,
        "B",
        "Warehouse",
        ["Material A"],
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-NOT-AUTHORIZED");
    });
  });

  describe("Product Creation", () => {
    it("should create a new product successfully", () => {
      // Setup: Register manufacturer and create batch
      mockContract.registerStakeholder(
        manufacturer,
        mockContract.STAKEHOLDER_MANUFACTURER,
        "Test Manufacturing Co",
        "contact@testmfg.com",
        []
      );

      const batchResult = mockContract.createBatch(
        manufacturer,
        "BATCH001",
        10,
        "A+",
        "Factory",
        ["Material 1"],
        []
      );

      const batchId = batchResult.value;

      // Create product
      const result = mockContract.createProduct(
        manufacturer,
        "Test Product",
        "Electronics",
        batchId,
        Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
        "USA",
        "High quality test product",
        1000,
        "Factory Floor"
      );

      expect(result.success).toBe(true);
      expect(typeof result.value).toBe("number");

      const product = mockContract.getProduct(result.value);
      expect(product).toBeTruthy();
      expect(product.productName).toBe("Test Product");
      expect(product.manufacturer).toBe(manufacturer);
      expect(product.currentStatus).toBe(mockContract.STATUS_CREATED);
      expect(product.currentHolder).toBe(manufacturer);
      expect(product.isRecalled).toBe(false);

      // Check that batch quantity was decremented
      const batch = mockContract.getBatch(batchId);
      expect(batch.remainingQuantity).toBe(9);
    });

    it("should reject product creation with invalid batch", () => {
      const result = mockContract.createProduct(
        manufacturer,
        "Test Product",
        "Electronics",
        999, // Non-existent batch
        Date.now() + 365 * 24 * 60 * 60 * 1000,
        "USA",
        "Description",
        1000,
        "Location"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-NOT-FOUND");
    });

    it("should reject product creation from non-batch-owner", () => {
      // Register another manufacturer
      const otherManufacturer = "ST1OTHERMFG123456789ABCDEFGH";
      mockContract.registerStakeholder(
        otherManufacturer,
        mockContract.STAKEHOLDER_MANUFACTURER,
        "Other Manufacturer",
        "other@mfg.com",
        []
      );

      // Try to create product using someone else's batch
      const batchResult = mockContract.createBatch(
        manufacturer,
        "BATCH002",
        5,
        "A",
        "Factory",
        ["Material"],
        []
      );

      const result = mockContract.createProduct(
        otherManufacturer, // Different manufacturer
        "Unauthorized Product",
        "Electronics",
        batchResult.value,
        Date.now() + 365 * 24 * 60 * 60 * 1000,
        "USA",
        "Description",
        1000,
        "Location"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-NOT-AUTHORIZED");
    });
  });

  describe("Product Status Updates", () => {
    let productId;

    beforeEach(() => {
      // Setup product for testing
      mockContract.registerStakeholder(
        manufacturer,
        mockContract.STAKEHOLDER_MANUFACTURER,
        "Test Manufacturing Co",
        "contact@testmfg.com",
        []
      );

      const batchResult = mockContract.createBatch(
        manufacturer,
        "BATCH001",
        10,
        "A+",
        "Factory",
        ["Material 1"],
        []
      );

      const productResult = mockContract.createProduct(
        manufacturer,
        "Test Product",
        "Electronics",
        batchResult.value,
        Date.now() + 365 * 24 * 60 * 60 * 1000,
        "USA",
        "Description",
        1000,
        "Factory Floor"
      );

      productId = productResult.value;
    });

    it("should update product status successfully", () => {
      const result = mockContract.updateProductStatus(
        manufacturer,
        productId,
        mockContract.STATUS_IN_PRODUCTION,
        "Production Line 1",
        manufacturer,
        null,
        null,
        "Started production"
      );

      expect(result.success).toBe(true);

      const product = mockContract.getProduct(productId);
      expect(product.currentStatus).toBe(mockContract.STATUS_IN_PRODUCTION);
      expect(product.currentLocation).toBe("Production Line 1");

      // Check history was recorded
      const history = mockContract.getProductHistory(productId, 2); // Second entry
      expect(history).toBeTruthy();
      expect(history.statusChange).toBe(mockContract.STATUS_IN_PRODUCTION);
      expect(history.notes).toBe("Started production");
    });

    it("should reject invalid status transitions", () => {
      const result = mockContract.updateProductStatus(
        manufacturer,
        productId,
        mockContract.STATUS_SOLD, // Invalid jump from CREATED to SOLD
        "Retail Store",
        manufacturer,
        null,
        null,
        "Invalid transition"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-INVALID-TRANSITION");
    });

    it("should reject unauthorized status updates", () => {
      // Register unauthorized user
      const unauthorized = "ST1UNAUTHORIZED123456789ABCDEF";
      mockContract.registerStakeholder(
        unauthorized,
        mockContract.STAKEHOLDER_CONSUMER,
        "Unauthorized User",
        "unauthorized@test.com",
        []
      );

      const result = mockContract.updateProductStatus(
        unauthorized,
        productId,
        mockContract.STATUS_IN_PRODUCTION,
        "Somewhere",
        unauthorized,
        null,
        null,
        "Unauthorized update"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-NOT-AUTHORIZED");
    });
  });

  describe("Product Verification", () => {
    let productId;

    beforeEach(() => {
      // Setup
      mockContract.registerStakeholder(
        manufacturer,
        mockContract.STAKEHOLDER_MANUFACTURER,
        "Test Manufacturing Co",
        "contact@testmfg.com",
        []
      );

      mockContract.registerStakeholder(
        verifier,
        mockContract.STAKEHOLDER_VERIFIER,
        "Test Verifier Co",
        "verifier@test.com",
        []
      );

      const batchResult = mockContract.createBatch(
        manufacturer,
        "BATCH001",
        10,
        "A+",
        "Factory",
        ["Material 1"],
        []
      );

      const productResult = mockContract.createProduct(
        manufacturer,
        "Test Product",
        "Electronics",
        batchResult.value,
        Date.now() + 365 * 24 * 60 * 60 * 1000,
        "USA",
        "Description",
        1000,
        "Factory Floor"
      );

      productId = productResult.value;
    });

    it("should add verification successfully", () => {
      const result = mockContract.addVerification(
        verifier,
        productId,
        mockContract.VERIFICATION_QUALITY,
        true,
        "Quality check passed with grade A+",
        Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days validity
        null,
        "Standard quality verification"
      );

      expect(result.success).toBe(true);
      expect(typeof result.value).toBe("number");

      const verification = mockContract.getVerification(result.value);
      expect(verification).toBeTruthy();
      expect(verification.productId).toBe(productId);
      expect(verification.verifier).toBe(verifier);
      expect(verification.verificationType).toBe(
        mockContract.VERIFICATION_QUALITY
      );
      expect(verification.verificationResult).toBe(true);

      // Check product verification count increased
      const product = mockContract.getProduct(productId);
      expect(product.totalVerifications).toBe(1);

      // Check verifier's verification count increased
      const verifierData = mockContract.getStakeholder(verifier);
      expect(verifierData.verificationCount).toBe(1);
    });

    it("should reject verification from unauthorized stakeholder", () => {
      // Register consumer (not authorized to verify)
      mockContract.registerStakeholder(
        consumer,
        mockContract.STAKEHOLDER_CONSUMER,
        "Test Consumer",
        "consumer@test.com",
        []
      );

      const result = mockContract.addVerification(
        consumer,
        productId,
        mockContract.VERIFICATION_QUALITY,
        true,
        "Unauthorized verification",
        Date.now() + 30 * 24 * 60 * 60 * 1000,
        null,
        "Should fail"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR-NOT-AUTHORIZED");
    });

    it("should allow manufacturer to verify their own product", () => {
      const result = mockContract.addVerification(
        manufacturer,
        productId,
        mockContract.VERIFICATION_AUTHENTICITY
      );
    });
  });
});

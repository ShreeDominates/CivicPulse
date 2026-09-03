/**
 * Canonical CivicPulse Government & Authorized Source Adapter Contracts
 *
 * Provides a provider-independent representation of government source interactions,
 * distinguishing data return from authoritative verification, structural authenticity,
 * document freshness/expiry, and provenance.
 */

export type AdapterMode = "REAL" | "SIMULATED" | "NOT_IMPLEMENTED";

/**
 * Distinguishes whether the data was merely returned by an endpoint vs confirmed
 * as authentic by an authoritative register.
 */
export type VerificationStatus =
  | "DATA_RETURNED"       // Payload received from provider without authoritative assertion
  | "DATA_VERIFIED"       // Record confirmed against authoritative register (e.g. CBS / CPC)
  | "VERIFICATION_FAILED" // Upstream source explicitly reported record as invalid/unverified
  | "NOT_VERIFIED";       // Verification was not performed or unsupported

/**
 * Distinguishes document authenticity and digital signature status.
 * Avoids claiming cryptographic validity when a signature was merely simulated or absent.
 */
export type AuthenticityStatus =
  | "UNAUTHENTICATED"         // No digital signature or cryptographic proof provided
  | "AUTHENTICITY_CONFIRMED"  // Cryptographic token / XML-DSig / PKI confirmed valid upstream
  | "SIGNATURE_SIMULATED"     // Sandbox artifact modeled on authentic signature structure
  | "SIGNATURE_INVALID";      // Signature verification failed upstream

/**
 * Freshness status of the data record relative to the governing policy or intake window.
 */
export type FreshnessStatus =
  | "FRESH"      // Data is current (e.g. current assessment year, active intake window)
  | "STALE"      // Data is from an outdated cycle (e.g. previous assessment year)
  | "EXPIRED"    // Explicit validity window has elapsed (e.g. NCL certificate expired)
  | "PERMANENT"  // Lifelong validity (e.g. SC/ST certificate, birth record)
  | "UNKNOWN";   // Source does not provide timestamp or freshness metadata

/**
 * Overall legal / administrative validity of the underlying record.
 */
export type ValidityStatus =
  | "VALID"      // Active and in good standing
  | "REVOKED"    // Cancelled or revoked by issuing authority
  | "SUSPENDED"  // Temporarily withheld or under administrative review
  | "EXPIRED"    // Past validity period
  | "UNKNOWN";

/**
 * Provider-independent error taxonomy.
 */
export type AdapterErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONSENT_REQUIRED"
  | "RECORD_NOT_FOUND"
  | "INVALID_IDENTIFIER"
  | "EXPIRED_RECORD"
  | "REVOKED_RECORD"
  | "SOURCE_UNAVAILABLE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "DUPLICATE_REQUEST"
  | "VERIFICATION_FAILED"
  | "UNKNOWN";

export interface AdapterError {
  code: AdapterErrorCode;
  message: string;
  category: "VALIDATION" | "AUTH" | "CONSENT" | "UPSTREAM_ERROR" | "FRESHNESS" | "SYSTEM";
  upstreamStatusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Non-sensitive provenance metadata explaining where the data originated.
 */
export interface ProvenanceMetadata {
  sourceId: string;             // Canonical source ID e.g. "INCOME_TAX_DEPT_APISETU"
  sourceName: string;           // Human-readable source name e.g. "Income Tax Department"
  department?: string;          // Ministry/Department e.g. "Central Board of Direct Taxes"
  mode: AdapterMode;            // REAL | SIMULATED | NOT_IMPLEMENTED
  requestId: string;            // Unique correlation / request tracking identifier
  recordId?: string;            // Source-side record/ack number (e.g. CPC Ack URN)
  retrievedAt: string;          // ISO timestamp when CivicPulse retrieved this data
  issuedAt?: string;            // Original issuance date from authority
  sourceUpdatedAt?: string;     // Last updated date in source register
  expiresAt?: string;           // Expiry date where applicable (e.g. NCL expiry)
  adapterVersion: string;       // Adapter version string e.g. "2.0.0"
  signatureMetadata?: {
    signerIdentity?: string;    // e.g. "Controller of Examinations, CBSE"
    algorithm?: string;         // e.g. "SHA256withRSA"
    isSimulated: boolean;       // Clearly states if simulated in sandbox
  };
}

/**
 * The Canonical Adapter Result envelope returned by all CivicPulse adapters.
 */
export interface CanonicalAdapterResult<T> {
  success: boolean;
  verificationStatus: VerificationStatus;
  authenticityStatus: AuthenticityStatus;
  freshnessStatus: FreshnessStatus;
  validityStatus: ValidityStatus;
  provenance: ProvenanceMetadata;
  data?: T;
  error?: AdapterError;
}

/**
 * Standard execution context passed to an adapter.
 */
export interface AdapterExecutionContext {
  userId?: string;
  actorHash?: string;
  consentId?: string;
  endpoint?: string;
  ipAddress?: string;
  requestId?: string;
  scenario?: string;      // Optional developer/test scenario override
  skipLatency?: boolean;  // Optional flag to skip latency in automated test suites
}

/**
 * Common interface that every government / authorized data-source adapter implements.
 */
export interface GovernmentAdapter<TRequest, TData> {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly mode: AdapterMode;
  execute(request: TRequest, context?: AdapterExecutionContext): Promise<CanonicalAdapterResult<TData>>;
}

// ==========================================
// Canonical Domain Payload Models
// ==========================================

export interface IncomePayload {
  annualIncome: number;
  holderName: string;
  pan: string;
  assessmentYear?: string;
  taxFiled?: boolean;
  source: string;
  verifiedAt: string;
}

export interface SubjectScore {
  code: string;
  name: string;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
  grade: string;
}

export type IdentityMatchStatus = "MATCH" | "PARTIAL_MATCH" | "MISMATCH" | "NOT_CHECKED";

export interface MarksPayload {
  percentage: number;
  rollNumber: string;
  studentName: string;
  motherName?: string;
  fatherName?: string;
  year: number;
  class: number;
  grade?: string;
  schoolCode?: string;
  schoolName?: string;
  subjects?: SubjectScore[];
  resultStatus?: "PASS" | "COMPARTMENT" | "ESSENTIAL_REPEAT";
  source: string;
  // NOTE: digitalSignatureValid is preserved strictly as legacy UI metadata.
  // Authoritative cryptographic state is always represented in CanonicalAdapterResult.authenticityStatus.
  digitalSignatureValid: boolean;
  issuedBy?: string;
  issuedOn?: string;
  documentReference?: string; // Simulated Document Reference
  identityMatch?: {
    status: IdentityMatchStatus;
    confidence: number;
    matchedName?: string;
    claimedName?: string;
    details?: string;
  };
}

export interface BankPayload {
  valid: boolean;
  registeredName: string;
  bankName: string;
  ifsc: string;
  accountLast4: string;
  verifiedAt: string;
  nameMatchConfidence?: number;
}

export interface LgdPayload {
  found: boolean;
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  source: string;
}

/**
 * Placeholder domain payload for future State Caste/Category adapter
 */
export interface CastePayload {
  category: string;
  certificateId: string;
  subCaste?: string;
  source: string;
  issuingAuthority?: string;
  nclValidUntil?: string;
}

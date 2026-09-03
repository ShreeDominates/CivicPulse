/**
 * @deprecated LEGACY THEORETICAL TRANSPORT STUB — NOT USED IN B3 AUTHORITATIVE PATH.
 *
 * SAFETY DISCLOSURE (SIH AUDIT):
 * 1. DigiLocker Requester API requires 3-legged citizen OAuth authorization; it does
 *    not permit automated 2-legged client_credentials access to citizen educational records.
 * 2. The URL endpoint below is a theoretical stub, not a verified CBSE endpoint.
 * 3. Checking `signature.length > 0` is NOT cryptographic verification. Actual X.509
 *    PKI digital signature verification is explicitly: NOT IMPLEMENTED.
 *
 * All active CBSE / DigiLocker verification in CivicPulse is routed authoritatively
 * through `MarksAdapter` and `simulateMarksVerification` in `lib/govapi/`.
 */

let XMLParser: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  XMLParser = require("fast-xml-parser").XMLParser;
} catch {}

const DIGILOCKER_TOKEN_URL =
  "https://digilocker.meripehchan.gov.in/public/oauth2/1/token";

export interface DigiLockerMarksResponse {
  source: string;
  rollNumber: string;
  studentName: string;
  year: number;
  class: number;
  percentage: number;
  grade: string;
  digitalSignatureValid: boolean;
  issuedBy: string;
  issuedOn: string;
}

export async function getDigiLockerToken(): Promise<string> {
  const response = await fetch(DIGILOCKER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.DIGILOCKER_CLIENT_ID || "",
      client_secret: process.env.DIGILOCKER_CLIENT_SECRET || "",
    }),
  });

  if (!response.ok) throw new Error("DigiLocker auth failed");
  const data = await response.json();
  return data.access_token;
}

export async function fetchCBSEMarksFromDigiLocker(
  rollNumber: string
): Promise<DigiLockerMarksResponse> {
  const token = await getDigiLockerToken();
  const response = await fetch(
    `https://api.digitallocker.gov.in/public/oauth2/1/xml/edu/cbse/marksheet/${rollNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/xml",
      },
    }
  );

  if (!response.ok) throw new Error("DigiLocker fetch failed");
  const xml = await response.text();

  // Parse XML response
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const result = parser.parse(xml);

  // Extract fields from XML structure
  const marksheet = result.marksheet || result.Document || {};
  const signature = marksheet.DigiLockerSignature || "";

  return {
    source: "CBSE_DIGILOCKER",
    rollNumber: marksheet.RollNumber || rollNumber,
    studentName: marksheet.StudentName || marksheet.Name || "",
    year: parseInt(marksheet.Year || marksheet.YearOfPassing || "2025"),
    class: parseInt(marksheet.Class || "12"),
    percentage: parseFloat(marksheet.Percentage || marksheet.Marks || "0"),
    grade: marksheet.Grade || "A",
    digitalSignatureValid: signature.length > 0,
    issuedBy: "CENTRAL BOARD OF SECONDARY EDUCATION",
    issuedOn: marksheet.IssuedOn || new Date().toISOString(),
  };
}

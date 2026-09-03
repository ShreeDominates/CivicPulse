export interface EligibilityCriterion {
  label: string;
  actualValue: string;
  threshold: string;
  pass: boolean;
  description: string;
}

export interface EligibilityResult {
  approved: boolean;
  criteria: EligibilityCriterion[];
  scholarshipAmount: number;
  rejectionReasons: string[];
}

export interface IncomeData {
  annualIncome: number;
  holderName: string;
  source: string;
  digitallyVerified: boolean;
}

export interface MarksData {
  percentage: number;
  rollNumber: string;
  studentName: string;
  source: string;
  digitalSignatureValid: boolean;
}

export interface CasteData {
  category: string;
  certificateId: string;
  source: string;
}

export interface LgdData {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
}

export interface BankData {
  valid: boolean;
  bankName: string;
  accountLast4: string;
  registeredName: string;
}

export function evaluateScholarshipEligibility(
  income: IncomeData,
  marks: MarksData,
  caste: CasteData,
  lgd: LgdData,
  bank: BankData
): EligibilityResult {
  const criteria: EligibilityCriterion[] = [];
  const rejectionReasons: string[] = [];

  // Criterion 1: Income
  const incomePass = income.annualIncome <= 250000;
  criteria.push({
    label: "Annual Family Income ≤ ₹2,50,000",
    actualValue: `₹${income.annualIncome.toLocaleString("en-IN")}`,
    threshold: "≤ ₹2,50,000",
    pass: incomePass,
    description: `Income verified by ${income.source}`,
  });
  if (!incomePass) rejectionReasons.push(`Income ₹${income.annualIncome.toLocaleString("en-IN")} exceeds the ceiling of ₹2,50,000`);

  // Criterion 2: Marks
  const marksPass = marks.percentage >= 75;
  criteria.push({
    label: "12th Board Percentage ≥ 75%",
    actualValue: `${marks.percentage}%`,
    threshold: "≥ 75%",
    pass: marksPass,
    description: `Score from ${marks.source}${marks.digitalSignatureValid ? " (Digitally Signed ✓)" : ""}`,
  });
  if (!marksPass) rejectionReasons.push(`Percentage ${marks.percentage}% is below the required 75%`);

  // Criterion 3: Category
  const validCategories = ["SC", "ST", "OBC", "EWS"];
  const categoryPass = validCategories.includes(caste.category.toUpperCase());
  criteria.push({
    label: "Category: SC / ST / OBC / EWS",
    actualValue: caste.category,
    threshold: "SC, ST, OBC, or EWS",
    pass: categoryPass,
    description: `Certificate: ${caste.certificateId}`,
  });
  if (!categoryPass) rejectionReasons.push(`Category "${caste.category}" is not eligible for this scholarship`);

  // Criterion 4: Maharashtra Domicile
  const domicilePass = lgd.stateCode === "27";
  criteria.push({
    label: "Maharashtra Domicile (LGD State 27)",
    actualValue: `${lgd.districtName} (${lgd.stateName})`,
    threshold: "LGD State Code 27",
    pass: domicilePass,
    description: `LGD District Code: ${lgd.districtCode}`,
  });
  if (!domicilePass) rejectionReasons.push(`State "${lgd.stateName}" is not Maharashtra`);

  // Criterion 5: Bank Account
  const bankPass = bank.valid && bank.registeredName.length > 0;
  criteria.push({
    label: "Valid Bank Account",
    actualValue: `${bank.bankName} XXXX${bank.accountLast4}`,
    threshold: "Verified & name matches",
    pass: bankPass,
    description: `Registered to: ${bank.registeredName}`,
  });
  if (!bankPass) rejectionReasons.push("Bank account verification failed");

  const approved = criteria.every((c) => c.pass);

  return {
    approved,
    criteria,
    scholarshipAmount: approved ? 48000 : 0,
    rejectionReasons,
  };
}

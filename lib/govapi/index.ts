export * from "./types.ts";
export * from "./adapters/incomeAdapter.ts";
export * from "./adapters/marksAdapter.ts";
export * from "./adapters/bankAdapter.ts";
export * from "./adapters/lgdAdapter.ts";
export * from "./adapters/casteAdapter.ts";
export * from "./adapters/pfmsAdapter.ts";

// Low-level provider transports
export { fetchIncome, fetchCBSE12 } from "./apisetu.ts";
export { fetchCBSEMarksFromDigiLocker, getDigiLockerToken } from "./digilocker.ts";
export { validateBankAccount } from "./razorpay.ts";
export { fetchDataGovStats } from "./datagov.ts";

interface BankValidationResponse {
  valid: boolean;
  registeredName: string;
  bankName: string;
  ifsc: string;
  accountLast4: string;
  verifiedAt: string;
}

export async function validateBankAccount(
  accountNumber: string,
  ifsc: string,
  name: string
): Promise<BankValidationResponse> {
  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch(
    "https://api.razorpay.com/v1/fund_accounts/validations",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_number: accountNumber,
        ifsc: ifsc,
        name: name,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.description || "Bank validation failed");
  }

  const data = await response.json();
  return {
    valid: true,
    registeredName: data.registered_name || name,
    bankName: data.bank_name || "Unknown Bank",
    ifsc,
    accountLast4: accountNumber.slice(-4),
    verifiedAt: new Date().toISOString(),
  };
}

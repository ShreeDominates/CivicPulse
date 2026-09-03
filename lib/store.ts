import { create } from "zustand";

export type TaskStatus = "waiting" | "fetching" | "verified" | "failed";

export interface FetchTask {
  id: string;
  label: string;
  status: TaskStatus;
  result?: string;
  apiBadge?: string;
  apiColor?: string;
  error?: string;
}

interface ScholarshipState {
  // Wizard step
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Form data
  panNumber: string;
  aadhaarNumber: string;
  bankAccount: string;
  bankIfsc: string;
  setPanNumber: (v: string) => void;
  setAadhaarNumber: (v: string) => void;
  setBankAccount: (v: string) => void;
  setBankIfsc: (v: string) => void;

  // Consent
  consentGranted: boolean;
  consentId: string | null;
  setConsent: (granted: boolean, id?: string) => void;

  // Fetch tasks
  tasks: FetchTask[];
  updateTaskStatus: (id: string, status: TaskStatus, result?: string, apiBadge?: string, apiColor?: string, error?: string) => void;
  resetTasks: () => void;

  // Fetched data
  incomeData: any;
  marksData: any;
  casteData: any;
  lgdData: any;
  bankData: any;
  setIncomeData: (d: any) => void;
  setMarksData: (d: any) => void;
  setCasteData: (d: any) => void;
  setLgdData: (d: any) => void;
  setBankData: (d: any) => void;

  // Eligibility
  eligibilityResult: any;
  setEligibilityResult: (r: any) => void;

  // Application
  applicationRef: string | null;
  setApplicationRef: (ref: string) => void;

  // Reset
  reset: () => void;
}

const initialTasks: FetchTask[] = [
  { id: "income", label: "Fetching income certificate from Income Tax Department (API Setu)...", status: "waiting" },
  { id: "marks", label: "Fetching 12th Board Result from CBSE (DigiLocker API)...", status: "waiting" },
  { id: "caste", label: "Fetching caste/category from State Revenue Portal (API Setu)...", status: "waiting" },
  { id: "lgd", label: "Normalizing address to LGD District Code...", status: "waiting" },
  { id: "bank", label: "Validating bank account via NPCI...", status: "waiting" },
];

export const useScholarshipStore = create<ScholarshipState>((set) => ({
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  panNumber: "",
  aadhaarNumber: "",
  bankAccount: "",
  bankIfsc: "",
  setPanNumber: (v) => set({ panNumber: v }),
  setAadhaarNumber: (v) => set({ aadhaarNumber: v }),
  setBankAccount: (v) => set({ bankAccount: v }),
  setBankIfsc: (v) => set({ bankIfsc: v }),

  consentGranted: false,
  consentId: null,
  setConsent: (granted, id) => set({ consentGranted: granted, consentId: id || null }),

  tasks: [...initialTasks],
  updateTaskStatus: (id, status, result, apiBadge, apiColor, error) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, result, apiBadge, apiColor, error } : t
      ),
    })),
  resetTasks: () => set({ tasks: [...initialTasks] }),

  incomeData: null,
  marksData: null,
  casteData: null,
  lgdData: null,
  bankData: null,
  setIncomeData: (d) => set({ incomeData: d }),
  setMarksData: (d) => set({ marksData: d }),
  setCasteData: (d) => set({ casteData: d }),
  setLgdData: (d) => set({ lgdData: d }),
  setBankData: (d) => set({ bankData: d }),

  eligibilityResult: null,
  setEligibilityResult: (r) => set({ eligibilityResult: r }),

  applicationRef: null,
  setApplicationRef: (ref) => set({ applicationRef: ref }),

  reset: () =>
    set({
      currentStep: 1,
      panNumber: "",
      aadhaarNumber: "",
      bankAccount: "",
      bankIfsc: "",
      consentGranted: false,
      consentId: null,
      tasks: [...initialTasks],
      incomeData: null,
      marksData: null,
      casteData: null,
      lgdData: null,
      bankData: null,
      eligibilityResult: null,
      applicationRef: null,
    }),
}));

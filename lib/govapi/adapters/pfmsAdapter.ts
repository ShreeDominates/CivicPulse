/**
 * CivicPulse PFMS / DBT Government Adapter.
 * Bridges application lifecycle disbursement requests to the realistic PFMS simulator.
 */

import type {
  GovernmentAdapter,
  CanonicalAdapterResult,
  AdapterExecutionContext,
} from "../types.ts";
import {
  PfmsSimulator,
  type PfmsDisbursementRequest,
  type PfmsDisbursementPayload,
} from "../simulators/pfmsSimulator.ts";

export class PfmsAdapter implements GovernmentAdapter<PfmsDisbursementRequest, PfmsDisbursementPayload> {
  readonly sourceId = "PFMS_DBT_PORTAL";
  readonly sourceName = "Public Financial Management System (PFMS)";

  get mode(): "SIMULATED" | "REAL" | "NOT_IMPLEMENTED" {
    return "SIMULATED";
  }

  async execute(
    request: PfmsDisbursementRequest,
    context?: AdapterExecutionContext
  ): Promise<CanonicalAdapterResult<PfmsDisbursementPayload>> {
    return PfmsSimulator.execute(request, context);
  }
}

export const pfmsAdapter = new PfmsAdapter();

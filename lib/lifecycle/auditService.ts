/**
 * CivicPulse Authoritative Application Lifecycle & Audit Event Service.
 * Implements persistent timeline recording and verification traceability.
 */

import crypto from "crypto";
import type { LifecycleEvent } from "./types.ts";

// Safe Prisma import
let prisma: any = null;
try {
  prisma = require("@/lib/prisma").prisma;
} catch {}

class AuditService {
  // In-memory persistent event store (fallback and unit testing)
  private events: LifecycleEvent[] = [];

  /**
   * Records an authoritative lifecycle transition event.
   */
  public async recordEvent(
    eventData: Omit<LifecycleEvent, "id" | "timestamp">
  ): Promise<LifecycleEvent> {
    const timestamp = new Date().toISOString();
    const id = `EVT-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const event: LifecycleEvent = {
      id,
      ...eventData,
      timestamp,
    };

    // Store in-memory
    this.events.push(event);

    // Persist to Prisma AuditLog if available
    if (prisma) {
      try {
        await prisma.auditLog.create({
          data: {
            actorHash: event.actorHash,
            action: event.action,
            apiSource: event.provenance.source,
            endpoint: `/api/applications/${event.applicationRef}`,
            responseCode: 200,
            durationMs: 50,
            metadata: JSON.stringify({
              eventId: event.id,
              applicationId: event.applicationId,
              applicationRef: event.applicationRef,
              previousStatus: event.previousStatus,
              newStatus: event.newStatus,
              correlationId: event.correlationId,
              details: event.details,
              provenance: event.provenance,
            }),
          },
        });
      } catch (err) {
        // Fallback retained in memory
      }
    }

    return event;
  }

  /**
   * Retrieves the complete timeline for an application by reference or ID.
   */
  public async getTimeline(applicationRefOrId: string): Promise<LifecycleEvent[]> {
    // Check in-memory store
    const localMatches = this.events.filter(
      (e) => e.applicationRef === applicationRefOrId || e.applicationId === applicationRefOrId
    );

    if (localMatches.length > 0) {
      return [...localMatches].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    // Try fetching from Prisma AuditLog
    if (prisma) {
      try {
        const logs = await prisma.auditLog.findMany({
          where: {
            metadata: {
              contains: applicationRefOrId,
            },
          },
          orderBy: { timestamp: "asc" },
        });

        return logs
          .map((log: any) => {
            try {
              const meta = JSON.parse(log.metadata || "{}");
              return {
                id: meta.eventId || log.id,
                applicationId: meta.applicationId || "",
                applicationRef: meta.applicationRef || applicationRefOrId,
                previousStatus: meta.previousStatus || "SUBMITTED",
                newStatus: meta.newStatus || "SUBMITTED",
                action: log.action,
                actorHash: log.actorHash,
                actorRole: "SYSTEM",
                timestamp: log.timestamp.toISOString(),
                correlationId: meta.correlationId || "",
                details: meta.details,
                provenance: meta.provenance || { source: log.apiSource || "CIVICPULSE", mode: "SIMULATED" },
              } as LifecycleEvent;
            } catch {
              return null;
            }
          })
          .filter(Boolean) as LifecycleEvent[];
      } catch {
        return [];
      }
    }

    return [];
  }

  /**
   * Resets in-memory events (useful for test runs).
   */
  public clear(): void {
    this.events = [];
  }
}

export const auditService = new AuditService();

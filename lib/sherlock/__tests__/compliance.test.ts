import { describe, expect, it } from "vitest"
import { buildSherlockExportPackage, redactSensitiveFields } from "../compliance"
import { mockSherlockArtifact } from "../mock-artifact"

describe("Sherlock compliance controls", () => {
  it("redacts sensitive fields and common sensitive string patterns", () => {
    const redacted = redactSensitiveFields({
      email: "candidate@example.com",
      summary: "Reach me at candidate@example.com or +1 (555) 123-4567.",
      nested: {
        apiKey: "sk-test-secret",
        note: "SSN 123-45-6789",
      },
    })

    expect(redacted.email).toBe("[REDACTED]")
    expect(redacted.summary).toContain("[REDACTED_EMAIL]")
    expect(redacted.summary).toContain("[REDACTED_PHONE]")
    expect(redacted.nested.apiKey).toBe("[REDACTED]")
    expect(redacted.nested.note).toContain("[REDACTED_ID]")
  })

  it("builds a redacted evidence-only export package with disclosure, source policy, and audit trail", () => {
    const exportPackage = buildSherlockExportPackage({
      ...mockSherlockArtifact,
      candidate: {
        ...mockSherlockArtifact.candidate,
        handles: [
          ...mockSherlockArtifact.candidate.handles,
          {
            source: "Email",
            value: "candidate@example.com",
            confidence: "low",
          },
        ],
      },
    })

    expect(exportPackage.controls.evidenceOnlyOutput).toBe(true)
    expect(exportPackage.controls.humanDecisionRequired).toBe(true)
    expect(exportPackage.candidateDisclosure.text).toContain("does not create a candidate score")
    expect(exportPackage.sourcePolicy.length).toBeGreaterThan(0)
    expect(exportPackage.auditTrail.length).toBeGreaterThan(0)
    expect(JSON.stringify(exportPackage)).not.toContain("candidate@example.com")
  })
})

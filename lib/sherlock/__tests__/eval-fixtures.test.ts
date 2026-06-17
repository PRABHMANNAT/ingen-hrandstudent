import { describe, expect, it } from "vitest"
import fixtures from "../evals/no-score-fixtures.json"
import { assertSherlockEvidenceOnlyOutput } from "../guardrails"

describe("Sherlock no-score eval fixtures", () => {
  it("covers at least 20 evidence-only scenarios", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(20)
  })

  it("keeps every expected output free of prohibited decision fields and language", () => {
    for (const fixture of fixtures) {
      const result = assertSherlockEvidenceOnlyOutput(fixture.output)
      expect(result, fixture.id).toEqual({ ok: true })
      expect(fixture.output.humanReviewRequired, fixture.id).toBe(true)
    }
  })
})

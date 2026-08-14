import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  determineResidency,
  type AssessmentYear,
  type ResidencyInput,
} from "@/lib/residency";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Residential Status Determinator — India Income Tax" },
      {
        name: "description",
        content:
          "Determine an individual's residential status (ROR / RNOR / NR) under the Income-tax Act, 1961 for AY 2026-27 and the Income-tax Act, 2025 for AY 2027-28.",
      },
      { property: "og:title", content: "Residential Status Determinator — India Income Tax" },
      {
        property: "og:description",
        content:
          "Determine an individual's residential status (ROR / RNOR / NR) under the Income-tax Act, 1961 for AY 2026-27 and the Income-tax Act, 2025 for AY 2027-28.",
      },
    ],
  }),
  component: Index,
});

const defaults: ResidencyInput = {
  assessmentYear: "AY 2026-27",
  isIndianCitizen: true,
  isPIO: false,
  leavingForEmployment: false,
  crewOfIndianShip: false,
  visitingIndia: false,
  indianIncome: 0,
  liableToTaxAbroad: false,
  daysCurrentFY: 0,
  daysPrev4FY: 0,
  daysPrev7FY: 0,
  nonResidentYearsInPrev10: 0,
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      {children}
    </label>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary p-1">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            value === v
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

const numberInput =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function Index() {
  const [input, setInput] = useState<ResidencyInput>(defaults);
  

  const set = <K extends keyof ResidencyInput>(key: K, value: ResidencyInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(() => determineResidency(input), [input]);

  const badgeTone =
    result.finalResidentialStatus === "ROR"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : result.finalResidentialStatus === "RNOR"
        ? "bg-accent text-accent-foreground border-border"
        : "bg-secondary text-secondary-foreground border-border";

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary">
        <div className="mx-auto max-w-5xl px-5 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            India Direct Tax · Individuals
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            Residential Status Determinator
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80">
            Section-mapped determination of ROR / RNOR / Non-Resident status under the
            Income-tax Act, 1961 (AY 2026-27) and the Income-tax Act, 2025 (AY 2027-28),
            with a complete statutory reasoning chain.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[1.1fr_1fr]">
        <section className="min-w-0 space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">

          <div className="space-y-2">
            <span className="block text-sm font-medium text-foreground">Assessment Year</span>
            <div className="grid grid-cols-2 gap-2">
              {(["AY 2026-27", "AY 2027-28"] as AssessmentYear[]).map((ay) => (
                <button
                  key={ay}
                  type="button"
                  onClick={() => set("assessmentYear", ay)}
                  className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                    input.assessmentYear === ay
                      ? "border-ring bg-accent"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <span className="block text-sm font-semibold text-foreground">{ay}</span>
                  <span className="block text-xs text-muted-foreground">
                    {ay === "AY 2026-27"
                      ? "FY 2025-26 · Income-tax Act, 1961"
                      : "FY 2026-27 · Income-tax Act, 2025"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Citizen of India?">
              <Toggle value={input.isIndianCitizen} onChange={(v) => set("isIndianCitizen", v)} />
            </Field>
            <Field label="Person of Indian Origin (PIO)?">
              <Toggle value={input.isPIO} onChange={(v) => set("isPIO", v)} />
            </Field>
            <Field label="Left India for employment abroad?">
              <Toggle
                value={input.leavingForEmployment}
                onChange={(v) => set("leavingForEmployment", v)}
              />
            </Field>
            <Field label="Crew member of an Indian ship?">
              <Toggle value={input.crewOfIndianShip} onChange={(v) => set("crewOfIndianShip", v)} />
            </Field>
            <Field label="Citizen/PIO abroad visiting India?">
              <Toggle value={input.visitingIndia} onChange={(v) => set("visitingIndia", v)} />
            </Field>
            <Field label="Liable to tax in another country?">
              <Toggle
                value={input.liableToTaxAbroad}
                onChange={(v) => set("liableToTaxAbroad", v)}
              />
            </Field>
          </div>

          <Field
            label="Total income other than income from foreign sources (₹)"
            hint="Threshold for the 120-day rule and deemed residency: ₹15,00,000."
          >
            <input
              type="number"
              min={0}
              className={numberInput}
              value={input.indianIncome}
              onChange={(e) => set("indianIncome", Number(e.target.value) || 0)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Days in India — relevant FY (D₀)">
              <input
                type="number"
                min={0}
                max={366}
                className={numberInput}
                value={input.daysCurrentFY}
                onChange={(e) => set("daysCurrentFY", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Days in India — 4 preceding FYs">
              <input
                type="number"
                min={0}
                className={numberInput}
                value={input.daysPrev4FY}
                onChange={(e) => set("daysPrev4FY", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Days in India — 7 preceding FYs">
              <input
                type="number"
                min={0}
                className={numberInput}
                value={input.daysPrev7FY}
                onChange={(e) => set("daysPrev7FY", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Non-resident years in 10 preceding FYs">
              <input
                type="number"
                min={0}
                max={10}
                className={numberInput}
                value={input.nonResidentYearsInPrev10}
                onChange={(e) => set("nonResidentYearsInPrev10", Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Determine status
            </button>
            <button
              type="button"
              onClick={() => setInput(defaults)}
              className="rounded-lg border border-input bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="min-w-0 space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {result.assessmentYear} · {result.financialYear}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{result.applicableAct}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${badgeTone}`}
              >
                {result.finalResidentialStatus}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {result.statusDescription}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {result.taxabilityImpact}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.applicableStatutorySections.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Reasoning chain
            </h3>
            <ol className="mt-3 space-y-3">
              {result.reasoningChain.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 break-words">{r}</span>
                </li>
              ))}
            </ol>
          </div>


          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Informational tool only. Determination is based on the inputs supplied and does not
            constitute professional tax advice.
          </p>
        </section>
      </div>
    </main>
  );
}

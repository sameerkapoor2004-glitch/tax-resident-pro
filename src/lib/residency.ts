export type AssessmentYear = "AY 2026-27" | "AY 2027-28";

export interface ResidencyInput {
  assessmentYear: AssessmentYear;
  isIndianCitizen: boolean;
  isPIO: boolean;
  leavingForEmployment: boolean;
  crewOfIndianShip: boolean;
  visitingIndia: boolean;
  indianIncome: number; // total income other than income from foreign sources (INR)
  liableToTaxAbroad: boolean;
  daysCurrentFY: number; // D0
  daysPrev4FY: number; // sum D-1..D-4
  daysPrev7FY: number; // sum D-1..D-7
  nonResidentYearsInPrev10: number; // count of NR years among FY-1..FY-10
}

export interface ResidencyResult {
  assessmentYear: AssessmentYear;
  financialYear: string;
  applicableAct: string;
  finalResidentialStatus: "ROR" | "RNOR" | "NR";
  statusDescription: string;
  taxabilityImpact: string;
  reasoningChain: string[];
  applicableStatutorySections: string[];
}

const INCOME_THRESHOLD = 1_500_000;

const ACT_MAP = {
  "AY 2026-27": {
    financialYear: "FY 2025-26",
    act: "Income-tax Act, 1961",
    basic: "Section 6(1)",
    basicA: "Section 6(1)(a)",
    basicC: "Section 6(1)(c)",
    deemed: "Section 6(1A)",
    nor: "Section 6(6)",
    norA: "Section 6(6)(a)",
    norC: "Section 6(6)(c)",
  },
  "AY 2027-28": {
    financialYear: "FY 2026-27",
    act: "Income-tax Act, 2025",
    basic: "Section 6(1) / 6(2)",
    basicA: "Section 6(1)",
    basicC: "Section 6(2)",
    deemed: "Section 6(7)",
    nor: "Section 6(13)",
    norA: "Section 6(13)(a)",
    norC: "Section 6(13)(c)",
  },
} as const;

const TAXABILITY = {
  ROR: "Global income is taxable in India — income accruing, arising or received anywhere in the world is chargeable to tax.",
  RNOR: "Global income is not taxable in India. Only Indian-sourced income and income from a business controlled in / profession set up in India are taxable.",
  NR: "Only income received, accruing or arising in India (or deemed to do so) is taxable in India. Foreign income is outside the Indian tax net.",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function determineResidency(input: ResidencyInput): ResidencyResult {
  const m = ACT_MAP[input.assessmentYear];
  const reasoningChain: string[] = [];
  const sections: string[] = [];
  const highIncome = input.indianIncome > INCOME_THRESHOLD;
  const D0 = input.daysCurrentFY;

  const isCitizenOrPIO = input.isIndianCitizen || input.isPIO;
  const leaverException =
    input.isIndianCitizen && (input.leavingForEmployment || input.crewOfIndianShip);
  const visitorException = isCitizenOrPIO && input.visitingIndia;

  // STEP 1 — Basic conditions
  let isResidentStep1 = false;
  let residentVia120 = false;

  if (D0 >= 182) {
    isResidentStep1 = true;
    reasoningChain.push(
      `Basic Condition 1 satisfied under ${m.basicA}: stay in India during ${m.financialYear} was ${D0} days (≥ 182 days).`,
    );
    sections.push(m.basicA);
  } else if (leaverException) {
    reasoningChain.push(
      `Indian citizen leaving India ${input.leavingForEmployment ? "for the purpose of employment outside India" : "as a member of the crew of an Indian ship"} — the 60-day limb of Basic Condition 2 is inapplicable; only the 182-day test applies. Stay of ${D0} days does not meet it.`,
    );
  } else {
    const threshold = visitorException ? (highIncome ? 120 : 182) : 60;
    if (visitorException) {
      reasoningChain.push(
        highIncome
          ? `Indian Citizen/PIO visiting India with income other than foreign-source income of ${inr(input.indianIncome)} (> ${inr(INCOME_THRESHOLD)}): the 60-day limb is substituted with 120 days.`
          : `Indian Citizen/PIO visiting India with income other than foreign-source income of ${inr(input.indianIncome)} (≤ ${inr(INCOME_THRESHOLD)}): the 60-day limb is substituted with 182 days.`,
      );
    }
    if (D0 >= threshold && input.daysPrev4FY >= 365) {
      isResidentStep1 = true;
      residentVia120 = visitorException && highIncome && D0 >= 120 && D0 < 182;
      reasoningChain.push(
        `Basic Condition 2 satisfied under ${m.basicC}: stay of ${D0} days (≥ ${threshold} days) in ${m.financialYear} and ${input.daysPrev4FY} days (≥ 365 days) in the 4 preceding financial years.`,
      );
      sections.push(m.basicC);
    } else {
      reasoningChain.push(
        `Basic Condition 2 not satisfied: stay of ${D0} days (threshold ${threshold} days) with ${input.daysPrev4FY} days in the 4 preceding financial years (threshold 365 days).`,
      );
    }
  }

  // STEP 2 — Deemed residency
  let deemedResident = false;
  if (!isResidentStep1) {
    deemedResident = input.isIndianCitizen && highIncome && !input.liableToTaxAbroad;
    if (deemedResident) {
      reasoningChain.push(
        `Deemed resident under ${m.deemed}: Indian citizen, income other than income from foreign sources of ${inr(input.indianIncome)} exceeds ${inr(INCOME_THRESHOLD)}, and not liable to tax in any other country or territory by reason of domicile, residence or any similar criterion.`,
      );
      sections.push(m.deemed);
    } else {
      reasoningChain.push(
        `Deemed residency under ${m.deemed} not attracted (requires Indian citizenship + income > ${inr(INCOME_THRESHOLD)} + no tax liability abroad).`,
      );
    }
  }

  if (!isResidentStep1 && !deemedResident) {
    reasoningChain.push("Neither the basic conditions nor deemed residency are satisfied.");
    return {
      assessmentYear: input.assessmentYear,
      financialYear: m.financialYear,
      applicableAct: m.act,
      finalResidentialStatus: "NR",
      statusDescription: "Non-Resident",
      taxabilityImpact: TAXABILITY.NR,
      reasoningChain,
      applicableStatutorySections: sections.length ? sections : [m.basic],
    };
  }

  // STEP 3 — ROR vs RNOR
  const norReasons: string[] = [];
  if (deemedResident) {
    norReasons.push(
      `A deemed resident is always Resident but Not Ordinarily Resident (${m.nor} read with ${m.deemed}).`,
    );
    sections.push(m.nor);
  } else {
    if (input.nonResidentYearsInPrev10 >= 9) {
      norReasons.push(
        `Non-resident in ${input.nonResidentYearsInPrev10} out of the 10 preceding financial years (${m.norA}).`,
      );
      sections.push(m.norA);
    }
    if (input.daysPrev7FY <= 729) {
      norReasons.push(
        `Stay in India during the 7 preceding financial years was ${input.daysPrev7FY} days (≤ 729 days) (${m.nor}).`,
      );
      sections.push(m.nor);
    }
    if (residentVia120) {
      norReasons.push(
        `Indian Citizen/PIO visiting India with income > ${inr(INCOME_THRESHOLD)} who became resident via the 120-day threshold (stay of ${D0} days, between 120 and 181 days) (${m.norC}).`,
      );
      sections.push(m.norC);
    }
  }

  if (norReasons.length) {
    reasoningChain.push(...norReasons);
    return {
      assessmentYear: input.assessmentYear,
      financialYear: m.financialYear,
      applicableAct: m.act,
      finalResidentialStatus: "RNOR",
      statusDescription: "Resident but Not Ordinarily Resident",
      taxabilityImpact: TAXABILITY.RNOR,
      reasoningChain,
      applicableStatutorySections: [...new Set(sections)],
    };
  }

  reasoningChain.push(
    `No condition under ${m.nor} is satisfied — resident in at least 2 of the 10 preceding financial years and stay of ${input.daysPrev7FY} days (> 729 days) in the 7 preceding financial years.`,
  );
  return {
    assessmentYear: input.assessmentYear,
    financialYear: m.financialYear,
    applicableAct: m.act,
    finalResidentialStatus: "ROR",
    statusDescription: "Resident and Ordinarily Resident",
    taxabilityImpact: TAXABILITY.ROR,
    reasoningChain,
    applicableStatutorySections: [...new Set(sections)],
  };
}

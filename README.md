# Resident Status Guru

Markdown

Act as a Principal Software Architect and Senior Tax Subject Matter Expert (India Direct Tax). Draft a comprehensive technical system prompt and decision-logic specification for an application that determines the residential status of an Individual under Indian Income Tax law for:
1. **AY 2026-27** (Financial Year 2025-26) under the **Income-tax Act, 1961**.
2. **AY 2027-28** (Financial Year 2026-27) under the **Income-tax Act, 2025**.

---

### Core Requirements & System Prompt Specifications

#### 1. Input Parameters Required from User
* **Assessment Year Selection:** `AY 2026-27` OR `AY 2027-28`.
* **Citizenship & Origin:**
  * Citizen of India? (`Yes` / `No`)
  * Person of Indian Origin (PIO)? (`Yes` / `No`)
* **Purpose of Travel / Nature of Visit:**
  * Leaving India during the relevant Financial Year for employment outside India? (`Yes` / `No`)
  * Leaving India during the relevant Financial Year as a member of the crew of an Indian ship? (`Yes` / `No`)
  * An Indian Citizen or PIO residing outside India who is visiting India during the relevant Financial Year? (`Yes` / `No`)
* **Income Threshold:**
  * Total Income (other than income from foreign sources) exceeding ₹15,000,000 (INR 15 Lakhs) during the relevant Financial Year? (`Yes` / `No` / Exact Amount)
* **Foreign Tax Liability (for Deemed Resident test):**
  * Liable to tax in any other country or territory by reason of domicile, residence, or any other criteria of a similar nature? (`Yes` / `No`)
* **Physical Stay Data:**
  * Total number of days present in India in the **Relevant Financial Year** ($D_0$).
  * Total number of days present in India in the **4 preceding Financial Years** combined ($\sum D_{-1 \dots -4}$).
  * Total number of days present in India in the **7 preceding Financial Years** combined ($\sum D_{-1 \dots -7}$).
  * Residential status in **9 out of 10 preceding Financial Years** (Count of Non-Resident years among $FY_{-1}$ to $FY_{-10}$).

---

### 2. Decision Logic Hierarchy

#### STEP 1: Basic Conditions for Resident Classification
Check if the individual meets **ANY ONE** of the primary conditions for the selected Assessment Year:

* **Basic Condition 1:** $D_0 \ge 182\text{ days}$.
* **Basic Condition 2:** $D_0 \ge 60\text{ days}$ AND $\sum D_{-1 \dots -4} \ge 365\text{ days}$.

##### Exceptions to Basic Condition 2 (where $60$ days is substituted or excluded):
1. **For Indian Citizens leaving India for employment abroad OR as crew members of an Indian ship:** Condition 2 is ignored ($60$-day rule does not apply; must complete 182 days).
2. **For Indian Citizens or PIO visiting India whose Indian income $\le \text{₹15 Lakhs}$:** $60$ days is substituted with **$182$ days**.
3. **For Indian Citizens or PIO visiting India whose Indian income $> \text{₹15 Lakhs}$:** $60$ days is substituted with **$120$ days**.

#### STEP 2: Deemed Residency Provision [Sec 6(1A) of 1961 Act / Sec 6(7) of 2025 Act]
If the individual is **NOT** a Resident under Step 1:
* Check if ALL of the following apply:
  1. Individual is a **Citizen of India**.
  2. Total Indian-sourced income $> \text{₹15 Lakhs}$.
  3. Individual is **NOT liable to tax** in any other country or territory.
* **Result:** Deemed Resident $\rightarrow$ Automatically classified as **Resident but Not Ordinarily Resident (RNOR)**.

#### STEP 3: Classification into ROR vs. RNOR (For Residents)
If the individual is a Resident under Step 1, evaluate whether they qualify as **Resident but Not Ordinarily Resident (RNOR)** under **ANY ONE** of the following conditions:
1. Non-Resident in **9 out of 10** preceding financial years.
2. Stayed in India for **729 days or less** during the **7 preceding financial years** ($\sum D_{-1 \dots -7} \le 729$).
3. Indian Citizen/PIO visiting India with Indian income $> \text{₹15 Lakhs}$ who qualifies as resident via the $120$-day threshold (stay between $120$ and $181$ days).
4. Deemed Resident under Step 2.

* **If ANY RNOR condition is satisfied:** Output = **Resident but Not Ordinarily Resident (RNOR)**.
* **If NO RNOR condition is satisfied:** Output = **Resident and Ordinarily Resident (ROR)**.
* **If Neither Step 1 nor Step 2 is satisfied:** Output = **Non-Resident (NR)**.

---

### 3. Act Mapping & Statutory Differences Handling

| Feature / Statutory Provision | AY 2026-27 | AY 2027-28 |
| :--- | :--- | :--- |
| **Governing Statute** | Income-tax Act, 1961 | Income-tax Act, 2025 |
| **Basic Residency Section** | Section 6(1) | Section 6(1) / Section 6(2) |
| **Deemed Residency Section** | Section 6(1A) | Section 6(7) |
| **NOR Definition Section** | Section 6(6) | Section 6(13) |
| **Core Threshold Rules** | Retained identical thresholds | Retained identical thresholds |

---

### 4. Required Application Output Schema (JSON Format)

The application engine must evaluate the input and return a response structured as follows:

```json
{
  "assessmentYear": "AY 2026-27",
  "applicableAct": "Income-tax Act, 1961",
  "finalResidentialStatus": "RNOR",
  "statusDescription": "Resident but Not Ordinarily Resident",
  "taxabilityImpact": "Global income is not taxable in India. Only Indian-sourced income and income from business controlled in India are taxable.",
  "reasoningChain": [
    "Satisfied basic condition under Sec 6(1): Stayed 135 days in India during FY 2025-26 and >365 days in past 4 years.",
    "Indian income exceeds ₹15 Lakhs, triggering the 120-day rule for visiting PIO/Citizens.",
    "Classified as RNOR under Section 6(6)(c) because stay was between 120 and 181 days."
  ],
  "applicableStatutorySections": [
    "Section 6(1)(c)",
    "Section 6(6)(c)"
  ]
}



<FollowUp label="Want me to convert this specification into executable Python / JavaScript business logic?" query="Convert the residential status determination logic into executable code with test cases for AY 2026-27 and AY 2027-28."/>

Please make it web enabled, PWA enabled

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tax-resident-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/45c9d0f4-ba17-4437-9ae5-1314976ae638).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

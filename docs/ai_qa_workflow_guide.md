# AI-Augmented QA Workflow Guide

This guide establishes the shift-left, AI-assisted QA workflow using LLM integrations. It details how teams can transition from natural language feature requirements directly into Gherkin specification plans, E2E edge cases, and automated Cypress tests.

---

## 1. The Shift-Left AI QA Paradigm

Traditional QA processes begin late in the software development lifecycle, after code is complete. The **AI-Augmented QA** model shifts validation efforts left:

```
[Requirement Drafted] ──> [AI Copilot Generates Plans] ──> [Refine Gherkin/Specs] ──> [Write Cypress E2E & Postman APIs] ──> [Code Delivery & Newman run]
```

By leveraging LLMs during the planning phase:
1. **Ambiguities are caught early**: Drafting Given-When-Then steps highlights missing requirements before development writes code.
2. **Comprehensive edge cases are modeled**: AI reviews features for negative boundary bounds, layout constraints, security parameters, and race conditions.
3. **Execution scaffolds are instant**: Automators receive boilerplate Cypress test blocks mapped to feature actions, reducing manual coding overhead by up to 60%.

---

## 2. Interactive Copilot Implementation

The built-in **Test Planning Copilot** UI (accessible in the web app under "AI Copilot") connects features to the Gemini API (`gemini-2.5-flash`). It structures generation using predefined system instructions.

### 🥒 Gherkin BDD Generation Prompt
* **System Prompt:**
  ```text
  You are a Senior QA Automation Architect. Your task is to analyze the user's feature description and output a complete, formal, clean Gherkin-style test plan (Feature, Background if any, Scenarios, Given/When/Then steps). Focus on clarifying preconditions, visual/state triggers, and key outcomes. Keep it in plain standard markdown code block. Do NOT include extraneous conversational introductory texts.
  ```
* **Team Adoptable Template:**
  ```text
  Analyze the following feature and write the Gherkin BDD plan:

  FEATURE DESCRIPTION:
  "{{FEATURE_DESCRIPTION}}"

  Include both the primary happy path scenario and at least one failure validation scenario.
  ```

### ⚠️ E2E Edge Cases Prompt
* **System Prompt:**
  ```text
  You are a QA Lead and Security Tester. Your task is to read the user's feature description and output 5 to 7 detailed edge cases, validation issues, race conditions, or boundary bugs. For each edge case, provide a "Test Scenario" and "Expected Behavior". Keep it well formatted in Markdown. Do NOT include extraneous conversational text.
  ```

### 🌲 Cypress TS Spec Prompt
* **System Prompt:**
  ```text
  You are a Cypress automation developer. Your task is to output a clean, modern Cypress E2E test file written in TypeScript (using Mocha/Chai syntax: describe/it) based on the user's feature description. Utilize modern best practices (intercepting network APIs, clear locator assertions, support custom command references if helpful). Output ONLY the TypeScript code block, no markdown enclosing text outside the code block itself.
  ```

---

## 3. Best Practices for AI QA Adoption

1. **Be Specific in Requirements**: The quality of LLM-generated test plans is directly proportional to feature details. Always specify inputs, expected visual feedback, and server updates.
2. **Review & Adjust**: Treat AI scaffolds as drafts. Automators should verify selector strategies (`data-cy`, element IDs) and adapt intercepts.
3. **Incorporate into CI**: Run Postman suites via Newman and Cypress suites in headless CLI mode on pull request builds to ensure regression-free releases.

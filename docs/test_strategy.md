# Test Strategy & Demo Walkthrough

This document defines the verification strategy for the AI-Augmented QA Demo application. It includes test architecture blueprints, configuration variables, and command-line steps to run E2E and API regression runs.

---

## 1. System Under Test (SUT) Details

The target SUT is a Node-based dashboard application incorporating:
* **Authentication**: Simulated token validation on endpoints.
* **Profile Management**: Profile image upload (multipart forms) processed via an HTML5 canvas crop tool.
* **Tasks Workspace**: CRUD API backend coupled with a drag-and-move Kanban client.

---

## 2. Test Execution Layers

### 🌲 E2E UI Automation (Cypress + TypeScript)
* **Goal**: Validate actual user interaction workflows, canvas coordinate movements, mouse-drag panning, and DOM rendering.
* **Framework**: Cypress 13 using TypeScript (`cypress/e2e/*.cy.ts`).
* **Configurations**:
  * Root path: [cypress.config.ts](file:///d:/Learning/cypress.config.ts)
  * Target Server: `http://localhost:3000`
  * Support file: [e2e.ts](file:///d:/Learning/cypress/support/e2e.ts)
  * Custom commands: [commands.ts](file:///d:/Learning/cypress/support/commands.ts)

### ✉️ API Integration Automation (Postman + Newman)
* **Goal**: Validate backend JSON contract integrity, status codes, schemas, and clean state deletion without opening browser engines.
* **Framework**: Postman Collections run via Newman CLI runner.
* **Configurations**:
  * Run script: [run-newman.js](file:///d:/Learning/postman/run-newman.js)
  * Collection: [api-validation.postman_collection.json](file:///d:/Learning/postman/collections/api-validation.postman_collection.json)
  * Environment: [api-validation.postman_environment.json](file:///d:/Learning/postman/collections/api-validation.postman_environment.json)
  * Reports output: `postman/reports/newman-api-report.html`

---

## 3. Step-by-Step Execution Guide

Follow these steps to spin up the environment and execute test validations locally:

### Step 1: Start the SUT Server
Launches the Express server on port 3000. Keep this shell open.
```bash
npm start
```
*App is active at:* `http://localhost:3000`

### Step 2: Execute Cypress E2E Tests
Run E2E tests headlessly in terminal:
```bash
npx cypress run
```
To open the interactive Cypress dashboard workspace:
```bash
npx cypress open
```

### Step 3: Execute Postman API Suite via Newman
Run automated REST validation. Generates the premium HTML summary:
```bash
npm run test:api
```

---

## 4. Automation Artifacts & Verification Results
* **Newman HTML Report**: Look in `postman/reports/newman-api-report.html` for details on request headers, responses, execution time, and passing assertions.
* **Cypress Screenshots**: Created automatically inside `cypress/screenshots/` if a test fails during headless execution.

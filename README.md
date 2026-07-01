# AI-Augmented QA & Test Planning Copilot Workspace

This workspace demonstrates a modern shift-left AI-Augmented QA framework incorporating an interactive web SUT (System Under Test), a Cypress TypeScript E2E suite, Postman validation scripts executed via Newman, and a built-in Gemini LLM Test Planning Copilot.

---

## ⚡ Framework Architecture

```
                       ┌───────────────────────────┐
                       │   System Under Test (SUT) │
                       │    (Express Port 3000)    │
                       └─────────────┬─────────────┘
                                     │
             ┌───────────────────────┼───────────────────────┐
             ▼                       ▼                       ▼
┌─────────────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│  AI Test Copilot UI     │ │  Cypress E2E    │ │  Newman REST API        │
│  (Gherkin, Edge Cases)  │ │  (TypeScript)   │ │  (Postman Runner)       │
└─────────────────────────┘ └─────────────────┘ └─────────────────────────┘
```

---

## 🚀 Key Features Under Test

1. **Authentication (SUT Login)**: Sleek glassmorphic card credentials checking with validation toast alerts.
2. **Profile Photo Canvas Editor**: Interactive crop canvas with drag-to-pan, range slider zoom, and relative coordinate save triggers.
3. **Tasks Kanban Board**: CRUD database integration displaying card columns, status changes, and card deletes.
4. **AI QA Copilot Sandbox**: Dynamic test suite planning playground converting description prompts into Given-When-Then Gherkin, boundary Edge Cases, or Cypress TypeScript spec scaffolds.

---

## 📁 Repository Map

* `cypress/e2e/`: TypeScript specs checking auth, profile upload, and Kanban CRUD.
* `demo-app/`: Express application serve script and static HTML/CSS/JS frontend.
* `postman/`: Postman collection JSON & the programmatic Newman report generator script.
* `prompts/`: Standard prompt templates for team QA BDD generations.
* `docs/`: In-depth [AI QA Workflow Guide](docs/ai_qa_workflow_guide.md) and [Test Strategy Document](docs/test_strategy.md).

---

## 🛠️ Step-by-Step Run Commands

### 1. Boot local server
Starts backend listening on `http://localhost:3000`:
```bash
npm start
```

### 2. Execute E2E Tests (Cypress)
Run Cypress tests headlessly in the terminal:
```bash
npx cypress run
```
Or open the interactive dashboard:
```bash
npx cypress open
```

### 3. Execute API Tests (Newman)
Run REST collection checks and compile HTML dashboards:
```bash
npm run test:api
```
Reports are output to `postman/reports/newman-api-report.html`.

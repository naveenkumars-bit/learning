# AI-Augmented QA & Test Planning Copilot Workspace

This repository contains a modern, shift-left AI-Augmented QA platform containing an interactive web application (System Under Test), a Cypress TypeScript E2E test suite, a Postman API collection run via Newman, and a built-in Gemini LLM Test Planning Copilot.

Use the instructions below to set up and run this project on any system.

---

## 🛠️ Prerequisites

Before running the project, make sure the target system has the following installed:
* **Node.js** (v18.x or higher recommended)
* **Git** (for version control)
* **Web Browser** (Google Chrome or Electron for Cypress testing)

---

## ⚙️ Setup Instructions

Follow these step-by-step commands to clone and initialize the workspace:

### 1. Clone the repository
Open your terminal and run:
```bash
git clone https://github.com/naveenkumars-bit/learning.git
cd learning
```

### 2. Install dependencies
Install all required Node.js packages (Express server, Cypress, Newman, and Google GenAI SDK):
```bash
npm install
```

### 3. Configure LLM Copilot (Optional)
The Test Copilot tab uses the **Gemini 2.5 Flash** model to generate Gherkin scenarios, edge cases, and Cypress specs.
* **To enable live Gemini generations**: Create a file named `.env` in the root folder and add your key:
  ```env
  GEMINI_API_KEY=your_actual_gemini_api_token_here
  ```
* **Offline/Mock Mode**: If no `.env` file or key is supplied, the Copilot automatically runs in **simulation mode**, matching keywords (login, profile, tasks) to return realistic E2E assets. No token setup is strictly required to explore the platform.

---

## 🚀 Running the Project

The verification workspace consists of three tasks: starting the server, running Newman API scripts, and running Cypress E2E scripts.

### Step 1: Start the SUT Server
First, boot the local web application server. This hosts the frontend and the mock backend REST endpoints:
```bash
npm start
```
* **Local Web Interface**: Access the application at `http://localhost:3000`

---

### Step 2: Execute API Tests (Newman)
With the server running, open a new terminal window/tab and execute the Postman collections programmatically:
```bash
npm run test:api
```
* **Automation Reports**: Once completed, a premium HTML report is generated at:
  `postman/reports/newman-api-report.html`

---

### Step 3: Execute E2E UI Tests (Cypress)
Run the Cypress TypeScript E2E spec suite.

* **To run all specs headlessly in the terminal**:
  ```bash
  npx cypress run
  ```
* **To open the interactive Cypress Test Runner**:
  ```bash
  npx cypress open
  ```

---

## 📁 Key Project Components

* `cypress/e2e/`: Automated TS specs testing Login, Profile uploading + Canvas cropping, and Tasks Kanban CRUD.
* `demo-app/server.js`: Express REST API endpoints and Copilot LLM proxy routing.
* `postman/collections/`: Postman endpoints payload and environment settings.
* `prompts/copilot_prompts.json`: Reusable prompt templates used for AI QA generation workflows.
* `docs/`: Holds the [AI QA Workflow Guide](docs/ai_qa_workflow_guide.md) and [Test Strategy Document](docs/test_strategy.md).

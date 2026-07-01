const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static UI files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + fileExt);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpg, jpeg, png, gif, webp)'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// In-memory data stores
let tasks = [
  { id: '1', title: 'Implement Auth Page', description: 'Create beautiful login view with validation', status: 'done' },
  { id: '2', title: 'Build Profile Photo Upload', description: 'Enable file upload with canvas cropper', status: 'in-progress' },
  { id: '3', title: 'Add API Integration Tests', description: 'Run Postman collection using Newman', status: 'todo' }
];

let userProfile = {
  username: 'QA_Engineer',
  email: 'qa@company.com',
  photoUrl: '/uploads/default-avatar.png',
  cropConfig: null
};

// Create a default avatar for fallback
const defaultAvatarPath = path.join(uploadDir, 'default-avatar.png');
if (!fs.existsSync(defaultAvatarPath)) {
  // Create a simple blank dummy image or we will serve a standard SVG/placeholder
  fs.writeFileSync(defaultAvatarPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
}

// --- REST API ENDPOINTS ---

// Auth Login API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  // Simple hardcoded mock credentials for QA testing
  if (username === 'admin' && password === 'password123') {
    return res.json({
      success: true,
      message: 'Login successful',
      token: 'jwt-mock-token-xyz123',
      user: { username: 'admin', email: 'admin@testing.com' }
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

// Profile Photo Upload API
app.post('/api/profile/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const relativePath = '/uploads/' + req.file.filename;
  res.json({
    success: true,
    message: 'File uploaded successfully',
    photoUrl: relativePath,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size
  });
});

// Profile Save API (with crop coords)
app.post('/api/profile/save', (req, res) => {
  const { photoUrl, x, y, width, height, zoom } = req.body;
  
  if (!photoUrl) {
    return res.status(400).json({ success: false, message: 'Photo URL is required' });
  }

  userProfile.photoUrl = photoUrl;
  userProfile.cropConfig = { x, y, width, height, zoom };

  res.json({
    success: true,
    message: 'Profile photo saved and cropped successfully',
    profile: userProfile
  });
});

// Profile Get API
app.get('/api/profile', (req, res) => {
  res.json({ success: true, profile: userProfile });
});

// Tasks GET API
app.get('/api/tasks', (req, res) => {
  res.json({ success: true, tasks });
});

// Database reset endpoint for E2E isolation
app.post('/api/tasks/reset', (req, res) => {
  tasks = [
    { id: '1', title: 'Implement Auth Page', description: 'Create beautiful login view with validation', status: 'done' },
    { id: '2', title: 'Build Profile Photo Upload', description: 'Enable file upload with canvas cropper', status: 'in-progress' },
    { id: '3', title: 'Add API Integration Tests', description: 'Run Postman collection using Newman', status: 'todo' }
  ];
  userProfile = {
    username: 'QA_Engineer',
    email: 'qa@company.com',
    photoUrl: '/uploads/default-avatar.png',
    cropConfig: null
  };
  res.json({ success: true, message: 'Database reset successfully' });
});

// Tasks POST API
app.post('/api/tasks', (req, res) => {
  const { title, description, status } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Task title is required' });
  }

  const newTask = {
    id: Date.now().toString(),
    title,
    description: description || '',
    status: status || 'todo'
  };

  tasks.push(newTask);
  res.status(201).json({ success: true, message: 'Task created successfully', task: newTask });
});

// Tasks PATCH API
app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const updatedTask = {
    ...tasks[taskIndex],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(status !== undefined && { status })
  };

  tasks[taskIndex] = updatedTask;
  res.json({ success: true, message: 'Task updated successfully', task: updatedTask });
});

// Tasks DELETE API
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.json({ success: true, message: 'Task deleted successfully', task: deletedTask });
});

// --- AI COPILOT ENDPOINT ---

// Helper for Mock AI generations (Fallback when GEMINI_API_KEY is not set)
function generateMockResponse(prompt, mode) {
  const isProfile = /profile|photo|crop|upload/i.test(prompt);
  const isAuth = /login|auth|password|credentials/i.test(prompt);
  const isTasks = /task|todo|kanban|list/i.test(prompt);

  if (mode === 'gherkin') {
    if (isProfile) {
      return `Feature: Profile Photo Cropping and Upload
  As an active user
  I want to upload, zoom, and crop my profile photo
  So that my avatar displays exactly how I want on my profile page

  Scenario: Successfully upload, crop, and save a profile image
    Given the user is logged into the application
    And the user is on the profile edit page
    When the user selects a valid JPEG image file "avatar.jpg"
    Then the image should load into the crop canvas viewport
    And the zoom slider should be set to 1.0 by default
    When the user drags the crop selection bounding box to coordinates x=50, y=50, w=150, h=150
    And the user clicks the "Save Profile" button
    Then the cropped avatar should be saved to the database
    And the server should return a 200 success response
    And the UI should display the updated avatar preview`;
    }
    if (isAuth) {
      return `Feature: User Authentication
  As a registered user
  I want to log in using my credentials
  So that I can access my personalized workspace

  Scenario: Successful login with valid credentials
    Given the user is on the login page
    When the user enters username "admin" and password "password123"
    And the user clicks the "Log In" button
    Then the system should authenticate the user successfully
    And store the authentication token in sessionStorage
    And redirect the user to the dashboard workspace`;
    }
    if (isTasks) {
      return `Feature: Task CRUD Operations
  As a workspace manager
  I want to create, update, and delete tasks
  So that I can organize my project delivery schedule

  Scenario: Create a new task on the board
    Given the user is on the tasks board page
    When the user clicks "Add Task" button
    And enters title "Automate E2E suite" and description "Configure Cypress TS"
    And clicks the submit task button
    Then a new task with title "Automate E2E suite" should appear in the "Todo" column
    And the backend API should verify the task is successfully persistent`;
    }
    // Generic
    return `Feature: Custom App Feature Description
  As an application user
  I want to interact with this feature
  So that I can achieve my target workflows

  Scenario: Execute happy path workflow
    Given the user is navigated to the feature interface
    When the user executes the primary interactive step
    And clicks the confirm action button
    Then the application state should update successfully
    And the server should return a successful validation status`;
  }

  if (mode === 'edge_cases') {
    if (isProfile) {
      return `### E2E Edge Cases for Profile Photo Upload & Cropping:

1. **Unsupported File Format Upload**:
   - *Test Scenario*: User uploads an unsupported format like \`document.pdf\` or \`malicious.exe\`.
   - *Expected Behavior*: Client-side error validation triggers, preventing upload, displaying "Only images are allowed".

2. **Extremely Large File Upload**:
   - *Test Scenario*: User uploads a 50MB RAW image.
   - *Expected Behavior*: Server-side file limit (5MB) catches the upload, returning a \`413 Payload Too Large\` or validation error.

3. **Interrupted Upload / Connection Loss**:
   - *Test Scenario*: Network goes offline mid-upload.
   - *Expected Behavior*: App displays a retry/error toast gracefully instead of freezing.

4. **Zero-Width/Height Selection**:
   - *Test Scenario*: Crop box coordinates are dragged to width=0, height=0.
   - *Expected Behavior*: Save button is disabled, or crop defaults to standard full-image size.

5. **Exceeding Canvas Boundary coordinates**:
   - *Test Scenario*: Crop box coordinates dragged outside the canvas viewport boundaries.
   - *Expected Behavior*: Coordinates are automatically clamped/bound within the image pixel dimensions.`;
    }
    if (isAuth) {
      return `### E2E Edge Cases for User Authentication:

1. **Incorrect Login Credentials**:
   - *Test Scenario*: Entering "admin" and "wrongpassword".
   - *Expected Behavior*: App displays "Invalid username or password" in red alert; field clears, user is not logged in.

2. **Empty Fields Validation**:
   - *Test Scenario*: Submitting with empty username or empty password.
   - *Expected Behavior*: Form prevents submission; native HTML5 validation or custom alerts point out required inputs.

3. **Expired Session Token Retrieval**:
   - *Test Scenario*: Requesting tasks API using an invalid or expired mock JWT header.
   - *Expected Behavior*: Server responds with \`401 Unauthorized\`, client redirects to login page.

4. **SQL Injection/XSS payloads**:
   - *Test Scenario*: Typing \`admin' OR '1'='1\` or scripts in the username input.
   - *Expected Behavior*: Application parses strings literally, failing authentication cleanly without execution errors.`;
    }
    if (isTasks) {
      return `### E2E Edge Cases for Task CRUD:

1. **Adding Task with Empty Title**:
   - *Test Scenario*: Submitting empty title or spaces only.
   - *Expected Behavior*: Server returns \`400 Bad Request\`, UI highlights title input as invalid.

2. **Rapid Double-Click Submission**:
   - *Test Scenario*: User clicks "Submit Task" multiple times within milliseconds.
   - *Expected Behavior*: UI disables button on click to prevent duplicate database entry creations.

3. **Long Text Overflow Handling**:
   - *Test Scenario*: Task title is 500 characters long with no spaces.
   - *Expected Behavior*: Task card uses CSS \`word-break: break-word\` and doesn't break the layout.

4. **Deleting Task with Dependent State**:
   - *Test Scenario*: Deleting a task while it is in the middle of being updated.
   - *Expected Behavior*: Clean state update in-memory, lists reload without app crashing.`;
    }
    return `### Identified E2E Edge Cases:
1. **Invalid Input Boundaries**: Check boundaries, empty fields, and extreme inputs.
2. **Security Checks**: Validate invalid tokens, SQL scripts, and cross-site scripting inputs.
3. **Network Failure/Slow Latency**: Mock slow API responses or offline conditions.
4. **State Persistence Integrity**: Refreshing the browser mid-operation does not corrupt backend storage.`;
  }

  if (mode === 'cypress') {
    if (isProfile) {
      return `// Cypress TypeScript Happy Path Spec for Profile Photo Upload
import './support/commands';

describe('Profile Photo Upload and Cropping Spec', () => {
  beforeEach(() => {
    // Authenticate and navigate to dashboard
    cy.visit('/#login');
    cy.get('#username').type('admin');
    cy.get('#password').type('password123');
    cy.get('#login-btn').click();
    cy.get('#tab-profile').click();
  });

  it('should successfully upload an image, select crop coordinates, and save', () => {
    // Select image and trigger upload
    const fixtureFile = 'avatar.jpg';
    cy.get('#file-upload-input').attachFile(fixtureFile);

    // Verify canvas is updated and visible
    cy.get('#crop-canvas').should('be.visible');

    // Simulate adjusting crop controls
    cy.get('#zoom-slider').invoke('val', 1.5).trigger('input');
    cy.get('#zoom-value').should('contain', '1.5');

    // Click save profile photo
    cy.get('#save-profile-btn').click();

    // Verify confirmation and backend profile update
    cy.get('.toast-notification')
      .should('be.visible')
      .and('contain', 'Profile photo saved and cropped successfully');
      
    cy.get('#profile-avatar-preview')
      .should('have.attr', 'src')
      .and('include', 'profile-');
  });
});`;
    }
    if (isAuth) {
      return `// Cypress TypeScript Happy Path Spec for User Authentication
describe('Authentication Flow Spec', () => {
  beforeEach(() => {
    cy.visit('/#login');
  });

  it('should successfully log in and access the dashboard with valid credentials', () => {
    // Fill credentials
    cy.get('#username').type('admin');
    cy.get('#password').type('password123');

    // Intercept API call
    cy.intercept('POST', '/api/auth/login').as('loginReq');

    // Submit form
    cy.get('#login-btn').click();

    // Verify request status
    cy.wait('@loginReq').its('response.statusCode').should('eq', 200);

    // Verify routing and sessionStorage
    cy.url().should('include', '#dashboard');
    cy.window().then((window) => {
      expect(window.sessionStorage.getItem('authToken')).to.eq('jwt-mock-token-xyz123');
    });

    // Check greeting
    cy.get('#dashboard-greeting').should('contain', 'Welcome back, admin!');
  });
});`;
    }
    if (isTasks) {
      return `// Cypress TypeScript Happy Path Spec for Task Management
describe('Task Manager CRUD Spec', () => {
  beforeEach(() => {
    // Authenticate and navigate to dashboard
    cy.visit('/#login');
    cy.get('#username').type('admin');
    cy.get('#password').type('password123');
    cy.get('#login-btn').click();
    cy.get('#tab-tasks').click();
  });

  it('should create a task, move it, and delete it successfully', () => {
    // Create new task
    cy.get('#add-task-btn').click();
    cy.get('#task-title-input').type('Automated Cypress Test');
    cy.get('#task-desc-input').type('Write automated E2E tests for verification');
    cy.get('#save-task-btn').click();

    // Verify creation
    cy.get('.task-list[data-status="todo"]')
      .should('contain', 'Automated Cypress Test');

    // Update status to In Progress
    cy.get('.task-card').contains('Automated Cypress Test')
      .find('.btn-move-progress').click();
      
    cy.get('.task-list[data-status="in-progress"]')
      .should('contain', 'Automated Cypress Test');

    // Delete task
    cy.get('.task-card').contains('Automated Cypress Test')
      .find('.btn-delete-task').click();

    // Verify removal
    cy.get('.task-card').contains('Automated Cypress Test').should('not.exist');
  });
});`;
    }
    return `// Cypress TypeScript Scaffold
describe('Happy Path Spec', () => {
  it('performs standard workflow successfully', () => {
    cy.visit('/');
    // Add interactors here
  });
});`;
  }
}

// Generates content using Google Gen AI SDK
app.post('/api/copilot/generate', async (req, res) => {
  const { prompt, mode } = req.body;

  if (!prompt || !mode) {
    return res.status(400).json({ success: false, message: 'Prompt and mode are required' });
  }

  // System instructions for the LLM based on output mode
  let systemInstruction = "";
  if (mode === 'gherkin') {
    systemInstruction = `You are a Senior QA Automation Architect. Your task is to analyze the user's feature description and output a complete, formal, clean Gherkin-style test plan (Feature, Background if any, Scenarios, Given/When/Then steps). Focus on clarifying preconditions, visual/state triggers, and key outcomes. Keep it in plain standard markdown code block. Do NOT include extraneous conversational introductory texts.`;
  } else if (mode === 'edge_cases') {
    systemInstruction = `You are a QA Lead and Security Tester. Your task is to read the user's feature description and output 5 to 7 detailed edge cases, validation issues, race conditions, or boundary bugs. For each edge case, provide a "Test Scenario" and "Expected Behavior". Keep it well formatted in Markdown. Do NOT include extraneous conversational text.`;
  } else if (mode === 'cypress') {
    systemInstruction = `You are a Cypress automation developer. Your task is to output a clean, modern Cypress E2E test file written in TypeScript (using Mocha/Chai syntax: describe/it) based on the user's feature description. Utilize modern best practices (intercepting network APIs, clear locator assertions, support custom command references if helpful). Output ONLY the TypeScript code block, no markdown enclosing text outside the code block itself.`;
  }

  // Check if GEMINI_API_KEY is available
  if (!process.env.GEMINI_API_KEY) {
    console.log(`[Copilot] GEMINI_API_KEY environment variable is missing. Running in mock/simulation mode.`);
    const mockOutput = generateMockResponse(prompt, mode);
    // Add small delay to feel realistic
    await new Promise(resolve => setTimeout(resolve, 800));
    return res.json({
      success: true,
      provider: 'mock-simulation',
      data: mockOutput
    });
  }

  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    console.log(`[Copilot] Calling Gemini API for mode: ${mode}`);
    const apiPrompt = `${systemInstruction}\n\nUser Feature Description:\n"${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: apiPrompt,
    });

    return res.json({
      success: true,
      provider: 'gemini-2.5-flash',
      data: response.text
    });
  } catch (error) {
    console.error('[Copilot API Error]:', error);
    // Graceful fallback to mock on API errors
    const mockOutput = generateMockResponse(prompt, mode);
    return res.json({
      success: true,
      provider: 'mock-fallback-on-error',
      message: error.message,
      data: mockOutput
    });
  }
});

// Default catch-all redirects to main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` SUT and AI Copilot server running on port: ${PORT}`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});

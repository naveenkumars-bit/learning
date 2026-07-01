// Global State Management
let currentUser = null;
let apiToken = null;
let currentProfile = null;
let allTasks = [];

// Canvas Cropper State
let cropperImage = new Image();
let canvas = null;
let ctx = null;
let isDragging = false;
let startX = 0;
let startY = 0;
let imgX = 0;
let imgY = 0;
let scale = 1.0;
const cropSize = 150; // 150x150 crop box
let uploadedPhotoUrl = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupAuth();
  setupProfileEditor();
  setupTasksBoard();
  setupCopilot();
  checkServerConnection();
});

// Toast Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// Check if Server and Gemini Key are online
async function checkServerConnection() {
  const statusEl = document.getElementById('api-key-status');
  try {
    const res = await fetch('/api/profile');
    if (res.ok) {
      // Fetch profile to see if connection is ok
      const data = await res.json();
      currentProfile = data.profile;
      updateProfileUI();

      // Check if GEMINI_API_KEY is configured
      statusEl.innerHTML = "LLM Hook: Connected (Simulation mode active unless GEMINI_API_KEY is set)";
      statusEl.style.color = "var(--text-muted)";
    }
  } catch (err) {
    statusEl.innerHTML = "LLM Hook: Disconnected. Server offline.";
    statusEl.style.color = "#ef4444";
  }
}

// 1. Navigation and View Switching
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.workspace-view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-target');
      
      // Update Active Navigation Button
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle Views
      views.forEach(view => {
        if (view.id === targetView) {
          view.classList.add('active');
          // If tasks board is selected, reload tasks
          if (targetView === 'view-tasks') {
            loadTasks();
          }
        } else {
          view.classList.remove('active');
        }
      });
    });
  });
}

// 2. Authentication SUT Flow
function setupAuth() {
  const form = document.getElementById('login-form');
  const userStatus = document.getElementById('header-user-status');
  const usernameText = document.getElementById('header-username');
  
  // Restore session from sessionStorage
  const savedToken = sessionStorage.getItem('authToken');
  const savedUser = sessionStorage.getItem('username');
  
  if (savedToken && savedUser) {
    authenticateUser(savedUser, savedToken);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('authToken', data.token);
        sessionStorage.setItem('username', data.user.username);
        authenticateUser(data.user.username, data.token);
        showToast('Successfully logged in!', 'success');
      } else {
        showToast(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      showToast('Error communicating with server', 'error');
    }
  });

  function authenticateUser(username, token) {
    currentUser = username;
    apiToken = token;
    
    // Update Header Status Widget
    userStatus.querySelector('.status-dot').className = 'status-dot online';
    usernameText.textContent = `Logged in: ${username}`;

    // Enable Hidden Tabs
    document.getElementById('tab-profile').style.display = 'block';
    document.getElementById('tab-tasks').style.display = 'block';

    // Navigate to profile edit automatically
    document.getElementById('tab-profile').click();
  }
}

// 3. Profile Photo Crop and Upload Canvas logic
function setupProfileEditor() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-upload-input');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const zoomSlider = document.getElementById('zoom-slider');
  const zoomVal = document.getElementById('zoom-value');
  const btnReset = document.getElementById('btn-crop-reset');
  const btnSave = document.getElementById('save-profile-btn');

  canvas = document.getElementById('crop-canvas');
  ctx = canvas.getContext('2d');

  // Drag and Drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
      fileInput.files = files;
      handleFileSelected(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  async function handleFileSelected(file) {
    // Send upload request
    const formData = new FormData();
    formData.append('photo', file);

    try {
      showToast('Uploading profile image...', 'info');
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.success) {
        uploadedPhotoUrl = data.photoUrl;
        showToast('Image uploaded successfully! Load canvas editor.', 'success');
        
        // Load image into HTML5 Image Object
        cropperImage.onload = () => {
          resetCropper();
          dropzone.style.display = 'none';
          canvasWrapper.style.display = 'flex';
        };
        cropperImage.onerror = () => {
          console.warn("Failed to load uploaded image. Loading default avatar as fallback.");
          cropperImage.onload = () => {
            resetCropper();
            dropzone.style.display = 'none';
            canvasWrapper.style.display = 'flex';
          };
          cropperImage.src = '/uploads/default-avatar.png';
        };
        cropperImage.src = data.photoUrl;
      } else {
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('Error uploading photo', 'error');
    }
  }

  function resetCropper() {
    // Center image on Canvas
    scale = 1.0;
    zoomSlider.value = 1.0;
    zoomVal.textContent = '1.0x';
    
    // Start at center position
    imgX = (canvas.width - cropperImage.width * scale) / 2;
    imgY = (canvas.height - cropperImage.height * scale) / 2;
    
    drawCanvas();
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Image with zoom and offset
    ctx.drawImage(cropperImage, imgX, imgY, cropperImage.width * scale, cropperImage.height * scale);

    // 2. Draw Crop Bounding box overlay
    // Translucent grey fill outside crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    const cropX = (canvas.width - cropSize) / 2;
    const cropY = (canvas.height - cropSize) / 2;

    // Top box
    ctx.fillRect(0, 0, canvas.width, cropY);
    // Bottom box
    ctx.fillRect(0, cropY + cropSize, canvas.width, canvas.height - (cropY + cropSize));
    // Left box
    ctx.fillRect(0, cropY, cropX, cropSize);
    // Right box
    ctx.fillRect(cropX + cropSize, cropY, canvas.width - (cropX + cropSize), cropSize);

    // Purple bounding outline
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);
  }

  // Mouse/Touch Drag Handlers
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - imgX;
    startY = e.clientY - imgY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    imgX = e.clientX - startX;
    imgY = e.clientY - startY;
    drawCanvas();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Slider Zoom Control
  zoomSlider.addEventListener('input', (e) => {
    const oldScale = scale;
    scale = parseFloat(e.target.value);
    zoomVal.textContent = `${scale.toFixed(1)}x`;

    // Zoom from center of canvas
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    
    imgX = canvasCenterX - (canvasCenterX - imgX) * (scale / oldScale);
    imgY = canvasCenterY - (canvasCenterY - imgY) * (scale / oldScale);

    drawCanvas();
  });

  btnReset.addEventListener('click', resetCropper);

  btnSave.addEventListener('click', async () => {
    if (!uploadedPhotoUrl) return;

    // Calculate crop coordinates relative to the original image pixels
    const cropX = (canvas.width - cropSize) / 2;
    const cropY = (canvas.height - cropSize) / 2;

    const relativeX = Math.round((cropX - imgX) / scale);
    const relativeY = Math.round((cropY - imgY) / scale);
    const relativeSize = Math.round(cropSize / scale);

    try {
      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: uploadedPhotoUrl,
          x: relativeX,
          y: relativeY,
          width: relativeSize,
          height: relativeSize,
          zoom: scale
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        currentProfile = data.profile;
        updateProfileUI();
        showToast('Profile photo saved and cropped successfully!', 'success');
        
        // Return back to dropzone display state
        canvasWrapper.style.display = 'none';
        dropzone.style.display = 'block';
        fileInput.value = '';
      } else {
        showToast(data.message || 'Saving profile failed', 'error');
      }
    } catch (err) {
      showToast('Error saving profile image', 'error');
    }
  });
}

function updateProfileUI() {
  if (!currentProfile) return;
  
  // Set preview URL
  const previewImg = document.getElementById('profile-avatar-preview');
  previewImg.src = currentProfile.photoUrl;
  
  // Update name and email fields
  document.getElementById('profile-username-text').textContent = currentProfile.username;
  document.getElementById('profile-email-text').textContent = currentProfile.email;
}

// 4. Tasks Kanban Board CRUD
function setupTasksBoard() {
  const addBtn = document.getElementById('add-task-btn');
  const modal = document.getElementById('task-modal');
  const closeModal = document.getElementById('btn-close-modal');
  const taskForm = document.getElementById('task-form');

  addBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value;
    const desc = document.getElementById('task-desc-input').value;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, status: 'todo' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Task added successfully!', 'success');
        modal.style.display = 'none';
        taskForm.reset();
        loadTasks();
      } else {
        showToast(data.message || 'Error saving task', 'error');
      }
    } catch (err) {
      showToast('Error adding task to server', 'error');
    }
  });
}

async function loadTasks() {
  try {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    if (res.ok && data.success) {
      allTasks = data.tasks;
      renderTasks();
    }
  } catch (err) {
    showToast('Failed to load Kanban tasks', 'error');
  }
}

function renderTasks() {
  const lists = {
    todo: document.getElementById('list-todo'),
    'in-progress': document.getElementById('list-in-progress'),
    done: document.getElementById('list-done')
  };

  const counts = {
    todo: document.getElementById('count-todo'),
    'in-progress': document.getElementById('count-in-progress'),
    done: document.getElementById('count-done')
  };

  // Clear lists
  Object.values(lists).forEach(l => l.innerHTML = '');
  
  // Categorize
  const groups = { todo: [], 'in-progress': [], done: [] };
  allTasks.forEach(task => {
    if (groups[task.status]) {
      groups[task.status].push(task);
    }
  });

  // Render cards
  Object.entries(groups).forEach(([status, tasks]) => {
    counts[status].textContent = tasks.length;
    
    tasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.innerHTML = `
        <h5>${escapeHTML(task.title)}</h5>
        ${task.description ? `<p>${escapeHTML(task.description)}</p>` : ''}
        <div class="task-card-footer">
          <button class="btn-delete-task" data-id="${task.id}">🗑️</button>
          ${status !== 'done' ? `<button class="btn-move-progress" data-id="${task.id}" data-current="${status}">➡️ Move</button>` : ''}
        </div>
      `;

      // Event: Move task status
      const moveBtn = card.querySelector('.btn-move-progress');
      if (moveBtn) {
        moveBtn.addEventListener('click', async () => {
          const nextStatus = status === 'todo' ? 'in-progress' : 'done';
          await updateTaskStatus(task.id, nextStatus);
        });
      }

      // Event: Delete task
      card.querySelector('.btn-delete-task').addEventListener('click', async () => {
        await deleteTask(task.id);
      });

      lists[status].appendChild(card);
    });
  });
}

async function updateTaskStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      loadTasks();
    }
  } catch (err) {
    showToast('Failed to update task status', 'error');
  }
}

async function deleteTask(id) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      loadTasks();
      showToast('Task deleted successfully', 'info');
    }
  } catch (err) {
    showToast('Failed to delete task', 'error');
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// 5. Test Planning Copilot Workspace
function setupCopilot() {
  const generateBtn = document.getElementById('btn-copilot-generate');
  const spinner = document.getElementById('generate-spinner');
  const btnText = document.getElementById('generate-btn-text');
  const inputTextarea = document.getElementById('copilot-input-description');
  const outputCode = document.getElementById('copilot-output-code');
  const providerBadge = document.getElementById('output-provider-badge');
  
  const templatePills = document.querySelectorAll('.template-pill');
  const copyBtn = document.getElementById('btn-output-copy');
  const downloadBtn = document.getElementById('btn-output-download');

  // Load Prompt Template
  templatePills.forEach(pill => {
    pill.addEventListener('click', () => {
      inputTextarea.value = pill.getAttribute('data-desc');
    });
  });

  // Call Server LLM Hook
  generateBtn.addEventListener('click', async () => {
    const prompt = inputTextarea.value.trim();
    if (!prompt) {
      showToast('Please enter a feature description first!', 'error');
      return;
    }

    const mode = document.querySelector('input[name="copilot-mode"]:checked').value;

    // UI Loading State
    generateBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Analyzing Feature...';
    outputCode.textContent = '// Generating assets via LLM copilot models...';
    providerBadge.textContent = 'Generating...';

    try {
      const res = await fetch('/api/copilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        outputCode.textContent = data.data;
        providerBadge.textContent = data.provider;
        showToast('Assets generated successfully!', 'success');
      } else {
        outputCode.textContent = `// Generation failed\n${data.message || 'Unknown server error'}`;
        providerBadge.textContent = 'Error';
        showToast('Error generating AI assets', 'error');
      }
    } catch (err) {
      outputCode.textContent = `// Network error communicating with backend`;
      providerBadge.textContent = 'Network Error';
      showToast('Network error triggering copilot', 'error');
    } finally {
      generateBtn.disabled = false;
      spinner.style.display = 'none';
      btnText.textContent = 'Generate AI Assets';
    }
  });

  // Copy to Clipboard
  copyBtn.addEventListener('click', () => {
    const text = outputCode.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied content to clipboard!', 'success');
    }).catch(err => {
      showToast('Failed to copy', 'error');
    });
  });

  // Download Output File
  downloadBtn.addEventListener('click', () => {
    const text = outputCode.textContent;
    const mode = document.querySelector('input[name="copilot-mode"]:checked').value;
    
    let filename = 'ai_qa_asset';
    let mimeType = 'text/plain';
    
    if (mode === 'gherkin') {
      filename += '.feature';
    } else if (mode === 'edge_cases') {
      filename += '_edge_cases.md';
      mimeType = 'text/markdown';
    } else if (mode === 'cypress') {
      filename += '_spec.cy.ts';
      mimeType = 'text/typescript';
    }

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
    
    showToast(`Downloaded asset as: ${filename}`, 'success');
  });
}

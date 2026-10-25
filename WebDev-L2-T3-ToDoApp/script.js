(function () {
  "use strict";

  // --- State Management ---
  const STORAGE_KEY = "taskflow_pro_tasks_v1";
  let tasks = [];

  // --- DOM Elements ---
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const pendingList = document.getElementById("pending-list");
  const completedList = document.getElementById("completed-list");
  const pendingCountBadge = document.getElementById("pending-count-badge");
  const completedCountBadge = document.getElementById("completed-count-badge");
  const statsSummaryText = document.getElementById("stats-summary-text");
  const progressFill = document.getElementById("progress-fill");
  const progressPercent = document.getElementById("progress-percent");
  const btnClearCompleted = document.getElementById("btn-clear-completed");
  const btnResetAll = document.getElementById("btn-reset-all");

  // --- Format Helpers ---
  function formatTimestamp(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // --- Persistence: LocalStorage ---
  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        tasks = JSON.parse(stored);
      } else {
        // Initial seed data for immediate pleasant experience
        tasks = [
          {
            id: "task_" + Date.now() + "_1",
            text: "Review quarterly architecture roadmap and deliverables",
            completed: false,
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            completedAt: null,
          },
          {
            id: "task_" + Date.now() + "_2",
            text: "Design clean CSS3 variables and micro-interactions",
            completed: true,
            createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
            completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
        ];
        saveTasks();
      }
    } catch (err) {
      console.warn("Error reading from LocalStorage:", err);
      tasks = [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  }

  // --- UI Rendering ---
  function render() {
    pendingList.innerHTML = "";
    completedList.innerHTML = "";

    const pendingTasks = tasks.filter((t) => !t.completed);
    const completedTasks = tasks.filter((t) => t.completed);

    // Update Counter Badges
    pendingCountBadge.textContent = `${pendingTasks.length} pending`;
    completedCountBadge.textContent = `${completedTasks.length} completed`;

    // Update Overall Stats & Progress
    const total = tasks.length;
    statsSummaryText.textContent = `${total} total task${total === 1 ? "" : "s"}`;
    const pct =
      total === 0 ? 0 : Math.round((completedTasks.length / total) * 100);
    progressFill.style.width = `${pct}%`;
    progressPercent.textContent = `${pct}%`;

    // Render Pending Tasks
    if (pendingTasks.length === 0) {
      pendingList.innerHTML = `
            <div class="empty-state">
              <span class="empty-icon">🎉</span>
              <p>No pending tasks! Time to relax or create a new objective above.</p>
            </div>
          `;
    } else {
      pendingTasks.forEach((task) => {
        pendingList.appendChild(createTaskElement(task));
      });
    }

    // Render Completed Tasks
    if (completedTasks.length === 0) {
      completedList.innerHTML = `
            <div class="empty-state">
              <span class="empty-icon">⏳</span>
              <p>No completed tasks yet. Finish a task on the left to see it logged here.</p>
            </div>
          `;
    } else {
      completedTasks.forEach((task) => {
        completedList.appendChild(createTaskElement(task));
      });
    }
  }

  // --- Task DOM Builder ---
  function createTaskElement(task) {
    const card = document.createElement("div");
    card.className = `task-card animate-enter ${task.completed ? "is-completed" : ""}`;
    card.dataset.id = task.id;

    // Header / Main Row
    const mainRow = document.createElement("div");
    mainRow.className = "task-card-main";

    // Checkbox Toggle
    const checkbox = document.createElement("button");
    checkbox.className = "checkbox-btn";
    checkbox.setAttribute(
      "aria-label",
      task.completed ? "Mark task as pending" : "Mark task as complete",
    );
    checkbox.onclick = () => toggleTaskComplete(task.id, card);

    // Task Title text container
    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.textContent = task.text;

    // Action Buttons
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "task-actions";

    // Edit Button (only if not completed)
    if (!task.completed) {
      const editBtn = document.createElement("button");
      editBtn.className = "btn-icon btn-edit";
      editBtn.title = "Edit task";
      editBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          `;
      editBtn.onclick = () => handleEditTask(task.id, titleSpan, editBtn);
      actionsWrap.appendChild(editBtn);
    }

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon btn-delete";
    deleteBtn.title = "Delete task";
    deleteBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        `;
    deleteBtn.onclick = () => deleteTaskWithAnimation(task.id, card);
    actionsWrap.appendChild(deleteBtn);

    mainRow.appendChild(checkbox);
    mainRow.appendChild(titleSpan);
    mainRow.appendChild(actionsWrap);
    card.appendChild(mainRow);

    // Metadata & Timestamps Row
    const metaRow = document.createElement("div");
    metaRow.className = "task-meta";

    // Created Timestamp
    const createdSpan = document.createElement("span");
    createdSpan.className = "timestamp-badge";
    createdSpan.innerHTML = `
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Created: ${formatTimestamp(task.createdAt)}
        `;
    metaRow.appendChild(createdSpan);

    // Completed Timestamp
    if (task.completed && task.completedAt) {
      const completedSpan = document.createElement("span");
      completedSpan.className = "timestamp-badge";
      completedSpan.style.color = "var(--success)";
      completedSpan.innerHTML = `
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Finished: ${formatTimestamp(task.completedAt)}
          `;
      metaRow.appendChild(completedSpan);
    }

    card.appendChild(metaRow);
    return card;
  }

  // --- Task Actions ---
  function addTask(rawText) {
    const text = rawText.trim();
    if (!text) return;

    const newTask = {
      id: "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    tasks.unshift(newTask);
    saveTasks();
    render();
  }

  function toggleTaskComplete(id, cardElement) {
    cardElement.classList.add("animate-exit");
    setTimeout(() => {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        render();
      }
    }, 220);
  }

  function deleteTaskWithAnimation(id, cardElement) {
    cardElement.classList.add("animate-exit");
    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
    }, 220);
  }

  function handleEditTask(id, titleSpan, editBtn) {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    const existingText = currentTask.text;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "task-edit-input";
    input.value = existingText;

    titleSpan.replaceWith(input);
    input.focus();
    input.select();
    editBtn.style.display = "none";

    function finalizeEdit() {
      const newText = input.value.trim();
      if (newText) {
        currentTask.text = newText;
        saveTasks();
      }
      render();
    }

    input.addEventListener("blur", finalizeEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.removeEventListener("blur", finalizeEdit);
        finalizeEdit();
      } else if (e.key === "Escape") {
        input.removeEventListener("blur", finalizeEdit);
        render();
      }
    });
  }

  // --- Event Listeners ---
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = "";
    taskInput.focus();
  });

  btnClearCompleted.addEventListener("click", () => {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;
    if (confirm(`Remove ${completedCount} completed task(s)?`)) {
      tasks = tasks.filter((t) => !t.completed);
      saveTasks();
      render();
    }
  });

  btnResetAll.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all tasks?")) {
      tasks = [];
      saveTasks();
      render();
    }
  });

  // Initialize
  loadTasks();
  render();
})();

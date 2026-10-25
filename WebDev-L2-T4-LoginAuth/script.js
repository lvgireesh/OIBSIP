// ========================================================================
// NexusAuth Embedded JavaScript Execution Controller
// ========================================================================

const STORAGE_KEYS = {
  USERS_VAULT: "nexus_users_vault_v1",
  ACTIVE_SESSION: "nexus_active_session_v1",
};

// 1. WebCrypto SHA-256 Hashing Engine
async function computeSha256Hash(text) {
  if (!text) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 2. LocalStorage Vault Operations
function getVaultUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_VAULT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserToVault(identifier, passwordHash) {
  const users = getVaultUsers();
  const normalizedKey = identifier.trim().toLowerCase();
  users[normalizedKey] = {
    identifier: identifier.trim(),
    passwordHash: passwordHash,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.USERS_VAULT, JSON.stringify(users));
}

function isUserRegistered(identifier) {
  const users = getVaultUsers();
  const normalizedKey = identifier.trim().toLowerCase();
  return Boolean(users[normalizedKey]);
}

function verifyCredentials(identifier, passwordHash) {
  const users = getVaultUsers();
  const normalizedKey = identifier.trim().toLowerCase();
  const record = users[normalizedKey];
  if (!record) return false;
  return record.passwordHash === passwordHash;
}

// 3. Session Management
function getActiveSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function createActiveSession(identifier) {
  const sessionToken =
    "tok_" +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36);
  const session = {
    identifier: identifier.trim(),
    token: sessionToken,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  return session;
}

function destroyActiveSession() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

// 4. View Routing
const views = {
  login: document.getElementById("view-login"),
  register: document.getElementById("view-register"),
  dashboard: document.getElementById("view-dashboard"),
};

const tabs = {
  login: document.getElementById("tab-login"),
  register: document.getElementById("tab-register"),
  dashboard: document.getElementById("tab-dashboard"),
};

const toast = {
  el: document.getElementById("toast-banner"),
  msg: document.getElementById("toast-message"),
  icon: document.getElementById("toast-icon"),
  close: document.getElementById("toast-close"),
};

function showToast(type, message) {
  if (!toast.el) return;
  toast.el.className = `toast-banner toast-${type}`;
  toast.msg.textContent = message;

  if (type === "error") {
    toast.icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
  } else {
    toast.icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>`;
  }

  toast.el.classList.remove("hidden");
}

function hideToast() {
  if (toast.el) toast.el.classList.add("hidden");
}

function switchView(targetView) {
  hideToast();
  clearAllFieldErrors();

  const currentSession = getActiveSession();

  // Guard Dashboard: direct access redirect if no session
  if (targetView === "dashboard" && !currentSession) {
    showToast(
      "error",
      "Protected Area: You must sign in to view the dashboard.",
    );
    targetView = "login";
  }

  // Hide all views
  Object.values(views).forEach((v) => {
    if (v) v.classList.add("hidden");
  });
  Object.values(tabs).forEach((t) => {
    if (t) t.classList.remove("active");
  });

  // Show target
  if (views[targetView]) views[targetView].classList.remove("hidden");
  if (tabs[targetView]) tabs[targetView].classList.add("active");

  if (targetView === "dashboard" && currentSession) {
    renderDashboard(currentSession);
  }
}

function renderDashboard(session) {
  const users = getVaultUsers();
  const normalizedKey = session.identifier.trim().toLowerCase();
  const record = users[normalizedKey];

  const greetingEl = document.getElementById("greeting-username");
  const avatarEl = document.getElementById("user-avatar-initial");
  const tokenEl = document.getElementById("session-token-display");
  const countEl = document.getElementById("vault-user-count");
  const dashIdEl = document.getElementById("dash-session-identity");
  const dashHashEl = document.getElementById("dash-session-hash");
  const dashTimeEl = document.getElementById("dash-session-time");

  if (greetingEl)
    greetingEl.textContent = `Welcome back, ${session.identifier}!`;
  if (avatarEl)
    avatarEl.textContent = (session.identifier[0] || "U").toUpperCase();
  if (tokenEl) tokenEl.textContent = session.token;
  if (countEl)
    countEl.textContent = `${Object.keys(users).length} User(s) in Local Vault`;
  if (dashIdEl) dashIdEl.textContent = session.identifier;
  if (dashHashEl)
    dashHashEl.textContent = record ? record.passwordHash : "Unavailable";
  if (dashTimeEl)
    dashTimeEl.textContent = new Date(session.loginAt).toLocaleString();
}

function clearAllFieldErrors() {
  document
    .querySelectorAll(".field-error")
    .forEach((el) => (el.textContent = ""));
}

function setFieldError(fieldId, errorElementId, message) {
  const errorEl = document.getElementById(errorElementId);
  if (errorEl) errorEl.textContent = message;
}

// 5. Live Password Requirements
function setupPasswordLiveValidation() {
  const regPwInput = document.getElementById("reg-password");
  const ruleLen = document.getElementById("rule-len");
  const ruleNum = document.getElementById("rule-num");

  if (!regPwInput) return;

  regPwInput.addEventListener("input", (e) => {
    const val = e.target.value;
    const hasMinLen = val.length >= 8;
    const hasNum = /\d/.test(val);

    if (ruleLen) {
      ruleLen.classList.toggle("valid", hasMinLen);
      ruleLen.querySelector(".rule-indicator").textContent = hasMinLen
        ? "✓"
        : "•";
    }
    if (ruleNum) {
      ruleNum.classList.toggle("valid", hasNum);
      ruleNum.querySelector(".rule-indicator").textContent = hasNum ? "✓" : "•";
    }
  });
}

// 6. Form Handlers
async function handleRegistration(e) {
  e.preventDefault();
  hideToast();
  clearAllFieldErrors();

  const idInput = document.getElementById("reg-identifier");
  const pwInput = document.getElementById("reg-password");
  const submitBtn = document.getElementById("btn-reg-submit");

  const identifier = idInput.value.trim();
  const password = pwInput.value;

  let hasError = false;

  if (!identifier) {
    setFieldError(
      "reg-identifier",
      "err-reg-identifier",
      "Username or email cannot be empty.",
    );
    hasError = true;
  }

  const isLengthValid = password.length >= 8;
  const hasNumber = /\d/.test(password);

  if (!password) {
    setFieldError("reg-password", "err-reg-password", "Password is required.");
    hasError = true;
  } else if (!isLengthValid || !hasNumber) {
    setFieldError(
      "reg-password",
      "err-reg-password",
      "Password does not satisfy the requirements.",
    );
    hasError = true;
  }

  if (hasError) return;

  // Duplicate check against localStorage
  if (isUserRegistered(identifier)) {
    showToast(
      "error",
      `An account with "${identifier}" already exists. Please choose another username or log in.`,
    );
    return;
  }

  const btnText = submitBtn.querySelector(".btn-text");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");
  btnText.classList.add("hidden");
  btnSpinner.classList.remove("hidden");

  try {
    const passwordHash = await computeSha256Hash(password);
    saveUserToVault(identifier, passwordHash);

    e.target.reset();
    document.getElementById("rule-len").classList.remove("valid");
    document.getElementById("rule-num").classList.remove("valid");
    document
      .getElementById("rule-len")
      .querySelector(".rule-indicator").textContent = "•";
    document
      .getElementById("rule-num")
      .querySelector(".rule-indicator").textContent = "•";

    switchView("login");
    showToast(
      "success",
      "Registration successful! Your password has been SHA-256 hashed and stored.",
    );

    const loginIdInput = document.getElementById("login-identifier");
    if (loginIdInput) {
      loginIdInput.value = identifier;
      document.getElementById("login-password").focus();
    }
  } catch (err) {
    console.error("Registration failed:", err);
    showToast("error", "Error computing cryptographic hash.");
  } finally {
    btnText.classList.remove("hidden");
    btnSpinner.classList.add("hidden");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  hideToast();
  clearAllFieldErrors();

  const idInput = document.getElementById("login-identifier");
  const pwInput = document.getElementById("login-password");
  const submitBtn = document.getElementById("btn-login-submit");

  const identifier = idInput.value.trim();
  const password = pwInput.value;

  let hasError = false;
  if (!identifier) {
    setFieldError(
      "login-identifier",
      "err-login-identifier",
      "Enter your username or email.",
    );
    hasError = true;
  }
  if (!password) {
    setFieldError(
      "login-password",
      "err-login-password",
      "Enter your password.",
    );
    hasError = true;
  }

  if (hasError) return;

  const btnText = submitBtn.querySelector(".btn-text");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");
  btnText.classList.add("hidden");
  btnSpinner.classList.remove("hidden");

  try {
    const enteredHash = await computeSha256Hash(password);
    const isValid = verifyCredentials(identifier, enteredHash);

    if (!isValid) {
      showToast("error", "Invalid username or password.");
      return;
    }

    createActiveSession(identifier);
    e.target.reset();
    switchView("dashboard");
    showToast("success", `Authentication verified for ${identifier}. Welcome!`);
  } catch (err) {
    console.error("Login error:", err);
    showToast("error", "Authentication failed unexpectedly.");
  } finally {
    btnText.classList.remove("hidden");
    btnSpinner.classList.add("hidden");
  }
}

function handleLogout() {
  destroyActiveSession();
  switchView("login");
  showToast(
    "success",
    "Session terminated. You have been securely logged out.",
  );
}

// 7. Initialization
document.addEventListener("DOMContentLoaded", () => {
  const formRegister = document.getElementById("form-register");
  const formLogin = document.getElementById("form-login");
  const btnLogout = document.getElementById("btn-logout");

  if (formRegister) formRegister.addEventListener("submit", handleRegistration);
  if (formLogin) formLogin.addEventListener("submit", handleLogin);
  if (btnLogout) btnLogout.addEventListener("click", handleLogout);

  const toRegisterBtn = document.getElementById("link-to-register");
  const toLoginBtn = document.getElementById("link-to-login");

  if (toRegisterBtn)
    toRegisterBtn.addEventListener("click", () => switchView("register"));
  if (toLoginBtn)
    toLoginBtn.addEventListener("click", () => switchView("login"));

  if (toast.close) toast.close.addEventListener("click", hideToast);

  document.querySelectorAll(".btn-toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const eyeOpen = btn.querySelector(".eye-open");
      const eyeClosed = btn.querySelector(".eye-closed");

      if (input.type === "password") {
        input.type = "text";
        eyeOpen.classList.add("hidden");
        eyeClosed.classList.remove("hidden");
      } else {
        input.type = "password";
        eyeOpen.classList.remove("hidden");
        eyeClosed.classList.add("hidden");
      }
    });
  });

  setupPasswordLiveValidation();

  // Check session on load
  const session = getActiveSession();
  if (session) {
    switchView("dashboard");
  } else {
    switchView("login");
  }
});

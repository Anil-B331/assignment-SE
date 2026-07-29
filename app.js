const STORAGE_KEY = "aurum_auth_user";
const SESSION_KEY = "aurum_auth_session";
const REMEMBER_KEY = "aurum_auth_remembered_email";

const authTitle = document.getElementById("at");
const authSubtitle = document.getElementById("asb");
const authEyebrow = document.getElementById("ae");
const alertBox = document.getElementById("al");
const registerForm = document.getElementById("rf");
const signinForm = document.getElementById("sf");
const registerTab = document.getElementById("rt");
const signinTab = document.getElementById("st");
const gotoSignin = document.getElementById("gs");
const gotoRegister = document.getElementById("gr");
const registerButton = document.getElementById("rb");
const signinButton = document.getElementById("sb");
const loadingOverlay = document.getElementById("lo");
const forgotModal = document.getElementById("md");
const forgotPasswordButton = document.getElementById("fpb");
const closeForgot = document.getElementById("cf");
const verifyResetEmail = document.getElementById("vre");
const updatePasswordButton = document.getElementById("upb");
const forgotStepEmail = document.getElementById("fse");
const forgotStepPassword = document.getElementById("fsp");
const resetEmail = document.getElementById("resetEmail");
const newPassword = document.getElementById("newPassword");
const confirmNewPassword = document.getElementById("confirmNewPassword");
const rememberMe = document.getElementById("rm");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const confirmPassword = document.getElementById("confirmPassword");
const fullName = document.getElementById("fullName");
const signinEmail = document.getElementById("signinEmail");
const signinPassword = document.getElementById("signinPassword");
const strengthBar = document.getElementById("sbar");
const strengthText = document.getElementById("stx");
const resetEmailMessage = document.getElementById("remm");
const newPasswordMessage = document.getElementById("npm");
const confirmNewPasswordMessage = document.getElementById("cnpm");

if (location.protocol === "file:") {
  document.body.style.zoom = "50%";
}

const fieldMap = {
  fullName: {
    input: fullName,
    message: document.getElementById("fnm"),
    validator: validateFullName,
  },
  registerEmail: {
    input: registerEmail,
    message: document.getElementById("rem"),
    validator: validateEmail,
  },
  registerPassword: {
    input: registerPassword,
    message: document.getElementById("rpm"),
    validator: validatePassword,
  },
  confirmPassword: {
    input: confirmPassword,
    message: document.getElementById("cpm"),
    validator: validateConfirmPassword,
  },
  signinEmail: {
    input: signinEmail,
    message: document.getElementById("sem"),
    validator: validateEmail,
  },
  signinPassword: {
    input: signinPassword,
    message: document.getElementById("spm"),
    validator: validateRequiredPassword,
  },
};

let resetVerifiedEmail = "";
let activeMode = localStorage.getItem(SESSION_KEY) ? "signin" : getInitialMode();

initialize();

function initialize() {
  setRememberedEmail();
  bindEvents();
  switchMode(activeMode, { silent: true });
  syncRegisterValidation();
  syncSigninValidation();
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function getInitialMode() {
  return getStoredUser() ? "signin" : "register";
}

function bindEvents() {
  registerTab.addEventListener("click", () => switchMode("register"));
  signinTab.addEventListener("click", () => switchMode("signin"));
  gotoSignin.addEventListener("click", () => switchMode("signin"));
  gotoRegister.addEventListener("click", () => switchMode("register"));
  forgotPasswordButton.addEventListener("click", openForgotModal);
  closeForgot.addEventListener("click", closeForgotModal);
  forgotModal.addEventListener("click", (event) => {
    if (event.target === forgotModal) closeForgotModal();
  });

  Object.values(fieldMap).forEach(({ input, validator, message }) => {
    input.addEventListener("input", () => {
      clearAlert();
      const result = validator(input.value);
      setFieldState(input, message, result.valid ? "success" : "error", result.message);
      if (input === registerPassword) updateStrengthIndicator(input.value);
      if (input === confirmPassword) validateConfirmPassword(confirmPassword.value);
      if (activeMode === "register") syncRegisterValidation();
      if (activeMode === "signin") syncSigninValidation();
    });

    input.addEventListener("blur", () => {
      const result = validator(input.value);
      setFieldState(input, message, result.valid ? "success" : "error", result.message);
      if (input === registerPassword) updateStrengthIndicator(input.value);
    });
  });

  document.querySelectorAll("[data-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const target = document.getElementById(targetId);
      const isPassword = target.type === "password";
      target.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Hide" : "Show";
    });
  });

  registerForm.addEventListener("submit", handleRegisterSubmit);
  signinForm.addEventListener("submit", handleSigninSubmit);
  verifyResetEmail.addEventListener("click", verifyResetAccountEmail);
  updatePasswordButton.addEventListener("click", handlePasswordReset);
}

function switchMode(mode, options = {}) {
  activeMode = mode;
  const isRegister = mode === "register";
  registerForm.classList.toggle("hidden", !isRegister);
  signinForm.classList.toggle("hidden", isRegister);
  registerTab.classList.toggle("active", isRegister);
  signinTab.classList.toggle("active", !isRegister);
  authTitle.textContent = isRegister ? "Register your workspace" : "Welcome back";
  authSubtitle.textContent = isRegister
    ? "Set up your profile in under a minute."
    : "Sign in with the credentials saved in LocalStorage.";
  authEyebrow.textContent = isRegister ? "Create account" : "Existing account";
  clearAlert();
  clearModeValidation();
  if (!options.silent) {
    if (isRegister) {
      registerForm.querySelector("input")?.focus();
    } else {
      signinEmail.focus();
    }
  }
  syncRegisterValidation();
  syncSigninValidation();
}

function clearModeValidation() {
  Object.values(fieldMap).forEach(({ input, message }) => {
    if (input.closest("form").classList.contains("hidden")) return;
    setFieldState(input, message, "", "");
  });
  resetEmailMessage.textContent = "";
  resetEmailMessage.className = "fm";
  newPasswordMessage.textContent = "";
  newPasswordMessage.className = "fm";
  confirmNewPasswordMessage.textContent = "";
  confirmNewPasswordMessage.className = "fm";
}

function clearAlert() {
  alertBox.hidden = true;
  alertBox.textContent = "";
  alertBox.className = "alert";
}

function showAlert(message, type = "error") {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.hidden = false;
}

function setFieldState(input, messageEl, state, message) {
  input.classList.remove("valid", "invalid");
  if (state === "success") input.classList.add("valid");
  if (state === "error") input.classList.add("invalid");
  messageEl.textContent = message || "";
  messageEl.className = `fm ${state === "error" ? "error" : state === "success" ? "success" : ""}`.trim();
}

function validateFullName(value) {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, message: "Full name is required." };
  if (trimmed.length < 2) return { valid: false, message: "Full name should contain at least 2 characters." };
  return { valid: true, message: "Looks good." };
}

function validateEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, message: "Email address is required." };
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(trimmed)) return { valid: false, message: "Enter a valid email address." };
  return { valid: true, message: "Email format looks good." };
}

function validatePassword(value) {
  if (!value) return { valid: false, message: "Password is required." };
  const checks = passwordChecks(value);
  if (!checks.length) return { valid: false, message: "Password must contain at least 8 characters." };
  if (!checks.uppercase) return { valid: false, message: "Add at least one uppercase letter." };
  if (!checks.lowercase) return { valid: false, message: "Add at least one lowercase letter." };
  if (!checks.number) return { valid: false, message: "Add at least one number." };
  if (!checks.special) return { valid: false, message: "Add at least one special character." };
  return { valid: true, message: "Strong password." };
}

function validateRequiredPassword(value) {
  if (!value) return { valid: false, message: "Password is required." };
  return { valid: true, message: "" };
}

function validateConfirmPassword(value) {
  if (!value) return { valid: false, message: "Please confirm your password." };
  if (value !== registerPassword.value) return { valid: false, message: "Passwords do not match." };
  return { valid: true, message: "Passwords match." };
}

function passwordChecks(value) {
  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

function updateStrengthIndicator(password) {
  const checks = passwordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;
  strengthBar.className = "sb";
  if (!password) {
    strengthText.textContent = "Password strength will appear here.";
    return;
  }
  if (score <= 2) {
    strengthBar.classList.add("weak");
    strengthText.textContent = "Weak: add more character variety.";
  } else if (score <= 4) {
    strengthBar.classList.add("fair");
    strengthText.textContent = "Fair: one more rule away from strong.";
  } else {
    strengthBar.classList.add("strong");
    strengthText.textContent = "Strong password ready to use.";
  }
}

function syncRegisterValidation() {
  const validations = [
    validateFullName(fullName.value),
    validateEmail(registerEmail.value),
    validatePassword(registerPassword.value),
    validateConfirmPassword(confirmPassword.value),
  ];
  registerButton.disabled = !validations.every((item) => item.valid);
}

function syncSigninValidation() {
  const validations = [
    validateEmail(signinEmail.value),
    validateRequiredPassword(signinPassword.value),
  ];
  signinButton.disabled = !validations.every((item) => item.valid);
}

function handleRegisterSubmit(event) {
  event.preventDefault();
  const fullNameResult = validateFullName(fullName.value);
  const emailResult = validateEmail(registerEmail.value);
  const passwordResult = validatePassword(registerPassword.value);
  const confirmResult = validateConfirmPassword(confirmPassword.value);

  const validations = [
    [fullName, document.getElementById("fnm"), fullNameResult],
    [registerEmail, document.getElementById("rem"), emailResult],
    [registerPassword, document.getElementById("rpm"), passwordResult],
    [confirmPassword, document.getElementById("cpm"), confirmResult],
  ];

  validations.forEach(([input, messageEl, result]) => setFieldState(input, messageEl, result.valid ? "success" : "error", result.message));
  updateStrengthIndicator(registerPassword.value);

  if (!validations.every(([, , result]) => result.valid)) {
    showAlert("Please fix the highlighted fields before continuing.");
    return;
  }

  const existingUser = getStoredUser();
  if (existingUser && existingUser.email.toLowerCase() === registerEmail.value.trim().toLowerCase()) {
    showAlert("That email is already registered. Please sign in instead.");
    switchMode("signin");
    signinEmail.value = registerEmail.value.trim();
    return;
  }

  const user = {
    fullName: fullName.value.trim(),
    email: registerEmail.value.trim().toLowerCase(),
    password: registerPassword.value,
  };

  setStoredUser(user);
  localStorage.setItem(REMEMBER_KEY, user.email);
  showAlert("Registration completed successfully. Redirecting to sign in...", "success");
  registerForm.reset();
  updateStrengthIndicator("");
  setTimeout(() => switchMode("signin"), 1200);
}

function handleSigninSubmit(event) {
  event.preventDefault();
  const emailResult = validateEmail(signinEmail.value);
  const passwordResult = validateRequiredPassword(signinPassword.value);
  setFieldState(signinEmail, document.getElementById("sem"), emailResult.valid ? "success" : "error", emailResult.message);
  setFieldState(signinPassword, document.getElementById("spm"), passwordResult.valid ? "success" : "error", passwordResult.message);

  if (!emailResult.valid || !passwordResult.valid) {
    showAlert("Enter valid sign in credentials.");
    return;
  }

  const user = getStoredUser();
  const email = signinEmail.value.trim().toLowerCase();
  const password = signinPassword.value;

  if (!user || user.email.toLowerCase() !== email || user.password !== password) {
    setFieldState(signinEmail, document.getElementById("sem"), "error", "Credentials do not match our records.");
    setFieldState(signinPassword, document.getElementById("spm"), "error", "Please check your password and try again.");
    showAlert("Invalid email or password. Please try again.");
    return;
  }

  if (rememberMe.checked) {
    localStorage.setItem(REMEMBER_KEY, email);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, loginAt: new Date().toISOString() }));
  showLoadingAndRedirect();
}

function showLoadingAndRedirect() {
  loadingOverlay.classList.remove("hidden");
  window.setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1100);
}

function setRememberedEmail() {
  const rememberedEmail = localStorage.getItem(REMEMBER_KEY);
  if (rememberedEmail) {
    signinEmail.value = rememberedEmail;
    rememberMe.checked = true;
  }
}

function openForgotModal() {
  forgotModal.classList.remove("hidden");
  forgotStepEmail.classList.remove("hidden");
  forgotStepPassword.classList.add("hidden");
  resetVerifiedEmail = "";
  resetEmail.value = signinEmail.value.trim();
  resetEmailMessage.textContent = "";
  resetEmailMessage.className = "field-message";
  newPassword.value = "";
  confirmNewPassword.value = "";
  newPasswordMessage.textContent = "";
  confirmNewPasswordMessage.textContent = "";
  resetEmail.focus();
}

function closeForgotModal() {
  forgotModal.classList.add("hidden");
  resetVerifiedEmail = "";
}

function verifyResetAccountEmail() {
  const result = validateEmail(resetEmail.value);
  setFieldState(resetEmail, resetEmailMessage, result.valid ? "success" : "error", result.message);
  if (!result.valid) return;

  const user = getStoredUser();
  const email = resetEmail.value.trim().toLowerCase();
  if (!user || user.email.toLowerCase() !== email) {
    setFieldState(resetEmail, resetEmailMessage, "error", "No registered account matches this email.");
    return;
  }

  resetVerifiedEmail = email;
  forgotStepEmail.classList.add("hidden");
  forgotStepPassword.classList.remove("hidden");
  newPassword.focus();
}

function handlePasswordReset() {
  const newPasswordResult = validatePassword(newPassword.value);
  const confirmResult = newPassword.value === confirmNewPassword.value
    ? { valid: true, message: "Passwords match." }
    : { valid: false, message: "Passwords do not match." };

  setFieldState(newPassword, newPasswordMessage, newPasswordResult.valid ? "success" : "error", newPasswordResult.message);
  setFieldState(confirmNewPassword, confirmNewPasswordMessage, confirmResult.valid ? "success" : "error", confirmResult.message);

  if (!newPasswordResult.valid || !confirmResult.valid) return;

  const user = getStoredUser();
  if (!user || user.email.toLowerCase() !== resetVerifiedEmail) {
    setFieldState(resetEmail, resetEmailMessage, "error", "Please verify a registered email first.");
    forgotStepPassword.classList.add("hidden");
    forgotStepEmail.classList.remove("hidden");
    return;
  }

  const updatedUser = {
    ...user,
    password: newPassword.value,
  };

  setStoredUser(updatedUser);
  localStorage.setItem(REMEMBER_KEY, updatedUser.email);
  showAlert("Password updated successfully. You can sign in with the new password.", "success");
  closeForgotModal();
  signinEmail.value = updatedUser.email;
  signinPassword.value = "";
  switchMode("signin");
}

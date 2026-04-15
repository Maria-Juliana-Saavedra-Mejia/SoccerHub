const authService = new AuthService(SoccerHubConfig);

const loginForm = document.getElementById("loginForm");
const roleSelect = document.getElementById("roleSelect");
const adminPasswordField = document.getElementById("adminPasswordField");
const adminPassword = document.getElementById("adminPassword");
const loginMessage = document.getElementById("loginMessage");

function showMessage(text, isError = false) {
  loginMessage.textContent = text;
  loginMessage.classList.toggle("form__message--error", isError);
}

function togglePasswordVisibility() {
  const isAdminSelected = roleSelect.value === "admin";
  adminPasswordField.hidden = !isAdminSelected;
  if (!isAdminSelected) adminPassword.value = "";
}

function redirectByRole(role) {
  if (role === "admin") {
    window.location.href = "./html/admin.html";
    return;
  }
  if (role === "user") {
    window.location.href = "./html/user.html";
  }
}

function init() {
  const sessionRole = authService.getCurrentRole();
  if (sessionRole === "admin" || sessionRole === "user") {
    redirectByRole(sessionRole);
    return;
  }

  roleSelect.addEventListener("change", togglePasswordVisibility);

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const role = roleSelect.value;
    const password = role === "admin" ? adminPassword.value.trim() : "";
    const result = authService.login(role, password);
    showMessage(result.message, !result.success);
    if (!result.success) return;
    redirectByRole(role);
  });

  togglePasswordVisibility();
  showMessage("Select a role and login.");
}

init();

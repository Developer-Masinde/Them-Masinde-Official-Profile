const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("login-error");

  error.textContent = "";

  if (!email || !password) {
    error.textContent = "Please enter your email and password.";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    error.textContent = loginError.message;
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
    return;
  }

  window.location.href = "dashboard.html";
});

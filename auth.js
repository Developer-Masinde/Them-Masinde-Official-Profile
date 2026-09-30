/*
    PEFA SOWETO CATHEDRAL
    ADMIN DASHBOARD PROTECTION

    This file makes sure that a user must be
    authenticated before accessing dashboard.html.
*/

(async () => {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Session check failed:", error);

    window.location.href = "login.html";

    return;
  }

  if (!data.session) {
    window.location.href = "login.html";

    return;
  }

  console.log("Authenticated admin session found.");
})();

/*
    LOGOUT
*/

document.getElementById("logout-btn").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Logout failed:", error);

    alert("Logout failed. Please try again.");

    return;
  }

  window.location.href = "login.html";
});

let mode = new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "login";
const form = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");
const errorEl = document.getElementById("auth-error");
const noticeEl = document.getElementById("auth-notice");
const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
function renderMode() {
  tabLogin.classList.toggle("active", mode === "login");
  tabSignup.classList.toggle("active", mode === "signup");
  if (mode === "login") { formTitle.textContent = "Welcome back"; formSubtitle.textContent = "Log in to keep generating"; submitBtn.textContent = "Log in"; }
  else { formTitle.textContent = "Create your account"; formSubtitle.textContent = "Start with 5 free generations a month"; submitBtn.textContent = "Sign up"; }
  errorEl.classList.add("hidden");
  noticeEl.classList.add("hidden");
}
renderMode();
tabLogin.addEventListener("click", () => { mode = "login"; renderMode(); });
tabSignup.addEventListener("click", () => { mode = "signup"; renderMode(); });
function showError(msg) { errorEl.textContent = msg; errorEl.classList.remove("hidden"); noticeEl.classList.add("hidden"); }
function showNotice(msg) { noticeEl.textContent = msg; noticeEl.classList.remove("hidden"); errorEl.classList.add("hidden"); }
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.classList.add("hidden");
  submitBtn.disabled = true;
  submitBtn.textContent = mode === "login" ? "Logging in…" : "Signing up…";
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  try {
    if (mode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) { window.location.href = "onboarding.html"; }
      else { showNotice("Check your inbox to confirm your email, then log in."); mode = "login"; renderMode(); }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const profile = await getOrCreateProfile(data.user.id);
      window.location.href = profile.onboarded ? "dashboard.html" : "onboarding.html";
    }
  } catch (err) { showError(err.message || "Something went wrong. Please try again."); }
  finally { submitBtn.disabled = false; renderMode(); }
});
document.getElementById("google-btn").addEventListener("click", async () => {
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/onboarding.html" } });
    if (error) throw error;
  } catch (err) { showError(err.message || "Google sign-in failed."); }
});
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const profile = await getOrCreateProfile(session.user.id);
    window.location.href = profile.onboarded ? "dashboard.html" : "onboarding.html";
  }
})();

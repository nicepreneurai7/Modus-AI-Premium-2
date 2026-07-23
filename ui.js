function initTheme() {
  const saved = localStorage.getItem("modus-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
}
initTheme();
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("modus-theme", isDark ? "dark" : "light");
  document.querySelectorAll("[data-theme-icon]").forEach(el => { el.textContent = isDark ? "☀" : "☾"; });
}
document.addEventListener("DOMContentLoaded", () => {
  const isDark = document.documentElement.classList.contains("dark");
  document.querySelectorAll("[data-theme-icon]").forEach(el => { el.textContent = isDark ? "☀" : "☾"; });
  document.querySelectorAll("[data-theme-toggle]").forEach(el => { el.addEventListener("click", toggleTheme); });
});
function showToast(message, duration = 3200) {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}
function copyText(text, label = "Copied") {
  navigator.clipboard.writeText(text).then(() => showToast(label));
}
async function loadPartial(url, targetSelector, activePage) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const target = document.querySelector(targetSelector);
    target.innerHTML = html;
    if (activePage) {
      target.querySelectorAll(`[data-page]`).forEach(link => {
        if (link.dataset.page === activePage) link.classList.add("active");
      });
    }
    target.querySelectorAll("[data-theme-toggle]").forEach(el => { el.addEventListener("click", toggleTheme); });
    const isDark = document.documentElement.classList.contains("dark");
    target.querySelectorAll("[data-theme-icon]").forEach(el => { el.textContent = isDark ? "☀" : "☾"; });
    target.querySelectorAll("[data-logout]").forEach(el => {
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.href = "auth.html";
      });
    });
    const menuBtn = document.querySelector("[data-mobile-menu-btn]");
    const sidebarEl = document.querySelector(".sidebar");
    if (menuBtn && sidebarEl) { menuBtn.addEventListener("click", () => sidebarEl.classList.toggle("hidden")); }
  } catch (err) { console.error("Failed to load partial:", url, err); }
}
async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) { window.location.href = "auth.html"; return null; }
  return session;
}
async function requireOnboarding(profile) {
  if (!profile || !profile.onboarded) { window.location.href = "onboarding.html"; return false; }
  return true;
}
async function getOrCreateProfile(userId) {
  let { data: profile, error } = await supabaseClient.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!profile) {
    const { data: created, error: insertErr } = await supabaseClient
      .from("profiles")
      .insert({ id: userId, onboarded: false, generations_used_this_month: 0, subscription_status: "free" })
      .select()
      .single();
    if (insertErr) console.error(insertErr);
    profile = created;
  }
  return profile;
}

const ROLES = ["Freelancer", "Business Owner", "Solopreneur", "Agency/Company", "Content Creator", "Influencer", "Coach/Consultant", "Personal Brand", "Theme Page Owner", "Nonprofit", "Student", "Other"];
const NICHES = ["Fitness", "Food & Restaurant", "Fashion & Beauty", "Tech & SaaS", "Travel", "Business & Finance", "Real Estate", "Motivation & Mindset", "Comedy & Entertainment", "Parenting & Family", "Health & Wellness", "Pets & Animals", "Gaming", "Music & Art", "Education", "Other"];
let selectedRole = null;
let selectedNiche = null;
let session = null;
function buildGrid(items, gridId, onSelect) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = items.map(item => `<button type="button" class="checkbox-card text-left" data-value="${item}"><span class="font-medium">${item}</span></button>`).join("");
  grid.querySelectorAll("[data-value]").forEach(btn => {
    btn.addEventListener("click", () => {
      grid.querySelectorAll("[data-value]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(btn.dataset.value);
    });
  });
}
buildGrid(ROLES, "role-grid", (val) => {
  selectedRole = val;
  document.getElementById("role-custom-wrap").classList.toggle("hidden", val !== "Other");
  document.getElementById("role-next").disabled = false;
});
buildGrid(NICHES, "niche-grid", (val) => {
  selectedNiche = val;
  document.getElementById("niche-custom-wrap").classList.toggle("hidden", val !== "Other");
  document.getElementById("niche-finish").disabled = false;
});
document.getElementById("role-next").addEventListener("click", () => {
  document.getElementById("step-role").classList.add("hidden");
  document.getElementById("step-niche").classList.remove("hidden");
});
document.getElementById("niche-back").addEventListener("click", () => {
  document.getElementById("step-niche").classList.add("hidden");
  document.getElementById("step-role").classList.remove("hidden");
});
document.getElementById("niche-finish").addEventListener("click", async () => {
  const finalRole = selectedRole === "Other" ? (document.getElementById("role-custom").value.trim() || "Other") : selectedRole;
  const finalNiche = selectedNiche === "Other" ? (document.getElementById("niche-custom").value.trim() || "Other") : selectedNiche;
  const btn = document.getElementById("niche-finish");
  btn.disabled = true;
  btn.textContent = "Saving…";
  const { error } = await supabaseClient.from("profiles").update({ role: finalRole, niche: finalNiche, onboarded: true }).eq("id", session.user.id);
  if (error) { showToast("Couldn't save your profile — please try again."); btn.disabled = false; btn.textContent = "Enter Modus"; return; }
  window.location.href = "dashboard.html";
});
(async () => {
  session = await requireAuth();
  if (!session) return;
  const profile = await getOrCreateProfile(session.user.id);
  if (profile.onboarded) window.location.href = "dashboard.html";
})();

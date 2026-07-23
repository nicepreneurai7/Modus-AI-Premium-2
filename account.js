const ROLES = ["Freelancer","Business Owner","Solopreneur","Agency/Company","Content Creator","Influencer","Coach/Consultant","Personal Brand","Theme Page Owner","Nonprofit","Student","Other"];
const NICHES = ["Fitness","Food & Restaurant","Fashion & Beauty","Tech & SaaS","Travel","Business & Finance","Real Estate","Motivation & Mindset","Comedy & Entertainment","Parenting & Family","Health & Wellness","Pets & Animals","Gaming","Music & Art","Education","Other"];
let session = null;
let profile = null;
document.getElementById("save-profile-btn").addEventListener("click", async () => {
  const role = document.getElementById("role-select").value;
  const niche = document.getElementById("niche-select").value;
  const { error } = await supabaseClient.from("profiles").update({ role, niche }).eq("id", session.user.id);
  showToast(error ? "Couldn't save changes" : "Profile updated");
});
document.getElementById("signout-btn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "auth.html";
});
(async () => {
  session = await requireAuth();
  if (!session) return;
  profile = await getOrCreateProfile(session.user.id);
  const ok = await requireOnboarding(profile);
  if (!ok) return;
  await loadPartial("partials/sidebar.html", "[data-sidebar-container]", "account");
  await loadPartial("partials/topbar.html", "[data-topbar-container]", "account");
  document.getElementById("account-email").textContent = session.user.email;
  const roleSelect = document.getElementById("role-select");
  const nicheSelect = document.getElementById("niche-select");
  roleSelect.innerHTML = ROLES.map(r => `<option ${r===profile.role?'selected':''}>${r}</option>`).join("");
  nicheSelect.innerHTML = NICHES.map(n => `<option ${n===profile.niche?'selected':''}>${n}</option>`).join("");
  const planLabel = document.getElementById("plan-label");
  const planDetail = document.getElementById("plan-detail");
  const planCta = document.getElementById("plan-cta");
  if (profile.subscription_status === "paid") { planLabel.textContent = "Unlimited"; planDetail.textContent = "$5/month · unlimited generations"; planCta.textContent = "Manage plan"; }
  else { planLabel.textContent = "Free"; planDetail.textContent = `${profile.generations_used_this_month || 0} of ${FREE_MONTHLY_LIMIT} generations used this month`; planCta.textContent = "Upgrade — $5/mo"; }
})();

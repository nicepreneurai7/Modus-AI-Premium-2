const TONES = ["Casual","Professional","Informative","Funny/Humorous","Emotional/Heartfelt","Sporty/Energetic","Trendy/Vibes","Inspirational","Bold/Confident","Luxurious","Minimalist","Storytelling","Sarcastic/Witty","Motivational","Nostalgic","Flirty/Playful","Surprise Me (AI Chooses)"];
const LENGTHS = ["Short","Medium","Long","AI Decides"];
const FORMATS = ["Well-Formatted (structured with line breaks)","Short Paragraph (dense block)","Single-Line/One-Go","Casual (natural emoji placement)","Bullet/List Style","Story-Style (narrative flow)"];
const ROLES = ["Freelancer","Business Owner","Solopreneur","Agency/Company","Content Creator","Influencer","Coach/Consultant","Personal Brand","Theme Page Owner","Nonprofit","Student","Other"];
const NICHES = ["Fitness","Food & Restaurant","Fashion & Beauty","Tech & SaaS","Travel","Business & Finance","Real Estate","Motivation & Mindset","Comedy & Entertainment","Parenting & Family","Health & Wellness","Pets & Animals","Gaming","Music & Art","Education","Other"];
let session = null;
let profile = null;
let counts = { captions: 3, hashtags: 5 };
let selectedTone = "Casual";
let selectedLength = "Medium";
let lastResults = null;
function fillPills(containerId, items, selected, onSelect) {
  const el = document.getElementById(containerId);
  el.innerHTML = items.map(i => `<button type="button" class="pill${i===selected?' active':''}" data-value="${i}">${i}</button>`).join("");
  el.querySelectorAll("[data-value]").forEach(btn => {
    btn.addEventListener("click", () => {
      el.querySelectorAll(".pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(btn.dataset.value);
    });
  });
}
function initForm() {
  fillPills("tone-pills", TONES, selectedTone, v => selectedTone = v);
  fillPills("length-pills", LENGTHS, selectedLength, v => selectedLength = v);
  const formatSelect = document.getElementById("format-select");
  formatSelect.innerHTML = FORMATS.map(f => `<option value="${f}">${f}</option>`).join("");
  const roleSelect = document.getElementById("role-select");
  const nicheSelect = document.getElementById("niche-select");
  roleSelect.innerHTML = ROLES.map(r => `<option value="${r}" ${r===profile.role?'selected':''}>${r}</option>`).join("");
  nicheSelect.innerHTML = NICHES.map(n => `<option value="${n}" ${n===profile.niche?'selected':''}>${n}</option>`).join("");
  document.getElementById("personalize-summary").textContent = `Personalized for ${profile.niche || "your niche"} · ${profile.role || "your role"}`;
  document.getElementById("personalize-toggle").addEventListener("click", () => {
    document.getElementById("personalize-panel").classList.toggle("hidden");
  });
  document.querySelectorAll("[data-stepper]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.stepper;
      const delta = parseInt(btn.dataset.delta, 10);
      const max = key === "captions" ? 5 : 15;
      const min = 1;
      counts[key] = Math.min(max, Math.max(min, counts[key] + delta));
      document.getElementById(`${key}-count`).textContent = counts[key];
    });
  });
  document.querySelectorAll(".output-check").forEach(cb => {
    cb.addEventListener("change", () => {
      const card = cb.closest("[data-output-card]");
      card.classList.toggle("active", cb.checked);
      syncOutputVisibility();
    });
    cb.closest("[data-output-card]").classList.toggle("active", cb.checked);
  });
  syncOutputVisibility();
  document.getElementById("bulk-toggle").addEventListener("change", (e) => {
    document.getElementById("single-topic-wrap").classList.toggle("hidden", e.target.checked);
    document.getElementById("bulk-topic-wrap").classList.toggle("hidden", !e.target.checked);
  });
}
function syncOutputVisibility() {
  const wants = t => document.querySelector(`.output-check[value="${t}"]`).checked;
  document.getElementById("captions-count-wrap").classList.toggle("hidden", !wants("captions"));
  document.getElementById("hashtags-count-wrap").classList.toggle("hidden", !wants("hashtags"));
}
function renderUsage() {
  const badge = document.getElementById("usage-badge");
  const notice = document.getElementById("usage-notice");
  if (profile.subscription_status === "paid") { badge.textContent = "Unlimited plan"; notice.classList.add("hidden"); return; }
  const used = profile.generations_used_this_month || 0;
  badge.textContent = `${used} of ${FREE_MONTHLY_LIMIT} free generations used this month`;
  if (used >= FREE_MONTHLY_LIMIT) { notice.textContent = "You've used all 5 free generations this month. Upgrade for unlimited access."; notice.classList.remove("hidden"); }
  else { notice.classList.add("hidden"); }
}
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function callGenerateEndpoint(payload, accessToken) {
  try {
    const res = await fetch(GENERATE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Endpoint returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return { data, isPreview: false, errorMessage: null };
  } catch (err) {
    const errorMessage = err instanceof TypeError
      ? `Network/CORS error: "${err.message}" — the request never reached the server.`
      : err.message;
    console.warn("Generate endpoint call failed, using local preview:", err);
    return { data: buildPreviewResult(payload), isPreview: true, errorMessage };
  }
}
function buildPreviewResult(payload) {
  const topic = payload.topic || "your post";
  const result = {};
  if (payload.output_types.includes("hooks")) { result.hooks = Array.from({ length: 5 }, (_, i) => `Hook ${i + 1}: A ${payload.tone.toLowerCase()} opener about ${topic}.`); }
  if (payload.output_types.includes("captions")) { result.captions = Array.from({ length: payload.caption_count }, (_, i) => `Caption ${i + 1} (${payload.length}, ${payload.formatting.split(" (")[0]}): ${topic} — written in a ${payload.tone.toLowerCase()} tone.`); }
  if (payload.output_types.includes("hashtags")) { result.hashtags = Array.from({ length: payload.hashtag_count }, (_, i) => `#${(payload.niche || "content").replace(/[^a-zA-Z0-9]/g, "")}${i + 1}`); }
  return result;
}
function renderResults(resultsByTopic, isPreview, errorMessage) {
  const wrap = document.getElementById("results-wrap");
  const container = document.getElementById("results-container");
  wrap.classList.remove("hidden");
  document.getElementById("loading-wrap").classList.add("hidden");
  const errorBanner = (isPreview && errorMessage) ? `<div class="card p-4 mb-2" style="border-color: var(--danger)"><p class="eyebrow mb-1" style="color: var(--danger)">Live generation failed — showing preview text instead</p><p class="text-sm" style="color: var(--ink-soft); word-break: break-word;">${escapeHtml(errorMessage)}</p></div>` : "";
  container.innerHTML = errorBanner + resultsByTopic.map(({ topic, result }, idx) => `
    <details class="card p-5" ${resultsByTopic.length === 1 ? "open" : ""}>
      <summary class="font-display text-xl cursor-pointer flex items-center justify-between">
        <span>${topic || "Result"}</span>
        ${isPreview ? '<span class="eyebrow" style="color: var(--gold)">preview — connect proxy</span>' : ""}
      </summary>
      <div class="mt-4 flex flex-col gap-6">
        ${result.hooks ? renderSection("Hooks", result.hooks, `hooks-${idx}`) : ""}
        ${result.captions ? renderSection("Captions", result.captions, `captions-${idx}`) : ""}
        ${result.hashtags ? renderSection("Hashtags", [result.hashtags.join(" ")], `hashtags-${idx}`, true) : ""}
      </div>
    </details>
  `).join("");
  container.querySelectorAll("[data-copy]").forEach(btn => { btn.addEventListener("click", () => copyText(btn.dataset.copy, "Copied to clipboard")); });
}
function renderSection(label, items, key) {
  return `<div><div class="flex items-center justify-between mb-2"><p class="eyebrow">${label}</p><button type="button" class="pill" data-copy="${escapeAttr(items.join("\n"))}">Copy ${label.toLowerCase()}</button></div><div class="flex flex-col gap-2">${items.map(it => `<div class="flex items-start justify-between gap-3 p-3 rounded-md" style="background: var(--paper-dim)"><p class="text-sm leading-relaxed">${escapeHtml(it)}</p><button type="button" class="pill shrink-0" data-copy="${escapeAttr(it)}">Copy</button></div>`).join("")}</div></div>`;
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/\n/g, "&#10;"); }
async function saveHistoryEntry(topic, result, meta) {
  const title = (topic || "Untitled generation").slice(0, 60);
  const { error } = await supabaseClient.from("history").insert({
    user_id: session.user.id, title, topic, output_types: meta.output_types, tone: meta.tone, length: meta.length, formatting: meta.formatting, result: result
  });
  if (error) { console.error(error); return; }
  const { count } = await supabaseClient.from("history").select("id", { count: "exact", head: true }).eq("user_id", session.user.id);
  if (count > HISTORY_HARD_CAP) {
    const { data: oldest } = await supabaseClient.from("history").select("id").eq("user_id", session.user.id).order("created_at", { ascending: true }).limit(count - HISTORY_HARD_CAP);
    if (oldest && oldest.length) { await supabaseClient.from("history").delete().in("id", oldest.map(o => o.id)); showToast("Oldest history entry auto-deleted to stay within your 15-entry limit."); }
  } else if (count >= HISTORY_SOFT_CAP) { showToast(`${count} of ${HISTORY_HARD_CAP} saved — oldest entries will auto-delete once you pass ${HISTORY_HARD_CAP}.`); }
}
document.getElementById("gen-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (profile.subscription_status !== "paid" && (profile.generations_used_this_month || 0) >= FREE_MONTHLY_LIMIT) { openUpgradeCheckout(session.user.email, session.user.id); return; }
  const outputTypes = Array.from(document.querySelectorAll(".output-check:checked")).map(c => c.value);
  if (outputTypes.length === 0) { showToast("Select at least one output type."); return; }
  const isBulk = document.getElementById("bulk-toggle").checked;
  let topics = [];
  if (isBulk) {
    topics = document.getElementById("bulk-input").value.split("\n").map(t => t.trim()).filter(Boolean);
    if (topics.length === 0) { showToast("Add at least one topic, one per line."); return; }
  } else {
    const t = document.getElementById("topic-input").value.trim();
    if (!t) { showToast("Tell us what the post is about."); return; }
    topics = [t];
  }
  const formatting = document.getElementById("format-select").value;
  const role = document.getElementById("role-select").value;
  const niche = document.getElementById("niche-select").value;
  let imageBase64 = null;
  const imageFile = document.getElementById("image-input")?.files?.[0];
  if (imageFile) imageBase64 = await fileToBase64(imageFile);
  const btn = document.getElementById("generate-btn");
  btn.disabled = true;
  btn.textContent = "Generating…";
  document.getElementById("results-wrap").classList.add("hidden");
  document.getElementById("loading-wrap").classList.remove("hidden");
  const { data: { session: freshSession } } = await supabaseClient.auth.getSession();
  const accessToken = freshSession.access_token;
  const resultsByTopic = [];
  let anyPreview = false;
  let lastErrorMessage = null;
  for (const topic of topics) {
    const payload = { topic, role, niche, output_types: outputTypes, tone: selectedTone, length: selectedLength, formatting, caption_count: counts.captions, hashtag_count: counts.hashtags, image_base64: imageBase64 };
    const { data: result, isPreview, errorMessage } = await callGenerateEndpoint(payload, accessToken);
    if (isPreview) { anyPreview = true; lastErrorMessage = errorMessage; }
    resultsByTopic.push({ topic, result });
    await saveHistoryEntry(topic, result, payload);
  }
  const newUsed = (profile.generations_used_this_month || 0) + 1;
  await supabaseClient.from("profiles").update({ generations_used_this_month: newUsed }).eq("id", session.user.id);
  profile.generations_used_this_month = newUsed;
  renderUsage();
  lastResults = resultsByTopic;
  renderResults(resultsByTopic, anyPreview, lastErrorMessage);
  btn.disabled = false;
  btn.textContent = "Generate";
  if (profile.subscription_status !== "paid" && newUsed >= FREE_MONTHLY_LIMIT) { setTimeout(() => openUpgradeCheckout(session.user.email, session.user.id), 600); }
});
document.getElementById("copy-all-btn").addEventListener("click", () => {
  if (!lastResults) return;
  const combined = lastResults.map(({ topic, result }) => {
    const parts = [`Topic: ${topic}`];
    if (result.hooks) parts.push("Hooks:\n" + result.hooks.join("\n"));
    if (result.captions) parts.push("Captions:\n" + result.captions.join("\n\n"));
    if (result.hashtags) parts.push("Hashtags:\n" + result.hashtags.join(" "));
    return parts.join("\n\n");
  }).join("\n\n---\n\n");
  copyText(combined, "All results copied");
});
(async () => {
  session = await requireAuth();
  if (!session) return;
  profile = await getOrCreateProfile(session.user.id);
  const ok = await requireOnboarding(profile);
  if (!ok) return;
  await loadPartial("partials/sidebar.html", "[data-sidebar-container]", "dashboard");
  await loadPartial("partials/topbar.html", "[data-topbar-container]", "dashboard");
  initForm();
  renderUsage();
})();

let session = null;
let entries = [];
let selectedIds = new Set();
function fmtDate(iso) { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function renderList() {
  const list = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  const countEl = document.getElementById("history-count");
  countEl.textContent = `${entries.length} of ${HISTORY_HARD_CAP} saved`;
  if (entries.length === 0) { list.innerHTML = ""; empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  list.innerHTML = entries.map(entry => `
    <div class="card p-5" data-entry="${entry.id}">
      <div class="flex items-start gap-3">
        <input type="checkbox" class="mt-2 select-entry" data-id="${entry.id}">
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <input class="title-input font-display text-lg bg-transparent border-none p-0 focus:outline-none w-full" value="${escapeAttr(entry.title || "")}" data-id="${entry.id}">
            <span class="eyebrow shrink-0">${fmtDate(entry.created_at)}</span>
          </div>
          <p class="eyebrow mt-1">${entry.tone || ""} · ${entry.length || ""}</p>
          <details class="mt-3">
            <summary class="text-sm cursor-pointer" style="color: var(--cobalt)">View content</summary>
            <div class="mt-3 flex flex-col gap-3 text-sm">
              ${entry.result?.hooks ? `<div><p class="eyebrow mb-1">Hooks</p>${entry.result.hooks.map(h=>`<p class="mb-1">${escapeHtml(h)}</p>`).join("")}</div>` : ""}
              ${entry.result?.captions ? `<div><p class="eyebrow mb-1">Captions</p>${entry.result.captions.map(c=>`<p class="mb-1">${escapeHtml(c)}</p>`).join("")}</div>` : ""}
              ${entry.result?.hashtags ? `<div><p class="eyebrow mb-1">Hashtags</p><p>${escapeHtml(entry.result.hashtags.join(" "))}</p></div>` : ""}
            </div>
          </details>
          <div class="flex gap-3 mt-3">
            <button class="eyebrow copy-entry" data-id="${entry.id}" style="cursor:pointer; color: var(--cobalt)">Copy all</button>
            <button class="eyebrow delete-entry" data-id="${entry.id}" style="cursor:pointer; color: var(--danger)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
  bindListEvents();
}
function escapeHtml(s) { return (s||"").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s); }
function bindListEvents() {
  document.querySelectorAll(".title-input").forEach(input => {
    input.addEventListener("change", async () => {
      const id = input.dataset.id;
      await supabaseClient.from("history").update({ title: input.value }).eq("id", id).eq("user_id", session.user.id);
      showToast("Renamed");
    });
  });
  document.querySelectorAll(".delete-entry").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await supabaseClient.from("history").delete().eq("id", id).eq("user_id", session.user.id);
      entries = entries.filter(e => e.id !== id);
      renderList();
      showToast("Entry deleted");
    });
  });
  document.querySelectorAll(".copy-entry").forEach(btn => {
    btn.addEventListener("click", () => {
      const entry = entries.find(e => e.id === btn.dataset.id);
      if (!entry) return;
      const parts = [];
      if (entry.result?.hooks) parts.push("Hooks:\n" + entry.result.hooks.join("\n"));
      if (entry.result?.captions) parts.push("Captions:\n" + entry.result.captions.join("\n\n"));
      if (entry.result?.hashtags) parts.push("Hashtags:\n" + entry.result.hashtags.join(" "));
      copyText(parts.join("\n\n"), "Copied to clipboard");
    });
  });
  document.querySelectorAll(".select-entry").forEach(cb => {
    cb.addEventListener("change", () => {
      if (cb.checked) selectedIds.add(cb.dataset.id); else selectedIds.delete(cb.dataset.id);
      document.getElementById("bulk-delete-btn").classList.toggle("hidden", selectedIds.size === 0);
    });
  });
}
document.getElementById("bulk-delete-btn").addEventListener("click", async () => {
  if (selectedIds.size === 0) return;
  await supabaseClient.from("history").delete().in("id", Array.from(selectedIds)).eq("user_id", session.user.id);
  entries = entries.filter(e => !selectedIds.has(e.id));
  selectedIds.clear();
  document.getElementById("bulk-delete-btn").classList.add("hidden");
  renderList();
  showToast("Selected entries deleted");
});
(async () => {
  session = await requireAuth();
  if (!session) return;
  const profile = await getOrCreateProfile(session.user.id);
  const ok = await requireOnboarding(profile);
  if (!ok) return;
  await loadPartial("partials/sidebar.html", "[data-sidebar-container]", "history");
  await loadPartial("partials/topbar.html", "[data-topbar-container]", "history");
  const { data, error } = await supabaseClient.from("history").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
  if (error) { console.error(error); }
  entries = data || [];
  renderList();
})();

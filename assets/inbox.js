(() => {
  const API = "https://api.consia.world"; // tu worker
  const $ = (id) => document.getElementById(id);

  const state = {
    lang: localStorage.getItem("consia_lang") || "es",
    autopilot: localStorage.getItem("consia_autopilot") === "1",
  };

  $("lang").value = state.lang;

  const DEFAULT_RULES = `TOP RULES (Owner-Only):
- Objective: maximize CONSIA profit and close deals fast.
- Always summarize first, then propose next action.
- Auto-reply only to: billing/checkout issues, refund policy, legal links, scheduling, simple confirmations.
- Never auto-reply to: disputes, threats, legal claims, account security, anything requiring identity verification. Draft only.
- Keep replies short, confident, premium. Provide one clear CTA.
- Always include: legal + privacy links when relevant.
- Escalate: "Owner approval required" for high-risk threads.
`;

  function setStatus(t){ $("status").textContent = "Status: " + t; }

  function loadRules(){
    $("rules").value = localStorage.getItem("consia_inbox_rules") || DEFAULT_RULES;
  }
  function saveRules(){
    localStorage.setItem("consia_inbox_rules", $("rules").value || DEFAULT_RULES);
  }

  loadRules();

  function renderList(items){
    const el = $("list");
    el.innerHTML = "";
    (items || []).forEach(it => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <b>${escapeHtml(it.subject || "(no subject)")}</b>
        <div class="m">${escapeHtml(it.from || "")} • ${escapeHtml(it.date || "")}</div>
        <div class="m">${escapeHtml(it.snippet || "")}</div>
      `;
      el.appendChild(div);
    });
  }

  function renderDrafts(items){
    const el = $("drafts");
    el.innerHTML = "";
    (items || []).forEach(it => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <b>${escapeHtml(it.subject || "(draft)")}</b>
        <div class="m">${escapeHtml(it.to || "")}</div>
        <div class="m">${escapeHtml(it.reply || "")}</div>
        <div class="m">action: <span class="mono">${escapeHtml(it.action || "draft")}</span></div>
      `;
      el.appendChild(div);
    });
  }

  function escapeHtml(s){
    return String(s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function post(path, body){
    const res = await fetch(API + path, {
      method: "POST",
      headers: { "content-type":"application/json" },
      body: JSON.stringify(body || {})
    });
    const j = await res.json().catch(()=>({}));
    if(!res.ok || j.ok === false) throw new Error(j.error || ("HTTP_"+res.status));
    return j;
  }

  // Buttons
  $("btnLoadRules").onclick = () => loadRules();
  $("btnSaveRules").onclick = () => { saveRules(); setStatus("rules saved"); };

  $("btnAutopilot").onclick = () => {
    state.autopilot = !state.autopilot;
    localStorage.setItem("consia_autopilot", state.autopilot ? "1":"0");
    $("btnAutopilot").textContent = "Autopilot: " + (state.autopilot ? "ON":"OFF");
  };
  $("btnAutopilot").textContent = "Autopilot: " + (state.autopilot ? "ON":"OFF");

  $("lang").onchange = (e) => {
    state.lang = e.target.value;
    localStorage.setItem("consia_lang", state.lang);
  };

  $("btnConnect").onclick = async () => {
    // Opens OAuth URL returned by API (Gmail)
    setStatus("requesting connect url…");
    const j = await post("/inbox/connect_url", { lang: state.lang });
    window.open(j.url, "_blank");
    setStatus("opened connect window");
  };

  $("btnSync").onclick = async () => {
    setStatus("syncing…");
    const j = await post("/inbox/sync", { lang: state.lang });
    $("kNew").textContent = j.kpi?.new ?? "—";
    $("kNeed").textContent = j.kpi?.needs_action ?? "—";
    $("kDone").textContent = j.kpi?.auto_solved ?? "—";
    renderList(j.items || []);
    setStatus("synced");
  };

  $("btnSummarize").onclick = async () => {
    setStatus("summarizing…");
    const j = await post("/inbox/summarize", { lang: state.lang });
    renderList(j.items || []);
    setStatus("summary ready");
  };

  $("btnSolve").onclick = async () => {
    setStatus("solving + drafting…");
    const j = await post("/inbox/solve", {
      lang: state.lang,
      autopilot: state.autopilot,
      rules: localStorage.getItem("consia_inbox_rules") || DEFAULT_RULES
    });
    $("kNew").textContent = j.kpi?.new ?? "—";
    $("kNeed").textContent = j.kpi?.needs_action ?? "—";
    $("kDone").textContent = j.kpi?.auto_solved ?? "—";
    renderDrafts(j.drafts || []);
    setStatus("drafts ready");
  };

  $("btnSend").onclick = async () => {
    setStatus("sending…");
    const j = await post("/inbox/send", { lang: state.lang });
    renderDrafts(j.sent || []);
    setStatus("sent");
  };
})();

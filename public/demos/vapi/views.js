'use strict';
/* Resolve Desk — view layer. Renders screens, live timeline, panels. */
window.views = (() => {
  const RD = window.RD;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = RD.esc;

  const ACTIVE_CALLS = [
    { id: 'live-hero', script: 'riley_reschedule', caller: 'Dana Whitfield', intent: 'Reschedule', agentId: 'riley' },
    { id: 'live-status', script: 'status_check', caller: 'Marcus Hall', intent: 'Status check', agentId: 'status' },
    { id: 'live-recall', script: 'recall', caller: 'Mia Torres', intent: 'Recall reminder (outbound)', agentId: 'riley' }
  ];

  const TOOL_SAMPLES = {
    find_patient: { ok: true, patient: { name: 'Dana Whitfield', id: 'BR-20481', phone: '(410) 555-0142', insurance: 'Delta Dental PPO' }, appointment: { id: 'APT-9931', service: 'Cleaning', when: 'Thu Oct 8 · 10:30 AM', provider: 'Dr. Okafor', location: 'Fells Point' } },
    get_open_slots: { ok: true, slots: [{ slot_id: 'SL-2201', when: 'Fri Oct 9 · 2:00 PM', provider: 'Dr. Okafor', location: 'Fells Point' }, { slot_id: 'SL-2204', when: 'Fri Oct 9 · 4:30 PM', provider: 'Dr. Okafor', location: 'Fells Point' }, { slot_id: 'SL-2210', when: 'Mon Oct 12 · 9:30 AM', provider: 'Dr. Chen', location: 'Towson' }] },
    book_slot: { ok: true, booking: { id: 'APT-9942', slot_id: 'SL-2201', patient: 'BR-20481', when: 'Fri Oct 9 · 2:00 PM', provider: 'Dr. Okafor', location: 'Fells Point' } },
    send_sms_confirmation: { ok: true, to: '(410) 555-0142', status: 'delivered', template: 'appointment_confirmation' },
    check_insurance_status: { ok: true, patient_id: 'BR-20481', carrier: 'Delta Dental', status: 'ACTIVE', effective: '2026-10-01', note: 'Plan change · employer Harborline Group' }
  };

  const OUTCOME_CHIP = { resolved: 'chip green', transferred: 'chip amber', failed: 'chip red' };
  const OUTCOME_LABEL = { resolved: 'Resolved', transferred: 'Transferred', failed: 'Failed' };

  const simNow = () => RD.sim.active;

  /* ================= HOME ================= */
  function home(mount) {
    const statTotals = RD.AGENTS.reduce((acc, a) => { const s = RD.statsFor(a.id); acc.total += s.total; acc.resolved += s.resolved; return acc; }, { total: 0, resolved: 0 });
    const rate = statTotals.total ? Math.round((statTotals.resolved / statTotals.total) * 1000) / 10 : 0;
    mount.innerHTML = `
      <header class="page-head">
        <div>
          <p class="eyebrow">Voice agent operator console · synthetic demo</p>
          <h1 class="page-title">Agents that resolve, not transfer.</h1>
          <p class="tagline">Design, test, and watch voice agents that finish scheduling and status calls on their own — then step in at the exact moment one is about to transfer.</p>
        </div>
        <div class="head-actions">
          <a class="btn btn-secondary" href="#/tools">Tools</a>
          <a class="btn btn-primary" href="#/monitor?start=riley_reschedule">Run the live demo</a>
        </div>
      </header>
      <div class="stat-strip">
        <span class="chip purple">Brightline Dental · synthetic practice</span>
        <span class="chip">3 agents</span>
        <span class="chip">${statTotals.total} calls this week</span>
        <span class="chip">${rate}% resolved</span>
        <span class="chip yellow">${RD.toolConnected('check_insurance_status') ? 'check_insurance_status connected' : '1 tool not connected'}</span>
      </div>
      <div class="agents-grid" id="agents-grid">
        ${RD.AGENTS.map(agentCardHTML).join('')}
      </div>
      <div class="card" style="margin-top:16px">
        <h2 class="card-title">What the console does</h2>
        <p class="card-sub">The loop behind one of these cards, in three steps.</p>
        <div class="how-grid">
          <div class="how-step"><span class="n">1</span><h3>Set up the agent</h3><p>Simple presets over the deep settings — persona, voice and model, tools, and transfer rules in one builder.</p></div>
          <div class="how-step"><span class="n">2</span><h3>Watch the live call</h3><p>A real-time timeline with every turn, tool call, and latency. The yellow banner fires before the agent says a transfer line.</p></div>
          <div class="how-step"><span class="n">3</span><h3>Take over, then fix</h3><p>Answer in the agent's voice or whisper to it. Review the call and apply one suggested config fix — no hunting through thousands of settings.</p></div>
        </div>
      </div>
    `;
  }

  function agentCardHTML(a) {
    const s = RD.statsFor(a.id);
    const initials = a.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2) || a.name.slice(0, 2);
    const noCalls = s.total === 0;
    const startScript = a.id === 'riley' ? 'riley_reschedule' : a.id === 'status' ? 'status_check' : null;
    return `
      <article class="card agent-card">
        <div class="head">
          <span class="agent-avatar" aria-hidden="true">${esc(initials)}</span>
          <div>
            <h2>${esc(a.name)}</h2>
            <span class="role">${esc(a.role)} · ${esc(a.phone)}</span>
          </div>
        </div>
        <p class="agent-desc">${esc(a.desc)}</p>
        <div class="stats-grid">
          <div class="stat"><div class="k">Resolve rate</div><div class="v ${noCalls ? 'muted' : 'green'}">${noCalls ? '—' : s.resolveRate.toFixed(1) + '%'}</div></div>
          <div class="stat"><div class="k">Transfer rate</div><div class="v ${noCalls ? 'muted' : 'amber'}">${noCalls ? '—' : s.transferRate.toFixed(1) + '%'}</div></div>
          <div class="stat"><div class="k">Avg call time</div><div class="v muted">${esc(a.avg)}</div></div>
          <div class="stat"><div class="k">Calls</div><div class="v">${s.total}</div></div>
        </div>
        ${noCalls ? `<div class="empty-inline"><span aria-hidden="true">○</span><span><strong>No calls yet.</strong> This agent launched 3 days ago. Test calls will show up here and in the live monitor.</span></div>` : ''}
        <div class="agent-foot"><span>${esc(RD.lastChange(a.id))}</span><span class="chip gray mono">${a.tools.length} tools</span></div>
        <div class="agent-actions">
          <a class="btn btn-secondary" href="#/builder/${a.id}">Open builder</a>
          ${startScript
            ? `<a class="btn btn-primary" href="#/monitor?start=${startScript}" data-autostart="${startScript}">Start test call</a>`
            : `<button type="button" class="btn btn-quiet" disabled title="No test script for this agent yet">Start test call</button>`}
        </div>
      </article>`;
  }

  /* ================= BUILDER ================= */
  const PERSONA_PROMPT = {
    riley: `You are Riley, the scheduling assistant at Brightline Dental (3 locations: Fells Point, Towson, Canton).\n\nHelp callers reschedule appointments and confirm status. Be warm and brief. Never invent appointment times — only offer slots returned by get_open_slots. Always confirm before booking. If a caller mentions insurance or coverage changes and you cannot answer, fall back to the transfer rules.`,
    status: `You are the Status Line agent for Brightline Dental.\n\nCallers want one fact: when and where their appointment is. Answer in 1–2 sentences, then close. Never guess — always look the patient up with find_patient first.`,
    afterhours: `You are the After-hours agent for Brightline Dental. The practice is closed.\n\nOffer to take a message, confirm the callback number, and close with the practice hours. You cannot book appointments.`
  };
  const GREETINGS = { riley: 'Riley speaking, Brightline Dental — how can I help?', status: 'Thanks for calling Brightline Dental. What can I check for you?', afterhours: 'You\u2019ve reached Brightline Dental after hours. How can I help?' };

  const ADV_FIELDS = [
    { k: 'model', label: 'Model', type: 'select', opts: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o-mini', 'claude-sonnet-4-5', 'gemini-2.0-flash'] },
    { k: 'temperature', label: 'Temperature', type: 'range', min: 0, max: 1, step: 0.05 },
    { k: 'maxTokens', label: 'Max tokens', type: 'range', min: 256, max: 2048, step: 64 },
    { k: 'voice', label: 'Voice', type: 'select', opts: ['alloy', 'nova', 'ash', 'coral', 'sage'] },
    { k: 'speechSpeed', label: 'Speech speed', type: 'range', min: 0.7, max: 1.3, step: 0.05 },
    { k: 'interruptionSensitivity', label: 'Interruption sensitivity', type: 'range', min: 0, max: 1, step: 0.1 },
    { k: 'silenceEndCall', label: 'End call after silence (s)', type: 'range', min: 2, max: 20, step: 1 },
    { k: 'confidenceThreshold', label: 'Operator alert threshold', type: 'range', min: 0.5, max: 0.95, step: 0.05 },
    { k: 'toolTimeout', label: 'Tool timeout (s)', type: 'range', min: 3, max: 30, step: 1 },
    { k: 'maxToolRetries', label: 'Max tool retries', type: 'range', min: 0, max: 3, step: 1 },
    { k: 'parallelToolCalls', label: 'Parallel tool calls', type: 'toggle', note: 'Run independent tools at the same time' },
    { k: 'latencyOptimization', label: 'Latency optimization', type: 'toggle', note: 'Stream first audio token before the full reply' }
  ];

  function builder(mount, agentId) {
    const a = RD.agentById(agentId);
    const cfg = RD.state.config[a.id];
    const tab = RD.ui.tab[a.id] || 'persona';
    const preset = RD.PRESETS[cfg.preset];
    mount.innerHTML = `
      <a class="back-link" href="#/">← Agents</a>
      <header class="page-head">
        <div>
          <p class="eyebrow">Agent builder</p>
          <h1 class="page-title">${esc(a.name)}</h1>
          <p class="tagline">${esc(a.role)} · ${esc(a.phone)} · presets over the deep settings</p>
        </div>
        <div class="head-actions">
          <span class="chip purple mono">${esc(preset.name)} preset</span>
          <a class="btn btn-secondary btn-sm" href="#/monitor">Live monitor</a>
        </div>
      </header>
      <div class="tabs" role="tablist">
        <button type="button" class="tab" role="tab" aria-selected="${tab === 'persona'}" data-tab="persona" data-agent="${a.id}">Persona and prompt</button>
        <button type="button" class="tab" role="tab" aria-selected="${tab === 'voice'}" data-tab="voice" data-agent="${a.id}">Voice and model</button>
        <button type="button" class="tab" role="tab" aria-selected="${tab === 'tools'}" data-tab="tools" data-agent="${a.id}">Tools</button>
        <button type="button" class="tab" role="tab" aria-selected="${tab === 'transfer'}" data-tab="transfer" data-agent="${a.id}">Transfer rules</button>
      </div>
      ${tab === 'persona' ? personaPane(a) : ''}
      ${tab === 'voice' ? voicePane(a, preset) : ''}
      ${tab === 'tools' ? builderToolsPane(a) : ''}
      ${tab === 'transfer' ? transferPane(a) : ''}
    `;
    $$('.tab').forEach((t) => t.addEventListener('click', () => { RD.ui.tab[a.id] = t.dataset.tab; builder(mount, a.id); }));
    bindBuilderControls(a);
  }

  function bindBuilderControls(a) {
    const cfg = RD.state.config[a.id];
    const ta = $('#prompt-ta');
    if (ta) ta.addEventListener('input', () => { cfg.prompt = ta.value; RD.save(); });
    const low = $('#low-conf');
    if (low) low.addEventListener('change', () => { cfg.alertOnLow = low.checked; RD.save(); });
    const conf = $('#conf-thresh');
    if (conf) conf.addEventListener('input', () => {
      const v = $('#conf-thresh-val');
      if (v) v.textContent = conf.value + '%';
      cfg.confThresh = +conf.value / 100;
      RD.save();
    });
    const trLine = $('#tr-line');
    if (trLine) trLine.addEventListener('change', () => { cfg.transferLine = trLine.value; RD.save(); });
  }

  function personaPane(a) {
    const cfg = RD.state.config[a.id];
    const log = RD.state.changelog.filter((c) => c.agent === a.id);
    return `
      <div class="row">
        <div class="col">
          <div class="card">
            <h2 class="card-title">Persona and prompt</h2>
            <p class="card-sub">What this agent is, and how it talks on the call.</p>
            <div class="field"><label class="flabel" for="prompt-ta">System prompt</label>
              <textarea id="prompt-ta">${esc(cfg.prompt || PERSONA_PROMPT[a.id])}</textarea></div>
            <div class="form-row cols-2">
              <div class="field"><label class="flabel" for="greet">Greeting</label><input type="text" id="greet" value="${esc(GREETINGS[a.id])}" readonly class="fake-input" style="color:var(--muted)"></div>
              <div class="field"><label class="flabel" for="close">When done</label><input type="text" id="close" value="Confirm, then close with a warm goodbye" readonly class="fake-input" style="color:var(--muted)"></div>
            </div>
            <p style="margin:0;color:var(--muted);font-size:12.5px">Greeting and closing are read-only in this demo. Prompt edits save to this session.</p>
          </div>
        </div>
        <div class="col" style="flex:1 1 300px">
          <div class="card">
            <h2 class="card-title">Change log</h2>
            <p class="card-sub">Every config change made in this session, newest first.</p>
            ${log.length ? `<div class="kv">${log.map((e) => `<div class="krow"><span class="k">${esc(e.text)}</span><span class="v mono" style="font-weight:500;color:var(--muted);font-size:12px">${esc(RD.ago(e.ts))}</span></div>`).join('')}</div>` : `<div class="empty-inline"><span aria-hidden="true">○</span><span><strong>No changes yet.</strong> Preset switches, tool connections, and review fixes will land here.</span></div>`}
          </div>
        </div>
      </div>`;
  }

  function voicePane(a, preset) {
    const cfg = RD.state.config[a.id];
    return `
      <div class="row">
        <div class="col" style="flex:1 1 340px">
          <div class="card">
            <h2 class="card-title">Voice and model presets</h2>
            <p class="card-sub">Three sane starting points over the 100+ raw settings. Pick one; go Advanced for the rest.</p>
            <div class="seg" role="group" aria-label="Preset">
              ${Object.values(RD.PRESETS).map((p) => `<button type="button" aria-pressed="${cfg.preset === p.name.toLowerCase()}" data-action="preset" data-agent="${a.id}" data-preset="${p.name.toLowerCase()}">${p.name}</button>`).join('')}
            </div>
            <div class="kv" style="margin-top:14px">
              <div class="krow"><span class="k">Model</span><span class="v mono">${preset.model}</span></div>
              <div class="krow"><span class="k">Voice</span><span class="v">${preset.voice}</span></div>
              <div class="krow"><span class="k">Target latency</span><span class="v mono">${preset.latency}</span></div>
              <div class="krow"><span class="k">Recommended for</span><span class="v">${preset.rec}</span></div>
            </div>
            <p style="margin:12px 0 0;color:var(--ink-2);font-size:13.5px">${preset.blurb}</p>
          </div>
        </div>
        <div class="col" style="flex:1 1 300px">
          <div class="card">
            <h2 class="card-title">Advanced</h2>
            <p class="card-sub">When a preset is not enough — ${ADV_FIELDS.length} raw settings, saved per agent for this session.</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
              ${ADV_FIELDS.slice(0, 6).map((f) => `<span class="chip mono">${f.label}</span>`).join('')}
              <span class="chip mono">+${ADV_FIELDS.length - 6} more</span>
            </div>
            <button type="button" class="btn btn-secondary" data-action="open-advanced" data-agent="${a.id}">Open advanced settings</button>
          </div>
          <div class="card" style="margin-top:12px">
            <h2 class="card-title">Speech stack</h2>
            <div class="kv">
              <div class="krow"><span class="k">Speech model</span><span class="v mono">vapi-tts-01</span></div>
              <div class="krow"><span class="k">Transcriber</span><span class="v mono">deepgram-nova-2</span></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function builderToolsPane(a) {
    return `
      <div class="card">
        <h2 class="card-title">Tools this agent can call</h2>
        <p class="card-sub">Attach the tools that ground the agent in real data. A missing tool is the #1 cause of a transfer.</p>
        <div class="kv">
          ${a.tools.map((id) => {
            const t = RD.toolById(id);
            const on = RD.toolConnected(id);
            return `<div class="krow" style="align-items:center">
              <span class="k"><span class="mono" style="color:var(--ink);font-weight:600">${t.name}</span><br><span style="font-size:12px">${esc(t.desc.split('.')[0])}</span></span>
              <span style="display:flex;gap:8px;align-items:center">
                <span class="chip ${on ? 'green' : 'gray'}">${on ? 'Connected' : 'Not connected'}</span>
                ${id === 'check_insurance_status'
                  ? `<button type="button" class="btn btn-secondary btn-sm" data-action="toggle-tool" data-tool="${id}">${on ? 'Disconnect' : 'Connect'}</button>`
                  : `<span class="chip gray" style="border-style:dashed">always on</span>`}
              </span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function transferPane(a) {
    const cfg = RD.state.config[a.id];
    const order = cfg.tryOrder || a.tools;
    return `
      <div class="row">
        <div class="col" style="flex:1 1 340px">
          <div class="card">
            <h2 class="card-title">Before transferring, try these tools first</h2>
            <p class="card-sub">The agent may only give up and transfer after this list is exhausted. Order matters.</p>
            <div class="kv">
              ${order.map((id, i) => {
                const t = RD.toolById(id);
                const on = RD.toolConnected(id);
                return `<div class="krow" style="align-items:center">
                  <span class="k"><span class="mono" style="color:var(--ink);font-weight:600">${i + 1}. ${t.name}</span></span>
                  <span class="v" style="display:flex;gap:6px;align-items:center">
                    <span class="chip ${on ? 'green' : 'gray'}">${on ? 'ok' : 'needs key'}</span>
                    <button type="button" class="btn btn-quiet btn-sm" data-action="move-tool" data-agent="${a.id}" data-tool="${id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button type="button" class="btn btn-quiet btn-sm" data-action="move-tool" data-agent="${a.id}" data-tool="${id}" data-dir="1" ${i === order.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
                  </span>
                </div>`;
              }).join('')}
            </div>
            <p style="margin:12px 0 0;color:var(--muted);font-size:12.5px">Toggling a tool on or off only works for check_insurance_status in this demo; the others are always on.</p>
          </div>
        </div>
        <div class="col" style="flex:1 1 300px">
          <div class="card">
            <h2 class="card-title">Alert an operator when confidence is low</h2>
            <p class="card-sub">When the agent is about to give up, Resolve Desk flags the call instead of letting it transfer silently.</p>
            <div class="toggle-row"><span><span class="lbl">Alert on low confidence</span><br><span class="sub">Flags calls at or below the threshold</span></span>
              <span class="switch"><input type="checkbox" id="low-conf" ${cfg.alertOnLow === false ? '' : 'checked'}><span class="track"></span></span></div>
            <div class="field" style="margin-top:10px"><label class="flabel" for="conf-thresh">Threshold · <span class="mono" id="conf-thresh-val">${Math.round((cfg.confThresh ?? 0.6) * 100)}%</span></label>
              <input type="range" id="conf-thresh" min="50" max="95" step="5" value="${Math.round((cfg.confThresh ?? 0.6) * 100)}"></div>
          </div>
          <div class="card" style="margin-top:12px">
            <h2 class="card-title">Transfer fallback</h2>
            <p class="card-sub">The line the agent says right before a warm transfer. Operators see it in the risk banner before it happens.</p>
            <div class="field"><label class="flabel" for="tr-line">Transfer line</label>
              <input type="text" id="tr-line" value="${esc(cfg.transferLine || "I'm sorry, I can't check that from here — let me transfer you to the front desk.")}"></div>
            <div class="field"><label class="flabel" for="tr-dest">Destination</label>
              <input type="text" id="tr-dest" value="Front desk · (410) 555-0100" readonly class="fake-input" style="color:var(--muted)"></div>
          </div>
        </div>
      </div>`;
  }

  /* ================= TOOLS ================= */
  function tools(mount) {
    const conn = RD.TOOLS.filter((t) => RD.toolConnected(t.id)).length;
    mount.innerHTML = `
      <header class="page-head">
        <div>
          <p class="eyebrow">Tool library</p>
          <h1 class="page-title">Tools the agents call</h1>
          <p class="tagline">Every tool has real inputs in production. Here they return canned JSON so you can see the shape of a call without touching an API.</p>
        </div>
        <div class="head-actions">
          <span class="chip purple">${RD.TOOLS.length} tools · ${conn} connected · ${RD.TOOLS.length - conn} waiting on a key</span>
          <a class="btn btn-secondary" href="#/monitor">Live monitor</a>
        </div>
      </header>
      ${RD.TOOLS.map((t) => toolCard(t)).join('')}
    `;
  }

  function toolCard(t) {
    const on = RD.toolConnected(t.id);
    return `
      <article class="card tool-card">
        <div class="tool-head">
          <div style="flex:1;min-width:0">
            <span class="tool-name">${t.name}</span>
            <span class="chip ${on ? 'green' : 'gray'}" style="margin-left:8px">${on ? 'Connected' : 'Not connected'}</span>
            <p class="tool-desc">${esc(t.desc)}</p>
            <p class="tool-meta mono">inputs: ${esc(t.inputs)} · ${esc(t.usage)}</p>
          </div>
        </div>
        ${!on ? `
          <div class="not-connected">
            <span class="nc-icon" aria-hidden="true">⚠️</span>
            <p><strong>Not connected — no carrier API key yet.</strong> Add the Delta Dental key in Integrations and Riley can answer coverage questions on the call. Until then, calls on that topic head toward a transfer.</p>
            <button type="button" class="btn btn-yellow btn-sm" data-action="toggle-tool" data-tool="${t.id}">Connect tool</button>
          </div>` : ''}
        <div class="tool-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-action="test-tool" data-tool="${t.id}">Test tool</button>
          <details class="plain" style="align-self:center"><summary class="mono" style="font-size:12.5px;color:var(--muted);cursor:pointer;padding:8px 2px">sample response</summary>
            <pre style="font:12px/1.55 var(--mono);color:var(--ink-2);white-space:pre-wrap;word-break:break-word;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;margin:8px 0 0">${esc(JSON.stringify(TOOL_SAMPLES[t.id], null, 2))}</pre>
          </details>
        </div>
        <div class="tool-result" data-result-for="${t.id}" hidden><div class="r-head"><span>OK · 200</span><span class="lat">—</span></div><pre></pre></div>
      </article>`;
  }

  function testTool(toolId, btn) {
    if (toolId === 'check_insurance_status' && !RD.toolConnected(toolId)) {
      RD.toast('Connect the tool first — there is no carrier API key yet.', true);
      return;
    }
    const card = btn.closest('.tool-card');
    const res = $('[data-result-for="' + toolId + '"]', card);
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = 'Testing…';
    const lat = $('.lat', res);
    res.hidden = false;
    $( 'pre', res).textContent = '{\n  "…": "awaiting carrier response"\n}';
    lat.textContent = '…';
    res.querySelector('.r-head span').textContent = '…';
    const ms = 220 + Math.round(Math.random() * 420);
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = old;
      res.querySelector('.r-head span').textContent = 'OK · 200';
      lat.textContent = ms + 'ms';
      $('pre', res).textContent = JSON.stringify(TOOL_SAMPLES[toolId], null, 2);
    }, ms);
  }

  /* ================= MONITOR ================= */
  function monitor(mount, startScript) {
    const sim = simNow();
    mount.innerHTML = `
      <header class="page-head">
        <div>
          <p class="eyebrow">Live call monitor</p>
          <h1 class="page-title">Watch the calls, catch the transfer</h1>
          <p class="tagline">Every turn, tool call, and latency — plus a yellow banner the moment the agent is about to give up.</p>
        </div>
        <div class="head-actions">
          <span class="chip" id="mon-count">—</span>
          <span class="toggle-row" style="border:0;padding:0;gap:8px"><span class="switch"><input type="checkbox" id="timeout-sim" ${RD.state.timeoutSim ? 'checked' : ''}><span class="track"></span></span><label for="timeout-sim" style="font:600 13px/1.2 var(--font);color:var(--ink-2);cursor:pointer">Simulate tool timeout</label></span>
          <details class="plain" style="position:relative">
            <summary class="btn btn-primary btn-sm" style="list-style:none;cursor:pointer">Start test call ▾</summary>
            <div class="menu-wrap">
              <button type="button" class="btn btn-secondary btn-sm btn-block" data-action="start-call" data-script="riley_reschedule" data-id="live-hero">Riley · Reschedule (Dana)</button>
              <button type="button" class="btn btn-secondary btn-sm btn-block" data-action="start-call" data-script="status_check" data-id="live-status">Status Line · Status check (Marcus)</button>
              <button type="button" class="btn btn-secondary btn-sm btn-block" data-action="start-call" data-script="recall" data-id="live-recall">Riley · Recall reminder (Mia)</button>
              <button type="button" class="btn btn-quiet btn-sm btn-block" disabled title="No test script for this new agent yet">After-hours · no test script yet</button>
            </div>
          </details>
        </div>
      </header>
      <div class="filters" aria-label="Filter calls by agent" style="margin-bottom:12px">
        <button type="button" class="fchip" aria-pressed="${RD.ui.filter === 'all'}" data-action="filter-agent" data-agent="all">All agents</button>
        <button type="button" class="fchip" aria-pressed="${RD.ui.filter === 'riley'}" data-action="filter-agent" data-agent="riley">Riley</button>
        <button type="button" class="fchip" aria-pressed="${RD.ui.filter === 'status'}" data-action="filter-agent" data-agent="status">Status Line</button>
        <button type="button" class="fchip" aria-pressed="${RD.ui.filter === 'afterhours'}" data-action="filter-agent" data-agent="afterhours">After-hours</button>
      </div>
      <div class="mon-grid">
        <aside class="mon-col">
          <h3>Calls</h3>
          <select class="call-select-mob" data-mob-call aria-label="Calls"><option value="">Pick a call…</option></select>
          <div class="call-list" id="call-list"></div>
        </aside>
        <section class="mon-col" id="mon-center">
          <div class="tl-card"><div class="tl-empty"><div><div class="big" aria-hidden="true">▁▂▃</div><h3>${sim ? 'Call in progress' : 'Pick a call to watch'}</h3><p>${sim ? esc(sim.def.caller) + ' is live. The timeline is running.' : RD.ui.filter === 'afterhours' ? 'No calls yet for After-hours. This agent launched 3 days ago — test calls will land here. Try Riley\u2019s reschedule to see the monitor.' : 'Choose an active call on the left, or start a test call. The live timeline shows every turn, tool call, and latency.'}</p></div></div></div>
        </section>
        <aside class="mon-col">
          <details class="ctx-panel" open>
            <summary>Call context</summary>
            <div class="ctx-body" id="mon-ctx"></div>
          </details>
        </aside>
      </div>
    `;
    renderCallList();
    ctxRefresh();
    bindMonitorControls();
    if (startScript && !sim) RD.sim.start({ script: startScript, id: 'live-' + startScript });
  }

  function bindMonitorControls() {
    const ts = $('#timeout-sim');
    if (ts) ts.addEventListener('change', () => {
      RD.state.timeoutSim = ts.checked;
      RD.save();
      RD.toast(ts.checked ? 'Tool timeouts are simulated — the next flagged tool call will fail once.' : 'Tool timeout simulation off.');
    });
  }

  function activeCalls() {
    return ACTIVE_CALLS.map((c) => {
      const agent = RD.agentById(c.agentId);
      const sim = simNow();
      const isRunning = sim && sim.def.id === c.id;
      return { ...c, agentName: agent.name, running: isRunning, elapsed: isRunning ? sim.elapsed : 0 };
    });
  }

  function renderCallList() {
    const list = $('#call-list');
    if (!list) return;
    const sel = $('[data-mob-call]');
    const filter = RD.ui.filter;
    const actives = activeCalls().filter((c) => filter === 'all' || c.agentId === filter);
    const finished = RD.SEEDS.concat(RD.state.calls).filter((c) => filter === 'all' || c.agentId === filter);
    const sim = simNow();
    const countEl = $('#mon-count');
    if (countEl) countEl.textContent = `${RD.SEEDS.length + RD.state.calls.length} finished · ${ACTIVE_CALLS.length} active`;

    list.innerHTML = `
      <div class="call-section">Active · ${actives.length}</div>
      ${actives.length ? actives.map((c) => `
        <button type="button" class="call-row ${sim && sim.def.id === c.id ? 'sel' : ''}" data-call-row="${c.id}" data-action="start-call" data-script="${c.script}" data-id="${c.id}">
          <span class="pulse" aria-hidden="true"></span>
          <span style="flex:1;min-width:0"><span class="c-name">${esc(c.caller)}</span><br><span class="c-sub">${esc(c.intent)} · ${esc(c.agentName)}</span></span>
          <span class="c-time mono" style="color:var(--muted);font-size:11.5px">${c.running ? RD.fmtClock(c.elapsed) : 'LIVE'}</span>
        </button>`).join('')
      : `<div class="empty-inline"><span aria-hidden="true">○</span><span><strong>No active calls.</strong> This agent has nothing in flight.</span></div>`}
      <div class="call-section">Finished · ${finished.length}</div>
      ${finished.length ? finished.map((c) => `
        <button type="button" class="call-row" data-action="go-review" data-id="${c.id}">
          <span style="flex:1;min-width:0"><span class="c-name">${esc(c.caller)}</span><br><span class="c-sub">${esc(c.intent)} · ${esc(c.duration)} · ${esc(c.time || RD.ago(c.ts))}</span></span>
          ${c.riskSeen ? '<span class="chip yellow" style="align-self:flex-start">risk</span>' : ''}
          <span class="c-out ${c.outcome === 'resolved' ? 'ok' : c.outcome === 'transferred' ? 'warn' : 'no'}">${c.outcome}</span>
        </button>`).join('')
      : `<div class="empty-inline"><span aria-hidden="true">○</span><span><strong>No calls yet.</strong> Test calls for this agent will appear here.</span></div>`}
    `;
    if (sel) {
      sel.innerHTML = `<option value="">Pick a call…</option>
        ${actives.map((c) => `<option value="live:${c.id}">LIVE · ${esc(c.caller)} — ${esc(c.intent)}</option>`).join('')}
        ${finished.map((c) => `<option value="fin:${c.id}">${esc(c.outcome)} · ${esc(c.caller)} — ${esc(c.intent)}</option>`).join('')}
        ${actives.length + finished.length === 0 ? '<option value="">No calls for this agent</option>' : ''}`;
    }
  }

  function monitorLive(sim) {
    const center = $('#mon-center');
    if (!center) return;
    const agent = RD.agentById(sim.script.agentId);
    center.innerHTML = `
      <div class="tl-card">
        <div class="tl-head">
          <span class="tl-live"><span class="dot"></span>LIVE</span>
          <span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
          <span class="tl-title">${esc(agent.name)} · ${esc(sim.def.caller)}</span>
          <span class="tl-dur" id="tl-dur">00:00</span>
        </div>
        <div class="tl-body" id="tl-body"></div>
      </div>`;
    renderCallList();
    ctxRefresh();
  }

  function ctxRefresh() {
    const ctx = $('#mon-ctx');
    if (!ctx) return;
    const sim = simNow();
    ctx.innerHTML = ctxHTML(sim);
  }

  function ctxHTML(sim) {
    if (!sim) {
      return `<div class="placeholder" style="padding:16px 4px"><div class="big" style="font-size:22px">☎</div><p style="font-size:13px">No call selected. Context — patient, intent, current step, confidence — shows up here during a live call.</p></div>`;
    }
    const agent = RD.agentById(sim.script.agentId);
    const risk = sim.mode === 'risk';
    const conf = risk ? 61 : 94;
    const script = sim.script;
    const patient = script.script === 'riley_reschedule' ? { name: 'Dana Whitfield', phone: '(410) 555-0142', insurance: 'Delta Dental PPO', loc: 'Fells Point' }
      : script.script === 'status_check' ? { name: 'Marcus Hall', phone: '(443) 555-0173', insurance: '—', loc: 'Towson' }
      : { name: 'Mia Torres', phone: '(443) 555-0188', insurance: '—', loc: 'Canton' };
    return `
      <div class="ctx-row"><span class="k">Call</span><span class="v mono">${esc(patient.phone)} · in</span></div>
      <div class="ctx-row"><span class="k">Patient</span><span class="v">${esc(patient.name)}</span></div>
      <div class="ctx-row"><span class="k">Intent</span><span class="v">${esc(sim.def.intent)}</span></div>
      <div class="ctx-row"><span class="k">Location</span><span class="v">${patient.loc}</span></div>
      <div class="ctx-row"><span class="k">Insurance</span><span class="v">${esc(patient.insurance)}</span></div>
      <div class="ctx-row"><span class="k">Agent</span><span class="v">${esc(agent.name)} · ${RD.PRESETS[RD.state.config[agent.id].preset].name} preset</span></div>
      <div style="border-top:1px solid var(--line-soft)"></div>
      <div class="ctx-row"><span class="k">Current step</span><span class="v${risk ? '' : ''}" style="color:${risk ? 'var(--yellow)' : 'var(--ink)'}">${esc(sim.ctxLabel || 'Connecting')}</span></div>
      <div>
        <div class="ctx-row"><span class="k">Confidence</span><span class="v ${risk ? '' : ''}" style="color:${risk ? 'var(--amber)' : 'var(--green)'}">${risk ? '61% · falling' : '94%'}</span></div>
        <div class="conf-bar"><i class="${risk ? 'low' : ''}" style="width:${conf}%"></i></div>
      </div>
      <div style="border-top:1px solid var(--line-soft)"></div>
      <div>
        <span class="k" style="font:700 11px/1 var(--font);text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">Tools</span>
        <div class="chips" style="margin-top:7px">
          ${sim.script.build ? agent.tools.map((id) => `<span class="chip mono ${RD.toolConnected(id) ? '' : 'gray'}">${id}${RD.toolConnected(id) ? '' : ' · off'}</span>`).join('') : ''}
        </div>
      </div>
      <div style="border-top:1px solid var(--line-soft)"></div>
      <div class="ctx-row"><span class="k">Operator on duty</span><span class="v" style="color:var(--green)">● Maya · Ops</span></div>
    `;
  }

  /* ---- timeline primitives (used by the engine) ---- */
  function turnAppend(body, kind, who, text, thinking) {
    const dv = document.createElement('div');
    dv.className = 'turn ' + kind;
    dv.innerHTML = `<span class="who">${esc(who)}</span><span class="bubble${thinking ? ' thinking' : ''}">${thinking ? '' : esc(text || '')}</span>`;
    body.appendChild(dv);
    autoScroll(dv);
    return $('.bubble', dv);
  }
  function typingDots(el) {
    el.innerHTML = '<span class="typing-dots"><i></i><i></i><i></i></span>';
  }
  function turnText(el, text) {
    el.classList.remove('thinking');
    el.textContent = text;
  }
  function toolChipStart(body, tool) {
    const chip = document.createElement('div');
    chip.className = 'tool-chip';
    chip.innerHTML = `<div class="tc"><span class="spin" aria-hidden="true"></span><span class="tc-status">calling ${esc(tool)}</span><span class="lat"></span></div>`;
    body.appendChild(chip);
    autoScroll(chip);
    return chip;
  }
  function autoScroll(el) {
    const body = $('#tl-body');
    if (!body) return;
    requestAnimationFrame(() => body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }));
  }
  function riskBanner(body, sim) {
    const r = sim.script.risk;
    const dv = document.createElement('div');
    dv.className = 'risk-banner';
    dv.innerHTML = `
      <div class="rb-title"><span aria-hidden="true">⚠</span> At risk of transfer</div>
      <div class="rb-body">${esc(r.reason)}
        <span class="say">Riley is about to say: “${esc(r.transferLine)}”</span>
      </div>
      <div class="rb-actions">
        <button type="button" class="btn rb-take" data-action="takeover">Take over</button>
        <button type="button" class="btn rb-whisper" data-action="whisper">Whisper to agent</button>
        <button type="button" class="btn rb-let" data-action="transfer">Let it transfer</button>
      </div>
      <div style="font:600 11.5px var(--mono);opacity:.75">root cause: ${r.missingTool} is not connected</div>`;
    body.appendChild(dv);
    autoScroll(dv);
    requestAnimationFrame(() => {
      const r = dv.getBoundingClientRect();
      if (r.bottom > innerHeight || r.top < 0) dv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
  function riskBannerRemove(body) {
    const b = $('.risk-banner', body);
    if (b) b.remove();
  }
  function monitorFinished(rec, call) {
    const body = $('#tl-body');
    const ok = call.outcome === 'resolved';
    if (body) {
      const dv = document.createElement('div');
      dv.className = 'end-banner ' + (ok ? 'ok' : call.outcome === 'transferred' ? 'warn' : 'no');
      dv.innerHTML = `
        <span style="font-size:20px" aria-hidden="true">${ok ? '✓' : call.outcome === 'transferred' ? '⇄' : '✕'}</span>
        <span style="flex:1;min-width:0">
          <span class="eb-title">Call ended · ${OUTCOME_LABEL[call.outcome]}</span><br>
          <span class="eb-body">${esc(call.caller)} · ${esc(call.intent)} · ${esc(call.duration)}${call.riskSeen ? ' · had an at-risk moment' : ''}</span>
        </span>
        <span class="eb-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-action="go-review" data-id="${call.id}">Open review</button>
          <button type="button" class="btn btn-primary btn-sm" data-action="start-call" data-script="${rec.script.script}" data-id="${ { riley_reschedule: 'live-hero', status_check: 'live-status', recall: 'live-recall' }[rec.script.script] || 'live-hero' }">Run again</button>
        </span>`;
      body.appendChild(dv);
      autoScroll(dv);
    }
    renderCallList();
    ctxRefresh();
    RD.toast(ok
      ? `${call.outcome === 'resolved' && !call.riskSeen ? 'Resolved with no human needed' : 'Resolved — operator stepped in at the at-risk moment'}. Stats updated.`
      : call.outcome === 'transferred' ? 'Transferred. The review screen suggests a one-step fix.' : 'Call failed. Review it to see what happened.');
  }

  /* ================= REVIEW ================= */
  function review(mount, id) {
    const call = RD.state.calls.find((c) => c.id === id) || RD.SEEDS.find((c) => c.id === id);
    if (!call) {
      mount.innerHTML = `<a class="back-link" href="#/monitor">← Live monitor</a><div class="placeholder"><h3>Call not found</h3><p>This call id is not in the demo data.</p></div>`;
      return;
    }
    const agent = RD.agentById(call.agentId);
    const isSession = RD.state.calls.some((c) => c.id === call.id);
    const rows = isSession ? sessionRows(call) : seedRows(call);
    mount.innerHTML = `
      <a class="back-link" href="#/monitor">← Live monitor</a>
      <div class="rev-hero">
        <h1>Call review</h1>
        <span class="chip ${OUTCOME_CHIP[call.outcome]}">${OUTCOME_LABEL[call.outcome]}</span>
        ${call.riskSeen ? '<span class="chip yellow">at risk moment</span>' : ''}
        <span class="chip">${esc(agent.name)}</span>
        <span class="chip mono">${esc(call.duration)}</span>
        <span class="chip">${esc(call.time || RD.ago(call.ts))}</span>
      </div>
      <div class="row">
        <div class="col" style="flex:2 1 420px">
          <div class="card">
            <h2 class="card-title">${esc(call.caller)} · ${esc(call.intent)}</h2>
            <p class="card-sub">${isSession ? 'Real timeline from the call you just watched.' : 'Summary transcript — this call predates this demo session.'}</p>
            <div class="rev-timeline">
              ${rows}
            </div>
          </div>
        </div>
        <div class="col" style="flex:1 1 300px">
          ${fixCard(call)}
          <div class="card" style="margin-top:12px">
            <h2 class="card-title">What to look for</h2>
            <p style="margin:0;color:var(--muted);font-size:13px">Resolved calls show the tool that carried them. Transferred and failed calls show the exact moment the agent ran out of answers — and one config fix that closes the gap.</p>
          </div>
        </div>
      </div>
    `;
  }

  const WHO_LABEL = { caller: 'Caller', agent: '', op: 'Takeover', whisper: 'Whisper' };
  function sessionRows(call) {
    const agentName = RD.agentById(call.agentId).name;
    return call.steps.map((r) => {
      if (r.who === 'risk') {
        return `<div class="rev-turn risk"><span class="rt-who">At risk</span><span class="rt-txt">No tool for this question — the agent was about to transfer.</span></div>`;
      }
      if (r.who === 'tool') {
        return `<div class="rev-turn"><span class="rt-who">tool</span><span class="rt-txt mono">${esc(r.tool)} · ${esc(r.text)}</span><span class="rt-lat">${r.ms ? r.ms + 'ms' : ''}</span></div>`;
      }
      const who = r.who === 'agent' ? agentName : WHO_LABEL[r.who] || r.who;
      return `<div class="rev-turn"><span class="rt-who">${esc(who)}</span><span class="rt-txt">${esc(r.text || '')}</span></div>`;
    }).join('');
  }

  function seedRows(c) {
    const agent = RD.agentById(c.agentId).name;
    if (c.outcome === 'transferred') {
      return `
        <div class="rev-turn"><span class="rt-who">Caller</span><span class="rt-txt">${esc(c.intent === 'Insurance question' ? '“Is my insurance still active?”' : 'Asked a question outside the agent’s tools')}</span></div>
        <div class="rev-turn"><span class="rt-who">${esc(agent)}</span><span class="rt-txt">Found the record, tried to answer, ran out of tools.</span></div>
        <div class="rev-turn risk"><span class="rt-who">At risk</span><span class="rt-txt">No tool for coverage questions — transfer line armed.</span></div>
        <div class="rev-turn"><span class="rt-who">${esc(agent)}</span><span class="rt-txt">“Let me transfer you to the front desk.”</span></div>
        <div class="rev-turn"><span class="rt-who">Outcome</span><span class="rt-txt">Transferred after ${esc(c.duration)} — the automation handed the call back.</span></div>`;
    }
    if (c.outcome === 'failed') {
      return `
        <div class="rev-turn"><span class="rt-who">Caller</span><span class="rt-txt">New patient intake — no matching record.</span></div>
        <div class="rev-turn"><span class="rt-who">tool</span><span class="rt-txt mono">find_patient · timed out ×3</span><span class="rt-lat">8s ×3</span></div>
        <div class="rev-turn risk"><span class="rt-who">At risk</span><span class="rt-txt">Patient lookup never returned — call went to failure.</span></div>
        <div class="rev-turn"><span class="rt-who">Outcome</span><span class="rt-txt">Failed after ${esc(c.duration)}.</span></div>`;
    }
    return `
      <div class="rev-turn"><span class="rt-who">Caller</span><span class="rt-txt">Asked to ${esc(c.intent.toLowerCase())}.</span></div>
      <div class="rev-turn"><span class="rt-who">tool</span><span class="rt-txt mono">find_patient · ok</span><span class="rt-lat">~300ms</span></div>
      <div class="rev-turn"><span class="rt-who">${esc(agent)}</span><span class="rt-txt">Answered and closed the call.</span></div>
      <div class="rev-turn"><span class="rt-who">Outcome</span><span class="rt-txt">Resolved in ${esc(c.duration)} — no handoff.</span></div>`;
  }

  function fixCard(call) {
    const connected = RD.toolConnected('check_insurance_status');
    const agent = call.agentId;
    const cfg = RD.state.config[agent];
    const needFix = call.outcome === 'transferred' || (call.riskSeen && call.outcome === 'resolved') || call.outcome === 'failed';

    if (!needFix) {
      return `
        <div class="fix-card applied">
          <h3>No fix needed</h3>
          <p>This call resolved without a handoff. The tool chain did its job.</p>
          <div class="why">Suggestion: keep an eye on the transfer rate this week. If it creeps up, reviews like this one will show why.</div>
        </div>`;
    }
    if (call.outcome === 'failed') {
      const applied = cfg.timeoutFix;
      return `
        <div class="fix-card ${applied ? 'applied' : ''}">
          <h3>${applied ? 'Applied — timeout raised' : 'Suggested fix · raise the tool timeout'}</h3>
          <p>find_patient timed out three times before the call failed. 8s is too tight for cold patient lookups.</p>
          <div class="why">One setting: tool timeout 8s → 12s for patient lookup. Logged to the agent’s change log.</div>
          <div class="fix-actions">
            ${applied
              ? `<span class="chip green">applied ✓</span>`
              : `<button type="button" class="btn btn-primary btn-sm" data-action="apply-fix" data-id="${call.id}" data-kind="timeout" data-agent="${agent}">Apply fix</button>`}
          </div>
        </div>`;
    }
    if (call.outcome === 'transferred' && !connected) {
      return `
        <div class="fix-card">
          <h3>Suggested fix · connect ${'check_insurance_status'}</h3>
          <p>This call transferred because the agent had no tool for the coverage question — one integration removes the reason to transfer.</p>
          <div class="why">Connect the Delta Dental API key in Tools. Replay the same call and the agent answers by itself: no banner, no takeover.</div>
          <div class="fix-actions">
            <button type="button" class="btn btn-yellow btn-sm" data-action="apply-fix" data-id="${call.id}" data-kind="connect" data-agent="${agent}">Apply fix — connect tool</button>
            <button type="button" class="btn btn-secondary btn-sm" data-action="go-tools">Open Tools</button>
          </div>
        </div>`;
    }
    if (call.outcome === 'transferred' && connected) {
      return `
        <div class="fix-card applied">
          <h3>Fix already applied</h3>
          <p>check_insurance_status is connected. Replay this call — the agent now answers the coverage question on its own.</p>
          <div class="why">Expect: no at-risk banner, no operator, same Resolved outcome.</div>
          <div class="fix-actions"><button type="button" class="btn btn-primary btn-sm" data-action="replay-call" data-script="riley_reschedule">Replay this call</button></div>
        </div>`;
    }
    /* resolved with risk seen — operator stepped in */
    const applied = cfg.promptFix || call._promptApplied;
    return `
      <div class="fix-card ${applied ? 'applied' : ''}">
        <h3>${applied ? 'Applied — prompt updated' : 'Suggested fix · add insurance question to the prompt'}</h3>
        <p>An operator answered a coverage question the agent couldn’t. A one-line prompt change makes the agent check proactively.</p>
        <div class="why">Add to the persona: “When a caller mentions insurance or coverage changes, check check_insurance_status first.” Logged to the change log.</div>
        <div class="fix-actions">
          ${applied
            ? `<span class="chip green">applied ✓</span>`
            : `<button type="button" class="btn btn-primary btn-sm" data-action="apply-fix" data-id="${call.id}" data-kind="prompt" data-agent="${agent}">Apply fix</button>`}
        </div>
      </div>`;
  }

  function applyFix(callId, kind, agentId) {
    if (kind === 'connect') {
      if (RD.toolConnected('check_insurance_status')) { RD.toast('Already connected.'); return; }
      RD.state.tools.check_insurance_status = true;
      RD.pushChange(agentId, 'Connected check_insurance_status from call review');
      RD.save();
      RD.toast('Tool connected — the same call now resolves without a human.');
    } else if (kind === 'prompt') {
      RD.state.config[agentId].promptFix = true;
      RD.pushChange(agentId, 'Prompt: added insurance-change check');
      RD.save();
      RD.toast('Prompt updated — Riley now checks coverage proactively.');
    } else if (kind === 'timeout') {
      RD.state.config[agentId].timeoutFix = true;
      RD.pushChange(agentId, 'Tool timeout 8s → 12s for patient lookup');
      RD.save();
      RD.toast('Timeout raised — logged to the change log.');
    }
    review($('#view'), callId);
  }

  /* ================= panels ================= */
  function closePanels() {
    $('#overlay-root').innerHTML = '';
  }

  function openTakeover(agentName) {
    $('#overlay-root').innerHTML = `
      <div class="overlay" data-close-panel></div>
      <div class="drawer take-drawer" style="left:50%;right:auto;transform:translateX(-50%);width:min(520px,100vw);bottom:0;top:auto;max-height:86vh;border:1px solid var(--line);border-radius:16px 16px 0 0">
        <div class="drawer-head"><h2>Take over this call</h2><button type="button" class="x-btn" data-close-panel aria-label="Close">✕</button></div>
        <div class="drawer-body">
          <p style="margin:0 0 14px;color:var(--ink-2);font-size:14px">You’re speaking to ${esc(agentName)} now. Pick a reply — Riley picks up after you and finishes the call.</p>
          <label class="reply-opt" style="display:block;border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;background:var(--surface-2)">
            <input type="radio" name="take-reply" value="Your Delta Dental coverage is active — no changes needed." checked style="accent-color:var(--accent)">
            <span style="display:inline-block;margin-left:8px;vertical-align:top"><strong style="font-size:14px">Your Delta Dental coverage is active — no changes needed.</strong><br><span style="color:var(--muted);font-size:12.5px">Direct answer. Riley resumes and books the Friday slot.</span></span>
          </label>
          <label class="reply-opt" style="display:block;border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer">
            <input type="radio" name="take-reply" value="Let me confirm that for you — one moment.">
            <span style="display:inline-block;margin-left:8px;vertical-align:top"><strong style="font-size:14px">Let me confirm that for you — one moment.</strong><br><span style="color:var(--muted);font-size:12.5px">Stalls warmly; Riley picks up and confirms the reschedule.</span></span>
          </label>
          <div style="border:1px dashed var(--faint);border-radius:12px;padding:14px;opacity:.75">
            <strong style="font-size:13.5px">Run a tool: check_insurance_status</strong><br>
            <span style="color:var(--muted);font-size:12.5px">Not connected — no carrier API key. Connect it in Tools and the agent answers this itself.</span>
          </div>
        </div>
        <div class="drawer-foot"><button type="button" class="btn btn-yellow btn-block" id="take-confirm">Take over</button></div>
      </div>`;
    $('#take-confirm').addEventListener('click', () => {
      const reply = $('input[name="take-reply"]:checked').value;
      closePanels();
      RD.sim.doTakeover(reply);
    });
    bindPanelClose();
    const dr = $('.take-drawer');
    requestAnimationFrame(() => dr.classList.add('in'));
  }

  function openWhisper() {
    const sim = simNow();
    const agentName = sim ? RD.agentById(sim.script.agentId).name : 'Riley';
    $('#overlay-root').innerHTML = `
      <div class="overlay" data-close-panel></div>
      <div class="drawer take-drawer" style="left:50%;right:auto;transform:translateX(-50%);width:min(520px,100vw);bottom:0;top:auto;max-height:86vh;border:1px solid var(--line);border-radius:16px 16px 0 0">
        <div class="drawer-head"><h2>Whisper to ${esc(agentName)}</h2><button type="button" class="x-btn" data-close-panel aria-label="Close">✕</button></div>
        <div class="drawer-body">
          <p style="margin:0 0 14px;color:var(--ink-2);font-size:14px">You talk to the agent, the agent talks to the caller. ${esc(agentName)} voices the answer; the caller never hears you.</p>
          <div class="chips" style="margin-bottom:12px">
            <button type="button" class="chip yellow" data-whisper-fill="Coverage is active — tell Dana Delta Dental PPO is confirmed, then continue the reschedule.">Coverage: active</button>
            <button type="button" class="chip yellow" data-whisper-fill="Stall — say you’re checking with the front desk, then continue scheduling.">Stall</button>
          </div>
          <div class="field"><label class="flabel" for="whisper-ta">Whisper</label>
            <textarea id="whisper-ta" style="min-height:84px">Coverage is active — tell Dana Delta Dental PPO is confirmed, then continue the reschedule.</textarea></div>
        </div>
        <div class="drawer-foot"><button type="button" class="btn btn-yellow btn-block" id="whisper-send">Send whisper</button></div>
      </div>`;
    $('#whisper-send').addEventListener('click', () => {
      const txt = $('#whisper-ta').value.trim();
      if (!txt) { RD.toast('Type a whisper first.', true); return; }
      closePanels();
      RD.sim.doWhisper(txt);
    });
    $$('[data-whisper-fill]').forEach((b) => b.addEventListener('click', () => { $('#whisper-ta').value = b.dataset.whisperFill; }));
    bindPanelClose();
  }

  function openAdvanced(agentId) {
    const agent = RD.agentById(agentId);
    const adv = RD.state.config[agentId].advanced;
    $('#overlay-root').innerHTML = `
      <div class="overlay" data-close-panel></div>
      <div class="drawer" id="adv-drawer">
        <div class="drawer-head"><h2>Advanced settings · ${esc(agent.name)}</h2><button type="button" class="x-btn" data-close-panel aria-label="Close">✕</button></div>
        <div class="drawer-body">
          <p style="margin:0 0 14px;color:var(--muted);font-size:12.5px">The ${ADV_FIELDS.length} raw settings behind the presets. Saved for this session, per agent.</p>
          ${ADV_FIELDS.map((f) => advFieldHTML(f, adv[f])).join('')}
        </div>
        <div class="drawer-foot"><button type="button" class="btn btn-primary btn-block" data-action="advanced-done">Done</button></div>
      </div>`;
    bindPanelClose();
    $$('#adv-drawer [data-adv]').forEach((ctl) => {
      const k = ctl.dataset.adv;
      ctl.addEventListener('input', () => {
        if (ctl.type === 'checkbox') adv[k] = ctl.checked;
        else if (ctl.type === 'range' && ctl.step && ctl.step < 1 && ctl.step !== '1') adv[k] = Math.round(parseFloat(ctl.value) * 100) / 100;
        else adv[k] = isNaN(parseFloat(ctl.value)) ? ctl.value : parseFloat(ctl.value);
        RD.save();
        const val = $('[data-adv-val="' + k + '"]');
        if (val) val.textContent = ctl.type === 'checkbox' ? (ctl.checked ? 'on' : 'off') : ctl.value;
      });
    });
  }

  function advFieldHTML(f, value) {
    if (f.type === 'toggle') {
      return `<div class="toggle-row"><span><span class="lbl">${f.label}</span><br><span class="sub">${f.note}</span></span>
        <span class="switch"><input type="checkbox" data-adv="${f.k}" ${value ? 'checked' : ''}><span class="track"></span></span></div>`;
    }
    if (f.type === 'select') {
      return `<div class="field"><label class="flabel" for="adv-${f.k}">${f.label}</label>
        <select id="adv-${f.k}" data-adv="${f.k}" style="font-family:var(--mono);font-size:14px">${f.opts.map((o) => `<option ${o === value ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
    }
    return `<div class="field"><div class="range-row"><label class="flabel" for="adv-${f.k}" style="margin:0">${f.label}</label><span class="val" data-adv-val="${f.k}">${value}</span></div>
      <input type="range" id="adv-${f.k}" data-adv="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${value}"></div>`;
  }

  function bindPanelClose() {
    $$('[data-close-panel]').forEach((el) => el.addEventListener('click', closePanels));
  }

  /* ================= expose ================= */
  return {
    home, builder, tools, monitor, review,
    monitorLive, ctxRefresh, renderCallList, monitorFinished,
    turnAppend, typingDots, turnText, toolChipStart, autoScroll,
    riskBanner, riskBannerRemove, testTool, applyFix,
    openTakeover, openWhisper, openAdvanced, closePanels,
    ACTIVE_CALLS
  };
})();

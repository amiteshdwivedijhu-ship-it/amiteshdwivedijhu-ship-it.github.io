'use strict';
/* Resolve Desk — synthetic operator console prototype.
   Data, state, and the live-call simulation engine. */

window.RD = (() => {
  const LS_KEY = 'rd_vapi_state_v1';

  /* ---------------- helpers ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad = (n) => String(n).padStart(2, '0');
  const fmtClock = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

  let toastTimer = null;
  function toast(msg, isErr) {
    const t = $('#toast-root');
    t.innerHTML = `<div class="toast show${isErr ? ' err' : ''}">${esc(msg)}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.innerHTML = ''; }, 3200);
  }

  const ago = (ts) => {
    const d = Date.now() - ts;
    if (d < 60e3) return 'just now';
    if (d < 3600e3) return `${Math.floor(d / 60e3)}m ago`;
    if (d < 86400e3) return `${Math.floor(d / 3600e3)}h ago`;
    return `${Math.floor(d / 86400e3)}d ago`;
  };

  /* ---------------- synthetic data ---------------- */
  const AGENTS = [
    { id: 'riley', name: 'Riley', role: 'Scheduler', phone: '(410) 555-0142',
      desc: 'Reschedules appointments and answers status calls for Brightline Dental.',
      base: { total: 412, resolved: 388, transferred: 13, failed: 11 },
      avg: '2m 41s', lastChange: 'Voice preset · Balanced → Careful · 2 days ago',
      tools: ['find_patient', 'get_open_slots', 'book_slot', 'send_sms_confirmation', 'check_insurance_status'] },
    { id: 'status', name: 'Status Line', role: 'Appointment status', phone: '(410) 555-0167',
      desc: 'Tells callers when and where their appointment is. High volume, short calls.',
      base: { total: 187, resolved: 176, transferred: 8, failed: 3 },
      avg: '1m 12s', lastChange: 'Voice preset · Balanced → Fast · 1 week ago',
      tools: ['find_patient', 'get_open_slots', 'send_sms_confirmation', 'check_insurance_status'] },
    { id: 'afterhours', name: 'After-hours', role: 'After-hours triage', phone: '(410) 555-0190',
      desc: 'New agent — takes messages when the practice is closed. Launched 3 days ago.',
      base: { total: 0, resolved: 0, transferred: 0, failed: 0 },
      avg: '—', lastChange: 'Created · 3 days ago',
      tools: ['find_patient', 'send_sms_confirmation'] }
  ];
  const agentById = (id) => AGENTS.find((a) => a.id === id) || AGENTS[0];

  const LOCATIONS = ['Fells Point', 'Towson', 'Canton'];
  const TOOLS = [
    { id: 'find_patient', name: 'find_patient',
      desc: 'Look up a caller by name or phone. Returns the patient record, upcoming appointment, and home location.',
      inputs: 'name, phone', connected: true, usage: '142 calls this week',
      summary: (r) => `${r.patient.name} · ${r.appointment.service} ${r.appointment.when}` },
    { id: 'get_open_slots', name: 'get_open_slots',
      desc: 'Find open appointment slots for a location, provider, and date range. Never invent a time — this tool is the only source of slots.',
      inputs: 'location, provider, from, to', connected: true, usage: '98 calls this week',
      summary: (r) => `${r.slots.length} open slots · first: ${r.slots[0].when}` },
    { id: 'book_slot', name: 'book_slot',
      desc: 'Book a slot returned by get_open_slots. Confirms with an appointment id before the agent tells the caller.',
      inputs: 'slot_id, patient_id', connected: true, usage: '87 calls this week',
      summary: (r) => `booked ${r.booking.id} · ${r.booking.when}` },
    { id: 'send_sms_confirmation', name: 'send_sms_confirmation',
      desc: 'Send a text confirmation or details to the patient phone. Templates: appointment_confirmation, location_details.',
      inputs: 'phone, template', connected: true, usage: '91 calls this week',
      summary: (r) => `${r.status} · ${r.template}` },
    { id: 'check_insurance_status', name: 'check_insurance_status',
      desc: 'Check a patient\u2019s active coverage with their carrier. Answers "is my insurance still active?" on the call.',
      inputs: 'patient_id, carrier', connected: false, usage: 'not connected',
      summary: (r) => `${r.carrier} ${r.status} · effective ${r.effective}` }
  ];
  const toolById = (id) => TOOLS.find((t) => t.id === id);
  const toolConnected = (id) => id !== 'check_insurance_status' || RD.state.tools.check_insurance_status;

  const PRESETS = {
    fast: { name: 'Fast', model: 'gpt-4.1-mini', voice: 'nova', latency: '~420ms',
      blurb: 'Shortest replies, lowest latency. Best for high-volume status checks.',
      rec: 'Status checks at volume' },
    balanced: { name: 'Balanced', model: 'gpt-4.1-mini', voice: 'alloy', latency: '~520ms',
      blurb: 'A good mix of speed and warmth. The default for most production agents.',
      rec: 'Most production agents' },
    careful: { name: 'Careful', model: 'gpt-4.1', voice: 'ash', latency: '~680ms',
      blurb: 'Deepest reasoning, a slower pace. Best when calls mix scheduling with coverage questions.',
      rec: 'Scheduling + insurance' }
  };

  const ADVANCED_DEFAULTS = {
    model: 'gpt-4.1-mini', temperature: 0.4, maxTokens: 1024, voice: 'alloy',
    speechSpeed: 1.0, interruptionSensitivity: 0.6, silenceEndCall: 8,
    confidenceThreshold: 0.6, toolTimeout: 8, maxToolRetries: 1,
    parallelToolCalls: false, latencyOptimization: true
  };

  /* ---------------- scripts ---------------- */
  const PATIENT_DANA = { name: 'Dana Whitfield', id: 'BR-20481', phone: '(410) 555-0142', insurance: 'Delta Dental PPO', location: 'Fells Point' };

  const SCRIPTS = {
    riley_reschedule: {
      agentId: 'riley', caller: 'Dana Whitfield', phone: '(410) 555-0142',
      intent: 'Reschedule cleaning', duration: '2m 04s',
      risk: {
        missingTool: 'check_insurance_status',
        reason: 'Dana asked about insurance coverage. The agent has no tool that answers it.',
        transferLine: "I'm sorry, I can't check that from here — let me transfer you to the front desk to confirm your coverage."
      },
      takeoverLine: 'Thanks, Maya. Dana — your Delta Dental coverage is active, so nothing changes there. Back to your reschedule: what day works better?',
      whisperLine: 'Thanks for the heads-up, Maya. Dana — good news: your Delta Dental coverage is active. What day works better?',
      build(connected) {
        const steps = [
          { t: 'caller', text: 'Hi, this is Dana Whitfield — I need to reschedule my cleaning appointment.' },
          { t: 'agent', text: 'Of course, Dana. Let me pull up your record.', think: 900 },
          { t: 'tool', tool: 'find_patient', ms: 340, timeoutAble: true,
            result: { ok: true, patient: { name: 'Dana Whitfield', id: 'BR-20481', phone: '(410) 555-0142', insurance: 'Delta Dental PPO' },
              appointment: { id: 'APT-9931', service: 'Cleaning', when: 'Thu Oct 8 · 10:30 AM', provider: 'Dr. Okafor', location: 'Fells Point' } } },
          { t: 'agent', text: "I found it — your cleaning with Dr. Okafor is Thursday at 10:30 AM at our Fells Point location. What day works better?", think: 1100 },
          { t: 'caller', text: 'Is my insurance still active? I changed jobs last month.' }
        ];
        if (connected) {
          steps.push(
            { t: 'tool', tool: 'check_insurance_status', ms: 380,
              result: { ok: true, patient_id: 'BR-20481', carrier: 'Delta Dental', status: 'ACTIVE', effective: '2026-10-01', note: 'Plan change to Delta Dental PPO · employer Harborline Group' } },
            { t: 'agent', text: 'Good news — your Delta Dental PPO coverage is active, no changes needed. Now, what day works better?', think: 1000 }
          );
        } else {
          steps.push({ t: 'risk' });
        }
        steps.push(
          { t: 'caller', text: 'Friday at 2 would work.' },
          { t: 'tool', tool: 'get_open_slots', ms: 280,
            result: { ok: true, slots: [
              { slot_id: 'SL-2201', when: 'Fri Oct 9 · 2:00 PM', provider: 'Dr. Okafor', location: 'Fells Point' },
              { slot_id: 'SL-2204', when: 'Fri Oct 9 · 4:30 PM', provider: 'Dr. Okafor', location: 'Fells Point' },
              { slot_id: 'SL-2210', when: 'Mon Oct 12 · 9:30 AM', provider: 'Dr. Chen', location: 'Towson' } ] } },
          { t: 'agent', text: 'I have Friday at 2:00 PM with Dr. Okafor in Fells Point. Should I book that?', think: 850 },
          { t: 'caller', text: 'Yes, please.' },
          { t: 'tool', tool: 'book_slot', ms: 420,
            result: { ok: true, booking: { id: 'APT-9942', slot_id: 'SL-2201', patient: 'BR-20481', when: 'Fri Oct 9 · 2:00 PM', provider: 'Dr. Okafor', location: 'Fells Point' } } },
          { t: 'agent', text: "Done — you're booked for Friday at 2:00 PM. I'm sending a text confirmation now.", think: 900 },
          { t: 'tool', tool: 'send_sms_confirmation', ms: 260,
            result: { ok: true, to: '(410) 555-0142', status: 'delivered', template: 'appointment_confirmation' } },
          { t: 'agent', text: "Your appointment is confirmed, and a text with the details is on its way. Anything else?", think: 900 },
          { t: 'caller', text: "That's all — thank you!" },
          { t: 'agent', text: "You're welcome. Have a great day!", think: 700 },
          { t: 'end', outcome: 'resolved', duration: '2m 04s' }
        );
        return steps;
      }
    },
    status_check: {
      agentId: 'status', caller: 'Marcus Hall', phone: '(443) 555-0173',
      intent: 'Appointment status', duration: '1m 09s',
      build() {
        return [
          { t: 'caller', text: 'Hi — just checking what time my appointment is tomorrow.' },
          { t: 'agent', text: 'Sure — let me look that up for you.', think: 700 },
          { t: 'tool', tool: 'find_patient', ms: 310,
            result: { ok: true, patient: { name: 'Marcus Hall', id: 'BR-10932' },
              appointment: { id: 'APT-9720', service: 'X-rays + exam', when: 'Sat Oct 4 · 9:15 AM', provider: 'Dr. Chen', location: 'Towson' } } },
          { t: 'agent', text: "Marcus, you're set for Saturday at 9:15 AM with Dr. Chen at our Towson location. Anything else?", think: 950 },
          { t: 'caller', text: 'Great, thanks.' },
          { t: 'agent', text: 'Anytime. Have a great day!', think: 600 },
          { t: 'end', outcome: 'resolved', duration: '1m 09s' }
        ];
      }
    },
    recall: {
      agentId: 'riley', caller: 'Mia Torres', phone: '(443) 555-0188',
      intent: 'Recall reminder (outbound)', duration: '0m 48s',
      build() {
        return [
          { t: 'agent', text: 'Hi Mia — this is Riley from Brightline Dental. Calling to remind you about your cleaning tomorrow at 9:00 AM in Canton.', think: 800 },
          { t: 'caller', text: 'Oh good, thanks for the reminder. Could you text me the address?' },
          { t: 'agent', text: 'Of course — sending the Canton address to your phone now.', think: 700 },
          { t: 'tool', tool: 'send_sms_confirmation', ms: 250,
            result: { ok: true, to: '(443) 555-0188', status: 'delivered', template: 'location_details' } },
          { t: 'agent', text: "Sent! We'll see you tomorrow at 9:00 AM, Mia.", think: 650 },
          { t: 'end', outcome: 'resolved', duration: '0m 48s' }
        ];
      }
    }
  };
  const scriptById = (id) => SCRIPTS[id] || SCRIPTS.riley_reschedule;

  /* finished-call seeds (12) */
  const SEEDS = [
    { id: 'c-1001', agentId: 'riley', caller: 'Priya Nair', intent: 'Reschedule', outcome: 'resolved', duration: '2m 04s', time: '40m ago', riskSeen: false },
    { id: 'c-1002', agentId: 'riley', caller: 'Omar Haddad', intent: 'Insurance question', outcome: 'transferred', duration: '0m 58s', time: '2h ago', riskSeen: true },
    { id: 'c-1003', agentId: 'riley', caller: 'Dana Whitfield', intent: 'Status check', outcome: 'resolved', duration: '1m 12s', time: '3h ago', riskSeen: false },
    { id: 'c-1004', agentId: 'riley', caller: 'Unknown caller', intent: 'New patient intake', outcome: 'failed', duration: '4m 21s', time: '5h ago', riskSeen: false },
    { id: 'c-1005', agentId: 'riley', caller: 'Lena Ortiz', intent: 'Reschedule', outcome: 'resolved', duration: '1m 48s', time: 'yesterday', riskSeen: false },
    { id: 'c-1006', agentId: 'riley', caller: 'Greg Walsh', intent: 'Billing question', outcome: 'transferred', duration: '1m 31s', time: 'yesterday', riskSeen: true },
    { id: 'c-1007', agentId: 'status', caller: 'Marcus Hall', intent: 'Status check', outcome: 'resolved', duration: '1m 09s', time: '1h ago', riskSeen: false },
    { id: 'c-1008', agentId: 'status', caller: 'Anita Rao', intent: 'Status check', outcome: 'resolved', duration: '0m 52s', time: '2h ago', riskSeen: false },
    { id: 'c-1009', agentId: 'status', caller: 'Sofia Reyes', intent: 'Status check', outcome: 'resolved', duration: '1m 22s', time: '4h ago', riskSeen: false },
    { id: 'c-1010', agentId: 'status', caller: 'Jordan Bell', intent: 'Status + insurance', outcome: 'transferred', duration: '1m 41s', time: 'yesterday', riskSeen: true },
    { id: 'c-1011', agentId: 'riley', caller: 'Dana Whitfield', intent: 'Reschedule', outcome: 'resolved', duration: '2m 02s', time: '2 days ago', riskSeen: false },
    { id: 'c-1012', agentId: 'status', caller: 'Marcus Hall', intent: 'Status check', outcome: 'resolved', duration: '0m 58s', time: '2 days ago', riskSeen: false }
  ];

  /* ---------------- state ---------------- */
  const DEFAULTS = () => ({
    tools: { check_insurance_status: false },
    timeoutSim: false,
    calls: [],
    changelog: [],
    config: {
      riley: { preset: 'balanced', promptFix: false, advanced: { ...ADVANCED_DEFAULTS } },
      status: { preset: 'fast', promptFix: false, advanced: { ...ADVANCED_DEFAULTS, model: 'gpt-4.1-mini', voice: 'nova' } },
      afterhours: { preset: 'balanced', promptFix: false, advanced: { ...ADVANCED_DEFAULTS } }
    }
  });

  let state;
  try {
    state = Object.assign(DEFAULTS(), JSON.parse(localStorage.getItem(LS_KEY) || '{}'));
    state.config = Object.assign(DEFAULTS().config, state.config || {});
    for (const a of Object.keys(state.config)) {
      state.config[a] = Object.assign({ preset: 'balanced', promptFix: false, advanced: { ...ADVANCED_DEFAULTS } }, state.config[a]);
      state.config[a].advanced = Object.assign({ ...ADVANCED_DEFAULTS }, state.config[a].advanced || {});
    }
  } catch (e) {
    state = DEFAULTS();
  }
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } };
  const resetDemo = () => {
    if (!confirm('Reset demo? This clears session calls, tool connections, and config changes.')) return;
    localStorage.removeItem(LS_KEY);
    location.hash = '#/';
    location.reload();
  };

  function pushChange(agentId, text) {
    state.changelog.unshift({ agent: agentId, ts: Date.now(), text });
    state.changelog = state.changelog.slice(0, 25);
    save();
  }

  function statsFor(agentId) {
    const a = agentById(agentId);
    const sess = state.calls.filter((c) => c.agentId === agentId);
    const total = a.base.total + sess.length;
    const resolved = a.base.resolved + sess.filter((c) => c.outcome === 'resolved').length;
    const transferred = a.base.transferred + sess.filter((c) => c.outcome === 'transferred').length;
    const failed = a.base.failed + sess.filter((c) => c.outcome === 'failed').length;
    return {
      total, resolved, transferred, failed,
      resolveRate: total ? (resolved / total) * 100 : null,
      transferRate: total ? (transferred / total) * 100 : null
    };
  }

  function lastChange(agentId) {
    const e = state.changelog.find((c) => c.agent === agentId);
    return e ? `${e.text} · ${ago(e.ts)}` : agentById(agentId).lastChange;
  }

  /* ---------------- simulation engine ---------------- */
  let SIM = null; // { def, steps, idx, mode, record, started, clock, running }
  const sim = {
    get active() { return SIM; },
    isRunning() { return SIM && SIM.running && SIM.mode !== 'risk' && SIM.mode !== 'timeout'; },

    async start(def) {
      if (SIM && SIM.running) this.stop();
      const script = scriptById(def.script);
      const steps = script.build(toolConnected('check_insurance_status'));
      def = Object.assign({ caller: script.caller, phone: script.phone, intent: script.intent }, def);
      SIM = {
        def, script, steps, idx: 0, mode: 'play', running: true, record: [],
        startedAt: Date.now(), elapsed: 0, clock: null,
        ctxLabel: 'Connecting the call'
      };
      window.views.monitorLive(SIM);
      SIM.clock = setInterval(() => {
        if (!SIM) return;
        SIM.elapsed = Math.floor((Date.now() - SIM.startedAt) / 1000);
        const el = $('#tl-dur');
        if (el) el.textContent = fmtClock(SIM.elapsed);
        const row = $(`[data-call-row="${SIM.def.id}"] .c-time`);
        if (row) row.textContent = fmtClock(SIM.elapsed);
      }, 1000);
      try { await this._runFrom(0); } catch (e) { if (e !== 'STOP') console.error(e); }
    },

    stop() {
      if (SIM) {
        SIM.running = false;
        clearInterval(SIM.clock);
        SIM = null;
      }
    },

    async _runFrom(startIdx) {
      SIM.idx = startIdx;
      while (SIM && SIM.running && SIM.idx < SIM.steps.length) {
        const s = SIM.steps[SIM.idx];
        await this._apply(s);
        if (!SIM || !SIM.running) return;
        if (s.t === 'risk') {
          SIM.record.push({ who: 'risk' });
          window.views.riskBanner($('#tl-body'), SIM);
          SIM.mode = 'risk';
          SIM.ctxLabel = 'At risk — waiting for operator';
          window.views.ctxRefresh();
          return;
        }
        if (s.t === 'end') { this._finish(s); return; }
        SIM.idx++;
      }
    },

    async _apply(s) {
      const body = $('#tl-body');
      const v = window.views;
      if (!body) return;
      if (s.t === 'caller') {
        v.turnAppend(body, 'caller', 'Caller', s.text);
        SIM.record.push({ who: 'caller', text: s.text });
        SIM.ctxLabel = 'Listening to caller';
        v.ctxRefresh();
        await sleep(420);
      } else if (s.t === 'agent') {
        const el = v.turnAppend(body, 'agent', agentById(SIM.script.agentId).name, null, true);
        v.typingDots(el);
        SIM.ctxLabel = 'Agent speaking';
        v.ctxRefresh();
        await sleep(s.think != null ? s.think : 800);
        if (SIM) v.turnText(el, s.text);
        SIM.record.push({ who: 'agent', text: s.text, think: s.think });
        await sleep(260);
      } else if (s.t === 'tool') {
        const t = toolById(s.tool);
        SIM.ctxLabel = `Calling ${s.tool}`;
        v.ctxRefresh();
        const chip = v.toolChipStart(body, s.tool);
        const willTimeout = s.timeoutAble && state.timeoutSim;
        if (willTimeout) {
          await sleep(1600);
          if (!SIM) return;
          const tcEl = chip.querySelector('.tc');
          tcEl.classList.add('err');
          chip.querySelector('.tc-status').textContent = `Timed out after ${state.config[SIM.script.agentId].advanced.toolTimeout || 8}.0s`;
          chip.querySelector('.lat').textContent = '';
          chip.querySelector('.spin')?.remove();
          const rb = document.createElement('button');
          rb.type = 'button'; rb.className = 'retry'; rb.textContent = 'Retry';
          rb.addEventListener('click', () => this._retryTool(s, chip));
          chip.querySelector('.tc').appendChild(rb);
          SIM.record.push({ who: 'tool', tool: s.tool, text: `timed out after 8s — retried`, risk: false });
          SIM.mode = 'timeout';
          SIM.retry = { s, chip };
          SIM.ctxLabel = 'Tool timed out — retry';
          v.ctxRefresh();
          return;
        }
        const started = performance.now();
        chip.querySelector('.lat').textContent = '…';
        await sleep(s.ms);
        if (!SIM) return;
        const real = Math.round(performance.now() - started);
        this._toolDone(s, chip, real);
        SIM.record.push({ who: 'tool', tool: s.tool, ms: real, text: toolById(s.tool).summary(s.result) });
      }
    },

    _toolDone(s, chip, real) {
      chip.querySelector('.tc').classList.add('done');
      chip.querySelector('.tc-status').textContent = `${s.tool} · ok`;
      chip.querySelector('.lat').textContent = `${real}ms`;
      chip.querySelector('.spin')?.remove();
      const res = document.createElement('details');
      const summ = document.createElement('summary');
      summ.textContent = toolById(s.tool).summary(s.result);
      const pre = document.createElement('div');
      pre.className = 'res';
      pre.textContent = JSON.stringify(s.result, null, 2);
      res.appendChild(summ); res.appendChild(pre);
      chip.appendChild(res);
      window.views.autoScroll(chip);
    },

    async _retryTool(step, oldChip) {
      if (!SIM || SIM.mode !== 'timeout') return;
      oldChip.remove();
      SIM.mode = 'play';
      SIM.retry = null;
      const body = $('#tl-body');
      const chip = window.views.toolChipStart(body, step.tool);
      chip.querySelector('.lat').textContent = '(retry)';
      const started = performance.now();
      await sleep(step.ms);
      if (!SIM) return;
      const real = Math.round(performance.now() - started);
      this._toolDone(step, chip, real);
      SIM.record.push({ who: 'tool', tool: step.tool, ms: real, text: `${toolById(step.tool).summary(step.result)} (after retry)` });
      SIM.ctxLabel = `Calling ${step.tool}`;
      window.views.ctxRefresh();
      SIM.idx++;
      await this._runFrom(SIM.idx);
    },

    /* operator decisions */
    async doTakeover(replyText) {
      if (!SIM || SIM.mode !== 'risk') return;
      SIM.mode = 'play';
      const body = $('#tl-body');
      window.views.riskBannerRemove(body);
      window.views.turnAppend(body, 'op', 'Maya · Ops — takeover', replyText);
      SIM.record.push({ who: 'op', text: replyText });
      const el = window.views.turnAppend(body, 'agent', agentById(SIM.script.agentId).name, null, true);
      window.views.typingDots(el);
      await sleep(1000);
      if (!SIM) return;
      window.views.turnText(el, SIM.script.takeoverLine);
      SIM.record.push({ who: 'agent', text: SIM.script.takeoverLine });
      SIM.ctxLabel = 'Agent resumed after takeover';
      window.views.ctxRefresh();
      await sleep(300);
      SIM.idx++;
      await this._runFrom(SIM.idx);
    },

    async doWhisper(whisperText) {
      if (!SIM || SIM.mode !== 'risk') return;
      SIM.mode = 'play';
      const body = $('#tl-body');
      window.views.riskBannerRemove(body);
      window.views.turnAppend(body, 'whisper', 'Maya → Riley (whisper)', whisperText);
      SIM.record.push({ who: 'whisper', text: whisperText });
      const el = window.views.turnAppend(body, 'agent', agentById(SIM.script.agentId).name, null, true);
      window.views.typingDots(el);
      await sleep(1100);
      if (!SIM) return;
      window.views.turnText(el, SIM.script.whisperLine);
      SIM.record.push({ who: 'agent', text: SIM.script.whisperLine });
      SIM.ctxLabel = 'Agent guided by whisper';
      window.views.ctxRefresh();
      await sleep(300);
      SIM.idx++;
      await this._runFrom(SIM.idx);
    },

    async doTransfer() {
      if (!SIM || SIM.mode !== 'risk') return;
      SIM.mode = 'play';
      const body = $('#tl-body');
      window.views.riskBannerRemove(body);
      const el = window.views.turnAppend(body, 'agent', agentById(SIM.script.agentId).name, null, true);
      window.views.typingDots(el);
      await sleep(1000);
      if (!SIM) return;
      window.views.turnText(el, SIM.script.risk.transferLine);
      SIM.record.push({ who: 'agent', text: SIM.script.risk.transferLine, transfer: true });
      await sleep(500);
      this._finish({ outcome: 'transferred', duration: SIM.script.duration, riskSeen: true });
    },

    _finish(s) {
      if (!SIM) return;
      const rec = SIM;
      rec.running = false;
      clearInterval(rec.clock);
      const call = {
        id: 's-' + Date.now(), agentId: rec.script.agentId, caller: rec.def.caller,
        phone: rec.def.phone, intent: rec.def.intent, script: rec.def.script,
        outcome: s.outcome, riskSeen: !!(s.riskSeen || rec.record.some((r) => r.who === 'risk')),
        duration: s.duration, ts: Date.now(), steps: rec.record
      };
      state.calls.unshift(call);
      save();
      window.views.monitorFinished(rec, call);
    }
  };

  /* ---------------- router ---------------- */
  const routes = [
    { pat: (p) => p.length === 0, view: 'home' },
    { pat: (p) => p[0] === 'builder' && p[1], view: 'builder', arg: (p) => p[1] },
    { pat: (p) => p[0] === 'tools', view: 'tools' },
    { pat: (p) => p[0] === 'monitor', view: 'monitor' },
    { pat: (p) => p[0] === 'review' && p[1], view: 'review', arg: (p) => p[1] }
  ];
  let ui = { filter: 'all', tab: { riley: 'persona', status: 'persona', afterhours: 'persona' } };

  function parseHash() {
    const h = location.hash || '#/';
    const [path, qs] = h.slice(1).split('?');
    const parts = path.split('/').filter(Boolean);
    const q = new URLSearchParams(qs || '');
    return { parts, q };
  }

  function render() {
    sim.stop();
    window.views.closePanels();
    const { parts, q } = parseHash();
    const route = routes.find((r) => r.pat(parts));
    const v = window.views;
    const view = route ? route.view : 'home';
    $$('.tn-link').forEach((a) => {
      const key = a.dataset.nav;
      a.setAttribute('aria-current', key === view ? 'page' : '');
    });
    document.title = {
      home: 'Resolve Desk · Voice agent operator console (Synthetic)',
      builder: 'Agent builder · Resolve Desk (Synthetic)',
      tools: 'Tools · Resolve Desk (Synthetic)',
      monitor: 'Live call monitor · Resolve Desk (Synthetic)',
      review: 'Call review · Resolve Desk (Synthetic)'
    }[view];
    const mount = $('#view');
    if (view === 'home') v.home(mount);
    else if (view === 'builder') v.builder(mount, route.arg(parts));
    else if (view === 'tools') v.tools(mount);
    else if (view === 'monitor') v.monitor(mount, q.get('start'));
    else v.review(mount, route.arg(parts));
    window.scrollTo(0, 0);
  }

  /* ---------------- delegated events ---------------- */
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) return; // plain hash link
    const act = e.target.closest('[data-action]');
    if (!act) return;
    const a = act.dataset.action;
    const v = window.views;
    switch (a) {
      case 'reset': resetDemo(); break;
      case 'start-call': {
        if (parseHash().parts[0] !== 'monitor') { location.hash = '#/monitor?start=' + act.dataset.script; break; }
        sim.start({ script: act.dataset.script, id: act.dataset.id || 'live-' + act.dataset.script });
        break;
      }
      case 'replay-call': {
        if (parseHash().parts[0] !== 'monitor') { location.hash = '#/monitor?start=' + act.dataset.script; break; }
        sim.start({ script: act.dataset.script, id: { riley_reschedule: 'live-hero', status_check: 'live-status', recall: 'live-recall' }[act.dataset.script] || 'live-hero' });
        break;
      }
      case 'takeover':
        window.views.openTakeover(RD.agentById(RD.sim.active.script.agentId).name);
        break;
      case 'whisper': window.views.openWhisper(); break;
      case 'transfer': sim.doTransfer(); break;
      case 'go-tools': location.hash = '#/tools'; break;
      case 'move-tool': {
        const agent = act.dataset.agent, tool = act.dataset.tool, dir = +act.dataset.dir;
        const order = (state.config[agent].tryOrder || agentById(agent).tools).slice();
        const i = order.indexOf(tool), j = i + dir;
        if (i < 0 || j < 0 || j >= order.length) break;
        [order[i], order[j]] = [order[j], order[i]];
        state.config[agent].tryOrder = order;
        pushChange(agent, `Reordered transfer-rule tools (${tool} moved ${dir > 0 ? 'down' : 'up'})`);
        v.builder($('#view'), agent);
        break;
      }
      case 'toggle-tool': {
        const id = act.dataset.tool;
        if (id !== 'check_insurance_status') { toast('This tool is always on in the demo.'); break; }
        state.tools[id] = !state.tools[id];
        save();
        if (state.tools[id]) toast(`${id} connected — agents can now answer coverage questions.`);
        else toast(`${id} disconnected.`);
        const el = $('#view');
        const route = parseHash().parts;
        if (route[0] === 'tools') v.tools(el); else if (route[0] === 'builder') v.builder(el, route[1]);
        break;
      }
      case 'test-tool': window.views.testTool(act.dataset.tool, act); break;
      case 'preset': {
        const agent = act.dataset.agent, p = act.dataset.preset;
        if (state.config[agent].preset === p) break;
        state.config[agent].preset = p;
        const pr = PRESETS[p];
        state.config[agent].advanced.model = pr.model;
        state.config[agent].advanced.voice = pr.voice;
        pushChange(agent, `Switched voice/model preset to ${pr.name}`);
        toast(`${agentById(agent).name} now on the ${pr.name} preset (${pr.latency} target).`);
        v.builder($('#view'), agent);
        break;
      }
      case 'open-advanced': window.views.openAdvanced(act.dataset.agent); break;
      case 'advanced-done': window.views.closePanels(); toast('Advanced settings saved for this session.'); break;
      case 'filter-agent': ui.filter = act.dataset.agent; v.monitor($('#view')); break;
      case 'apply-fix': window.views.applyFix(act.dataset.id, act.dataset.kind, act.dataset.agent); break;
      case 'go-review': location.hash = '#/review/' + act.dataset.id; break;
    }
  });
  document.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-mob-call]');
    if (!sel) return;
    const [kind, id] = sel.value.split(':');
    if (kind === 'live') {
      const c = window.views.ACTIVE_CALLS.find((x) => x.id === id);
      if (c) sim.start({ script: c.script, id: c.id });
    } else if (kind === 'fin') location.hash = '#/review/' + id;
    sel.value = '';
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.views.closePanels(); });
  window.addEventListener('hashchange', render);

  /* ---------------- boot ---------------- */
  window.addEventListener('DOMContentLoaded', render);

  return {
    AGENTS, TOOLS, PRESETS, SEEDS, SCRIPTS, LOCATIONS,
    agentById, toolById, toolConnected, scriptById,
    state, save, resetDemo, pushChange, statsFor, lastChange,
    sim, toast, esc, ago, fmtClock, ui, render
  };
})();

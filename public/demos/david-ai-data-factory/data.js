/* All data in this file is SAMPLE DATA, generated for a prototype.
   No real buyers, contributors, recordings, rates, or results. */
(function () {
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var R = rng(20261026);
  function pick(a) { return a[Math.floor(R() * a.length)]; }
  function gauss() { var u = R() || 1e-9, v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }

  var LANGS = [
    { code: 'en-US', name: 'English (US)', accents: ['General American', 'Southern US', 'New York', 'Midwest'], share: 40, accept: 0.86, active: 410 },
    { code: 'en-IN', name: 'English (India)', accents: ['Hindi-influenced', 'Tamil-influenced', 'Bengali-influenced'], share: 20, accept: 0.8, active: 190 },
    { code: 'es-MX', name: 'Spanish (Mexico)', accents: ['Central Mexican', 'Norteño', 'Yucatec'], share: 20, accept: 0.84, active: 160 },
    { code: 'hi-IN', name: 'Hindi (India)', accents: ['Delhi', 'Mumbai', 'Bhojpuri-influenced'], share: 20, accept: 0.72, active: 41 }
  ];
  var ENVS = [
    { id: 'quiet', name: 'Quiet room', share: 30, snr: 32 },
    { id: 'tv', name: 'Home, TV on', share: 20, snr: 22 },
    { id: 'cafe', name: 'Café', share: 20, snr: 19 },
    { id: 'car', name: 'Parked car', share: 15, snr: 24 },
    { id: 'street', name: 'Street', share: 15, snr: 18 }
  ];
  var TOPICS = [
    { t: 'Return a broken blender', kind: 'support' },
    { t: 'Change a flight date', kind: 'support' },
    { t: 'Dispute a bank charge', kind: 'support' },
    { t: 'Cancel a gym plan', kind: 'support' },
    { t: 'Ask about a phone bill', kind: 'support' },
    { t: 'Late food delivery', kind: 'support' },
    { t: 'Plan a weekend trip', kind: 'casual' },
    { t: 'Favorite movie this year', kind: 'casual' },
    { t: 'Cooking a family recipe', kind: 'casual' }
  ];
  var FIRST = ['Maya', 'Jon', 'Priya', 'Luis', 'Ana', 'Ravi', 'Sofia', 'Dev', 'Kim', 'Omar', 'Lena', 'Arjun', 'Rosa', 'Tariq', 'Neha', 'Carlos', 'Ivy', 'Sam', 'Meera', 'Diego', 'Asha', 'Ben', 'Kavya', 'Pablo', 'Zoe', 'Rohan', 'Elena', 'Nikhil', 'Grace', 'Mateo', 'Anil', 'Julia'];
  var LET = 'ABCDEFGHJKLMNPRSTVW';

  // Contributors (sample)
  var contributors = [];
  var cid = 2200;
  LANGS.forEach(function (L) {
    var n = L.code === 'en-US' ? 22 : L.code === 'hi-IN' ? 12 : 15;
    for (var i = 0; i < n; i++) {
      cid += 7 + Math.floor(R() * 40);
      contributors.push({
        id: 'C-' + cid, name: pick(FIRST) + ' ' + pick(LET.split('')) + '.', lang: L.code,
        accent: pick(L.accents), weeks: 1 + Math.floor(R() * 30), tier: 'Trusted', quirk: null, flags: []
      });
    }
  });
  contributors.forEach(function (c) { if (c.weeks < 4) c.tier = 'New'; });
  // Seeded problem contributors
  function byLang(code) { return contributors.filter(function (c) { return c.lang === code; }); }
  var hi = byLang('hi-IN'), us = byLang('en-US'), ein = byLang('en-IN'), mx = byLang('es-MX');
  hi[2].id = 'C-2291'; hi[5].id = 'C-3307'; hi[2].quirk = 'dup'; hi[5].quirk = 'dup'; hi[5].weeks = 2; hi[5].tier = 'New';
  hi[2].flags.push('Same voice as C-3307 (voice match 0.94)'); hi[5].flags.push('Same voice as C-2291 (voice match 0.94)');
  us[4].id = 'C-2418'; us[4].quirk = 'scripted'; us[4].flags.push('Reads from a script (low disfluency, long turn gaps)');
  ein[3].id = 'C-2650'; ein[3].quirk = 'bleed'; ein[3].flags.push('No headphones: other speaker leaks into channel');
  mx[6].quirk = 'clip'; mx[6].flags.push('Mic gain too high: clipping');

  // Sessions (sample): 240 sessions recorded Oct 13 to Oct 26, 2026
  var sessions = [];
  var sid = 10400;
  var langWeights = [0.38, 0.22, 0.22, 0.18];
  function pickLang() { var x = R(), s = 0; for (var i = 0; i < 4; i++) { s += langWeights[i]; if (x < s) return LANGS[i]; } return LANGS[3]; }
  function pickEnv(L) {
    var w = L.code === 'hi-IN' ? [0.45, 0.3, 0.1, 0.1, 0.05] : L.code === 'en-US' ? [0.42, 0.2, 0.16, 0.12, 0.1] : [0.3, 0.2, 0.2, 0.15, 0.15];
    var x = R(), s = 0; for (var i = 0; i < 5; i++) { s += w[i]; if (x < s) return ENVS[i]; } return ENVS[4];
  }
  for (var k = 0; k < 240; k++) {
    var L = pickLang();
    var pool = byLang(L.code);
    var a = pick(pool), b = pick(pool);
    while (b === a) b = pick(pool);
    if (k === 17 || k === 63 || k === 121 || k === 188 || k === 230) { L = LANGS[3]; a = hi[2]; b = hi[5]; }
    if (k === 40 || k === 99 || k === 150 || k === 211) { L = LANGS[0]; a = us[4]; b = pick(us.filter(function (c) { return c !== us[4]; })); }
    if (k === 55 || k === 130 || k === 205) { L = LANGS[1]; a = ein[3]; b = pick(ein.filter(function (c) { return c !== ein[3]; })); }
    var env = pickEnv(L);
    var topic = pick(TOPICS);
    var day = 13 + Math.floor((k / 240) * 14);
    var quirks = [a.quirk, b.quirk];
    var has = function (q) { return quirks.indexOf(q) >= 0; };
    var dur = Math.round(clamp(30 + gauss() * 6, 18, 44));
    var snr = r1(env.snr + gauss() * 4);
    var bleed = r1(-42 + gauss() * 5); if (has('bleed')) bleed = r1(-15 - R() * 5);
    var clip = R() < 0.06 ? r2(0.6 + R() * 2.4) : r2(R() * 0.2); if (has('clip')) clip = r2(1.4 + R() * 2);
    var overlap = r1(clamp(11 + gauss() * 4, 2, 26));
    var gap = Math.round(clamp(420 + gauss() * 140, 160, 1100));
    var silence = r1(clamp(13 + gauss() * 5, 4, 38));
    var nat = r1(clamp(4.0 + gauss() * 0.45, 2.2, 5));
    var scripted = r2(clamp(0.16 + gauss() * 0.1, 0.02, 0.55));
    if (has('scripted')) { overlap = r1(2 + R() * 2); gap = Math.round(950 + R() * 350); nat = r1(2.2 + R() * 0.6); scripted = r2(0.8 + R() * 0.15); }
    var adherence = r2(clamp(0.88 + gauss() * 0.06, 0.6, 0.99));
    var pii = null;
    if (R() < 0.035 || k === 70 || k === 201) { pii = 'Phone number spoken at ' + (5 + Math.floor(R() * 20)) + ':' + String(Math.floor(R() * 60)).padStart(2, '0'); }
    var codeSwitch = L.code === 'hi-IN' || L.code === 'en-IN' ? R() < 0.55 : L.code === 'es-MX' ? R() < 0.15 : false;
    var natV3 = r1(clamp(nat + gauss() * 0.2 - (L.code === 'hi-IN' && codeSwitch ? 0.9 : 0), 1.5, 5));
    sessions.push({
      id: 'S-' + (sid + k * 3 + Math.floor(R() * 3)), lang: L.code, accentA: a.accent, accentB: b.accent,
      a: a.id, b: b.id, env: env.id, topic: topic.t, kind: topic.kind,
      date: '2026-10-' + String(day).padStart(2, '0'), durMin: dur,
      m: { snr: snr, bleed: bleed, clip: clip, overlap: overlap, gap: gap, silence: silence, nat: nat, natV3: natV3, scripted: scripted, adherence: adherence },
      pii: pii, dup: has('dup'), codeSwitch: codeSwitch,
      consent: (k === 214 || k === 233) ? null : 'CN-' + (88000 + k * 11),
      seed: Math.floor(R() * 1e9)
    });
  }

  // Accepted hours BEFORE this 14-day sample window (project to date, sample)
  // Deliberate gaps: hi-IN Café and Street are far behind. en-US Quiet is over.
  var priorHours = {
    'en-US': { quiet: 174, tv: 78, cafe: 72, car: 52, street: 49 },
    'en-IN': { quiet: 66, tv: 42, cafe: 40, car: 31, street: 28 },
    'es-MX': { quiet: 63, tv: 41, cafe: 39, car: 13, street: 30 },
    'hi-IN': { quiet: 52, tv: 31, cafe: 8, car: 20, street: 3 }
  };
  var priorSpeakers = {
    'en-US': { quiet: 212, tv: 120, cafe: 104, car: 80, street: 77 },
    'en-IN': { quiet: 98, tv: 61, cafe: 55, car: 40, street: 38 },
    'es-MX': { quiet: 90, tv: 56, cafe: 52, car: 22, street: 41 },
    'hi-IN': { quiet: 34, tv: 22, cafe: 6, car: 15, street: 4 }
  };

  // Judge calibration (sample). Golden set: 200 clips, 50 per language, double human labels.
  var RUBRIC = [
    { id: 'nat', name: 'Naturalness', desc: 'Sounds like a real, unscripted talk (fillers, repairs, natural pace).' },
    { id: 'scr', name: 'Scripted speech', desc: 'Detects reading from a script or memorized lines.' },
    { id: 'top', name: 'Topic adherence', desc: 'Talk stays on the assigned scenario.' },
    { id: 'turn', name: 'Turn-taking', desc: 'Real interruptions, backchannels, and overlaps happen.' },
    { id: 'emo', name: 'Emotion label', desc: 'Judge emotion tag matches the human tag.' }
  ];
  var KAPPA = {
    v2: { nat: { 'en-US': 0.74, 'en-IN': 0.70, 'es-MX': 0.72, 'hi-IN': 0.68 }, scr: { 'en-US': 0.64, 'en-IN': 0.60, 'es-MX': 0.63, 'hi-IN': 0.58 }, top: { 'en-US': 0.82, 'en-IN': 0.80, 'es-MX': 0.79, 'hi-IN': 0.78 }, turn: { 'en-US': 0.69, 'en-IN': 0.66, 'es-MX': 0.66, 'hi-IN': 0.62 }, emo: { 'en-US': 0.62, 'en-IN': 0.58, 'es-MX': 0.57, 'hi-IN': 0.55 } },
    v3: { nat: { 'en-US': 0.84, 'en-IN': 0.80, 'es-MX': 0.81, 'hi-IN': 0.56 }, scr: { 'en-US': 0.84, 'en-IN': 0.80, 'es-MX': 0.81, 'hi-IN': 0.78 }, top: { 'en-US': 0.84, 'en-IN': 0.82, 'es-MX': 0.82, 'hi-IN': 0.80 }, turn: { 'en-US': 0.73, 'en-IN': 0.70, 'es-MX': 0.70, 'hi-IN': 0.66 }, emo: { 'en-US': 0.64, 'en-IN': 0.61, 'es-MX': 0.60, 'hi-IN': 0.58 } }
  };
  var HUMAN_ACCEPT = { 'en-US': 0.72, 'en-IN': 0.68, 'es-MX': 0.70, 'hi-IN': 0.66 };

  window.SAMPLE = {
    project: {
      id: 'HALYARD', name: 'Project Halyard', buyer: 'Lab A (sample buyer)',
      request: 'We need full-duplex, support-style conversations in 4 languages with real background noise, so our voice agent learns to handle interruptions. About 1,200 hours in 6 weeks. Each speaker on their own channel. 48 kHz.',
      startDate: 'Sep 14, 2026', dueDate: 'Nov 20, 2026', stage: 4
    },
    spec: { targetHours: 1200, weeks: 6, avgSessionMin: 30, overlapMin: 5, overlapMax: 25, minSnr: 15, payPerHour: 26, hoursPerContributorWeek: 4, langShare: { 'en-US': 40, 'en-IN': 20, 'es-MX': 20, 'hi-IN': 20 }, envShare: { quiet: 30, tv: 20, cafe: 20, car: 15, street: 15 }, maxSpeakerShare: 2 },
    LANGS: LANGS, ENVS: ENVS, TOPICS: TOPICS, RUBRIC: RUBRIC, KAPPA: KAPPA, HUMAN_ACCEPT: HUMAN_ACCEPT,
    contributors: contributors, sessions: sessions, priorHours: priorHours, priorSpeakers: priorSpeakers,
    pilot: { hours: 20, accept: 0.81, agreement: 0.74, impact: 'Interruption-handling WER on the buyer eval set improved 11% vs. baseline (sample)' }
  };
})();

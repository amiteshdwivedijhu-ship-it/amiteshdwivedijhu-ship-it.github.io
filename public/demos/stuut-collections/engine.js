/* Stuut Collections exception packet engine.
   Design rules (reused from Ami's Prior Auth Agent on amiteshdwivedijhu-ship-it.github.io):
     1. Every claim in the packet carries the exact passage it came from.
     2. Grounded citation is enforced in code, not by prompting: verifyPacket()
        re-locates every span in the source corpus and fails anything it cannot find.
   Deterministic, rule-based: no model call, so the demo cannot hallucinate. */

var StuutEngine = (function () {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ---------- primitives ---------- */

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function parseIsoISO(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function fmtIsoISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function addDaysIso(s, n) {
    var d = parseIsoISO(s);
    d.setDate(d.getDate() + n);
    return fmtIsoISO(d);
  }

  function dayDiffIso(a, b) { // b - a in days
    return Math.round((parseIsoISO(b) - parseIsoISO(a)) / 86400000);
  }

  function wdIso(s) { return parseIsoISO(s).getDay(); }

  function fmtDate(iso) {
    var d = parseIsoISO(iso);
    return WEEKDAYS[d.getDay()] + ' ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function fmtDay(iso) {
    var d = parseIsoISO(iso);
    return WEEKDAYS[d.getDay()].slice(0, 3) + ' ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
  }

  function money(x) {
    return '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function norm(s) {
    return ('' + s).toLowerCase().replace(/[^a-z0-9$%.,]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function parseMoney(s) {
    var m = ('' + s).match(/\$?\s?[\d,]+\.\d{2}/);
    if (!m) return null;
    return parseFloat(m[0].replace(/[$,]/g, ''));
  }

  /* split into sentences on [.!?], returning verbatim slices of the source.
     Decimal points ($82,400.16) are guarded so a price never ends a sentence. */
  function sentences(text) {
    var out = [];
    var guarded = ('' + text).replace(/(\d)\.(\d)/g, '$1\u0001$2');
    var re = /\s*([^.!?\n]+(?:[.!?]+)?)/g;
    var m;
    while ((m = re.exec(guarded))) {
      var s = m[1].replace(/\u0001/g, '.');
      if (s && s.trim().length) out.push(s);
    }
    return out;
  }

  function nextWeekdayIso(anchorIso, w, includeToday) {
    var diff = (w - wdIso(anchorIso) + 7) % 7;
    if (diff === 0 && !includeToday) diff = 7;
    return addDaysIso(anchorIso, diff);
  }

  function nextBusinessDayIso(iso) {
    var d = iso;
    d = addDaysIso(d, 1);
    while (wdIso(d) === 6 || wdIso(d) === 0) d = addDaysIso(d, 1);
    return d;
  }

  /* ---------- commitment extraction ---------- */

  var WD = { sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 };

  var COMMIT_SENT = [
    /(will|'ll|am |are |going to|should|ready to|are set to)\s+(wire|pay|send|release|process|settle|remit|transfer)/i,
    /(will|'ll)\s+(get|make|have)\s+(the\s+)?(payment|check|wire|funds)\s+out/i,
    /(payment|check|wire|funds)\s+(will\s+)?(go(es)? out|be (sent|wired|released|transferred|processed|made))/i,
    /(expect|hope|plan|intend)\s+to\s+(remit|pay|wire)/i
  ];

  /* qualifications mean the speaker is not promising the full invoice */
  var QUALIFY = /undisputed|partial|portion|part (of|payment)|short-?pay|disput|credit memo|(?<!stays )on hold|the rest stays|balance (?:of )?(?:will|is) (?:be )?(?:held|pending)/i;

  var DODGE = /can't|cannot|can not|not (able|in a position) (to )?commit|no (confirmed |specific |payment )?date|still (?:reviewing|looking|working|on it)|don't have (a |the )?date|finance (?:is|team is) (?:still )?(?:reviewing|looking|working on)/i;

  function resolveDateMarker(text, anchorIso) {
    var n = text.toLowerCase();
    if (/\btomorrow\b/.test(n)) return { iso: addDaysIso(anchorIso, 1), explicit: true, label: 'tomorrow' };
    if (/\btonight\b|\btoday\b/.test(n)) return { iso: anchorIso, explicit: true, label: 'today' };
    if (/next week/.test(n)) return { iso: addDaysIso(anchorIso, 7), explicit: false, label: 'next week' };
    if (/(?:by )?end of (?:this )?week/.test(n)) return { iso: nextWeekdayIso(anchorIso, 5, true), explicit: true, label: 'end of week' };
    var m = n.match(/(?:this |coming )?(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day)?s?\b/);
    if (m) {
      var w = WD[m[1]];
      var prefixThis = /this |coming /.test(m[0]);
      var nth = n.match(/\bthe (\d{1,2})(?:st|nd|rd|th)?\b/);
      return {
        iso: nextWeekdayIso(anchorIso, w, prefixThis),
        explicit: true,
        label: m[0].trim(),
        statedDay: nth ? parseInt(nth[1], 10) : null
      };
    }
    var d = n.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (d) return { iso: d[0], explicit: true, label: d[0] };
    return null;
  }

  function commitmentInSentence(s, anchorIso) {
    var hasVerb = COMMIT_SENT.some(function (r) { return r.test(s); });
    if (!hasVerb) return null;
    var qualified = QUALIFY.test(s);
    var d = resolveDateMarker(s, anchorIso);
    if (d) {
      return { kind: 'dated', payByIso: d.iso, explicit: d.explicit, label: d.label, statedDay: d.statedDay, qualified: qualified, span: s };
    }
    return { kind: 'soft', qualified: qualified, span: s };
  }

  function scanSentences(text, anchorIso) {
    var out = [];
    sentences(text).forEach(function (s) {
      var c = commitmentInSentence(s, anchorIso);
      if (c) out.push(c);
    });
    return out;
  }

  function isCustomerSpeaker(speaker) {
    return !/(stuut|\(ai\)|alex)/i.test(speaker);
  }

  /* ---------- stance of a customer turn ---------- */

  function turnStance(text, anchorIso) {
    var sents = sentences(text);
    var i;
    for (i = 0; i < sents.length; i++) {
      if (DODGE.test(sents[i])) return { label: 'no-commitment', span: sents[i] };
    }
    var commits = [];
    for (i = 0; i < sents.length; i++) {
      var c = commitmentInSentence(sents[i], anchorIso);
      if (c) commits.push(c);
    }
    var dated = null;
    for (i = 0; i < commits.length; i++) {
      if (commits[i].kind === 'dated' && !commits[i].qualified) dated = commits[i];
    }
    if (dated) {
      var confirmed = /that's right|that is right|\bcorrect\b|\byes[,.]?\s+(the |a )|right[,.] (?:the|it)/i.test(dated.span);
      return { label: confirmed ? 'confirmed' : 'commitment', span: dated.span };
    }
    for (i = 0; i < commits.length; i++) {
      if (commits[i].qualified) return { label: 'partial-intent', span: commits[i].span };
    }
    return null;
  }

  /* ---------- dispute / short-pay ---------- */

  var DISPUTE = /disput|deduct|credit memo|incorrect|wrong|pricing|unit price|sku|line item|short-?pay|withheld|on hold|hold/i;

  function sentenceWithMoney(sents, amount) {
    for (var i = 0; i < sents.length; i++) {
      if (parseMoney(sents[i]) === amount) return sents[i];
    }
    return null;
  }

  /* ---------- packet builder ---------- */

  function buildPacket(c) {
    var inv = c.invoice;
    var agingDays = Math.max(0, dayDiffIso(inv.dueDate, c.asOf));
    var open = inv.total - inv.paid;

    var agingSrc = 'Invoice ' + inv.number + ' total ' + money(inv.total) + ' paid ' + money(inv.paid) +
      ' open ' + money(open) + ' due ' + inv.dueDate + ' terms ' + inv.terms + ' aged ' + agingDays + ' days as of ' + c.asOf;

    var sources = { aging: agingSrc };
    c.channels.forEach(function (ch) {
      if (ch.type === 'voice') {
        sources[ch.id] = ch.turns.map(function (t) { return t.speaker + ': ' + t.text; }).join('\n');
      } else if (ch.type === 'remittance') {
        sources[ch.id] = ch.note;
      } else {
        sources[ch.id] = ch.subject + '\n' + (ch.body || '');
      }
    });

    /* commitments: incoming customer emails + customer voice turns */
    var commitments = [];
    c.channels.forEach(function (ch) {
      if (ch.type === 'email' && ch.direction === 'in') {
        scanSentences(ch.body, ch.date).forEach(function (k) {
          commitments.push({ kind: k.kind, payByIso: k.payByIso, explicit: k.explicit, label: k.label, qualified: k.qualified, span: k.span, itemId: ch.id, channel: 'email' });
        });
      }
      if (ch.type === 'voice') {
        ch.turns.forEach(function (t) {
          if (!isCustomerSpeaker(t.speaker)) return;
          scanSentences(t.text, ch.date).forEach(function (k) {
            commitments.push({ kind: k.kind, payByIso: k.payByIso, explicit: k.explicit, label: k.label, qualified: k.qualified, span: k.span, itemId: ch.id, channel: 'voice' });
          });
        });
      }
    });

    /* promise state: a dated, unqualified commitment is the full promise-to-pay */
    var missed = commitments.filter(function (k) { return k.kind === 'dated' && !k.qualified && k.payByIso < c.asOf; });
    var future = commitments.filter(function (k) { return k.kind === 'dated' && !k.qualified && k.payByIso >= c.asOf; });
    var softIntent = commitments.filter(function (k) { return k.kind === 'soft' && !k.qualified; });
    var partialIntent = commitments.filter(function (k) { return k.qualified; });

    var broken = missed.slice().sort(function (a, b) { return a.payByIso < b.payByIso ? 1 : -1; })[0] || null;
    var active = future.slice().sort(function (a, b) { return a.payByIso > b.payByIso ? 1 : -1; })[0] || null;

    var status = broken ? 'broken' : (active ? 'active' : 'none');

    /* latest customer stance on voice */
    var latestStance = null;
    var voiceChannels = c.channels.filter(function (ch) { return ch.type === 'voice'; });
    for (var vi = voiceChannels.length - 1; vi >= 0; vi--) {
      var ch = voiceChannels[vi];
      var found = null;
      for (var ti = ch.turns.length - 1; ti >= 0; ti--) {
        var t = ch.turns[ti];
        if (!isCustomerSpeaker(t.speaker)) continue;
        var st = turnStance(t.text, ch.date);
        if (st) { found = { stance: st, turn: t, itemId: ch.id }; break; }
      }
      if (found) { latestStance = found; break; }
      }

    /* short-pay from remittance */
    var remit = null;
    c.channels.forEach(function (ch) { if (ch.type === 'remittance') remit = ch; });
    var shortPay = { detected: false, received: 0, short: 0, cite: null, dispute: null };
    if (remit) {
      var rSents = sentences(remit.note);
      var amtSent = sentenceWithMoney(rSents, remit.amount) || rSents[0];
      shortPay.received = remit.amount;
      if (remit.amount < inv.total) {
        shortPay.detected = true;
        shortPay.short = Math.round((inv.total - remit.amount) * 100) / 100;
        shortPay.cite = { itemId: remit.id, span: amtSent };
      }
      var disputeSents = [];
      rSents.forEach(function (s) {
        if (DISPUTE.test(s)) disputeSents.push(s);
      });
      if (disputeSents.length) {
        shortPay.dispute = {
          reason: disputeSents.slice(0, 2).join(' '),
          span: disputeSents[0],
          itemId: remit.id
        };
      }
    }

    /* escalate + next action */
    var escalate = Boolean(broken) || shortPay.detected;
    var nextAction = null;

    function fact(label, value, itemId, span) {
      return { label: label, value: value, cite: { itemId: itemId, span: span } };
    }

    var facts = [];
    facts.push(fact('Open balance', money(open) + ' remains open on ' + inv.number, 'aging', 'open ' + money(open)));
    facts.push(fact('Aging', inv.number + ' is ' + agingDays + ' day' + (agingDays === 1 ? '' : 's') + ' past due as of ' + fmtDate(c.asOf), 'aging', 'due ' + inv.dueDate + ' terms ' + inv.terms));
    facts.push(fact('Invoice', money(inv.total) + ' total · ' + inv.terms, 'aging', 'total ' + money(inv.total)));

    /* channels tried */
          
    c.channels.forEach(function (ch) {
      if (ch.type === 'email') {
        facts.push(fact('Channel: email',
          (ch.direction === 'in' ? 'Inbound from customer · ' : 'Outbound · ') + fmtDay(ch.date) + ': "' + ch.subject + '"',
          ch.id, ch.subject));

      } else if (ch.type === 'voice') {
        var anchor = commitments.find(function (k) { return k.itemId === ch.id && k.span; });
        var vSpan = anchor ? anchor.span : sentences(ch.turns[0].text)[0];
        facts.push(fact('Channel: voice',
          ch.label + ' · ' + fmtDay(ch.date) + ' · ' + ch.duration + ' · ' + ch.turns.length + ' turns',
          ch.id, vSpan));
      }
    });

    /* promise facts */
    var promise = {
      status: status,
      payByIso: active ? active.payByIso : (broken ? broken.payByIso : null),
      payByLabel: active ? fmtDate(active.payByIso) : null,
      brokenAt: broken ? broken.payByIso : null,
      explicit: (active || broken) ? (active || broken).explicit : null,
      followUp: active ? nextBusinessDayIso(active.payByIso) : null,
      cite: (active || broken) ? { itemId: (active || broken).itemId, span: (active || broken).span } : null,
      stance: latestStance ? latestStance.stance.label : null,
      stanceSpan: latestStance ? latestStance.stance.span : null,
      stanceItemId: latestStance ? latestStance.itemId : null
    };

    if (active) {
      facts.push(fact('Promise to pay',
        'Full ' + money(inv.total) + ' promised by ' + fmtDate(active.payByIso) + ' on ' + active.channel,
        active.itemId, active.span));
      if (promise.stance === 'confirmed') {
        facts.push(fact('Promise confirmed',
          'Re-readback on voice: "' + promise.stanceSpan + '"',
          promise.stanceItemId, promise.stanceSpan));
      }
      facts.push(fact('Follow-up (computed)',
        'Auto-check payment on ' + fmtDate(promise.followUp) + '; SMS nudge only if unpaid',
        active.itemId, active.span));
      facts.push(fact('Escalation',
        'No escalation: promise carries an explicit pay-by date of ' + fmtDate(active.payByIso),
        active.itemId, active.span));
      nextAction = {
        action: 'Await payment · auto-check',
        detail: 'No agent action. Auto-check payment status on ' + fmtDate(promise.followUp) + '; if unpaid, send an SMS nudge and re-check 48h later.',
        dueBy: promise.followUp
      };
    } else if (broken) {
      facts.push(fact('Promise made',
        'Emailed promise to pay by ' + fmtDay(broken.payByIso) + ' (' + broken.channel + ')',
        broken.itemId, broken.span));
      facts.push(fact('Broken commitment',
        'Payment promised by ' + fmtDate(broken.payByIso) + ' was not received; ' + money(open) + ' still open on ' + inv.number,
        broken.itemId, broken.span));
      if (promise.stance === 'no-commitment') {
        facts.push(fact('Latest channel',
          'Voice call ' + fmtDay(c.asOf) + ': "' + promise.stanceSpan + '"',
          promise.stanceItemId, promise.stanceSpan));
        facts.push(fact('Escalation',
          'Broken commitment with no replacement pay-by date on the latest channel',
          promise.stanceItemId, promise.stanceSpan));
      } else {
        facts.push(fact('Escalation',
          'Broken commitment: ' + money(open) + ' open past the promised date',
          broken.itemId, broken.span));
      }
      nextAction = {
        action: 'Human call + revise terms',
        detail: 'Call ' + c.account.apContact + ' to renegotiate terms or extract a confirmed pay-by date; offer revised Net terms. Do not auto-dial again before the call.',
        dueBy: nextBusinessDayIso(c.asOf)
      };
    } else {
      if (partialIntent.length) {
        facts.push(fact('Partial intent',
          'Customer pays only the undisputed portion; no pay-by date for the balance',
          partialIntent[0].itemId, partialIntent[0].span));
      } else if (softIntent.length) {
        facts.push(fact('Soft intent',
          'Customer intends to remit but gives no date: "' + softIntent[0].span + '"',
          softIntent[0].itemId, softIntent[0].span));
      }
      if (promise.stance === 'no-commitment') {
        facts.push(fact('Latest channel',
          'Voice call ' + fmtDay(c.asOf) + ': "' + promise.stanceSpan + '"',
          promise.stanceItemId, promise.stanceSpan));
      }
    }

    /* short-pay facts */
    if (remit) {
      facts.push(fact('Remittance received',
        (remit.bank ? remit.bank + ' · ' : '') + money(remit.amount) + ' received ' + fmtDay(remit.date),
        remit.id, amtSent));
      if (shortPay.detected) {
        facts.push(fact('Short-pay',
          money(shortPay.short) + ' below the ' + money(inv.total) + ' invoice total',
          remit.id, amtSent));
      }
      if (shortPay.dispute) {
        facts.push(fact('Dispute reason',
          shortPay.dispute.reason,
          remit.id, shortPay.dispute.span));
      }
      /* customer raised the dispute before paying */
      c.channels.forEach(function (ch) {
        if (ch.type === 'email' && ch.direction === 'in') {
          var ds = sentences(ch.body).filter(function (s) { return DISPUTE.test(s); });
          if (ds.length) facts.push(fact('Dispute raised by email',
            fmtDay(ch.date) + ': "' + ds[0] + '"',
            ch.id, ds[0]));
        }
      });
      if (shortPay.detected) {
        facts.push(fact('Escalation',
          'Short-pay exception: ' + money(shortPay.short) + ' withheld ' + (shortPay.dispute ? 'with a cited dispute' : 'without a cited reason'),
          remit.id, amtSent));
      }
    }

    if (shortPay.detected) {
      nextAction = {
        action: 'Validate dispute · route to Disputes',
        detail: (shortPay.dispute ? 'Reconcile ' + shortPay.dispute.reason.slice(0, 140) + '. ' : '') +
          'Hold the disputed ' + money(shortPay.short) + ' while the credit memo is reviewed; collect the undisputed balance.',
        dueBy: nextBusinessDayIso(c.asOf)
      };
    } else if (!nextAction && (softIntent.length || partialIntent.length)) {
      nextAction = {
        action: 'Continue outreach',
        detail: 'No confirmed pay-by date on record. Email ' + c.account.apContact + ' to extract a dated commitment.',
        dueBy: nextBusinessDayIso(c.asOf)
      };
    }

    /* confidence: grounded in what the evidence supports; never full certainty */
    var rationale = ['base 0.90'];
    var conf = 0.90;
    if (active) {
      if (active.explicit) { conf += 0.05; rationale.push('+0.05 explicit pay-by date (' + active.label + ')'); }
      if (promise.stance === 'confirmed') { conf += 0.04; rationale.push('+0.04 confirmed on voice re-readback'); }
      if (parseMoney(active.span) !== null || /full/i.test(active.span)) { conf += 0.02; rationale.push('+0.02 full amount named in commitment'); }
    } else if (broken) {
      if (broken.explicit) { conf += 0.05; rationale.push('+0.05 original promise had an explicit date'); }
      if (promise.stance === 'no-commitment') { conf -= 0.05; rationale.push('-0.05 latest channel brings no replacement commitment'); }
    }
    if (shortPay.detected) {
      conf += 0.05; rationale.push('+0.05 exact short amount received and parsed from remittance');
    }
    if (shortPay.dispute) {
      conf += 0.02; rationale.push('+0.02 dispute reason stated in remittance note');
    }
    if (partialIntent.length || softIntent.length) { conf -= 0.02; rationale.push('-0.02 intent without a dated full commitment'); }
    conf = Math.max(0.50, Math.min(0.97, Math.round(conf * 100) / 100));

    facts.push(fact('Recommended action',
      nextAction.action + (nextAction.dueBy ? ' · due ' + fmtDate(nextAction.dueBy) : ''),
      (active || broken || null) ? (active || broken).itemId : (shortPay.cite ? shortPay.cite.itemId : null),
      (active || broken || null) ? (active || broken).span : (shortPay.cite ? shortPay.cite.span : null)));

    var channelsTried = c.channels.filter(function (ch) { return ch.type === 'email' || ch.type === 'voice' || ch.type === 'sms'; })
      .map(function (ch) {
        return { type: ch.type, id: ch.id, date: ch.date, direction: ch.direction, label: ch.type === 'voice' ? (ch.label || 'voice call') : ch.subject };
      });

    return {
      caseId: c.id,
      title: c.title,
      account: c.account,
      asOf: c.asOf,
      invoice: {
        number: inv.number, date: inv.date, dueDate: inv.dueDate, terms: inv.terms,
        total: inv.total, paid: inv.paid, open: open, agingDays: agingDays
      },
      channelsTried: channelsTried,
      sources: sources,
      promise: promise,
      shortPay: shortPay,
      remittance: remit ? { bank: remit.bank, date: remit.date, amount: remit.amount } : null,
      escalate: escalate,
      nextAction: nextAction,
      confidence: conf,
      confidenceRationale: rationale,
      facts: facts
    };
  }

  /* ---------- citation lens: every span must re-locate in its source ---------- */

  function verifyPacket(p) {
    var failures = [];
    p.facts.forEach(function (f) {
      if (!f.cite || !f.cite.itemId) { failures.push(f.label + ': missing citation'); return; }
      var src = p.sources[f.cite.itemId];
      if (!src) { failures.push(f.label + ': source item ' + f.cite.itemId + ' not found'); return; }
      var span = norm(f.cite.span);
      if (span.length < 3) { failures.push(f.label + ': citation span is empty'); return; }
      if (norm(src).indexOf(span) < 0) {
        failures.push(f.label + ': claim "' + f.cite.span.slice(0, 60) + '" not located in source ' + f.cite.itemId);
      }
    });
    return { ok: failures.length === 0, failures: failures, checked: p.facts.length };
  }

  /* ---------- rubric lens: pre-written pass/fail per case ---------- */

  function rubric(cases) {
    return (cases || STUUT_CASES).map(function (c) {
      var p = buildPacket(c);
      var v = verifyPacket(p);
      var e = c.expected;
      var checks = [];

      function check(name, pass, detail) {
        checks.push({ name: name, pass: !!pass, detail: detail });
      }

      if (v.ok) {
        check('citations', true, 'all ' + v.checked + ' claims carry a span that re-locates in source');
      } else {
        check('citations', false, v.failures.join('; '));
      }
      if (e.promise) check('promise status', p.promise.status === e.promise, 'expected ' + e.promise + ', got ' + p.promise.status);
      if (e.payBy) check('promise pay-by date', p.promise.payByIso === e.payBy, 'expected ' + e.payBy + ', got ' + p.promise.payByIso);
      if (e.followUp) check('follow-up date set', p.promise.followUp === e.followUp, 'expected ' + e.followUp + ', got ' + p.promise.followUp);
      if (e.escalate !== undefined) check('escalate flag', p.escalate === e.escalate, 'expected ' + e.escalate + ', got ' + p.escalate);
      if (e.shortPay) check('short-pay detected', p.shortPay.detected === true, 'remittance below invoice total');
      if (e.amountShort) check('short amount cited', Math.abs(p.shortPay.short - e.amountShort) < 0.005, 'expected ' + e.amountShort + ', got ' + p.shortPay.short);
      if (e.dispute) check('dispute reason cited', !!p.shortPay.dispute, 'remittance note names the dispute with a span');
      if (e.actionHasCall) check('next action = human call', p.nextAction && /call/i.test(p.nextAction.action), p.nextAction ? p.nextAction.action : 'missing');
      if (e.actionHasTerms) check('next action = revise terms', p.nextAction && /terms/i.test(p.nextAction.action), p.nextAction ? p.nextAction.action : 'missing');
      if (e.confidence) check('confidence as expected', p.confidence === e.confidence, 'expected ' + e.confidence + ', got ' + p.confidence);
      if (p.escalate) {
        check('next_action present when escalate=true', !!p.nextAction && !!p.nextAction.action, p.nextAction ? p.nextAction.action : 'MISSING');
      }

      var failed = checks.filter(function (k) { return !k.pass; });
      return {
        id: c.id,
        title: c.title,
        pass: failed.length === 0,
        checks: checks,
        reason: failed.length === 0
          ? checks.length + '/' + checks.length + ' checks passed; every claim cites a locatable span'
          : failed.map(function (k) { return k.name + ': ' + k.detail; }).join('; ')
      };
    });
  }

  return {
    buildPacket: buildPacket,
    verifyPacket: verifyPacket,
    rubric: rubric,
    turnStance: turnStance,
    fmtDate: fmtDate,
    fmtDay: fmtDay,
    money: money
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StuutEngine;
}
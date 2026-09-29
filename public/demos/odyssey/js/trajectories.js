/* Odyssey · Agora-2 trajectory packs.
 *
 * Synthetic multi-agent world-sim trajectories, generated offline from
 * scenario directives (no live Agora account, no robot/AV data). The eval
 * engine later scans these raw frames; nothing here is pre-labeled with
 * verdicts, scores, or failure modes.
 */

"use strict";

const ROOM = { w: 800, h: 480 };

const OBSTACLES = [
  { id: "counter", x: 120, y: 56, w: 560, h: 116 },
  { id: "cabinet", x: 668, y: 236, w: 104, h: 84 },
  { id: "table", x: 296, y: 244, w: 208, h: 112 },
];

/* Object home positions (world truth, shared across agent views). */
const OBJECTS = {
  cereal: { x: 238, y: 96 },
  bowl: { x: 400, y: 96 },
  mug: { x: 556, y: 96 },
  drawer: { x: 720, y: 278 },
};

const SPEED = 4.1; // px per frame @ 20 fps

/* Approach points sit clear of obstacle margins (8px rule). */
const APPROACH = {
  cereal: { x: 238, y: 190 },
  bowl: { x: 400, y: 190 },
  mug: { x: 556, y: 190 },
  table: { x: 400, y: 372 },
  cabinet: { x: 730, y: 350 },
};

const START = { x: 90, y: 430 };
const SOUTH_RUN = { x: 556, y: 420 }; // travel lane below the table

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function bearingDeg(from, to) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

/* A directive: { from, action, to?/route?, hold?, obj? } where action is the
 * EXECUTED action stream. intent may be overridden per frame by faults
 * (policy decisions that the executor then ignores). Route walks follow a
 * list of waypoints so paths stay clear of counter/table/cabinet margins. */
function genPack(def) {
  const N = def.frames;
  const frames = [];
  for (let f = 0; f < N; f++) {
    frames.push({ f, agents: {}, events: [], world: {} });
  }

  for (const agent of def.agents) {
    const dirs = def.script[agent];
    const pos = { ...def.start[agent] };
    let heading = def.start[agent].h;
    let carry = null;
    let state = "idle";
    let seg = 0;
    let lastD = null;

    const faultMap = {};
    for (const flt of def.faults?.[agent] ?? []) {
      for (let f = flt.from; f <= flt.to; f++) faultMap[f] = flt;
    }

    /* active directive = last one whose `from` has passed; hold actions
     * apply for `hold` frames, walks until the next directive starts */
    let p = -1;
    for (let f = 0; f < N; f++) {
      while (p + 1 < dirs.length && f >= dirs[p + 1].from) p++;
      let d = null;
      if (p >= 0 && f >= dirs[p].from) {
        const hold = dirs[p].hold || 0;
        const ends = hold ? dirs[p].from + hold : p + 1 < dirs.length ? dirs[p + 1].from : Infinity;
        if (f < ends) d = dirs[p];
      }

      if (d !== lastD) {
        seg = 0;
        lastD = d;
      }

      let intent = d ? d.intent : "idle";
      let action = d ? d.action : "idle";
      let move = 0;

      const flt = faultMap[f];
      if (flt) {
        intent = flt.intent;
        if (flt.action === "walk") {
          move = 1;
          action = "walk"; // executor walks somewhere else entirely
        } else {
          action = flt.action; // executor idles / stops while policy intended something else
        }
      } else if (d && d.action === "walk") {
        move = 1;
      }

      if (move) {
        const route = d.route || [d.to?.x !== undefined ? d.to : APPROACH[d.to] || d.to];
        const target = route[seg];
        if (dist(pos, target) < 2) seg = Math.min(seg + 1, route.length - 1);
        const t2 = route[seg];
        const step = Math.min(SPEED, dist(pos, t2));
        const dnow = dist(pos, t2) || 1;
        const bFrom = { x: pos.x, y: pos.y };
        pos.x += ((t2.x - pos.x) / dnow) * step;
        pos.y += ((t2.y - pos.y) / dnow) * step;
        heading = bearingDeg(bFrom, t2);
        state = carry ? "carry" : "travel";
      } else if (action === "grasp") {
        state = "grasping";
      } else if (action === "place" || action === "pour") {
        state = "holding";
      } else if (action === "idle") {
        state = "idle";
      }

      frames[f].agents[agent] = {
        x: Math.round(pos.x * 10) / 10,
        y: Math.round(pos.y * 10) / 10,
        h: Math.round(heading),
        intent,
        action,
        state,
        carry: carry ? carry.id : null,
      };

      // carry bookkeeping: object lifts at grasp end, drops at place/pour end
      if (action === "grasp" && d && d.hold && f === d.from + d.hold - 1) {
        carry = { id: d.obj || null };
      }
      if (carry && (action === "place" || action === "pour") && f === d.from + d.hold - 1) {
        carry = null;
      }
    }
  }

  // world object trajectories: carried objects ride with their agent
  const objTrail = {};
  for (const id of Object.keys(OBJECTS)) objTrail[id] = [{ f: 0, ...OBJECTS[id] }];
  for (let f = 1; f < N; f++) {
    const prev = {};
    for (const id of Object.keys(OBJECTS)) prev[id] = objTrail[id][objTrail[id].length - 1];
    for (const agent of def.agents) {
      const st = frames[f].agents[agent];
      const pr = frames[f - 1].agents[agent];
      if (st.carry && pr.carry === st.carry) continue; // same carrier keeps riding
      if (st.carry && pr.carry !== st.carry) {
        objTrail[st.carry].push({ f, x: st.x + 30, y: st.y + 10 });
      } else if (pr.carry) {
        // dropped: object stays exactly where it was; carrier walks away
        const prevObj = prev[pr.carry];
        objTrail[pr.carry].push({ f, x: prevObj.x, y: prevObj.y });
      }
    }
    for (const id of Object.keys(OBJECTS)) {
      const trail = objTrail[id];
      if (trail[trail.length - 1].f !== f) trail.push({ ...trail[trail.length - 1], f });
    }
  }
  for (let f = 0; f < N; f++) {
    const world = {};
    for (const id of Object.keys(OBJECTS)) {
      const t = objTrail[id].find((p) => p.f === f);
      world[id] = t ? { x: t.x, y: t.y } : { ...OBJECTS[id] };
    }
    frames[f].world = world;
  }

  for (const ev of def.events) {
    frames[ev.frame].events.push({
      id: ev.id,
      type: ev.type,
      note: ev.note,
      late_by: ev.late_by || 0,
      agent: ev.agent,
    });
  }

  return {
    id: def.id,
    case: def.case,
    tag: def.tag,
    task: def.task,
    fps: def.fps,
    frames: N,
    duration_s: N / def.fps,
    agents: def.agents,
    start: def.start,
    room: ROOM,
    obstacles: def.obstacles || OBSTACLES,
    objects: OBJECTS,
    framesArr: frames,
    priority: def.priority,
    scenario_note: def.scenario_note,
  };
}

const SCRIPT_01_OK = [
  { from: 0, action: "walk", intent: "walk", to: "cereal" },
  { from: 75, action: "grasp", intent: "grasp", hold: 18, obj: "cereal" },
  { from: 93, action: "walk", intent: "walk", to: "bowl", carry: "cereal" },
  { from: 134, action: "pour", intent: "pour", hold: 18 },
  { from: 152, action: "walk", intent: "walk", route: [{ x: 330, y: 190 }, { x: 90, y: 430 }] },
  { from: 253, action: "idle", intent: "idle" },
];

const TABLE_ROUTE = [{ x: 556, y: 420 }, { x: 440, y: 420 }, { x: 400, y: 372 }];

const SCRIPT_02_OK = [
  { from: 0, action: "walk", intent: "walk", to: "mug" },
  { from: 76, action: "grasp", intent: "grasp", hold: 18, obj: "mug" },
  { from: 94, action: "walk", intent: "walk", route: TABLE_ROUTE, carry: "mug" },
  { from: 195, action: "place", intent: "place", hold: 20 },
  { from: 215, action: "idle", intent: "idle" },
];

/* ------------------------------------------------------------------ */
/* Pack A · STABLE — both agents complete their tasks, all criticals pass */
/* ------------------------------------------------------------------ */

const RUN_A = genPack({
  id: "traj-sim-260-2026-09-28-a",
  case: "Stable",
  tag: "A",
  task: "Shared kitchen: empty cereal into bowl, place mug on table.",
  fps: 20,
  frames: 260,
  agents: ["wr-01", "wr-02"],
  start: {
    "wr-01": { x: 90, y: 430, h: 90 },
    "wr-02": { x: 712, y: 430, h: 270 },
  },
  script: {
    "wr-01": SCRIPT_01_OK,
    "wr-02": SCRIPT_02_OK,
  },
  events: [
    { frame: 75, id: "EV-001", type: "grasp_done", note: "wr-01 grabbed cereal", agent: "wr-01" },
    { frame: 93, id: "EV-002", type: "carry_start", note: "wr-01 carrying cereal to bowl", agent: "wr-01" },
    { frame: 134, id: "EV-003", type: "pour_start", note: "wr-01 pouring cereal", agent: "wr-01" },
    { frame: 151, id: "EV-004", type: "pour_done", note: "wr-01 finished pour", agent: "wr-01", late_by: 2 },
    { frame: 76, id: "EV-005", type: "grasp_done", note: "wr-02 grabbed mug", agent: "wr-02" },
    { frame: 195, id: "EV-006", type: "place_start", note: "wr-02 placing mug on table", agent: "wr-02" },
    { frame: 215, id: "EV-007", type: "place_done", note: "wr-02 placed mug", agent: "wr-02" },
  ],
  priority: {
    rank: null,
    label: "no critical failure",
    body:
      "No criticals on this run. PAT-queue candidate (low): event-log fidelity, EV-004 logged 2 frames late. Ship the run; file the note.",
  },
  scenario_note: "Both agents complete their tasks. The only anomaly is a 2-frame late event log write.",
});

/* ------------------------------------------------------------------ */
/* Pack B · FAILING — action ignored, then stuck without timely recovery */
/* ------------------------------------------------------------------ */

const RUN_B = genPack({
  id: "traj-sim-260-2026-09-28-b",
  case: "Failing",
  tag: "B",
  task: "Shared kitchen: empty cereal into bowl, place mug on table.",
  fps: 20,
  frames: 260,
  agents: ["wr-01", "wr-02"],
  start: {
    "wr-01": { x: 90, y: 430, h: 90 },
    "wr-02": { x: 712, y: 430, h: 270 },
  },
  script: {
    "wr-01": [
      { from: 0, action: "walk", intent: "walk", to: "cereal" },
      { from: 75, action: "grasp", intent: "grasp", hold: 18, obj: "cereal" },
      { from: 93, action: "walk", intent: "walk", to: "bowl", carry: "cereal" },
      { from: 180, action: "grasp", intent: "grasp", hold: 20 },
      { from: 200, action: "walk", intent: "walk", to: "bowl", carry: "cereal" },
      { from: 216, action: "idle", intent: "idle" },
    ],
    "wr-02": SCRIPT_02_OK,
  },
  faults: {
    "wr-01": [
      /* Policy decided to regrasp at f118 (shared-state interruption). The
       * executor emitted no action at all for 62 frames: intent "grasp",
       * executed "idle", position frozen, no recovery inside the window. */
      { from: 118, to: 179, intent: "grasp", action: "idle" },
    ],
  },
  events: [
    { frame: 75, id: "EV-010", type: "grasp_done", note: "wr-01 grabbed cereal", agent: "wr-01" },
    { frame: 118, id: "EV-011", type: "intent_set", note: "policy intent: regrasp (shared-state interruption)", agent: "wr-01" },
    { frame: 180, id: "EV-012", type: "recovery", note: "executor recovered: regrasp executed", agent: "wr-01" },
    { frame: 76, id: "EV-013", type: "grasp_done", note: "wr-02 grabbed mug", agent: "wr-02" },
    { frame: 195, id: "EV-014", type: "place_start", note: "wr-02 placing mug on table", agent: "wr-02" },
    { frame: 215, id: "EV-015", type: "place_done", note: "wr-02 placed mug", agent: "wr-02" },
  ],
  priority: {
    rank: 1,
    label: "Action-following",
    body:
      "wr-01 executed no action for 62 frames (118-179) after a shared-state interruption; recovery came at +62f, past the 60f window. Retrain target: action decoding under shared-state interruption.",
  },
  scenario_note: "Injected: policy intent changes at f118; executor idles for 62 frames; recovery arrives too late.",
});

/* ------------------------------------------------------------------ */
/* Pack C · CONFLICT — world renders clean, action-following fails (PROWL-shaped) */
/* ------------------------------------------------------------------ */

const RUN_C = genPack({
  id: "traj-sim-260-2026-09-28-c",
  case: "Conflict",
  tag: "C",
  task: "Shared kitchen: empty cereal into bowl, place mug on table.",
  fps: 20,
  frames: 260,
  agents: ["wr-01", "wr-02"],
  start: {
    "wr-01": { x: 90, y: 430, h: 90 },
    "wr-02": { x: 712, y: 430, h: 270 },
  },
  script: {
    "wr-01": SCRIPT_01_OK,
    "wr-02": [
      { from: 0, action: "walk", intent: "walk", to: "mug" },
      { from: 76, action: "walk", intent: "walk", route: TABLE_ROUTE },
      { from: 146, action: "walk", intent: "walk", to: "mug" },
      { from: 204, action: "grasp", intent: "grasp", hold: 16, obj: "mug" },
      { from: 220, action: "place", intent: "place", hold: 16 },
      { from: 236, action: "idle", intent: "idle" },
    ],
  },
  faults: {
    "wr-02": [
      /* Policy decided to grasp the mug at f76; the executor instead kept
       * walking a detour for 70 frames and never touched it. World state
       * stays clean the whole time: no object drifts, no teleports,
       * shared views identical. */
      { from: 76, to: 145, intent: "grasp", action: "walk" },
    ],
  },
  events: [
    { frame: 75, id: "EV-020", type: "grasp_done", note: "wr-01 grabbed cereal", agent: "wr-01" },
    { frame: 76, id: "EV-021", type: "intent_set", note: "policy intent: grasp mug", agent: "wr-02" },
    { frame: 134, id: "EV-026", type: "pour_start", note: "wr-01 pouring cereal", agent: "wr-01" },
    { frame: 151, id: "EV-027", type: "pour_done", note: "wr-01 finished pour", agent: "wr-01" },
    { frame: 146, id: "EV-022", type: "intent_set", note: "policy intent: walk to mug", agent: "wr-02" },
    { frame: 219, id: "EV-023", type: "grasp_done", note: "wr-02 grabbed mug (143f late)", agent: "wr-02" },
    { frame: 220, id: "EV-024", type: "place_start", note: "wr-02 placing mug", agent: "wr-02" },
    { frame: 235, id: "EV-025", type: "place_done", note: "wr-02 placed mug", agent: "wr-02" },
  ],
  priority: {
    rank: 1,
    label: "Action-following",
    body:
      "Escalated: visually clean rollout fails the action gate. Intent 'grasp' executed as 'move' for 70 frames (76-145, wr-02); visual consistency screened 0-259 and passed with zero drift. PROWL shape: polish is green, behavior is not. Block merge on action-following regressions.",
    escalated: true,
  },
  scenario_note: "Injected: executor walks a detour away from the decided grasp; every object renders perfectly the whole run.",
});

const PACKS = [RUN_A, RUN_B, RUN_C];
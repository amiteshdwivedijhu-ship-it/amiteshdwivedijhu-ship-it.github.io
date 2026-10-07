/* Synthetic players and a fake game. Not a PlayStation or Sony product. */
window.PARTY_DATA = {
  game: "Starfall Rally",
  timeLabel: "Tonight 8:00 PM",
  bandwidth: 300,
  gbPerMinute: 2.25,
  host: "kai",
  friends: ["ren", "mira", "theo", "ava"],
  players: {
    kai: { name: "Kai", role: "Host", device: "PS5", owns: true, installed: true, remain: 2.1, total: 2.1, online: "Active", remote: true, note: "2.1 GB patch pending" },
    ren: { name: "Ren", role: "Friend", device: "PC", owns: true, installed: true, remain: 0, total: 0, online: "Not needed on PC", remote: false, note: "Up to date" },
    mira: { name: "Mira", role: "Friend", device: "PS5", owns: true, installed: true, remain: 7.688, total: 12.4, startPct: 38, online: "Active", remote: true, note: "12.4 GB patch, 38% done" },
    theo: { name: "Theo", role: "Friend", device: "PS5", owns: true, installed: false, remain: 46, total: 46, online: "Active", remote: true, note: "Not installed, 46 GB" },
    ava: { name: "Ava", role: "Friend", device: "PS5", owns: true, installed: true, remain: 0, total: 0, online: "Lapsed", remote: false, note: "Online access lapsed" }
  },
  pm: {
    sessions: 1000,
    readyPct: 61,
    targetPct: 75,
    medianMin: 14,
    blockers: [
      ["Patch pending", 44],
      ["Not installed", 27],
      ["Membership", 18],
      ["Other", 11]
    ]
  },
  nudgeSeed: {
    tone: "Friendly and short",
    audience: "Players invited to a session who are not ready",
    touch: "Phone app and the Game Base card",
    technique: "One tap that starts the fix on the player's own console"
  }
};

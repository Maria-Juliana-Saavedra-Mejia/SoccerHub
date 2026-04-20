import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const validatorsCode = readFileSync(join(__dirname, "../scripts/validators.js"), "utf8");
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(validatorsCode, sandbox);

const { createTeamInputFromValues, createPlayerInputFromValues, createStatsInputFromValues } =
  sandbox;

test("createTeamInputFromValues rejects empty team name", () => {
  const r = createTeamInputFromValues({ name: "", logoUrl: "https://example.com/x.png" });
  assert.equal(r.valid, false);
  assert.equal(r.errors.name, "Team name is required.");
});

test("createTeamInputFromValues accepts valid team", () => {
  const r = createTeamInputFromValues({ name: "Test FC", logoUrl: "https://example.com/logo.png" });
  assert.equal(r.valid, true);
  assert.equal(r.data.name, "Test FC");
  assert.equal(r.data.logoUrl, "https://example.com/logo.png");
  assert.equal(r.data.description, "");
  assert.ok(Array.isArray(r.data.leaguesWon) && r.data.leaguesWon.length === 0);
  assert.equal(r.data.creator, "");
  assert.equal(r.data.currentLeague, "");
});

test("createTeamInputFromValues parses honors lines and optional fields", () => {
  const r = createTeamInputFromValues({
    name: "Test FC",
    logoUrl: "https://example.com/logo.png",
    description: "A test club.",
    currentLeague: "Demo League",
    creator: "Founder Name",
    leaguesWon: "Cup A\nCup B",
  });
  assert.equal(r.valid, true);
  assert.equal(r.data.description, "A test club.");
  assert.ok(Array.isArray(r.data.leaguesWon));
  assert.equal(r.data.leaguesWon.length, 2);
  assert.equal(r.data.leaguesWon[0], "Cup A");
  assert.equal(r.data.leaguesWon[1], "Cup B");
  assert.equal(r.data.creator, "Founder Name");
  assert.equal(r.data.currentLeague, "Demo League");
});

test("createPlayerInputFromValues rejects missing team", () => {
  const r = createPlayerInputFromValues({
    teamId: "",
    name: "Jane Doe",
    position: "Midfielder",
  });
  assert.equal(r.valid, false);
  assert.equal(r.errors.teamId, "Select a team.");
});

test("createPlayerInputFromValues rejects bad photo URL scheme", () => {
  const r = createPlayerInputFromValues({
    teamId: "t1",
    name: "Jane Doe",
    position: "Midfielder",
    imageUrl: "ftp://bad.example/a.jpg",
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.imageUrl);
});

test("createStatsInputFromValues rejects goals greater than matches played", () => {
  const r = createStatsInputFromValues({
    goals: "10",
    assists: "1",
    matchesPlayed: "5",
    shots: "",
    yellowCards: "",
  });
  assert.equal(r.valid, false);
  assert.equal(r.errors.goals, "Goals cannot exceed matches played.");
});

test("createStatsInputFromValues accepts valid stats", () => {
  const r = createStatsInputFromValues({
    goals: "4",
    assists: "2",
    matchesPlayed: "10",
    shots: "12",
    yellowCards: "1",
  });
  assert.equal(r.valid, true);
  assert.equal(r.data.goals, 4);
  assert.equal(r.data.assists, 2);
  assert.equal(r.data.matchesPlayed, 10);
  assert.equal(r.data.shots, 12);
  assert.equal(r.data.yellowCards, 1);
});

/**
 * SoccerHub — core domain, persistence, and auth (OOP)
 * Data: teams → players → stats (localStorage, migration-safe)
 */

const SoccerHubConfig = {
  /** Single JSON blob: { version, teams, players, stats } */
  dataKey: "soccerHubData",
  /** Legacy flat players array (migrated once) */
  legacyPlayersKey: "soccerHubPlayers",
  sessionKey: "soccerHubSessionRole",
  adminPassword: "admin123",
  dataVersion: 1,
};

class SoccerHubUtils {
  static newId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }
}

/**
 * @typedef {{ id: string, name: string, logoUrl: string }} Team
 * @typedef {{ id: string, teamId: string, name: string, position: string, imageUrl?: string }} Player
 * @typedef {{ playerId: string, goals: number, assists: number, matchesPlayed: number, shots?: number, yellowCards?: number }} PlayerStats
 * @typedef {{ version: number, teams: Team[], players: Player[], stats: PlayerStats[] }} AppData
 */

class AppDataRepository {
  constructor(config) {
    this.config = config;
  }

  /** @returns {AppData} */
  getDefaultData() {
    const teams = [
      {
        id: SoccerHubUtils.newId(),
        name: "Real Madrid",
        logoUrl: "https://crests.football-data.org/86.png",
      },
      {
        id: SoccerHubUtils.newId(),
        name: "FC Barcelona",
        logoUrl: "https://crests.football-data.org/81.png",
      },
      {
        id: SoccerHubUtils.newId(),
        name: "Manchester City",
        logoUrl: "https://crests.football-data.org/65.png",
      },
      {
        id: SoccerHubUtils.newId(),
        name: "Liverpool",
        logoUrl: "https://crests.football-data.org/64.png",
      },
      {
        id: SoccerHubUtils.newId(),
        name: "PSG",
        logoUrl: "https://crests.football-data.org/524.png",
      },
    ];

    const [madrid, barca, city, liverpool, psg] = teams.map((t) => t.id);

    const players = [
      // ================= REAL MADRID =================
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Thibaut Courtois",
        position: "Goalkeeper",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/108390.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Dani Carvajal",
        position: "Right Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/138927.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Antonio Rüdiger",
        position: "Center Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/86202.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "David Alaba",
        position: "Center Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/59016.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Ferland Mendy",
        position: "Left Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/291417.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Aurélien Tchouaméni",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/413112.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Toni Kroos",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/31909.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Jude Bellingham",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/581678.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Rodrygo",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/412363.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Vinícius Jr",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/371998.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Joselu",
        position: "Striker",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/81999.jpg",
      },

      // ================= BARCELONA =================
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Marc-André ter Stegen",
        position: "Goalkeeper",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/74857.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Jules Koundé",
        position: "Defender",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/342229.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Ronald Araújo",
        position: "Defender",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/480692.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Alejandro Balde",
        position: "Left Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/625207.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Frenkie de Jong",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/326330.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Pedri",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/683840.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Gavi",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/646740.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Raphinha",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/411295.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Robert Lewandowski",
        position: "Striker",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/38253.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "João Félix",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/462250.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Lamine Yamal",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/937958.jpg",
      },

      // ================= MAN CITY =================
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Ederson",
        position: "Goalkeeper",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p121160.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Kyle Walker",
        position: "Defender",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p58621.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Rúben Dias",
        position: "Defender",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p244731.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "John Stones",
        position: "Defender",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p97299.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Joško Gvardiol",
        position: "Defender",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/475959.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Rodri",
        position: "Midfielder",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p220566.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Kevin De Bruyne",
        position: "Midfielder",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p61366.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Bernardo Silva",
        position: "Midfielder",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p165809.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Phil Foden",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p209244.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Jack Grealish",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p114283.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: city,
        name: "Erling Haaland",
        position: "Striker",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p223094.png",
      },
    ];

    const stats = players.map((p, i) => ({
      playerId: p.id,
      goals: Math.min(28, 2 + (i % 12)),
      assists: i % 10,
      matchesPlayed: 8 + (i % 22),
      shots: 14 + i * 2,
      yellowCards: i % 5,
    }));

    return {
      version: this.config.dataVersion,
      teams,
      players,
      stats,
    };
  }

  /** @param {unknown} data */
  isValidAppData(data) {
    if (data === null || typeof data !== "object") return false;
    const d = /** @type {Record<string, unknown>} */ (data);
    return (
      typeof d.version === "number" &&
      Array.isArray(d.teams) &&
      Array.isArray(d.players) &&
      Array.isArray(d.stats)
    );
  }

  /** @param {unknown} t */
  normalizeTeam(t) {
    if (t === null || typeof t !== "object") return null;
    const o = /** @type {Record<string, unknown>} */ (t);
    const id = typeof o.id === "string" ? o.id : SoccerHubUtils.newId();
    const name = String(o.name || "").trim();
    const logoUrl = String(o.logoUrl || "").trim();
    if (!name) return null;
    return {
      id,
      name,
      logoUrl: logoUrl || "https://placehold.co/120x120/1a222c/34d27b?text=Team",
    };
  }

  /** @param {unknown} p */
  normalizePlayer(p) {
    if (p === null || typeof p !== "object") return null;
    const o = /** @type {Record<string, unknown>} */ (p);
    const id = typeof o.id === "string" ? o.id : SoccerHubUtils.newId();
    const teamId = typeof o.teamId === "string" ? o.teamId : "";
    const name = String(o.name || "").trim();
    const position = String(o.position || "—").trim() || "—";
    if (!teamId || !name) return null;
    const imageUrl = String(o.imageUrl || "").trim();
    const out = { id, teamId, name, position };
    if (imageUrl) out.imageUrl = imageUrl;
    return out;
  }

  /** @param {unknown} s */
  normalizeStats(s) {
    if (s === null || typeof s !== "object") return null;
    const o = /** @type {Record<string, unknown>} */ (s);
    const playerId = typeof o.playerId === "string" ? o.playerId : "";
    if (!playerId) return null;
    const goals = Math.max(0, Math.floor(Number(o.goals)) || 0);
    const assists = Math.max(0, Math.floor(Number(o.assists)) || 0);
    const matchesPlayed = Math.max(0, Math.floor(Number(o.matchesPlayed)) || 0);
    const shots = o.shots !== undefined ? Math.max(0, Math.floor(Number(o.shots)) || 0) : undefined;
    const yellowCards =
      o.yellowCards !== undefined ? Math.max(0, Math.floor(Number(o.yellowCards)) || 0) : undefined;
    return { playerId, goals, assists, matchesPlayed, shots, yellowCards };
  }

  /** @returns {AppData} */
  migrateFromLegacyPlayers() {
    try {
      const raw = localStorage.getItem(this.config.legacyPlayersKey);
      if (!raw) return this.getDefaultData();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return this.getDefaultData();

      const teamNameToId = new Map();
      /** @type {Team[]} */
      const teams = [];
      /** @type {Player[]} */
      const players = [];
      /** @type {PlayerStats[]} */
      const stats = [];

      for (const row of parsed) {
        if (row === null || typeof row !== "object") continue;
        const r = /** @type {Record<string, unknown>} */ (row);
        const teamName = String(r.team || "").trim();
        const name = String(r.name || "").trim();
        if (!teamName || !name) continue;

        let teamId = teamNameToId.get(teamName);
        if (!teamId) {
          teamId = SoccerHubUtils.newId();
          teamNameToId.set(teamName, teamId);
          teams.push({
            id: teamId,
            name: teamName,
            logoUrl: "https://placehold.co/120x120/1a222c/34d27b?text=" + encodeURIComponent(teamName.slice(0, 3)),
          });
        }

        const playerId = typeof r.id === "string" ? r.id : SoccerHubUtils.newId();
        players.push({
          id: playerId,
          teamId,
          name,
          position: "—",
        });
        stats.push({
          playerId,
          goals: Math.max(0, Math.floor(Number(r.goals)) || 0),
          assists: 0,
          matchesPlayed: Math.max(0, Math.floor(Number(r.matchesPlayed)) || 0),
        });
      }

      if (teams.length === 0) return this.getDefaultData();
      return { version: this.config.dataVersion, teams, players, stats };
    } catch {
      return this.getDefaultData();
    }
  }

  /** @returns {AppData} */
  load() {
    try {
      const raw = localStorage.getItem(this.config.dataKey);
      if (!raw) {
        const migrated = this.migrateFromLegacyPlayers();
        this.save(migrated);
        return migrated;
      }
      const parsed = JSON.parse(raw);
      if (!this.isValidAppData(parsed)) {
        const migrated = this.migrateFromLegacyPlayers();
        this.save(migrated);
        return migrated;
      }
      const d = /** @type {AppData} */ (parsed);
      const teams = d.teams.map((t) => this.normalizeTeam(t)).filter(Boolean);
      const players = d.players.map((p) => this.normalizePlayer(p)).filter(Boolean);
      const stats = d.stats.map((s) => this.normalizeStats(s)).filter(Boolean);
      return {
        version: this.config.dataVersion,
        teams: /** @type {Team[]} */ (teams),
        players: /** @type {Player[]} */ (players),
        stats: /** @type {PlayerStats[]} */ (stats),
      };
    } catch {
      const fresh = this.getDefaultData();
      this.save(fresh);
      return fresh;
    }
  }

  /** @param {AppData} data */
  save(data) {
    localStorage.setItem(this.config.dataKey, JSON.stringify(data));
  }
}

class LeagueService {
  constructor(repository) {
    this.repository = repository;
    this.data = repository.load();
  }

  persist() {
    this.repository.save(this.data);
  }

  getTeams() {
    return this.data.teams.slice();
  }

  getTeam(teamId) {
    return this.data.teams.find((t) => t.id === teamId) || null;
  }

  addTeam(team) {
    this.data.teams.push(team);
    this.persist();
  }

  updateTeam(teamId, patch) {
    const i = this.data.teams.findIndex((t) => t.id === teamId);
    if (i === -1) return false;
    this.data.teams[i] = { ...this.data.teams[i], ...patch };
    this.persist();
    return true;
  }

  removeTeam(teamId) {
    const before = this.data.teams.length;
    this.data.teams = this.data.teams.filter((t) => t.id !== teamId);
    const playerIds = this.data.players.filter((p) => p.teamId === teamId).map((p) => p.id);
    this.data.players = this.data.players.filter((p) => p.teamId !== teamId);
    this.data.stats = this.data.stats.filter((s) => !playerIds.includes(s.playerId));
    if (this.data.teams.length === before) return false;
    this.persist();
    return true;
  }

  getPlayers(teamId) {
    if (!teamId) return this.data.players.slice();
    return this.data.players.filter((p) => p.teamId === teamId);
  }

  getPlayer(playerId) {
    return this.data.players.find((p) => p.id === playerId) || null;
  }

  addPlayer(player) {
    if (player.imageUrl === "") {
      delete player.imageUrl;
    }
    this.data.players.push(player);
    if (!this.data.stats.some((s) => s.playerId === player.id)) {
      this.data.stats.push({
        playerId: player.id,
        goals: 0,
        assists: 0,
        matchesPlayed: 0,
        shots: 0,
        yellowCards: 0,
      });
    }
    this.persist();
  }

  updatePlayer(playerId, patch) {
    const i = this.data.players.findIndex((p) => p.id === playerId);
    if (i === -1) return false;
    this.data.players[i] = { ...this.data.players[i], ...patch };
    if (this.data.players[i].imageUrl === "") {
      delete this.data.players[i].imageUrl;
    }
    this.persist();
    return true;
  }

  removePlayer(playerId) {
    const before = this.data.players.length;
    this.data.players = this.data.players.filter((p) => p.id !== playerId);
    this.data.stats = this.data.stats.filter((s) => s.playerId !== playerId);
    if (this.data.players.length === before) return false;
    this.persist();
    return true;
  }

  getStats(playerId) {
    return this.data.stats.find((s) => s.playerId === playerId) || null;
  }

  upsertStats(playerId, patch) {
    let s = this.data.stats.find((x) => x.playerId === playerId);
    if (!s) {
      s = { playerId, goals: 0, assists: 0, matchesPlayed: 0, shots: 0, yellowCards: 0 };
      this.data.stats.push(s);
    }
    Object.assign(s, patch);
    this.persist();
    return s;
  }

  removeStats(playerId) {
    const before = this.data.stats.length;
    this.data.stats = this.data.stats.filter((x) => x.playerId !== playerId);
    if (this.data.stats.length === before) return false;
    this.persist();
    return true;
  }

  /** Reload from storage (e.g. after another tab changed data) */
  reload() {
    this.data = this.repository.load();
  }
}

class AuthService {
  constructor(config) {
    this.adminPassword = config.adminPassword;
    this.sessionKey = config.sessionKey;
  }

  login(role, password) {
    if (role === "admin" && password !== this.adminPassword) {
      return { success: false, message: "Incorrect admin password." };
    }
    localStorage.setItem(this.sessionKey, role);
    return { success: true, message: "Logged in as " + role + "." };
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
  }

  getCurrentRole() {
    return localStorage.getItem(this.sessionKey);
  }

  isAdmin() {
    return this.getCurrentRole() === "admin";
  }

  requireRole(role, redirectPath = "../index.html") {
    if (this.getCurrentRole() !== role) {
      window.location.href = redirectPath;
      return false;
    }
    return true;
  }
}

function createTeamInputFromValues(values) {
  const name = String(values.name || "").trim();
  const logoUrl = String(values.logoUrl || "").trim();
  const errors = {};
  if (!name) errors.name = "Team name is required.";
  if (!logoUrl) errors.logoUrl = "Logo URL is required.";
  return {
    valid: Object.keys(errors).length === 0,
    data: { name, logoUrl },
    errors,
  };
}

function createPlayerInputFromValues(values) {
  const teamId = String(values.teamId || "").trim();
  const name = String(values.name || "").trim();
  const position = String(values.position || "").trim();
  const imageUrl = String(values.imageUrl || "").trim();
  const errors = {};
  if (!teamId) errors.teamId = "Select a team.";
  if (!name) errors.name = "Player name is required.";
  if (!position) errors.position = "Position is required.";
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    errors.imageUrl = "Photo URL must start with http:// or https://";
  }
  const data = { teamId, name, position };
  if (imageUrl) data.imageUrl = imageUrl;
  return {
    valid: Object.keys(errors).length === 0,
    data,
    errors,
  };
}

function createStatsInputFromValues(values) {
  const goals = Number(values.goals);
  const assists = Number(values.assists);
  const matchesPlayed = Number(values.matchesPlayed);
  const shots = values.shots === "" || values.shots === undefined ? undefined : Number(values.shots);
  const yellowCards =
    values.yellowCards === "" || values.yellowCards === undefined ? undefined : Number(values.yellowCards);

  const errors = {};
  if (!Number.isInteger(goals) || goals < 0) errors.goals = "Goals must be a whole number >= 0.";
  if (!Number.isInteger(assists) || assists < 0) errors.assists = "Assists must be a whole number >= 0.";
  if (!Number.isInteger(matchesPlayed) || matchesPlayed < 0) {
    errors.matchesPlayed = "Matches must be a whole number >= 0.";
  }
  if (shots !== undefined && (!Number.isInteger(shots) || shots < 0)) {
    errors.shots = "Shots must be a whole number >= 0.";
  }
  if (yellowCards !== undefined && (!Number.isInteger(yellowCards) || yellowCards < 0)) {
    errors.yellowCards = "Yellow cards must be a whole number >= 0.";
  }
  if (!errors.goals && !errors.matchesPlayed && goals > matchesPlayed) {
    errors.goals = "Goals cannot exceed matches played.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    data: {
      goals,
      assists,
      matchesPlayed,
      shots,
      yellowCards,
    },
    errors,
  };
}

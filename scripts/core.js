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

  /**
   * Inline SVG avatar (initials) as a data URL — no network; avoids blocked CDNs / adblockers.
   * @param {string} initials 1–3 Latin characters recommended
   */
  static initialsAvatarDataUrl(initials) {
    const label = String(initials || "?")
      .replace(/[<>&'"]/g, "")
      .trim()
      .slice(0, 3) || "?";
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">' +
      '<rect fill="#111822" width="96" height="96" rx="10"/>' +
      '<text x="48" y="58" fill="#c8f902" font-size="22" font-family="system-ui,sans-serif" font-weight="700" text-anchor="middle">' +
      label +
      "</text></svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }
}

/**
 * Seed / backfill: extended club fields for the eight default clubs (keyed by exact `name`).
 * @type {Record<string, { description: string, leaguesWon: string[], creator: string, currentLeague: string }>}
 */
const DEFAULT_CLUB_METADATA_BY_NAME = {
  "Real Madrid": {
    description:
      "Record European champions based at the Santiago Bernabéu. Known for galácticos-era flair and a relentless winning culture in Spain and abroad.",
    leaguesWon: ["La Liga", "UEFA Champions League", "Copa del Rey", "FIFA Club World Cup"],
    creator: "Juan Padrós, Julián Palacios (founded 1902)",
    currentLeague: "La Liga",
  },
  "FC Barcelona": {
    description:
      "Catalan giants famous for La Masia youth production and possession football. Home matches at the renovated Estadi Olímpic while Camp Nou is redeveloped.",
    leaguesWon: ["La Liga", "UEFA Champions League", "Copa del Rey", "UEFA Cup Winners' Cup"],
    creator: "Joan Gamper (founded 1899)",
    currentLeague: "La Liga",
  },
  "Manchester City": {
    description:
      "Etihad Stadium club that rose to dominate English football with progressive coaching and deep squad depth under modern ownership.",
    leaguesWon: ["Premier League", "FA Cup", "EFL Cup", "UEFA Champions League"],
    creator: "Anna Connell, William Beastow (founded 1880 as St. Mark's)",
    currentLeague: "Premier League",
  },
  Liverpool: {
    description:
      "Anfield institution built on high pressing and European nights. One of England's most decorated clubs with a global supporter base.",
    leaguesWon: ["First Division / Premier League", "UEFA Champions League", "FA Cup", "EFL Cup"],
    creator: "John Houlding (founded 1892)",
    currentLeague: "Premier League",
  },
  PSG: {
    description:
      "Paris flagship club combining Ligue 1 dominance with marquee signings. Plays at the Parc des Princes in the French capital.",
    leaguesWon: ["Ligue 1", "Coupe de France", "Coupe de la Ligue", "UEFA Cup Winners' Cup"],
    creator: "Guy Crescent, Pierre-Étienne Guyot, Henri Heillmann (founded 1970)",
    currentLeague: "Ligue 1",
  },
  "FC Bayern Munich": {
    description:
      "German record champions with a tradition of ruthless efficiency in the Bundesliga and regular deep runs in European competition.",
    leaguesWon: ["Bundesliga", "DFB-Pokal", "UEFA Champions League", "UEFA Cup / Europa League"],
    creator: "Franz John and founding members (founded 1900)",
    currentLeague: "Bundesliga",
  },
  "Arsenal FC": {
    description:
      "North London club known for stylistic football and long unbeaten league runs. Emirates Stadium has been home since 2006.",
    leaguesWon: ["First Division / Premier League", "FA Cup", "League Cup", "UEFA Cup Winners' Cup"],
    creator: "Workers at Woolwich Arsenal Armament Factory (founded 1886)",
    currentLeague: "Premier League",
  },
  "Atlético Madrid": {
    description:
      "Madrid club built on defensive discipline and intensity under the Calderón and now the Metropolitano. Frequent title challengers in Spain.",
    leaguesWon: ["La Liga", "Copa del Rey", "UEFA Europa League", "UEFA Super Cup"],
    creator: "Students from Bilbao (founded 1903)",
    currentLeague: "La Liga",
  },
};

/**
 * @typedef {{ id: string, name: string, logoUrl: string, description?: string, leaguesWon?: string[], creator?: string, currentLeague?: string }} Team
 * @typedef {{ id: string, teamId: string, name: string, position: string, imageUrl?: string }} Player
 * @typedef {{ playerId: string, goals: number, assists: number, matchesPlayed: number, shots?: number, yellowCards?: number }} PlayerStats
 * @typedef {{ version: number, teams: Team[], players: Player[], stats: PlayerStats[] }} AppData
 */

/**
 * Fills empty description / honors / creator / league from {@link DEFAULT_CLUB_METADATA_BY_NAME} when the team name matches.
 * @param {Team} team
 * @returns {{ team: Team, changed: boolean }}
 */
function mergeKnownClubMetadata(team) {
  const seed = DEFAULT_CLUB_METADATA_BY_NAME[team.name];
  if (!seed) return { team, changed: false };
  let changed = false;
  const out = { ...team };
  if (!String(out.description || "").trim()) {
    out.description = seed.description;
    changed = true;
  }
  if (!out.leaguesWon || out.leaguesWon.length === 0) {
    out.leaguesWon = [...seed.leaguesWon];
    changed = true;
  }
  if (!String(out.creator || "").trim()) {
    out.creator = seed.creator;
    changed = true;
  }
  if (!String(out.currentLeague || "").trim()) {
    out.currentLeague = seed.currentLeague;
    changed = true;
  }
  return { team: out, changed };
}

class AppDataRepository {
  constructor(config) {
    this.config = config;
  }

  /** @returns {AppData} */
  getDefaultData() {
    const seedTeamBases = [
      { name: "Real Madrid", logoUrl: "https://crests.football-data.org/86.png" },
      { name: "FC Barcelona", logoUrl: "https://crests.football-data.org/81.png" },
      { name: "Manchester City", logoUrl: "https://crests.football-data.org/65.png" },
      { name: "Liverpool", logoUrl: "https://crests.football-data.org/64.png" },
      { name: "PSG", logoUrl: "https://crests.football-data.org/524.png" },
      { name: "FC Bayern Munich", logoUrl: "https://crests.football-data.org/5.png" },
      { name: "Arsenal FC", logoUrl: "https://crests.football-data.org/57.png" },
      { name: "Atlético Madrid", logoUrl: "https://crests.football-data.org/78.png" },
    ];
    const teams = seedTeamBases.map((base) => {
      const meta = DEFAULT_CLUB_METADATA_BY_NAME[base.name];
      if (!meta) {
        throw new Error("Missing DEFAULT_CLUB_METADATA_BY_NAME for " + base.name);
      }
      return {
        id: SoccerHubUtils.newId(),
        name: base.name,
        logoUrl: base.logoUrl,
        description: meta.description,
        leaguesWon: [...meta.leaguesWon],
        creator: meta.creator,
        currentLeague: meta.currentLeague,
      };
    });

    const [madrid, barca, city, liverpool, psg, bayern, arsenal, atletico] = teams.map((t) => t.id);

    const players = [
  // ================= REAL MADRID =================
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Thibaut Courtois",
    position: "Goalkeeper",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/8/8b/Thibaut_Courtois_2021.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Dani Carvajal",
    position: "Right Back",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/5/5c/Dani_Carvajal_2018.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Antonio Rüdiger",
    position: "Center Back",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/5/5f/Antonio_R%C3%BCdiger_2022.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "David Alaba",
    position: "Center Back",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/d/d4/David_Alaba_2021.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Ferland Mendy",
    position: "Left Back",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/0/0c/Ferland_Mendy_2021.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Aurélien Tchouaméni",
    position: "Midfielder",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/6/6c/Aurelien_Tchouameni_2022.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Toni Kroos",
    position: "Midfielder",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/3/3e/Toni_Kroos_2018.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Jude Bellingham",
    position: "Midfielder",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/4/4e/Jude_Bellingham_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Rodrygo",
    position: "Forward",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/3/3a/Rodrygo_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Vinícius Jr",
    position: "Forward",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/9/9f/Vinicius_Junior_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: madrid,
    name: "Joselu",
    position: "Striker",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/2/2f/Joselu_2023.jpg",
  },

  // ================= BARCELONA =================
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Marc-André ter Stegen",
    position: "Goalkeeper",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/3/3e/Marc-Andre_ter_Stegen_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Jules Koundé",
    position: "Defender",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/2/2e/Jules_Kounde_2022.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Ronald Araújo",
    position: "Defender",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/0/0f/Ronald_Araujo_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Alejandro Balde",
    position: "Left Back",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/7/7c/Alejandro_Balde_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Frenkie de Jong",
    position: "Midfielder",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/2/2e/Frenkie_de_Jong_2019.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Pedri",
    position: "Midfielder",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/3/3b/Pedri_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Gavi",
    position: "Midfielder",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/6/6e/Gavi_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Raphinha",
    position: "Forward",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/4/4f/Raphinha_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Robert Lewandowski",
    position: "Striker",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/8/8c/Robert_Lewandowski_2022.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "João Félix",
    position: "Forward",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/6/6c/Joao_Felix_2023.jpg",
  },
  {
    id: SoccerHubUtils.newId(),
    teamId: barca,
    name: "Lamine Yamal",
    position: "Forward",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/7/7d/Lamine_Yamal_2024.jpg",
  },

  // ================= MAN CITY =================
  {
    id: SoccerHubUtils.newId(),
    teamId: city,
    name: "Erling Haaland",
    position: "Striker",
    imageUrl:"https://resources.premierleague.com/premierleague/photos/players/250x250/p223094.png",
  },

  // ================= LIVERPOOL =================
  {
    id: SoccerHubUtils.newId(),
    teamId: liverpool,
    name: "Mohamed Salah",
    position: "Forward",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/c/c2/Mohamed_Salah_2021.jpg",
  },

  // ================= PSG =================
  {
    id: SoccerHubUtils.newId(),
    teamId: psg,
    name: "Gianluigi Donnarumma",
    position: "Goalkeeper",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/2/2d/Gianluigi_Donnarumma_2025.jpg",
  },

  // ================= BAYERN =================
  {
    id: SoccerHubUtils.newId(),
    teamId: bayern,
    name: "Harry Kane",
    position: "Striker",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/5/5e/Harry_Kane_2023.jpg",
  },

  // ================= ARSENAL =================
  {
    id: SoccerHubUtils.newId(),
    teamId: arsenal,
    name: "Bukayo Saka",
    position: "Forward",
    imageUrl:"https://resources.premierleague.com/premierleague/photos/players/250x250/p223340.png",
  },

  // ================= ATLETICO =================
  {
    id: SoccerHubUtils.newId(),
    teamId: atletico,
    name: "Antoine Griezmann",
    position: "Forward",
    imageUrl:"https://upload.wikimedia.org/wikipedia/commons/3/3a/Antoine_Griezmann_2022.jpg",
  }
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
    const description = String(o.description || "").trim();
    const creator = String(o.creator || "").trim();
    const currentLeague = String(o.currentLeague || "").trim();
    /** @type {string[]} */
    let leaguesWon = [];
    if (Array.isArray(o.leaguesWon)) {
      leaguesWon = o.leaguesWon.map((x) => String(x).trim()).filter(Boolean);
    } else if (typeof o.leaguesWon === "string" && o.leaguesWon.trim()) {
      leaguesWon = o.leaguesWon
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return {
      id,
      name,
      logoUrl: logoUrl || "https://placehold.co/120x120/1a222c/34d27b?text=Team",
      description,
      leaguesWon,
      creator,
      currentLeague,
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
      const normalizedTeams = d.teams.map((t) => this.normalizeTeam(t)).filter(Boolean);
      let teamsMerged = false;
      const teams = normalizedTeams.map((t) => {
        const { team: merged, changed } = mergeKnownClubMetadata(/** @type {Team} */ (t));
        if (changed) teamsMerged = true;
        return merged;
      });
      const normalizedPlayers = d.players.map((p) => this.normalizePlayer(p)).filter(Boolean);
      const stats = d.stats.map((s) => this.normalizeStats(s)).filter(Boolean);
      const result = {
        version: this.config.dataVersion,
        teams: /** @type {Team[]} */ (teams),
        players: /** @type {Player[]} */ (normalizedPlayers),
        stats: /** @type {PlayerStats[]} */ (stats),
      };
      if (teamsMerged) this.save(result);
      return result;
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

  /**
   * Sum goals, assists, and yellow cards for all players on a team.
   * @param {string} teamId
   * @returns {{ goals: number, assists: number, yellowCards: number }}
   */
  getTeamStatTotals(teamId) {
    let goals = 0;
    let assists = 0;
    let yellowCards = 0;
    for (const p of this.getPlayers(teamId)) {
      const s = this.getStats(p.id);
      if (s) {
        goals += s.goals;
        assists += s.assists;
        yellowCards += s.yellowCards !== undefined ? s.yellowCards : 0;
      }
    }
    return { goals, assists, yellowCards };
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

  /**
   * Replace app data from imported JSON (e.g. file). Validates top-level shape only.
   * @param {unknown} data
   * @returns {{ ok: boolean, message?: string }}
   */
  importAppData(data) {
    if (!this.repository.isValidAppData(data)) {
      return { ok: false, message: "Invalid SoccerHub data file." };
    }
    const d = /** @type {AppData} */ (data);
    const teams = d.teams
      .map((t) => this.repository.normalizeTeam(t))
      .filter(Boolean);
    const normalizedPlayers = d.players
      .map((p) => this.repository.normalizePlayer(p))
      .filter(Boolean);
    const stats = d.stats.map((s) => this.repository.normalizeStats(s)).filter(Boolean);
    this.data = {
      version: typeof d.version === "number" ? d.version : this.repository.config.dataVersion,
      teams: /** @type {Team[]} */ (teams),
      players: /** @type {Player[]} */ (normalizedPlayers),
      stats: /** @type {PlayerStats[]} */ (stats),
    };
    this.persist();
    return { ok: true };
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

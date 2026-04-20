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
      {
        id: SoccerHubUtils.newId(),
        name: "FC Bayern Munich",
        logoUrl: "https://crests.football-data.org/5.png",
      },
      {
        id: SoccerHubUtils.newId(),
        name: "Arsenal FC",
        logoUrl: "https://crests.football-data.org/57.png",
      },
      {
        id: SoccerHubUtils.newId(),
        name: "Atlético Madrid",
        logoUrl: "https://crests.football-data.org/78.png",
      },
    ];

    const [madrid, barca, city, liverpool, psg, bayern, arsenal, atletico] = teams.map((t) => t.id);

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

      // ================= LIVERPOOL =================
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Alisson",
        position: "Goalkeeper",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p116535.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Trent Alexander-Arnold",
        position: "Right Back",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p169187.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Virgil van Dijk",
        position: "Center Back",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p97032.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Andrew Robertson",
        position: "Left Back",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p234803.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Dominik Szoboszlai",
        position: "Midfielder",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p447203.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Alexis Mac Allister",
        position: "Midfielder",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p243568.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Mohamed Salah",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p118748.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Luis Díaz",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p244850.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Darwin Núñez",
        position: "Striker",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p482442.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Diogo Jota",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p194634.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Cody Gakpo",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p369687.png",
      },

      // ================= PSG =================
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Gianluigi Donnarumma",
        position: "Goalkeeper",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/315858.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Achraf Hakimi",
        position: "Right Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/398073.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Marquinhos",
        position: "Center Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/181767.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Lucas Hernández",
        position: "Defender",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/201455.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Vitinha",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/487465.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Warren Zaïre-Emery",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/709036.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Ousmane Dembélé",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/288230.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Bradley Barcola",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/662281.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Randal Kolo Muani",
        position: "Striker",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/333900.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Gonçalo Ramos",
        position: "Striker",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/550516.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Marco Asensio",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/286413.jpg",
      },

      // ================= BAYERN MUNICH =================
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Manuel Neuer",
        position: "Goalkeeper",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/17259.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Joshua Kimmich",
        position: "Right Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/161933.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Dayot Upamecano",
        position: "Center Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/344695.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Kim Min-jae",
        position: "Center Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/351503.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Alphonso Davies",
        position: "Left Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/424204.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Leon Goretzka",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/153065.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Jamal Musiala",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/580014.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Leroy Sané",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/192633.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Serge Gnabry",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/90139.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Harry Kane",
        position: "Striker",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/132098.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Thomas Müller",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/58333.jpg",
      },

      // ================= ARSENAL =================
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "David Raya",
        position: "Goalkeeper",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p98745.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Ben White",
        position: "Right Back",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p198869.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "William Saliba",
        position: "Center Back",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p462424.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Gabriel Magalhães",
        position: "Center Back",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p226597.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Declan Rice",
        position: "Midfielder",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p204480.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Martin Ødegaard",
        position: "Midfielder",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p184029.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Bukayo Saka",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p223340.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Gabriel Martinelli",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p444145.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Kai Havertz",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/309400.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Leandro Trossard",
        position: "Forward",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p117116.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Gabriel Jesus",
        position: "Striker",
        imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p205651.png",
      },

      // ================= ATLÉTICO MADRID =================
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Jan Oblak",
        position: "Goalkeeper",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/121483.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Nahuel Molina",
        position: "Right Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/593526.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "José Giménez",
        position: "Center Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/284857.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Reinildo",
        position: "Left Back",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/341408.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Koke",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/84423.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Rodrigo De Paul",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/255253.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Antoine Griezmann",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/125781.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Álvaro Morata",
        position: "Striker",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/128223.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Samuel Lino",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/709051.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Memphis Depay",
        position: "Forward",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/167688.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Axel Witsel",
        position: "Midfielder",
        imageUrl: "https://tmssl.akamaized.net/images/portrait/header/50664.jpg",
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
    this.data = {
      version: typeof d.version === "number" ? d.version : this.repository.config.dataVersion,
      teams: d.teams,
      players: d.players,
      stats: d.stats,
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

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
        imageUrl: "https://assets.realmadrid.com/is/image/realmadrid/COURTOIS_550x650_SinParche?$Desktop$&fit=wrap&wid=420",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Dani Carvajal",
        position: "Right Back",
        imageUrl: "https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/daniel-carvajal-ramos/assets/CARVAJAL_EQUIPO_CARITA_380x501_SinParche.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Antonio Rüdiger",
        position: "Center Back",
        imageUrl: "https://assets.realmadrid.com/is/image/realmadrid/RUDIGER_550x650_SinParche?$Mobile$&fit=wrap&wid=420",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "David Alaba",
        position: "Center Back",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSO60l9Ep7vm1REb42OW3xJr8eU9kHjfLReBg&s",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Ferland Mendy",
        position: "Left Back",
        imageUrl: "https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/ferland-mendy/assets/MENDY_550x650_SinParche.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Aurélien Tchouaméni",
        position: "Midfielder",
        imageUrl: "https://assets.realmadrid.com/is/image/realmadrid/TCHOUAMENI_550x650_SinParche?$Desktop$&fit=wrap&wid=420",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Toni Kroos",
        position: "Midfielder",
        imageUrl: "https://assets.realmadrid.com/is/image/realmadrid/KROOS2_HP_PNG?$Mobile$&fit=wrap&wid=312",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Jude Bellingham",
        position: "Midfielder",
        imageUrl: "https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/jude-bellingham/assets/BELLINGHAM_EQUIPO_CARITA_380x501_SinParche.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Rodrygo",
        position: "Forward",
        imageUrl: "https://assets.realmadrid.com/is/image/realmadrid/RODRYGO_550x650_SinParche?$Mobile$&fit=wrap&wid=420",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Vinícius Jr",
        position: "Forward",
        imageUrl: "https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/vinicius-paixao-de-oliveira-junior-/assets/VINICIUS_550x650_SinParche.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: madrid,
        name: "Joselu",
        position: "Striker",
        imageUrl: "https://assets.realmadrid.com/is/image/realmadrid/550x650_JOSELU_15?$Mobile$&fit=wrap&wid=420",
      },

      // ================= BARCELONA =================
  
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Marc-André ter Stegen",
        position: "Goalkeeper",
        imageUrl: "https://a.espncdn.com/photo/2026/0106/r1597439_1296x729_16-9.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Jules Koundé",
        position: "Defender",
        imageUrl: "https://barcauniversal.com/wp-content/uploads/2025/04/barcelona-v-real-madrid-copa-del-rey-final-1-scaled.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Ronald Araújo",
        position: "Defender",
        imageUrl: "https://www.fcbarcelona.com/photo-resources/2026/03/03/9676da2a-af41-4299-a3df-d19d92491ab5/JUCA9970.jpg?width=1200&height=750",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Alejandro Balde",
        position: "Left Back",
        imageUrl: "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2025-04/Alejandro%20Balde%20Barcelona%202025.jpg?itok=8XWLM1By",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Frenkie de Jong",
        position: "Midfielder",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRayb0kbH9xKR6r2efxImzYnE6bpQ5Fz3B0nQ&s",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Pedri",
        position: "Midfielder",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTezI4cQFqUTuhdaaDI29wR_mydugEZ39-XrA&s",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Gavi",
        position: "Midfielder",
        imageUrl: "https://i.pinimg.com/736x/c1/72/0f/c1720f55d4553b8aadbb42fca8a215b9.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Raphinha",
        position: "Forward",
        imageUrl: "https://www.aljazeera.com/wp-content/uploads/2025/01/2025-01-21T220448Z_1474946714_UP1EL1L1PBY5X_RTRMADP_3_SOCCER-CHAMPIONS-SLB-BAR-REPORT-1737497355.jpg?resize=1920%2C1440",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Robert Lewandowski",
        position: "Striker",
        imageUrl: "https://i.pinimg.com/736x/b4/0e/9e/b40e9eadc4187bcdf22ac4461883548e.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "João Félix",
        position: "Forward",
        imageUrl: "https://assets.goal.com/images/v3/blte480a8f93fa2e2a9/GOAL_-_Blank_WEB_-_Facebook_(3).jpg?auto=webp&format=pjpg&width=3840&quality=60",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: barca,
        name: "Lamine Yamal",
        position: "Forward",
        imageUrl: "https://assets-us-01.kc-usercontent.com/31dbcbc6-da4c-0033-328a-d7621d0fa726/5f67c61f-3ebb-4ddf-ba7c-72438b981969/2025-11-09T210026Z_700312376_UP1ELB91MCPGJ_RTRMADP_3_SOCCER-SPAIN-CEL-BAR%20%282%29.JPG?ver=03-06-2025?w=3840&q=75",
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
        imageUrl: "https://www.mancity.com/meta/media/fk4lwkni/ruben-dias-elec-blue.png?width=450&quality=100",
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
        imageUrl: "https://www.mancity.com/meta/media/afjd5irm/josko-gvardiol-elec-blue.png",
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
        imageUrl: "https://backend.liverpoolfc.com/sites/default/files/styles/xs/public/2025-08/alisson-becker-2526-action-shot_3b9d1ac89d40cf2fec8d178913e666f6.webp?itok=gNbPS0gy",
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
        imageUrl: "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/50327420.webp",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Andrew Robertson",
        position: "Left Back",
        imageUrl: "https://backend.liverpoolfc.com/sites/default/files/styles/xs/public/2025-08/andy-robertson-2526-bodyshot_68e21fb11193f4265b68fac61056aa21.webp?itok=X3U46YL8",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Dominik Szoboszlai",
        position: "Midfielder",
        imageUrl: "https://backend.liverpoolfc.com/sites/default/files/styles/xs/public/2025-08/dominik-szoboszlai-2526-action-shot_823b8a57728fadd08b6fefeeeffaf029.webp?itok=2wYv_ocB",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Alexis Mac Allister",
        position: "Midfielder",
        imageUrl: "https://backend.liverpoolfc.com/sites/default/files/styles/xs/public/2025-08/alexis-mac-allister-2526-bodyshot_3dddf5e4052b2e68168b0f0effb18933.webp?itok=77ssU4H2",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Mohamed Salah",
        position: "Forward",
        imageUrl: "https://backend.liverpoolfc.com/sites/default/files/styles/xs/public/2025-09/mohamed-salah-2025-26-body-shot-straight_1eed4e039fbd8ced5f98958fdf8b6235.png?itok=hWA7K4zm",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Luis Díaz",
        position: "Forward",
        imageUrl: "https://static.wikia.nocookie.net/liverpoolfc/images/1/1d/LDiaz2024.png/revision/latest?cb=20240830094651",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: liverpool,
        name: "Darwin Núñez",
        position: "Striker",
        imageUrl: "https://static.wikia.nocookie.net/liverpoolfc/images/4/49/DNunez2024.png/revision/latest?cb=20240830094708",
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
        imageUrl: "https://backend.liverpoolfc.com/sites/default/files/styles/md/public/2025-08/cody-gakpo-2526-bodyshot_d2699f6ae8e453ab344175e42bc4e28a.png?itok=-AidnI6U",
      },

      // ================= PSG =================
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Gianluigi Donnarumma",
        position: "Goalkeeper",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Norway_Italy_-_June_2025_A_17_%28Gianluigi_Donnarumma%29.jpg/250px-Norway_Italy_-_June_2025_A_17_%28Gianluigi_Donnarumma%29.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Achraf Hakimi",
        position: "Right Back",
        imageUrl: "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250088061.webp",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Marquinhos",
        position: "Center Back",
        imageUrl: "https://assets.sorare.com/playerpicture/46769dd9-79c5-4b96-b359-5c56c29decbb/picture/squared-6e4a7f59a05d309b77cb8c3f066d45e6.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Lucas Hernández",
        position: "Defender",
        imageUrl: "https://pbs.twimg.com/profile_images/1678037959092711424/nDCpBhWD_400x400.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Vitinha",
        position: "Midfielder",
        imageUrl: "https://s3.eu-west-3.amazonaws.com/ligue1.image/cms/Vitinha_with_PSG_e81b6dce82.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Warren Zaïre-Emery",
        position: "Midfielder",
        imageUrl: "https://static01.nyt.com/athletic/uploads/wp/2024/06/14132150/GettyImages-2154799869-scaled.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Ousmane Dembélé",
        position: "Forward",
        imageUrl: "https://www.lequipe.fr/_medias/img-photo-jpg/ousmane-dembele-face-au-bayern-munich-1-2-le-4-novembre-e-garnier-l-equipe/1500000002317948/376:28,1671:1323-828-828-75/2a2fc",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Bradley Barcola",
        position: "Forward",
        imageUrl: "https://image-service.onefootball.com/transform?w=280&h=210&dpr=2&image=https%3A%2F%2Fcdn.foot-africa.com%2F20260111%2Fbdce0114a742d18c7e8a0b74278656340aab864b31e31e0099bc68a1e06f87e6-1200-675.webp",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Randal Kolo Muani",
        position: "Striker",
        imageUrl: "https://assets.goal.com/images/v3/blt145cd7b23cadda28/Randal_Kolo_Muani_PSG_102023.jpg?auto=webp&format=pjpg&width=3840&quality=60",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Gonçalo Ramos",
        position: "Striker",
        imageUrl: "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250116654.webp",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: psg,
        name: "Marco Asensio",
        position: "Forward",
        imageUrl: "https://assets.goal.com/images/v3/getty-2167257227/crop/MM5DIMBQGA5DEMRVGA5G433XMU5DINZXHIYA====/GettyImages-2167257227.jpg?auto=webp&format=pjpg&width=3840&quality=60",
      },

      // ================= BAYERN MUNICH =================
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Manuel Neuer",
        position: "Goalkeeper",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/ar_1:1,c_fill,g_custom,w_768/v1719763484/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/manuel_neuer.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Joshua Kimmich",
        position: "Right Back",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-6x9-seo/v1656614911/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/joshua_kimmich.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Dayot Upamecano",
        position: "Center Back",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1656614772/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/dayot_upamecano.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Kim Min-jae",
        position: "Center Back",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1689695039/cms/public/images/fcbayern-com/players/spielerportraits/teaser/minjae-kim.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Alphonso Davies",
        position: "Left Back",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1656615722/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/alphonso_davies.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Leon Goretzka",
        position: "Midfielder",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1757574726/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/leon_goretzka.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Jamal Musiala",
        position: "Midfielder",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/ar_1:1,c_fill,g_custom,w_768/v1627302821/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/jamal_musiala.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Leroy Sané",
        position: "Forward",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1656615390/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/leroy_sane.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Serge Gnabry",
        position: "Forward",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1656615030/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/serge_gnabry.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Harry Kane",
        position: "Striker",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1691827799/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/harry-kane.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: bayern,
        name: "Thomas Müller",
        position: "Forward",
        imageUrl: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1629460334/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/thomas_mueller.png",
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
        imageUrl: "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250087938.webp",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: arsenal,
        name: "Leandro Trossard",
        position: "Forward",
        imageUrl: "https://www.getfootballnewsgermany.com/assets/arsenal-fc-v-newcastle-united-fc-premier-league-1-scaled.jpg",
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
        imageUrl: "https://img-estaticos.atleticodemadrid.com/system/fotos/16558/destacado_600x600/BUSTOS_WEB_900x900_0011_13_OBLAK.png?1723912761",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Nahuel Molina",
        position: "Right Back",
        imageUrl: "https://img-estaticos.atleticodemadrid.com/system/fotos/14846/destacado_600x600/_0009_RECORTES_WEB_0016_NAHUEL.png?1660405398",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "José Giménez",
        position: "Center Back",
        imageUrl: "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250063505.webp",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Reinildo",
        position: "Left Back",
        imageUrl: "https://img-estaticos.atleticodemadrid.com/system/fotos/13021/destacado_600x600/23_REINILDO.png?1643737107",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Koke",
        position: "Midfielder",
        imageUrl: "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/1909917.webp",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Rodrigo De Paul",
        position: "Midfielder",
        imageUrl: "https://img-estaticos.atleticodemadrid.com/system/fotos/16566/destacado_600x600/BUSTOS_WEB_900x900_0003_5_R-DE-PAUL.png?1723911355",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Antoine Griezmann",
        position: "Forward",
        imageUrl: "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250019498.webp",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Álvaro Morata",
        position: "Striker",
        imageUrl: "https://e0.365dm.com/19/07/1600x900/skysports-alvaro-morata-atletico-madrid_4711271.jpg?20190706131456",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Samuel Lino",
        position: "Forward",
        imageUrl: "https://cdn-img.zerozero.pt/img/planteis/new/87/91/8758791_samuel_lino_20250725195807.png",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Memphis Depay",
        position: "Forward",
        imageUrl: "https://okdiario.com/img/2023/03/11/memphis-en-el-entrenamiento-de-hoy.jpg",
      },
      {
        id: SoccerHubUtils.newId(),
        teamId: atletico,
        name: "Axel Witsel",
        position: "Midfielder",
        imageUrl: "https://img-estaticos.atleticodemadrid.com/system/fotos/15107/destacado_600x600/WITSEL_900x900.png?1692012680",
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

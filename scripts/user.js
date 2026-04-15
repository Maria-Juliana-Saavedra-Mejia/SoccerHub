const userAuthService = new AuthService(SoccerHubConfig);
const userLeague = new LeagueService(new AppDataRepository(SoccerHubConfig));

if (!userAuthService.requireRole("user")) {
  throw new Error("User access required.");
}

const logoutButton = document.getElementById("logoutButton");
const breadcrumb = document.getElementById("userBreadcrumb");
const teamsView = document.getElementById("teamsView");
const playersView = document.getElementById("playersView");
const teamSearchInput = document.getElementById("teamSearchInput");
const teamsGrid = document.getElementById("teamsGrid");
const teamsEmpty = document.getElementById("teamsEmpty");
const backToTeamsButton = document.getElementById("backToTeamsButton");
const playersPanelTitle = document.getElementById("playersPanelTitle");
const playerSearchInput = document.getElementById("playerSearchInput");
const playersList = document.getElementById("playersList");
const playersEmpty = document.getElementById("playersEmpty");
const statsModal = document.getElementById("statsModal");
const statsModalTitle = document.getElementById("statsModalTitle");
const statsModalBody = document.getElementById("statsModalBody");

let selectedTeamId = null;
let teamSearch = "";
let playerSearch = "";

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderBreadcrumb() {
  breadcrumb.replaceChildren();
  const home = document.createElement("span");
  home.className = "breadcrumb__item";
  home.textContent = "Teams";
  breadcrumb.appendChild(home);
  if (selectedTeamId) {
    const sep = document.createElement("span");
    sep.className = "breadcrumb__sep";
    sep.textContent = "/";
    breadcrumb.appendChild(sep);
    const team = userLeague.getTeam(selectedTeamId);
    const t = document.createElement("span");
    t.className = "breadcrumb__item breadcrumb__item--current";
    t.textContent = team ? team.name : "Squad";
    breadcrumb.appendChild(t);
  }
}

function filteredTeams() {
  const q = teamSearch.trim().toLowerCase();
  const teams = userLeague.getTeams();
  if (!q) return teams;
  return teams.filter((t) => t.name.toLowerCase().includes(q));
}

function renderTeams() {
  const teams = filteredTeams();
  teamsGrid.replaceChildren();
  teams.forEach((t) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "team-card";
    card.setAttribute("role", "listitem");
    card.dataset.teamId = t.id;
    card.innerHTML =
      '<span class="team-card__logo-wrap"><img class="team-card__logo" src="' +
      escapeHtml(t.logoUrl) +
      '" alt="" loading="lazy" /></span>' +
      '<span class="team-card__name">' +
      escapeHtml(t.name) +
      "</span>";
    teamsGrid.appendChild(card);
  });
  const showEmpty = teams.length === 0;
  teamsEmpty.hidden = !showEmpty;
}

function filteredPlayersForTeam(teamId) {
  const q = playerSearch.trim().toLowerCase();
  let list = userLeague.getPlayers(teamId);
  if (!q) return list;
  return list.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.position.toLowerCase().includes(q)
  );
}

function renderPlayers() {
  if (!selectedTeamId) return;
  const team = userLeague.getTeam(selectedTeamId);
  playersPanelTitle.textContent = team ? team.name + " — Squad" : "Squad";
  const players = filteredPlayersForTeam(selectedTeamId);
  playersList.replaceChildren();
  players.forEach((p) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "player-row";
    row.setAttribute("role", "listitem");
    row.dataset.playerId = p.id;
    const imgUrl = p.imageUrl && String(p.imageUrl).trim();
    const avatar = imgUrl
      ? '<span class="player-row__avatar"><img src="' +
        escapeHtml(imgUrl) +
        '" alt="" class="player-row__img" loading="lazy" /></span>'
      : '<span class="player-row__avatar player-row__avatar--empty" aria-hidden="true"></span>';
    row.innerHTML =
      avatar +
      '<span class="player-row__main"><span class="player-row__name">' +
      escapeHtml(p.name) +
      '</span><span class="player-row__pos">' +
      escapeHtml(p.position) +
      "</span></span>" +
      '<span class="player-row__hint">View stats →</span>';
    playersList.appendChild(row);
  });
  playersEmpty.hidden = players.length > 0;
}

function showTeamsView() {
  selectedTeamId = null;
  playerSearch = "";
  playerSearchInput.value = "";
  teamsView.classList.remove("is-hidden");
  playersView.classList.add("is-hidden");
  renderBreadcrumb();
  renderTeams();
}

function showPlayersView(teamId) {
  selectedTeamId = teamId;
  teamsView.classList.add("is-hidden");
  playersView.classList.remove("is-hidden");
  renderBreadcrumb();
  renderPlayers();
}

function openStatsModal(playerId) {
  const player = userLeague.getPlayer(playerId);
  if (!player) return;
  const team = userLeague.getTeam(player.teamId);
  const st = userLeague.getStats(playerId) || {
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
    shots: 0,
    yellowCards: 0,
  };
  statsModalTitle.textContent = player.name;
  const portrait =
    player.imageUrl && String(player.imageUrl).trim()
      ? '<div class="modal__portrait"><img src="' +
        escapeHtml(String(player.imageUrl).trim()) +
        '" alt="" loading="lazy" /></div>'
      : "";
  statsModalBody.innerHTML =
    portrait +
    '<p class="modal__meta">' +
    escapeHtml(team ? team.name : "") +
    " · " +
    escapeHtml(player.position) +
    "</p>" +
    '<dl class="stats-dl">' +
    "<div><dt>Goals</dt><dd>" +
    st.goals +
    "</dd></div>" +
    "<div><dt>Assists</dt><dd>" +
    st.assists +
    "</dd></div>" +
    "<div><dt>Matches played</dt><dd>" +
    st.matchesPlayed +
    "</dd></div>" +
    "<div><dt>Shots</dt><dd>" +
    (st.shots ?? "—") +
    "</dd></div>" +
    "<div><dt>Yellow cards</dt><dd>" +
    (st.yellowCards ?? "—") +
    "</dd></div>" +
    "</dl>";
  statsModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeStatsModal() {
  statsModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function bindEvents() {
  logoutButton.addEventListener("click", () => {
    userAuthService.logout();
    window.location.href = "../index.html";
  });

  teamSearchInput.addEventListener("input", () => {
    teamSearch = teamSearchInput.value;
    renderTeams();
  });

  playerSearchInput.addEventListener("input", () => {
    playerSearch = playerSearchInput.value;
    renderPlayers();
  });

  teamsGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".team-card[data-team-id]");
    if (!btn) return;
    const id = btn.dataset.teamId;
    if (id) showPlayersView(id);
  });

  backToTeamsButton.addEventListener("click", () => {
    showTeamsView();
  });

  playersList.addEventListener("click", (e) => {
    const row = e.target.closest(".player-row[data-player-id]");
    if (!row) return;
    const id = row.dataset.playerId;
    if (id) openStatsModal(id);
  });

  statsModal.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) closeStatsModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !statsModal.hidden) closeStatsModal();
  });
}

function init() {
  bindEvents();
  showTeamsView();
}

init();

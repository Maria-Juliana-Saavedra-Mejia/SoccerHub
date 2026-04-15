const adminAuthService = new AuthService(SoccerHubConfig);
const adminLeague = new LeagueService(new AppDataRepository(SoccerHubConfig));

if (!adminAuthService.requireRole("admin")) {
  throw new Error("Admin access required.");
}

const logoutButton = document.getElementById("logoutButton");
const adminGlobalMessage = document.getElementById("adminGlobalMessage");

const teamForm = document.getElementById("teamForm");
const teamEditId = document.getElementById("teamEditId");
const teamName = document.getElementById("teamName");
const teamLogoUrl = document.getElementById("teamLogoUrl");
const teamSubmitBtn = document.getElementById("teamSubmitBtn");
const teamCancelBtn = document.getElementById("teamCancelBtn");
const teamErrorName = document.getElementById("teamErrorName");
const teamErrorLogo = document.getElementById("teamErrorLogo");
const teamsTableBody = document.getElementById("teamsTableBody");

const playerForm = document.getElementById("playerForm");
const playerEditId = document.getElementById("playerEditId");
const playerTeamSelect = document.getElementById("playerTeamSelect");
const playerName = document.getElementById("playerName");
const playerPosition = document.getElementById("playerPosition");
const playerImageUrl = document.getElementById("playerImageUrl");
const playerSubmitBtn = document.getElementById("playerSubmitBtn");
const playerCancelBtn = document.getElementById("playerCancelBtn");
const playerErrorTeamId = document.getElementById("playerErrorTeamId");
const playerErrorName = document.getElementById("playerErrorName");
const playerErrorPosition = document.getElementById("playerErrorPosition");
const playerErrorImageUrl = document.getElementById("playerErrorImageUrl");
const playersTableBody = document.getElementById("playersTableBody");

const statsForm = document.getElementById("statsForm");
const statsPlayerSelect = document.getElementById("statsPlayerSelect");
const statsGoals = document.getElementById("statsGoals");
const statsAssists = document.getElementById("statsAssists");
const statsMatches = document.getElementById("statsMatches");
const statsShots = document.getElementById("statsShots");
const statsYellow = document.getElementById("statsYellow");
const statsErrorPlayer = document.getElementById("statsErrorPlayer");
const statsErrorGoals = document.getElementById("statsErrorGoals");
const statsErrorAssists = document.getElementById("statsErrorAssists");
const statsErrorMatches = document.getElementById("statsErrorMatches");
const statsErrorShots = document.getElementById("statsErrorShots");
const statsErrorYellow = document.getElementById("statsErrorYellow");

function showGlobal(text, isError) {
  adminGlobalMessage.textContent = text;
  adminGlobalMessage.classList.toggle("form__message--error", Boolean(isError));
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function clearTeamErrors() {
  teamErrorName.textContent = "";
  teamErrorLogo.textContent = "";
}

function clearPlayerErrors() {
  playerErrorTeamId.textContent = "";
  playerErrorName.textContent = "";
  playerErrorPosition.textContent = "";
  playerErrorImageUrl.textContent = "";
}

function clearStatsErrors() {
  statsErrorPlayer.textContent = "";
  statsErrorGoals.textContent = "";
  statsErrorAssists.textContent = "";
  statsErrorMatches.textContent = "";
  statsErrorShots.textContent = "";
  statsErrorYellow.textContent = "";
}

function fillTeamSelects() {
  const teams = adminLeague.getTeams();
  const prev = playerTeamSelect.value;
  playerTeamSelect.replaceChildren();
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Select team…";
  playerTeamSelect.appendChild(opt0);
  teams.forEach((t) => {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = t.name;
    playerTeamSelect.appendChild(o);
  });
  if (prev && teams.some((t) => t.id === prev)) playerTeamSelect.value = prev;
}

function fillStatsPlayerSelect() {
  const players = adminLeague.data.players.slice();
  const prev = statsPlayerSelect.value;
  statsPlayerSelect.replaceChildren();
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Select player…";
  statsPlayerSelect.appendChild(opt0);
  players.forEach((p) => {
    const team = adminLeague.getTeam(p.teamId);
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = (team ? team.name + " — " : "") + p.name;
    statsPlayerSelect.appendChild(o);
  });
  if (prev && players.some((p) => p.id === prev)) statsPlayerSelect.value = prev;
}

function resetTeamForm() {
  teamEditId.value = "";
  teamForm.reset();
  teamSubmitBtn.textContent = "Add team";
  teamCancelBtn.hidden = true;
  clearTeamErrors();
}

function resetPlayerForm() {
  playerEditId.value = "";
  playerForm.reset();
  playerSubmitBtn.textContent = "Add player";
  playerCancelBtn.hidden = true;
  clearPlayerErrors();
}

function loadStatsFormForPlayer(playerId) {
  clearStatsErrors();
  if (!playerId) {
    statsGoals.value = "";
    statsAssists.value = "";
    statsMatches.value = "";
    statsShots.value = "";
    statsYellow.value = "";
    return;
  }
  const st = adminLeague.getStats(playerId);
  statsGoals.value = String(st ? st.goals : 0);
  statsAssists.value = String(st ? st.assists : 0);
  statsMatches.value = String(st ? st.matchesPlayed : 0);
  statsShots.value = st && st.shots !== undefined ? String(st.shots) : "";
  statsYellow.value = st && st.yellowCards !== undefined ? String(st.yellowCards) : "";
}

function renderTeamsTable() {
  teamsTableBody.replaceChildren();
  adminLeague.getTeams().forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td><img class="table-logo" src="' +
      escapeHtml(t.logoUrl) +
      '" alt="" loading="lazy" /></td>' +
      "<td>" +
      escapeHtml(t.name) +
      "</td>";
    const tdAct = document.createElement("td");
    tdAct.className = "num actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn btn--ghost";
    edit.textContent = "Edit";
    edit.dataset.action = "edit-team";
    edit.dataset.teamId = t.id;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn--danger";
    del.textContent = "Delete";
    del.dataset.action = "delete-team";
    del.dataset.teamId = t.id;
    tdAct.appendChild(edit);
    tdAct.appendChild(del);
    tr.appendChild(tdAct);
    teamsTableBody.appendChild(tr);
  });
}

function renderPlayersTable() {
  playersTableBody.replaceChildren();
  adminLeague.data.players.forEach((p) => {
    const team = adminLeague.getTeam(p.teamId);
    const tr = document.createElement("tr");
    const photoTd =
      p.imageUrl && String(p.imageUrl).trim()
        ? '<td><img class="table-logo" src="' +
          escapeHtml(String(p.imageUrl)) +
          '" alt="" loading="lazy" /></td>'
        : '<td class="table-photo-empty">—</td>';
    tr.innerHTML =
      photoTd +
      "<td>" +
      escapeHtml(p.name) +
      "</td>" +
      "<td>" +
      escapeHtml(team ? team.name : "—") +
      "</td>" +
      "<td>" +
      escapeHtml(p.position) +
      "</td>";
    const tdAct = document.createElement("td");
    tdAct.className = "num actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn btn--ghost";
    edit.textContent = "Edit";
    edit.dataset.action = "edit-player";
    edit.dataset.playerId = p.id;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn--danger";
    del.textContent = "Delete";
    del.dataset.action = "delete-player";
    del.dataset.playerId = p.id;
    tdAct.appendChild(edit);
    tdAct.appendChild(del);
    tr.appendChild(tdAct);
    playersTableBody.appendChild(tr);
  });
}

function refreshAll() {
  adminLeague.reload();
  fillTeamSelects();
  fillStatsPlayerSelect();
  renderTeamsTable();
  renderPlayersTable();
}

teamsTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action][data-team-id]");
  if (!btn) return;
  const id = btn.dataset.teamId;
  if (!id) return;
  if (btn.dataset.action === "edit-team") {
    const t = adminLeague.getTeam(id);
    if (!t) return;
    teamEditId.value = t.id;
    teamName.value = t.name;
    teamLogoUrl.value = t.logoUrl;
    teamSubmitBtn.textContent = "Save team";
    teamCancelBtn.hidden = false;
    clearTeamErrors();
    showGlobal("Editing team: " + t.name);
    return;
  }
  if (btn.dataset.action === "delete-team") {
    if (!confirm("Delete this team and all its players?")) return;
    adminLeague.removeTeam(id);
    resetTeamForm();
    resetPlayerForm();
    refreshAll();
    loadStatsFormForPlayer(statsPlayerSelect.value);
    showGlobal("Team removed.");
  }
});

playersTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action][data-player-id]");
  if (!btn) return;
  const id = btn.dataset.playerId;
  if (!id) return;
  if (btn.dataset.action === "edit-player") {
    const p = adminLeague.getPlayer(id);
    if (!p) return;
    playerEditId.value = p.id;
    playerTeamSelect.value = p.teamId;
    playerName.value = p.name;
    playerPosition.value = p.position;
    playerImageUrl.value = p.imageUrl ? String(p.imageUrl) : "";
    playerSubmitBtn.textContent = "Save player";
    playerCancelBtn.hidden = false;
    clearPlayerErrors();
    statsPlayerSelect.value = p.id;
    loadStatsFormForPlayer(p.id);
    showGlobal("Editing player: " + p.name);
    return;
  }
  if (btn.dataset.action === "delete-player") {
    if (!confirm("Delete this player and their stats?")) return;
    adminLeague.removePlayer(id);
    resetPlayerForm();
    refreshAll();
    loadStatsFormForPlayer(statsPlayerSelect.value);
    showGlobal("Player removed.");
  }
});

teamForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearTeamErrors();
  const res = createTeamInputFromValues({ name: teamName.value, logoUrl: teamLogoUrl.value });
  if (!res.valid) {
    teamErrorName.textContent = res.errors.name || "";
    teamErrorLogo.textContent = res.errors.logoUrl || "";
    showGlobal("Fix team form errors.", true);
    return;
  }
  const editId = teamEditId.value.trim();
  if (editId) {
    adminLeague.updateTeam(editId, res.data);
    showGlobal("Team updated.");
  } else {
    adminLeague.addTeam({
      id: SoccerHubUtils.newId(),
      name: res.data.name,
      logoUrl: res.data.logoUrl,
    });
    showGlobal("Team added.");
  }
  resetTeamForm();
  refreshAll();
});

teamCancelBtn.addEventListener("click", () => {
  resetTeamForm();
  showGlobal("Team edit canceled.");
});

playerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearPlayerErrors();
  const res = createPlayerInputFromValues({
    teamId: playerTeamSelect.value,
    name: playerName.value,
    position: playerPosition.value,
    imageUrl: playerImageUrl.value,
  });
  if (!res.valid) {
    playerErrorTeamId.textContent = res.errors.teamId || "";
    playerErrorName.textContent = res.errors.name || "";
    playerErrorPosition.textContent = res.errors.position || "";
    playerErrorImageUrl.textContent = res.errors.imageUrl || "";
    showGlobal("Fix player form errors.", true);
    return;
  }
  const editId = playerEditId.value.trim();
  const playerPatch = {
    teamId: res.data.teamId,
    name: res.data.name,
    position: res.data.position,
    imageUrl: res.data.imageUrl ? res.data.imageUrl : "",
  };
  if (editId) {
    adminLeague.updatePlayer(editId, playerPatch);
    showGlobal("Player updated.");
  } else {
    const newPlayer = {
      id: SoccerHubUtils.newId(),
      teamId: res.data.teamId,
      name: res.data.name,
      position: res.data.position,
    };
    if (res.data.imageUrl) newPlayer.imageUrl = res.data.imageUrl;
    adminLeague.addPlayer(newPlayer);
    showGlobal("Player added.");
  }
  resetPlayerForm();
  refreshAll();
});

playerCancelBtn.addEventListener("click", () => {
  resetPlayerForm();
  showGlobal("Player edit canceled.");
});

statsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearStatsErrors();
  const playerId = statsPlayerSelect.value.trim();
  if (!playerId) {
    statsErrorPlayer.textContent = "Select a player.";
    showGlobal("Select a player for stats.", true);
    return;
  }
  const res = createStatsInputFromValues({
    goals: statsGoals.value,
    assists: statsAssists.value,
    matchesPlayed: statsMatches.value,
    shots: statsShots.value,
    yellowCards: statsYellow.value,
  });
  if (!res.valid) {
    statsErrorGoals.textContent = res.errors.goals || "";
    statsErrorAssists.textContent = res.errors.assists || "";
    statsErrorMatches.textContent = res.errors.matchesPlayed || "";
    statsErrorShots.textContent = res.errors.shots || "";
    statsErrorYellow.textContent = res.errors.yellowCards || "";
    showGlobal("Fix statistics form errors.", true);
    return;
  }
  adminLeague.upsertStats(playerId, {
    goals: res.data.goals,
    assists: res.data.assists,
    matchesPlayed: res.data.matchesPlayed,
    shots: res.data.shots,
    yellowCards: res.data.yellowCards,
  });
  showGlobal("Statistics saved.");
  refreshAll();
});

document.getElementById("statsResetBtn").addEventListener("click", () => {
  loadStatsFormForPlayer(statsPlayerSelect.value);
  clearStatsErrors();
  showGlobal("Stats form reset.");
});

statsPlayerSelect.addEventListener("change", () => {
  loadStatsFormForPlayer(statsPlayerSelect.value);
  clearStatsErrors();
});

logoutButton.addEventListener("click", () => {
  adminAuthService.logout();
  window.location.href = "../index.html";
});

function init() {
  resetTeamForm();
  resetPlayerForm();
  refreshAll();
  loadStatsFormForPlayer(statsPlayerSelect.value);
  showGlobal("Admin dashboard ready.");
}

init();

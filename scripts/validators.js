/**
 * Form validation helpers (shared by admin UI and automated tests).
 */

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

/**
 * Shared CSS mini-bar charts for goals / assists / yellow cards (no canvas deps).
 * Expects globals used by LeagueService consumers after core.js loads.
 */

function statsVizEscapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * @param {Array<{ goals: number, assists: number, yellowCards: number }>} items
 * @returns {{ maxG: number, maxA: number, maxY: number }}
 */
function computeMaxTriples(items) {
  let maxG = 1;
  let maxA = 1;
  let maxY = 1;
  for (const it of items) {
    maxG = Math.max(maxG, it.goals);
    maxA = Math.max(maxA, it.assists);
    maxY = Math.max(maxY, it.yellowCards);
  }
  return { maxG, maxA, maxY };
}

/**
 * @param {number} goals
 * @param {number} assists
 * @param {number} yellowCards
 * @param {number} maxGoals
 * @param {number} maxAssists
 * @param {number} maxYellow
 * @param {{ compact?: boolean, table?: boolean, ariaLabel?: string }} [options]
 * @returns {string}
 */
function statTripleBars(goals, assists, yellowCards, maxGoals, maxAssists, maxYellow, options) {
  const opts = options || {};
  const mg = Math.max(1, maxGoals);
  const ma = Math.max(1, maxAssists);
  const my = Math.max(1, maxYellow);
  const compact = Boolean(opts.compact);
  const table = Boolean(opts.table);
  const modal = Boolean(opts.modal);
  const baseClass = [
    "stat-viz",
    compact ? "stat-viz--compact" : "",
    table ? "stat-viz--table" : "",
    modal ? "stat-viz--modal" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const aria = opts.ariaLabel
    ? statsVizEscapeHtml(opts.ariaLabel)
    : "Goals, assists, and yellow cards";

  function pct(value, max) {
    return Math.min(100, (value / max) * 100);
  }

  function row(label, value, max, fillMod) {
    const w = pct(value, max);
    const vStr = statsVizEscapeHtml(String(value));
    return (
      '<div class="stat-viz__row">' +
      '<span class="stat-viz__label">' +
      statsVizEscapeHtml(label) +
      "</span>" +
      '<span class="stat-viz__num">' +
      vStr +
      "</span>" +
      '<span class="stat-viz__track"><span class="stat-viz__fill ' +
      fillMod +
      '" style="width:' +
      w +
      '%"></span></span>' +
      "</div>"
    );
  }

  return (
    '<div class="' +
    baseClass +
    '" role="group" aria-label="' +
    aria +
    '">' +
    row("G", goals, mg, "stat-viz__fill--goals") +
    row("A", assists, ma, "stat-viz__fill--assists") +
    row("Y", yellowCards, my, "stat-viz__fill--cards") +
    "</div>"
  );
}

/**
 * Single-scale bars so the largest of the three metrics fills (good for modals).
 * @param {number} goals
 * @param {number} assists
 * @param {number} yellowCards
 * @returns {string}
 */
function statTripleBarsNormalized(goals, assists, yellowCards) {
  const m = Math.max(1, goals, assists, yellowCards);
  return statTripleBars(goals, assists, yellowCards, m, m, m, {
    modal: true,
    ariaLabel: "Goals, assists, and yellow cards compared",
  });
}

/**
 * Hero “club totals” block on user squad view (Betplay-style layout via CSS).
 * @param {string} teamName
 * @param {string} logoUrl
 * @param {{ goals: number, assists: number, yellowCards: number }} totals
 * @returns {string}
 */
function teamSquadSummaryHtml(teamName, logoUrl, totals) {
  const g = totals.goals;
  const a = totals.assists;
  const y = totals.yellowCards;
  const scale = Math.max(1, g, a, y);

  function card(title, value, fillClass) {
    const w = Math.min(100, (value / scale) * 100);
    const v = statsVizEscapeHtml(String(value));
    const t = statsVizEscapeHtml(title);
    return (
      '<div class="squad-metric-card">' +
      '<p class="squad-metric-card__label">' +
      t +
      "</p>" +
      '<p class="squad-metric-card__value">' +
      v +
      "</p>" +
      '<div class="squad-metric-card__track"><span class="squad-metric-card__fill ' +
      fillClass +
      '" style="width:' +
      w +
      '%"></span></div>' +
      "</div>"
    );
  }

  const logo =
    logoUrl && String(logoUrl).trim()
      ? '<img class="team-squad-summary__logo" src="' +
        statsVizEscapeHtml(String(logoUrl).trim()) +
        '" alt="" loading="lazy" />'
      : '<div class="team-squad-summary__logo team-squad-summary__logo--empty" aria-hidden="true"></div>';

  return (
    '<div class="team-squad-summary__card">' +
    '<div class="team-squad-summary__intro">' +
    logo +
    '<div class="team-squad-summary__titles">' +
    '<p class="team-squad-summary__eyebrow">Club totals</p>' +
    '<h3 class="team-squad-summary__name">' +
    statsVizEscapeHtml(teamName) +
    "</h3>" +
    '<p class="team-squad-summary__sub">Sum of squad players: goals, assists, and yellow cards.</p>' +
    "</div>" +
    "</div>" +
    '<div class="team-squad-summary__metrics">' +
    card("Goals", g, "squad-metric-card__fill--goals") +
    card("Assists", a, "squad-metric-card__fill--assists") +
    card("Yellow cards", y, "squad-metric-card__fill--cards") +
    "</div>" +
    "</div>"
  );
}

/**
 * Compact G / A / Y badges for player list rows.
 * @param {number} goals
 * @param {number} assists
 * @param {number} yellowCards
 * @returns {string}
 */
function playerStatPillsHtml(goals, assists, yellowCards) {
  const g = statsVizEscapeHtml(String(goals));
  const a = statsVizEscapeHtml(String(assists));
  const y = statsVizEscapeHtml(String(yellowCards));
  return (
    '<div class="stat-pills" role="group" aria-label="Goals, assists, yellow cards">' +
    '<span class="stat-pills__pill stat-pills__pill--goals" title="Goals"><span class="stat-pills__n">' +
    g +
    '</span><span class="stat-pills__k">G</span></span>' +
    '<span class="stat-pills__pill stat-pills__pill--assists" title="Assists"><span class="stat-pills__n">' +
    a +
    '</span><span class="stat-pills__k">A</span></span>' +
    '<span class="stat-pills__pill stat-pills__pill--cards" title="Yellow cards"><span class="stat-pills__n">' +
    y +
    '</span><span class="stat-pills__k">Y</span></span>' +
    "</div>"
  );
}

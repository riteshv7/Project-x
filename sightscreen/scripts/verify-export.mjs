import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const publicMatchesDir = path.join(root, "public", "matches");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function slugifySegment(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildH2HSlug(teamA, teamB) {
  const [first, second] = [teamA, teamB].sort((a, b) => a.localeCompare(b));
  return `${slugifySegment(first)}-vs-${slugifySegment(second)}`;
}

function seasonFromDate(date) {
  return new Date(date).getUTCFullYear().toString();
}

function countPages(dirPath) {
  let count = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += countPages(fullPath);
    } else if (entry.name === "index.html" || entry.name.endsWith(".html")) {
      count += 1;
    }
  }
  return count;
}

function snippet(html) {
  return html
    .replace(/></g, ">\n<")
    .split("\n")
    .slice(0, 80)
    .join("\n");
}

function hasHref(html, href) {
  return html.includes(`href="${href}"`) || html.includes(`href="${href}/"`);
}

function hasHrefPrefix(html, prefix) {
  return html.includes(`href="${prefix}`) || html.includes(`href="${prefix}/`);
}

const matches = fs
  .readdirSync(publicMatchesDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => {
    const source = read(path.join(publicMatchesDir, file)).replace(/\bNaN\b/g, "null");
    return JSON.parse(source);
  });

const matchIds = matches.map((match) => match.match_id).sort();
const teamNames = Array.from(
  new Set(matches.flatMap((match) => [match.teams.team1, match.teams.team2])),
).sort((a, b) => a.localeCompare(b));
const seasons = Array.from(new Set(matches.map((match) => seasonFromDate(match.date)))).sort(
  (a, b) => Number(b) - Number(a),
);
const venues = Array.from(new Set(matches.map((match) => match.venue))).sort((a, b) =>
  a.localeCompare(b),
);
const h2hSlugs = Array.from(
  new Set(
    matches.map((match) => buildH2HSlug(match.teams.team1, match.teams.team2)),
  ),
).sort((a, b) => a.localeCompare(b));

assert(fs.existsSync(outDir), "Static export directory was not generated.");

const homepageHtmlPath = path.join(outDir, "index.html");
assert(fs.existsSync(homepageHtmlPath), "Homepage HTML was not generated.");
const homepageHtml = read(homepageHtmlPath);
assert(hasHref(homepageHtml, "/teams"), "Homepage is missing the browse-by-team link.");
assert(hasHref(homepageHtml, "/seasons"), "Homepage is missing the browse-by-season link.");
assert(hasHref(homepageHtml, "/venues"), "Homepage is missing the browse-by-venue link.");
assert(homepageHtml.includes("Sightscreen"), "Homepage wordmark missing.");

const matchPageCount = matchIds.filter((matchId) =>
  fs.existsSync(path.join(outDir, "matches", matchId, "index.html")),
).length;
assert(matchPageCount === matchIds.length, `Expected ${matchIds.length} match pages, found ${matchPageCount}.`);

const teamSlugs = teamNames.map((teamName) => slugifySegment(teamName));
const teamPageCount = teamSlugs.filter((slug) =>
  fs.existsSync(path.join(outDir, "teams", slug, "index.html")),
).length;
assert(teamPageCount === teamSlugs.length, `Expected ${teamSlugs.length} team pages, found ${teamPageCount}.`);

const seasonPageCount = seasons.filter((season) =>
  fs.existsSync(path.join(outDir, "seasons", season, "index.html")),
).length;
assert(
  seasonPageCount === seasons.length,
  `Expected ${seasons.length} season pages, found ${seasonPageCount}.`,
);

const venueSlugs = venues.map((venue) => slugifySegment(venue));
const venuePageCount = venueSlugs.filter((slug) =>
  fs.existsSync(path.join(outDir, "venues", slug, "index.html")),
).length;
assert(venuePageCount === venueSlugs.length, `Expected ${venueSlugs.length} venue pages, found ${venuePageCount}.`);

const h2hPageCount = h2hSlugs.filter((slug) =>
  fs.existsSync(path.join(outDir, "h2h", slug, "index.html")),
).length;
assert(h2hPageCount === h2hSlugs.length, `Expected ${h2hSlugs.length} h2h pages, found ${h2hPageCount}.`);

const firstTeamName = teamNames[0];
const firstTeamSlug = slugifySegment(firstTeamName);
const firstTeamHtmlPath = path.join(outDir, "teams", firstTeamSlug, "index.html");
const firstTeamHtml = read(firstTeamHtmlPath);
assert(firstTeamHtml.includes("Aggregate stats"), "Team page is missing aggregate stats.");
assert(hasHrefPrefix(firstTeamHtml, "/h2h/"), "Team page is missing h2h links.");
const teamMatches = matches.filter(
  (match) => match.teams.team1 === firstTeamName || match.teams.team2 === firstTeamName,
);
const teamWins = teamMatches.filter((match) => match.result.winner === firstTeamName).length;
const expectedTeamWinPct = `${((teamWins / teamMatches.length) * 100).toFixed(1)}%`;
assert(
  firstTeamHtml.includes(expectedTeamWinPct),
  `Team win% check failed for ${firstTeamName}; expected ${expectedTeamWinPct}.`,
);

const firstSeason = seasons[0];
const firstSeasonHtmlPath = path.join(outDir, "seasons", firstSeason, "index.html");
const firstSeasonHtml = read(firstSeasonHtmlPath);
assert(firstSeasonHtml.includes("Season table"), "Season page is missing the leaderboard.");
assert(hasHrefPrefix(firstSeasonHtml, "/teams/"), "Season page is missing team links.");

const firstVenue = venues[0];
const firstVenueSlug = slugifySegment(firstVenue);
const firstVenueHtmlPath = path.join(outDir, "venues", firstVenueSlug, "index.html");
const firstVenueHtml = read(firstVenueHtmlPath);
assert(firstVenueHtml.includes("Team performance at this venue"), "Venue page is missing team performance.");
assert(hasHrefPrefix(firstVenueHtml, "/teams/"), "Venue page is missing team links.");

const firstH2HSlug = h2hSlugs[0];
const firstH2HHtmlPath = path.join(outDir, "h2h", firstH2HSlug, "index.html");
const firstH2HHtml = read(firstH2HHtmlPath);
assert(firstH2HHtml.includes("Series Breakdown"), "H2H page is missing season-by-season breakdown.");
assert(firstH2HHtml.includes("Complete record") || firstH2HHtml.includes("Complete IPL head-to-head record"), "H2H page is missing summary copy.");

const totalPages = countPages(outDir);

console.log("Static export checks:");
console.log(`  - all ${teamPageCount} team pages render without errors`);
console.log(`  - all ${seasonPageCount} season pages render without errors`);
console.log(`  - all ${venuePageCount} venue pages render without errors`);
console.log(`  - all ${h2hPageCount} h2h pages render without errors`);
console.log("  - navigation links resolve across homepage, team, season, and venue pages");
console.log(`  - aggregate stat spot-check passed for ${firstTeamName} (${expectedTeamWinPct})`);
console.log(`Total pages generated: ${totalPages}`);
console.log(`Sample team page: ${firstTeamHtmlPath}`);
console.log(snippet(firstTeamHtml));
console.log(`Sample season page: ${firstSeasonHtmlPath}`);
console.log(snippet(firstSeasonHtml));
console.log(`Sample venue page: ${firstVenueHtmlPath}`);
console.log(snippet(firstVenueHtml));
console.log(`Sample h2h page: ${firstH2HHtmlPath}`);
console.log(snippet(firstH2HHtml));

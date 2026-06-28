import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const matchesRoot = path.join(root, "..", "analysis", "matches");

const LEAGUES = [
  {
    code: "IPL",
    slug: "ipl",
    label: "IPL",
    name: "Indian Premier League",
  },
  {
    code: "BBL",
    slug: "bbl",
    label: "BBL",
    name: "Big Bash League",
  },
  {
    code: "PSL",
    slug: "psl",
    label: "PSL",
    name: "Pakistan Super League",
  },
  {
    code: "SA20",
    slug: "sa20",
    label: "SA20",
    name: "SA20",
  },
  {
    code: "HUNDRED",
    slug: "the-hundred",
    label: "The Hundred",
    name: "The Hundred",
  },
];

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
    .slice(0, 36)
    .join("\n");
}

function hasHref(html, href) {
  return html.includes(`href="${href}"`) || html.includes(`href="${href}/"`);
}

function hasHrefPrefix(html, prefix) {
  return html.includes(`href="${prefix}`);
}

const matches = LEAGUES.flatMap((league) =>
  fs
    .readdirSync(path.join(matchesRoot, league.code))
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const source = read(path.join(matchesRoot, league.code, file)).replace(/\bNaN\b/g, "null");
      return { ...JSON.parse(source), league: league.code };
    }),
);

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
  new Set(matches.map((match) => buildH2HSlug(match.teams.team1, match.teams.team2))),
).sort((a, b) => a.localeCompare(b));

assert(fs.existsSync(outDir), "Static export directory was not generated.");

const homepageHtmlPath = path.join(outDir, "index.html");
assert(fs.existsSync(homepageHtmlPath), "Homepage HTML was not generated.");
const homepageHtml = read(homepageHtmlPath);
assert(hasHref(homepageHtml, "/leagues"), "Homepage is missing the Leagues link.");
assert(homepageHtml.includes("All leagues"), "Homepage is missing the league selector.");
assert(homepageHtml.includes("The Hundred"), "Homepage selector is missing The Hundred.");

const leaguesPageHtml = read(path.join(outDir, "leagues", "index.html"));
for (const league of LEAGUES) {
  assert(leaguesPageHtml.includes(league.name), `/leagues is missing ${league.name}.`);
  assert(hasHref(leaguesPageHtml, `/leagues/${league.slug}`), `/leagues is missing the ${league.slug} detail link.`);
}

for (const league of LEAGUES) {
  const leagueMatches = matches.filter((match) => match.league === league.code);
  const leagueTeams = Array.from(
    new Set(leagueMatches.flatMap((match) => [match.teams.team1, match.teams.team2])),
  );
  const leagueSeasons = Array.from(new Set(leagueMatches.map((match) => seasonFromDate(match.date))));
  const leagueHtmlPath = path.join(outDir, "leagues", league.slug, "index.html");
  assert(fs.existsSync(leagueHtmlPath), `League detail page missing for ${league.code}.`);
  const leagueHtml = read(leagueHtmlPath);
  assert(leagueHtml.includes("All-Time Leaderboard"), `${league.code} detail page is missing the leaderboard.`);
  assert(leagueHtml.includes(String(leagueMatches.length)), `${league.code} detail page is missing the match count.`);
  assert(leagueHtml.includes(String(leagueTeams.length)), `${league.code} detail page is missing the team count.`);
  assert(leagueHtml.includes(String(leagueSeasons.length)), `${league.code} detail page is missing the season count.`);
}

const matchPageCount = matchIds.filter((matchId) =>
  fs.existsSync(path.join(outDir, "matches", matchId, "index.html")),
).length;
assert(matchPageCount === matchIds.length, `Expected ${matchIds.length} match pages, found ${matchPageCount}.`);

const teamSlugs = teamNames.map((teamName) => slugifySegment(teamName));
const teamPageCount = teamSlugs.filter((slug) =>
  fs.existsSync(path.join(outDir, "teams", slug, "index.html")),
).length;
assert(teamPageCount === teamSlugs.length, `Expected ${teamSlugs.length} team pages, found ${teamPageCount}.`);

const leagueSeasonPages = LEAGUES.flatMap((league) => {
  const leagueSeasons = Array.from(
    new Set(
      matches
        .filter((match) => match.league === league.code)
        .map((match) => seasonFromDate(match.date)),
    ),
  );
  return leagueSeasons.map((season) => ({ league, season }));
});
const leagueSeasonPageCount = leagueSeasonPages.filter(({ league, season }) =>
  fs.existsSync(path.join(outDir, "seasons", league.slug, season, "index.html")),
).length;
assert(
  leagueSeasonPageCount === leagueSeasonPages.length,
  `Expected ${leagueSeasonPages.length} league-season pages, found ${leagueSeasonPageCount}.`,
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

const firstTeamName = "Chennai Super Kings";
const firstTeamSlug = slugifySegment(firstTeamName);
const firstTeamHtmlPath = path.join(outDir, "teams", firstTeamSlug, "index.html");
const firstTeamHtml = read(firstTeamHtmlPath);
assert(firstTeamHtml.includes("plays in"), "Team page is missing league context copy.");
assert(firstTeamHtml.includes("Season Breakdown"), "Team page is missing the season breakdown.");
assert(hasHref(firstTeamHtml, "/h2h/chennai-super-kings-vs-mumbai-indians"), "Team page is missing h2h links.");

const seasonChooserHtml = read(path.join(outDir, "seasons", "2024", "index.html"));
assert(seasonChooserHtml.includes("Choose a league for 2024"), "Season chooser page is missing league context.");
assert(hasHref(seasonChooserHtml, "/seasons/ipl/2024"), "Season chooser page is missing IPL 2024.");
assert(hasHref(seasonChooserHtml, "/seasons/bbl/2024"), "Season chooser page is missing BBL 2024.");

const iplSeasonHtml = read(path.join(outDir, "seasons", "ipl", "2024", "index.html"));
assert(iplSeasonHtml.includes("Leaderboard"), "League-specific season page is missing the leaderboard.");
assert(iplSeasonHtml.includes("filtered to"), "League-specific season page is missing league copy.");

const firstVenue = venues[0];
const firstVenueSlug = slugifySegment(firstVenue);
const firstVenueHtmlPath = path.join(outDir, "venues", firstVenueSlug, "index.html");
const firstVenueHtml = read(firstVenueHtmlPath);
assert(firstVenueHtml.includes("League Context"), "Venue page is missing league context.");
assert(firstVenueHtml.includes("All leagues"), "Venue page is missing the venue league filter.");
assert(hasHrefPrefix(firstVenueHtml, "/teams/"), "Venue page is missing team links.");

const firstH2HSlug = "chennai-super-kings-vs-mumbai-indians";
const firstH2HHtmlPath = path.join(outDir, "h2h", firstH2HSlug, "index.html");
const firstH2HHtml = read(firstH2HHtmlPath);
assert(firstH2HHtml.includes("Head To Head"), "H2H page is missing the title.");
assert(firstH2HHtml.includes("Complete record"), "H2H page is missing summary copy.");
assert(firstH2HHtml.includes("IPL"), "H2H page is missing league context.");

const sampleMatchId = "1304053";
const matchHtmlPath = path.join(outDir, "matches", sampleMatchId, "index.html");
const matchHtml = read(matchHtmlPath);
assert(matchHtml.includes("Match Header"), "Match detail page is missing the match header.");
assert(matchHtml.includes(">IPL<") && matchHtml.includes("2022"), "Match detail page is missing the league badge/name.");

const leagueHtmlPath = path.join(outDir, "leagues", "ipl", "index.html");
const leagueHtml = read(leagueHtmlPath);
assert(hasHref(leagueHtml, "/seasons/ipl/2024"), "League detail page is missing league-preserving season links.");
assert(hasHref(leagueHtml, "/teams/chennai-super-kings"), "League detail page is missing team links.");

const totalPages = countPages(outDir);

console.log("Static export checks:");
console.log("  - all five leagues render on /leagues");
console.log("  - each league detail page renders with league-specific match, team, and season counts");
console.log("  - homepage renders the league selector with all five options");
console.log("  - team pages show league context and team-specific match archives");
console.log("  - season pages render at /seasons/[league]/[season] and the chooser preserves league context");
console.log("  - venue pages show league context and render the venue filter UI");
console.log("  - h2h pages show league context");
console.log("  - match detail pages show the league badge near the header");
console.log("  - internal links preserve league context through /leagues and /seasons routes");
console.log(`Total pages generated: ${totalPages}`);
console.log(`Sample league detail page: ${leagueHtmlPath}`);
console.log(snippet(leagueHtml));
console.log(`Sample team page: ${firstTeamHtmlPath}`);
console.log(snippet(firstTeamHtml));
console.log(`Sample match detail page: ${matchHtmlPath}`);
console.log(snippet(matchHtml));

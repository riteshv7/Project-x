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

function buildComparisonSlug(playerA, playerB) {
  const [first, second] = [slugifySegment(playerA), slugifySegment(playerB)].sort((a, b) =>
    a.localeCompare(b),
  );
  return `${first}-vs-${second}`;
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

function playerDirectoryFromMatches(sourceMatches) {
  const entries = new Map();

  function ensureEntry(name, match) {
    const existing = entries.get(name);
    if (existing) {
      existing.matchIds.add(match.match_id);
      existing.leagues.add(match.league);
      existing.firstAppearance = existing.firstAppearance
        ? existing.firstAppearance < match.date
          ? existing.firstAppearance
          : match.date
        : match.date;
      existing.lastAppearance = existing.lastAppearance
        ? existing.lastAppearance > match.date
          ? existing.lastAppearance
          : match.date
        : match.date;
      return existing;
    }

    const created = {
      battingRuns: 0,
      bowlingWickets: 0,
      matchIds: new Set([match.match_id]),
      leagues: new Set([match.league]),
      firstAppearance: match.date,
      lastAppearance: match.date,
    };
    entries.set(name, created);
    return created;
  }

  for (const match of sourceMatches) {
    for (const innings of match.innings ?? []) {
      for (const batter of innings.scorecard?.batters ?? []) {
        ensureEntry(batter.name, match).battingRuns += batter.runs;
      }
      for (const bowler of innings.scorecard?.bowlers ?? []) {
        ensureEntry(bowler.name, match).bowlingWickets += bowler.wickets;
      }
    }
  }

  return Array.from(entries.entries())
    .map(([name, entry]) => ({
      name,
      slug: slugifySegment(name),
      battingRuns: entry.battingRuns,
      bowlingWickets: entry.bowlingWickets,
      matches: entry.matchIds.size,
    }))
    .sort((left, right) => {
      if (right.matches !== left.matches) {
        return right.matches - left.matches;
      }
      return left.name.localeCompare(right.name);
    });
}

function aggregateBattingByLeague(sourceMatches, leagueCode) {
  const totals = new Map();

  for (const match of sourceMatches) {
    if (match.league !== leagueCode) {
      continue;
    }
    for (const innings of match.innings ?? []) {
      for (const batter of innings.scorecard?.batters ?? []) {
        totals.set(batter.name, (totals.get(batter.name) ?? 0) + batter.runs);
      }
    }
  }

  return Array.from(totals.entries())
    .map(([name, runs]) => ({ name, runs }))
    .sort((left, right) => right.runs - left.runs || left.name.localeCompare(right.name));
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
const venues = Array.from(new Set(matches.map((match) => match.venue))).sort((a, b) =>
  a.localeCompare(b),
);
const h2hSlugs = Array.from(
  new Set(matches.map((match) => buildH2HSlug(match.teams.team1, match.teams.team2))),
).sort((a, b) => a.localeCompare(b));
const players = playerDirectoryFromMatches(matches);
const playerSlugs = Array.from(new Set(players.map((player) => player.slug)));
const comparisonPlayers = players.slice(0, 36);
const comparisonSlugs = [];
for (let leftIndex = 0; leftIndex < comparisonPlayers.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < comparisonPlayers.length; rightIndex += 1) {
    comparisonSlugs.push(buildComparisonSlug(comparisonPlayers[leftIndex].name, comparisonPlayers[rightIndex].name));
  }
}
const curatedPlaylistHtmlDir = path.join(outDir, "playlists", "curated");
const curatedPlaylistCount = fs.existsSync(curatedPlaylistHtmlDir)
  ? fs.readdirSync(curatedPlaylistHtmlDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
  : 0;

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
const analyticsPageCount = teamSlugs.filter((slug) =>
  fs.existsSync(path.join(outDir, "teams", slug, "analytics", "index.html")),
).length;

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

const exploreHtmlPath = path.join(outDir, "explore", "index.html");
assert(fs.existsSync(exploreHtmlPath), "Explore page was not generated.");
const exploreHtml = read(exploreHtmlPath);
assert(exploreHtml.includes("Explore matches"), "Explore page is missing its page title.");
assert(exploreHtml.includes("Advanced Filters"), "Explore page is missing advanced filter copy.");
assert(exploreHtml.includes("All margins"), "Explore page is missing margin filtering.");

const playersHtmlPath = path.join(outDir, "players", "index.html");
assert(fs.existsSync(playersHtmlPath), "Players browser page was not generated.");
const playersHtml = read(playersHtmlPath);
assert(playersHtml.includes("Player browser"), "Players browser is missing its title.");
assert(playersHtml.includes(String(players.length)), "Players browser is missing the unique player count.");

const playerPageCount = playerSlugs.filter((slug) =>
  fs.existsSync(path.join(outDir, "players", slug, "index.html")),
).length;
assert(
  playerPageCount === playerSlugs.length,
  `Expected ${playerSlugs.length} player pages, found ${playerPageCount}.`,
);

const samplePlayer = players[0];
const samplePlayerHtmlPath = path.join(outDir, "players", samplePlayer.slug, "index.html");
const samplePlayerHtml = read(samplePlayerHtmlPath);
assert(samplePlayerHtml.includes("Career Stats"), "Sample player page is missing career stats.");
assert(samplePlayerHtml.includes("Match-by-match"), "Sample player page is missing match-by-match stats.");
assert(
  samplePlayerHtml.includes(String(samplePlayer.battingRuns)) ||
    samplePlayerHtml.includes(String(samplePlayer.bowlingWickets)),
  "Sample player page is missing scorecard-derived totals.",
);

const comparisonPageCount = comparisonSlugs.filter((slug) =>
  fs.existsSync(path.join(outDir, "player-comparison", slug, "index.html")),
).length;
assert(
  comparisonPageCount === comparisonSlugs.length,
  `Expected ${comparisonSlugs.length} player comparison pages, found ${comparisonPageCount}.`,
);

const sampleComparisonSlug = comparisonSlugs[0];
const sampleComparisonHtmlPath = path.join(outDir, "player-comparison", sampleComparisonSlug, "index.html");
const sampleComparisonHtml = read(sampleComparisonHtmlPath);
assert(sampleComparisonHtml.includes("Player Comparison"), "Sample comparison page is missing its header.");
assert(sampleComparisonHtml.includes("Batting comparison"), "Sample comparison page is missing batting comparison.");
assert(sampleComparisonHtml.includes("Bowling comparison"), "Sample comparison page is missing bowling comparison.");
assert(sampleComparisonHtml.includes("H2H Direct"), "Sample comparison page is missing direct h2h summary.");

const matchDetailSource = read(path.join(root, "app", "matches", "[match_id]", "match-detail-client.tsx"));
assert(
  matchDetailSource.includes("href={`/players/${slugifySegment(batter.name)}`") &&
    matchDetailSource.includes("href={`/players/${slugifySegment(bowler.name)}`"),
  "Match detail scorecard player names are not wired to player pages.",
);

const leagueHtmlPath = path.join(outDir, "leagues", "ipl", "index.html");
const leagueHtml = read(leagueHtmlPath);
assert(hasHref(leagueHtml, "/seasons/ipl/2024"), "League detail page is missing league-preserving season links.");
assert(hasHref(leagueHtml, "/teams/chennai-super-kings"), "League detail page is missing team links.");

const playlistsHtmlPath = path.join(outDir, "playlists", "index.html");
assert(fs.existsSync(playlistsHtmlPath), "Playlists browser page was not generated.");
const playlistsHtml = read(playlistsHtmlPath);
assert(playlistsHtml.includes("Curated collections and personal saves"), "Playlists browser is missing its hero copy.");
assert(playlistsHtml.includes("My Playlists"), "Playlists browser is missing the personal playlists section.");
assert(curatedPlaylistCount >= 15, `Expected at least 15 curated playlists, found ${curatedPlaylistCount}.`);

const sampleCuratedPlaylistPath = path.join(outDir, "playlists", "curated", "biggest-upsets", "index.html");
assert(fs.existsSync(sampleCuratedPlaylistPath), "Sample curated playlist page was not generated.");
const sampleCuratedPlaylistHtml = read(sampleCuratedPlaylistPath);
assert(sampleCuratedPlaylistHtml.includes("Curated Playlist"), "Sample curated playlist page is missing its heading.");
assert(sampleCuratedPlaylistHtml.includes("Add to playlist"), "Sample curated playlist page is missing add-to-playlist controls.");
assert(sampleCuratedPlaylistHtml.includes("Showing"), "Sample curated playlist page is missing filter result copy.");

const personalPlaylistShellPath = path.join(outDir, "playlists", "personal", "local-storage", "index.html");
assert(fs.existsSync(personalPlaylistShellPath), "Personal playlist shell page was not generated.");
const personalPlaylistHtml = read(personalPlaylistShellPath);
assert(personalPlaylistHtml.includes("Loading playlist"), "Personal playlist shell is missing its loading state.");

const sharedPlaylistPath = path.join(outDir, "playlists", "shared", "index.html");
assert(fs.existsSync(sharedPlaylistPath), "Shared playlist page was not generated.");
const sharedPlaylistHtml = read(sharedPlaylistPath);
assert(sharedPlaylistHtml.includes("Loading shared playlist"), "Shared playlist page is missing its loading state.");

const playlistStorageSource = read(path.join(root, "lib", "playlist-storage.ts"));
assert(
  playlistStorageSource.includes('PLAYLIST_STORAGE_KEY = "sightscreen_playlists"'),
  "Playlist localStorage key is missing or changed.",
);

const leaderboardsHtmlPath = path.join(outDir, "leaderboards", "index.html");
assert(fs.existsSync(leaderboardsHtmlPath), "Leaderboards browser page was not generated.");
const leaderboardsHtml = read(leaderboardsHtmlPath);
assert(leaderboardsHtml.includes("Popular ranks and custom boards"), "Leaderboards browser is missing its hero copy.");
assert(leaderboardsHtml.includes("Popular Leaderboards"), "Leaderboards browser is missing the popular section.");
assert(leaderboardsHtml.includes("My Custom Leaderboards"), "Leaderboards browser is missing the saved boards section.");
assert(
  hasHref(leaderboardsHtml, "/leaderboards/custom") ||
    hasHrefPrefix(leaderboardsHtml, "/leaderboards/custom/?"),
  "Leaderboards browser is missing the custom builder link.",
);

const popularBoardsDir = path.join(outDir, "leaderboards", "popular");
const popularLeaderboardCount = fs.existsSync(popularBoardsDir)
  ? fs.readdirSync(popularBoardsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
  : 0;
assert(popularLeaderboardCount >= 15, `Expected at least 15 popular leaderboards, found ${popularLeaderboardCount}.`);

const samplePopularLeaderboardPath = path.join(
  outDir,
  "leaderboards",
  "popular",
  "most-runs-ipl-all-time",
  "index.html",
);
assert(fs.existsSync(samplePopularLeaderboardPath), "Sample popular leaderboard page was not generated.");
const samplePopularLeaderboardHtml = read(samplePopularLeaderboardPath);
assert(samplePopularLeaderboardHtml.includes("Most runs (IPL, all time)"), "Sample leaderboard page is missing its title.");
assert(samplePopularLeaderboardHtml.includes("Create custom leaderboard"), "Sample leaderboard page is missing the custom builder CTA.");

const iplRunLeaders = aggregateBattingByLeague(matches, "IPL");
const topIplRunLeader = iplRunLeaders[0];
assert(topIplRunLeader, "Could not compute a sample IPL run leader for leaderboard verification.");
assert(
  samplePopularLeaderboardHtml.includes(topIplRunLeader.name) &&
    samplePopularLeaderboardHtml.includes(String(topIplRunLeader.runs)),
  "Sample leaderboard page is missing the computed top IPL run leader.",
);

const customLeaderboardShellPath = path.join(outDir, "leaderboards", "custom", "index.html");
assert(fs.existsSync(customLeaderboardShellPath), "Custom leaderboard builder page was not generated.");
const customLeaderboardShellHtml = read(customLeaderboardShellPath);
assert(customLeaderboardShellHtml.includes("Loading leaderboard builder"), "Custom leaderboard builder is missing its loading state.");

const localLeaderboardShellPath = path.join(
  outDir,
  "leaderboards",
  "custom",
  "local-storage",
  "index.html",
);
assert(fs.existsSync(localLeaderboardShellPath), "Saved custom leaderboard shell page was not generated.");
const localLeaderboardShellHtml = read(localLeaderboardShellPath);
assert(localLeaderboardShellHtml.includes("Loading saved leaderboard"), "Saved custom leaderboard shell is missing its loading state.");

const leaderboardStorageSource = read(path.join(root, "lib", "leaderboard-builder.ts"));
assert(
  leaderboardStorageSource.includes('CUSTOM_LEADERBOARD_STORAGE_KEY = "sightscreen_custom_leaderboards"'),
  "Leaderboard localStorage key is missing or changed.",
);

const sampleAnalyticsHtmlPath = path.join(outDir, "teams", firstTeamSlug, "analytics", "index.html");
assert(fs.existsSync(sampleAnalyticsHtmlPath), "Sample team analytics page was not generated.");
const sampleAnalyticsHtml = read(sampleAnalyticsHtmlPath);
assert(sampleAnalyticsHtml.includes("Batting Order Strength"), "Team analytics page is missing batting section.");
assert(sampleAnalyticsHtml.includes("Bowling Depth"), "Team analytics page is missing bowling section.");
assert(sampleAnalyticsHtml.includes("Home vs Away"), "Team analytics page is missing home/away section.");
assert(sampleAnalyticsHtml.includes("Season-by-Season Trends"), "Team analytics page is missing season trends section.");
assert(sampleAnalyticsHtml.includes("4795"), "Team analytics page is missing the sample top batter total.");
assert(
  analyticsPageCount === teamSlugs.length,
  `Expected ${teamSlugs.length} team analytics pages, found ${analyticsPageCount}.`,
);

const teamPageSource = read(path.join(root, "app", "teams", "[team_name]", "team-page-client.tsx"));
assert(teamPageSource.includes("Open analytics hub"), "Team page is missing the analytics entry point.");

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
console.log("  - advanced filters page renders with league, venue, team, date, result, and margin controls");
console.log("  - player browser and player stats pages render from scorecard data");
console.log("  - player comparison pages render batting, bowling, differences, and shared-match sections");
console.log("  - match scorecard player names link to player pages");
console.log("  - curated playlist pages render with filters and add-to-playlist controls");
console.log("  - personal and shared playlist shells are exported for localStorage and URL-based collections");
console.log("  - popular leaderboards and custom leaderboard shells are exported");
console.log("  - leaderboard localStorage wiring and sample IPL run leader output are verified");
console.log("  - team analytics pages render batting, bowling, home-away, and season trend sections");
console.log(`Total pages generated: ${totalPages}`);
console.log(`Total unique players: ${players.length}`);
console.log(`Total player stats pages generated: ${playerPageCount}`);
console.log(`Total player comparison pages generated: ${comparisonPageCount}`);
console.log(`Total curated playlists generated: ${curatedPlaylistCount}`);
console.log(`Total popular leaderboards generated: ${popularLeaderboardCount}`);
console.log(`Total team analytics pages generated: ${analyticsPageCount}`);
console.log(`Sample advanced filters page: ${exploreHtmlPath}`);
console.log(snippet(exploreHtml));
console.log(`Sample player stats page: ${samplePlayerHtmlPath}`);
console.log(snippet(samplePlayerHtml));
console.log(`Sample player comparison page: ${sampleComparisonHtmlPath}`);
console.log(snippet(sampleComparisonHtml));
console.log(`Sample curated playlist page: ${sampleCuratedPlaylistPath}`);
console.log(snippet(sampleCuratedPlaylistHtml));
console.log(`Sample leaderboard page: ${samplePopularLeaderboardPath}`);
console.log(snippet(samplePopularLeaderboardHtml));
console.log(`Sample team analytics page: ${sampleAnalyticsHtmlPath}`);
console.log(snippet(sampleAnalyticsHtml));
console.log(`Sample league detail page: ${leagueHtmlPath}`);
console.log(snippet(leagueHtml));
console.log(`Sample team page: ${firstTeamHtmlPath}`);
console.log(snippet(firstTeamHtml));
console.log(`Sample match detail page: ${matchHtmlPath}`);
console.log(snippet(matchHtml));

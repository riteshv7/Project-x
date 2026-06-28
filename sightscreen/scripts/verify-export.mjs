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

const matchIds = fs
  .readdirSync(publicMatchesDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""))
  .sort();

const indexHtmlPath = path.join(outDir, "index.html");
assert(fs.existsSync(indexHtmlPath), "Homepage HTML was not generated.");

const homepageHtml = read(indexHtmlPath);
const homepageLinkCount = (homepageHtml.match(/href="\/matches\//g) || []).length;
assert(
  homepageLinkCount === matchIds.length,
  `Expected ${matchIds.length} homepage links, found ${homepageLinkCount}.`,
);
assert(homepageHtml.includes("Sightscreen"), "Homepage wordmark missing.");
assert(
  homepageHtml.includes("Cricket analysis for the thinking fan"),
  "Homepage tagline missing.",
);

const firstMatchId = matchIds[0];
const firstMatchHtmlPath = path.join(outDir, "matches", firstMatchId, "index.html");
assert(fs.existsSync(firstMatchHtmlPath), `Match page missing for ${firstMatchId}.`);

const matchPageCount = matchIds.filter((matchId) =>
  fs.existsSync(path.join(outDir, "matches", matchId, "index.html")),
).length;
assert(
  matchPageCount === matchIds.length,
  `Expected ${matchIds.length} match pages, found ${matchPageCount}.`,
);

const firstMatchHtml = read(firstMatchHtmlPath);
assert(
  firstMatchHtml.includes("Win Probability"),
  "First match page is missing the win-probability section.",
);
assert(firstMatchHtml.includes("Key Moments"), "First match page is missing the key moments section.");
assert(firstMatchHtml.includes("Phase Splits"), "First match page is missing the phase splits section.");

console.log("Static export checks:");
console.log(`  - homepage rendered with ${homepageLinkCount} match links`);
console.log(`  - all ${matchPageCount} match routes resolved`);
console.log("  - first match detail page contains win probability, key moments, and phase splits");
console.log(`First match detail HTML: ${firstMatchHtmlPath}`);
console.log(firstMatchHtml);

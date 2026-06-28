import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  const stat = fs.lstatSync(targetPath);
  if (!stat.isDirectory()) {
    fs.unlinkSync(targetPath);
    return;
  }

  for (const entry of fs.readdirSync(targetPath)) {
    removePath(path.join(targetPath, entry));
  }

  fs.rmdirSync(targetPath);
}

for (const directory of [".next", "out"]) {
  const targetPath = path.join(root, directory);
  if (!fs.existsSync(targetPath)) {
    continue;
  }

  const renamedPath = path.join(root, `${directory}-stale-${Date.now()}`);
  fs.renameSync(targetPath, renamedPath);
  try {
    removePath(renamedPath);
  } catch {
    // Leave stale generated directories behind if macOS is still holding a handle.
  }
}

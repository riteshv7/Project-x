"""Download, extract, and load Cricsheet IPL JSON matches."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlretrieve

DOWNLOAD_URL = "https://cricsheet.org/downloads/ipl_json.zip"


def ensure_raw_data(raw_dir: Path) -> list[Path]:
    """Ensure the Cricsheet IPL JSON files exist locally and return them."""
    raw_dir.mkdir(parents=True, exist_ok=True)
    zip_path = raw_dir / "ipl_json.zip"
    extract_dir = raw_dir / "ipl_json"

    if not zip_path.exists():
        try:
            urlretrieve(DOWNLOAD_URL, zip_path)
        except URLError as exc:
            raise RuntimeError(
                "Unable to download Cricsheet IPL JSON data. "
                "Place data/raw/ipl_json.zip in the repo and rerun."
            ) from exc

    if not extract_dir.exists():
        extract_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path) as zf:
            zf.extractall(extract_dir)

    json_paths = sorted(extract_dir.glob("*.json"))
    if not json_paths:
        raise RuntimeError(f"No JSON files found under {extract_dir}")
    return json_paths


def load_matches(raw_dir: Path) -> list[dict]:
    """Load all match JSON files with their file-derived IDs."""
    matches = []
    for path in ensure_raw_data(raw_dir):
        with path.open("r", encoding="utf-8") as handle:
            match = json.load(handle)
        matches.append({"match_id": path.stem, "path": path, "data": match})
    return matches

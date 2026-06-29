import type { PersonalPlaylist } from "@/lib/types";

export const PLAYLIST_STORAGE_KEY = "sightscreen_playlists";

interface PlaylistStore {
  playlists: PersonalPlaylist[];
}

function safeWindow() {
  return typeof window !== "undefined" ? window : null;
}

export function readPlaylists(): PersonalPlaylist[] {
  const browser = safeWindow();
  if (!browser) {
    return [];
  }

  try {
    const raw = browser.localStorage.getItem(PLAYLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as PlaylistStore;
    return Array.isArray(parsed.playlists) ? parsed.playlists : [];
  } catch {
    return [];
  }
}

export function writePlaylists(playlists: PersonalPlaylist[]) {
  const browser = safeWindow();
  if (!browser) {
    return;
  }
  browser.localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify({ playlists }));
}

export function createPlaylist(name: string, description: string): PersonalPlaylist {
  return {
    id: `playlist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    created_at: new Date().toISOString(),
    matches: [],
  };
}

export function upsertPlaylist(nextPlaylist: PersonalPlaylist) {
  const playlists = readPlaylists();
  const next = [...playlists.filter((playlist) => playlist.id !== nextPlaylist.id), nextPlaylist].sort(
    (left, right) => right.created_at.localeCompare(left.created_at),
  );
  writePlaylists(next);
  return next;
}

export function deletePlaylist(playlistId: string) {
  const next = readPlaylists().filter((playlist) => playlist.id !== playlistId);
  writePlaylists(next);
  return next;
}

export function addMatchToPlaylist(playlistId: string, matchId: string) {
  const playlists = readPlaylists().map((playlist) =>
    playlist.id === playlistId && !playlist.matches.includes(matchId)
      ? { ...playlist, matches: [...playlist.matches, matchId] }
      : playlist,
  );
  writePlaylists(playlists);
  return playlists;
}

export function removeMatchFromPlaylist(playlistId: string, matchId: string) {
  const playlists = readPlaylists().map((playlist) =>
    playlist.id === playlistId
      ? { ...playlist, matches: playlist.matches.filter((entry) => entry !== matchId) }
      : playlist,
  );
  writePlaylists(playlists);
  return playlists;
}

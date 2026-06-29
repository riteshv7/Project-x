import type {
  CustomLeaderboardConfig,
  LeaderboardAggregateSlice,
  LeaderboardMetric,
  LeaderboardRole,
  LeaderboardRow,
  LeaderboardThreshold,
} from "@/lib/types";
import { computeLeaderboardRows, serializeCustomLeaderboard } from "@/lib/leaderboard-generator";

export const CUSTOM_LEADERBOARD_STORAGE_KEY = "sightscreen_custom_leaderboards";

interface StoredBoards {
  custom_leaderboards: CustomLeaderboardConfig[];
}

function browserWindow() {
  return typeof window !== "undefined" ? window : null;
}

export function defaultThresholdForMetric(metric: LeaderboardMetric): LeaderboardThreshold {
  if (metric === "economy") {
    return { type: "overs", value: 10 };
  }
  if (metric === "average") {
    return { type: "dismissals", value: 5 };
  }
  if (metric === "strike_rate") {
    return { type: "innings", value: 5 };
  }
  return { type: "matches", value: 1 };
}

export function createCustomLeaderboardConfig(partial?: Partial<CustomLeaderboardConfig>): CustomLeaderboardConfig {
  return {
    id: `board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: "Custom leaderboard",
    metric: "runs",
    league: "all",
    season: "all",
    role: "any",
    minThreshold: defaultThresholdForMetric("runs"),
    created_at: new Date().toISOString(),
    ...partial,
  };
}

export function readCustomLeaderboards(): CustomLeaderboardConfig[] {
  const browser = browserWindow();
  if (!browser) {
    return [];
  }
  try {
    const raw = browser.localStorage.getItem(CUSTOM_LEADERBOARD_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as StoredBoards;
    return Array.isArray(parsed.custom_leaderboards) ? parsed.custom_leaderboards : [];
  } catch {
    return [];
  }
}

export function writeCustomLeaderboards(boards: CustomLeaderboardConfig[]) {
  const browser = browserWindow();
  if (!browser) {
    return;
  }
  browser.localStorage.setItem(
    CUSTOM_LEADERBOARD_STORAGE_KEY,
    JSON.stringify({ custom_leaderboards: boards }),
  );
}

export function upsertCustomLeaderboard(board: CustomLeaderboardConfig) {
  const next = [...readCustomLeaderboards().filter((entry) => entry.id !== board.id), board].sort(
    (left, right) => right.created_at.localeCompare(left.created_at),
  );
  writeCustomLeaderboards(next);
  return next;
}

export function deleteCustomLeaderboard(boardId: string) {
  const next = readCustomLeaderboards().filter((entry) => entry.id !== boardId);
  writeCustomLeaderboards(next);
  return next;
}

export function decodeCustomLeaderboardFromSearch(searchParams: URLSearchParams): CustomLeaderboardConfig {
  const metric = (searchParams.get("metric") as LeaderboardMetric | null) ?? "runs";
  const role = (searchParams.get("role") as LeaderboardRole | null) ?? "any";
  return createCustomLeaderboardConfig({
    name: searchParams.get("name") ?? "Shared leaderboard",
    metric,
    league: (searchParams.get("league") as CustomLeaderboardConfig["league"] | null) ?? "all",
    season: searchParams.get("season") ?? "all",
    role,
    minThreshold: {
      type: (searchParams.get("threshold_type") as LeaderboardThreshold["type"] | null) ?? defaultThresholdForMetric(metric).type,
      value: Number(searchParams.get("threshold_value") ?? defaultThresholdForMetric(metric).value),
    },
  });
}

export function buildCustomLeaderboardRows(
  slices: LeaderboardAggregateSlice[],
  config: CustomLeaderboardConfig,
): LeaderboardRow[] {
  return computeLeaderboardRows(slices, {
    metric: config.metric,
    league: config.league,
    season: config.season,
    role: config.role,
    minThresholdType: config.minThreshold.type,
    minThresholdValue: config.minThreshold.value,
    limit: 50,
  });
}

export function shareUrlForBoard(config: CustomLeaderboardConfig) {
  return `/leaderboards/custom/?${serializeCustomLeaderboard(config)}`;
}

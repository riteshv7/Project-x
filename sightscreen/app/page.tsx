import { HomePageClient } from "@/app/home-page-client";
import { getMatchSummaries } from "@/lib/data";

export default async function HomePage() {
  const matches = await getMatchSummaries();
  return <HomePageClient matches={matches} />;
}

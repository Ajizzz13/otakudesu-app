import { getOngoingAnime } from '@/lib/scraper';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  const ongoing = await getOngoingAnime();
  return <HomeClient ongoing={ongoing} />;
}

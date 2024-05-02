import { TiktokUser } from '@fongsidev/scraper';

import { calcAvg } from '@/lib/formatters';
import { TikTokApiResult } from '@/lib/tiktok-api';

export type TikTokVideoMetrics = {
  comments: number;
  likes: number;
  shares: number;
};

const emptyStats = Object.freeze({
  likes: 0,
  comments: 0,
  shares: 0,
});

export async function scrapeNewestTikTokVideoStats(
  username: string
): Promise<TikTokVideoMetrics> {
  const user_data: TikTokApiResult | null = await TiktokUser(username);

  if (!user_data) return emptyStats;

  const count = user_data.data.videos.length;

  const allVideoStats = user_data.data.videos.reduce(
    (acc, { digg_count, comment_count, share_count }) => ({
      likes: acc.likes + digg_count,
      comments: acc.comments + comment_count,
      shares: acc.shares + share_count,
    }),
    {
      likes: 0,
      comments: 0,
      shares: 0,
    }
  );

  // Average all of the stats
  return Object.entries(allVideoStats).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: calcAvg(value, count, true),
    }),
    {} as TikTokVideoMetrics
  );
}

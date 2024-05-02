import { TiktokUser } from '@fongsidev/scraper';

import {
  calcArrayAvg,
  calcAvg,
  calcInteractionRate,
  formatTikTokNumbers,
  formatTikTokUsername,
} from '@/lib/formatters';
import { scrapeNewestTikTokVideoStats } from '@/lib/scrapers';

export type TikTokVideoMetrics = {
  comments: number;
  likes: number;
  shares: number;
};

export type TikTokApiResult = {
  data: {
    videos: {
      author: {
        nickname: string;
        avatar: string;
      };
      play_count: number;
      digg_count: number;
      comment_count: number;
      share_count: number;
    }[];
  };
};

export type TikTokUserMetrics = {
  user: {
    display_name: string;
    avatar_url: string;
  };
  metrics: {
    total_followers: number;
    average_video_views: number;
    interaction_rate: number;
    average_comments: number;
    average_likes: number;
    average_shares: number;
  };
  meta: {
    video_stats_loading: boolean;
  };
};

export async function getTikTokUserMetrics(identifier: string) {
  const username = formatTikTokUsername(identifier);

  const user_data: TikTokApiResult | null = await TiktokUser(username);

  if (!user_data?.data?.videos) return null;

  const first_video = user_data.data.videos[0];
  const { author } = first_video;

  const tikTokName: string | undefined = author?.nickname;
  if (!tikTokName) return null;

  const tikTokAvatarURL: string | undefined = author?.avatar;

  const tikTokFollowers = '0';

  const tikTokVideoViews: number[] = user_data.data.videos.map(
    (video) => video.play_count
  );

  const avgTikTokVideoViews: number = calcArrayAvg(tikTokVideoViews);

  const metrics: TikTokVideoMetrics[] = user_data.data.videos
    .slice(10)
    .map((video) => ({
      likes: video.digg_count,
      comments: video.comment_count,
      shares: video.share_count,
    }));

  // Sum all the metrics
  const combinedStats = metrics.reduce(
    (acc, curr) => {
      acc.comments += curr.comments;
      acc.likes += curr.likes;
      acc.shares += curr.shares;
      return acc;
    },
    {
      likes: 0,
      comments: 0,
      shares: 0,
    } as TikTokVideoMetrics
  );

  // Average all of the stats togther
  const averagedStats = Object.entries(combinedStats).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: calcAvg(value, metrics.length, true),
    }),
    {} as TikTokVideoMetrics
  );

  const data = {
    user: {
      display_name: tikTokName,
      avatar_url: tikTokAvatarURL,
    },
    metrics: {
      total_followers: formatTikTokNumbers(tikTokFollowers),
      average_video_views: avgTikTokVideoViews,
      average_comments: averagedStats.comments,
      average_likes: averagedStats.likes,
      average_shares: averagedStats.shares,
      interaction_rate: calcInteractionRate(averagedStats, avgTikTokVideoViews),
    },
    meta: {
      // Loading state if there was missing video data that can be fetched again
      video_stats_loading: !metrics.length,
    },
  } as TikTokUserMetrics;

  return data;
}

/**
 * Get the latest TikTok video stats for a user (slow)
 */
export async function getTikTokUserCompleteVideoMetrics(
  username: string
): Promise<TikTokVideoMetrics> {
  const metrics = await scrapeNewestTikTokVideoStats(
    formatTikTokUsername(username)
  );

  return metrics;
}
1;

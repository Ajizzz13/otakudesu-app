export interface AnimeItem {
  title: string;
  cover: string;
  slug: string;
  url: string;
  episode?: string;
  rating?: string;
  date?: string;
  upload?: string;
}

export interface AnimeInfo {
  title: string;
  japanese: string;
  cover: string;
  score: string;
  producer: string;
  type: string;
  status: string;
  totalEpisodes: string;
  duration: string;
  releaseDate: string;
  studio: string;
  genres: { name: string; url: string }[];
  synopsis: string;
  episodes: { title: string; url: string; date: string }[];
}

export interface EpisodeInfo {
  title: string;
  animeUrl: string;
  prevUrl: string | null;
  nextUrl: string | null;
  episodes: { title: string; url: string }[];
  downloads: {
    quality: string;
    links: { label: string; url: string; size?: string }[];
  }[];
}

export interface ScheduleDay {
  day: string;
  items: { title: string; url: string }[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
}
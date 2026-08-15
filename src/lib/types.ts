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
  episodes: { title: string; url: string; slug: string; date: string }[];
}

export interface ServerStream {
  server: string;
  url: string;
}

export interface EpisodeStream {
  title: string;
  defaultStreamingUrl: string;
  servers: ServerStream[];
  navigation: {
    prev: string | null;
    next: string | null;
    all: string | null;
  };
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
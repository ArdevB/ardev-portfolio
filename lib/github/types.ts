export type GhRepo = {
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
  pushedAt: string | null;
  topics: string[];
  isFork: boolean;
  isArchived: boolean;
  isPrivate: boolean;
  /** bytes per language, when available (GraphQL) */
  languages?: { name: string; color: string | null; size: number }[];
};

export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type GitHubSnapshot = {
  username: string;
  avatarUrl: string | null;
  repos: GhRepo[];
  contributions: { total: number; weeks: ContributionDay[][] } | null;
  fetchedAt: string;
};

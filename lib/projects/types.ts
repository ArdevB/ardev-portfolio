/** A project as rendered on the public site (GitHub data merged with admin overrides). */
export type PublicProject = {
  id: string;
  slug: string;
  source: "github" | "manual";
  title: string;
  description: string | null;
  repoName: string | null;
  repoUrl: string | null;
  homepage: string | null;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
  updatedAt: string | null;
  topics: string[];
  cover: string | null;
  featured: boolean;
  order: number;
  caseStudy: {
    role: string | null;
    year: string | null;
    summary: string | null;
    body: string | null;
  };
};

import "server-only";
import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { languageColors } from "./colors";
import type { ContributionDay, GhRepo, GitHubSnapshot } from "./types";

export const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "ArdevB";
const TOKEN = process.env.GITHUB_TOKEN;
const TIMEOUT_MS = 10_000;

/** fetch with a hard timeout so a slow GitHub never hangs a render. */
const timedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });

const LEVELS: Record<string, ContributionDay["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

type GqlRepo = {
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  pushedAt: string | null;
  isFork: boolean;
  isArchived: boolean;
  isPrivate: boolean;
  primaryLanguage: { name: string; color: string | null } | null;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
  languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
};

type GqlResponse = {
  user: {
    avatarUrl: string;
    repositories: { nodes: GqlRepo[] };
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[];
      };
    };
  } | null;
};

const QUERY = /* GraphQL */ `
  query Portfolio($login: String!) {
    user(login: $login) {
      avatarUrl(size: 400)
      repositories(first: 100, privacy: PUBLIC, ownerAffiliations: OWNER, orderBy: { field: PUSHED_AT, direction: DESC }) {
        nodes {
          name
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          pushedAt
          isFork
          isArchived
          isPrivate
          primaryLanguage { name color }
          repositoryTopics(first: 12) { nodes { topic { name } } }
          languages(first: 6, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }
`;

function normalizeHomepage(url: string | null | undefined) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function fetchViaGraphQL(): Promise<GitHubSnapshot> {
  const gql = graphql.defaults({ headers: { authorization: `token ${TOKEN}` }, request: { fetch: timedFetch } });
  const data = await gql<GqlResponse>(QUERY, { login: GITHUB_USERNAME });
  if (!data.user) throw new Error(`GitHub user ${GITHUB_USERNAME} not found`);
  const u = data.user;
  return {
    username: GITHUB_USERNAME,
    avatarUrl: u.avatarUrl,
    fetchedAt: new Date().toISOString(),
    repos: u.repositories.nodes
      .filter((r) => !r.isPrivate)
      .map((r) => ({
        name: r.name,
        description: r.description,
        url: r.url,
        homepage: normalizeHomepage(r.homepageUrl),
        language: r.primaryLanguage?.name ?? null,
        languageColor: r.primaryLanguage?.color ?? null,
        stars: r.stargazerCount,
        forks: r.forkCount,
        pushedAt: r.pushedAt,
        topics: r.repositoryTopics.nodes.map((n) => n.topic.name),
        isFork: r.isFork,
        isArchived: r.isArchived,
        isPrivate: false,
        languages: r.languages.edges.map((e) => ({ name: e.node.name, color: e.node.color, size: e.size })),
      })),
    contributions: {
      total: u.contributionsCollection.contributionCalendar.totalContributions,
      weeks: u.contributionsCollection.contributionCalendar.weeks.map((w) =>
        w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 })),
      ),
    },
  };
}

/** Unauthenticated fallback (60 req/h) — repos only, no contribution graph. */
async function fetchViaREST(): Promise<GitHubSnapshot> {
  const octokit = new Octokit({ request: { fetch: timedFetch } });
  const [{ data: user }, { data: repos }] = await Promise.all([
    octokit.rest.users.getByUsername({ username: GITHUB_USERNAME }),
    octokit.rest.repos.listForUser({ username: GITHUB_USERNAME, type: "owner", sort: "pushed", per_page: 100 }),
  ]);
  return {
    username: GITHUB_USERNAME,
    avatarUrl: user.avatar_url,
    fetchedAt: new Date().toISOString(),
    contributions: null,
    repos: repos
      .filter((r) => !r.private)
      .map((r) => ({
        name: r.name,
        description: r.description ?? null,
        url: r.html_url,
        homepage: normalizeHomepage(r.homepage),
        language: r.language ?? null,
        languageColor: r.language ? (languageColors[r.language] ?? null) : null,
        stars: r.stargazers_count ?? 0,
        forks: r.forks_count ?? 0,
        pushedAt: r.pushed_at ?? null,
        topics: r.topics ?? [],
        isFork: r.fork,
        isArchived: r.archived ?? false,
        isPrivate: false,
      })),
  };
}

/** Public data for the site. Throws on failure so callers can fall back to the last snapshot. */
export async function fetchPublicGitHub(): Promise<GitHubSnapshot> {
  // Offline development: point GITHUB_FIXTURE at a saved snapshot JSON.
  if (process.env.GITHUB_FIXTURE) {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(process.env.GITHUB_FIXTURE, "utf8")) as GitHubSnapshot;
  }
  return TOKEN ? fetchViaGraphQL() : fetchViaREST();
}

/**
 * Admin only: every repo the token's owner has, including private ones.
 * Private repos are listed in the dashboard but never rendered publicly.
 */
export async function fetchAllOwnedRepos(): Promise<GhRepo[]> {
  if (process.env.GITHUB_FIXTURE) {
    const { readFile } = await import("node:fs/promises");
    const fx = JSON.parse(await readFile(process.env.GITHUB_FIXTURE, "utf8")) as GitHubSnapshot & { privateRepos?: GhRepo[] };
    return [...fx.repos, ...(fx.privateRepos ?? [])];
  }
  if (!TOKEN) throw new Error("GITHUB_TOKEN is not set");
  const octokit = new Octokit({ auth: TOKEN, request: { fetch: timedFetch } });
  const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    affiliation: "owner",
    per_page: 100,
    sort: "pushed",
  });
  return repos.map((r) => ({
    name: r.name,
    description: r.description ?? null,
    url: r.html_url,
    homepage: normalizeHomepage(r.homepage),
    language: r.language ?? null,
    languageColor: r.language ? (languageColors[r.language] ?? null) : null,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    pushedAt: r.pushed_at ?? null,
    topics: r.topics ?? [],
    isFork: r.fork,
    isArchived: r.archived ?? false,
    isPrivate: r.private,
  }));
}

import matter from "gray-matter";

export interface ParsedSkill {
  name: string;
  url: string;
  rawContent: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

/**
 * Convert a GitHub URL to a raw content URL.
 * Handles: github.com/user/repo/blob/branch/file → raw.githubusercontent.com/...
 */
function toRawGitHubUrl(url: string): string {
  const ghMatch = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/
  );
  if (ghMatch) {
    const [, owner, repo, branch, path] = ghMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  // If it's already a raw URL, return as-is
  if (url.includes("raw.githubusercontent.com")) {
    return url;
  }

  // Try treating a plain github repo URL as pointing to SKILL.md on main
  const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (repoMatch) {
    const [, owner, repo] = repoMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/main/SKILL.md`;
  }

  return url;
}

/**
 * Fetch and parse a skill from a URL.
 * Supports GitHub URLs and direct raw URLs.
 */
export async function fetchSkill(url: string): Promise<ParsedSkill> {
  const rawUrl = toRawGitHubUrl(url);

  const response = await fetch(rawUrl, {
    headers: { "User-Agent": "Vigil-Protocol/1.0" },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch skill from ${rawUrl}: ${response.status} ${response.statusText}`
    );
  }

  const rawContent = await response.text();

  // Parse YAML frontmatter + markdown body
  const { data: frontmatter, content: body } = matter(rawContent);

  // Extract name from frontmatter or first heading
  const name =
    (frontmatter.name as string) ||
    (frontmatter.title as string) ||
    extractFirstHeading(body) ||
    extractNameFromUrl(url);

  return {
    name,
    url,
    rawContent,
    frontmatter,
    body,
  };
}

function extractFirstHeading(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractNameFromUrl(url: string): string {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "Unknown Skill";
}

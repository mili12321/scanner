import fs from "fs";
import path from "path";

const PROGRESS_FILE = path.join(__dirname, "scan-progress.json");

export function saveProgress(repoKey: string, sha: string, page: number) {
  let data: Record<string, { sha: string; page: number }> = {};

  if (fs.existsSync(PROGRESS_FILE)) {
    data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  }

  data[repoKey] = { sha, page };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
}

export function getProgress(
  repoKey: string
): { sha: string; page: number } | null {
  if (!fs.existsSync(PROGRESS_FILE)) return null;

  const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  return data[repoKey] || null;
}

// {
//   "facebook/react": {  --->  repoKey is owner/repo
//     "sha": "abc123",
//     "page": 4
//   }
// }

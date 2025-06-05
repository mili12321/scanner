import fs from "fs";
const PLACEHOLDER_FILE = "last_sha.txt";

export function saveLastSha(sha: string) {
  fs.writeFileSync(PLACEHOLDER_FILE, sha, "utf-8");
}

export function getLastSha(): string | null {
  if (fs.existsSync(PLACEHOLDER_FILE)) {
    return fs.readFileSync(PLACEHOLDER_FILE, "utf-8").trim();
  }
  return null;
}

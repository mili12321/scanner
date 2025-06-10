import * as dotenv from "dotenv";
import { getProgress, saveProgress } from "./storage";
import { scanForAwsSecrets } from "./scanner";
import { getBranches, getCommitDetails, getCommits } from "./api";

dotenv.config();

type Finding = {
  sha: string;
  committer: string;
  date: string;
  message: string;
  secrets: string[];
  file: string;
};

export async function getCommitsAndScan(
  owner: string,
  repo: string,
  perPage = 5,
  maxPages = 10,
  branch = "main"
) {
  const repoKey = `${owner}/${repo}`;
  const progress = getProgress(repoKey);
  const lastScannedSha = progress?.sha || "";
  let page = progress?.page || 1;
  let allFindings: Finding[] = [];
  let foundLastSha = !lastScannedSha;

  while (page <= maxPages) {
    try {
      const response = await getCommits(owner, repo, perPage, page, branch);
      if (!response) break;

      const commits = response.commits;
      const headers = response.headers;
      console.log(`Page ${page} - fetched ${commits.length} commits`);

      const tasks: (() => Promise<void>)[] = [];

      for (const commit of commits) {
        if (!foundLastSha) {
          if (commit.sha === lastScannedSha) {
            foundLastSha = true;
          }
          continue;
        }

        tasks.push(async () => {
          const commitDetails = await getCommitDetails(owner, repo, commit.sha);
          if (!commitDetails || !commitDetails.files) return;

          let scannedCommitFully = false;

          for (const file of commitDetails.files) {
            if (!file.patch) continue;

            scannedCommitFully = true;
            const secrets = scanForAwsSecrets(file.patch);

            if (secrets.length > 0) {
              allFindings.push({
                sha: commit.sha,
                committer: commit.commit.committer.name,
                date: commit.commit.committer.date,
                message: commit.commit.message,
                secrets,
                file: file.filename,
              });
            }
          }

          if (scannedCommitFully) {
            saveProgress(repoKey, commit.sha, page);
          }
        });
      }

      await runWithLimit(tasks, 5);

      // Rate limit handling
      const remaining = parseInt(headers["x-ratelimit-remaining"], 10);
      const resetTime = parseInt(headers["x-ratelimit-reset"], 10) * 1000;
      const waitTime = resetTime - Date.now();

      if (remaining === 0 && waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${waitTime / 1000}s...`);
        await new Promise((res) => setTimeout(res, waitTime));
      }

      const linkHeader = headers.link;
      if (!linkHeader || !linkHeader.includes('rel="next"')) break;

      page++;
    } catch (err: any) {
      console.error("Error fetching commits:", err.message || err);
      break;
    }
  }

  console.log(`Total leaks found: ${allFindings.length}`);
  return allFindings;
}

export async function scanAllBranches(owner: string, repo: string) {
  const allFindings: Finding[] = [];

  const branches = await getBranches(owner, repo);
  if (!branches) {
    console.error("No branches found.");
    return allFindings;
  }

  //creates array of functions where each one returns a promise for the next scan
  const tasks = branches.map((branch: { name: string }) => async () => {
    const findings = await getCommitsAndScan(owner, repo, 5, 10, branch.name);
    return findings;
  });

  //run 3 tasks each time
  const results = await runWithLimit(tasks, 3);

  for (const findings of results) {
    allFindings.push(...findings);
  }

  console.log(`🎯 Total leaks across all branches: ${allFindings.length}`);
  return allFindings;
}

async function runWithLimit(tasks: any, limit: number) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const p = task().then((r: any) => {
      executing.delete(p);
      return r;
    });

    results.push(p);
    executing.add(p);

    if (executing.size >= limit) {
      await Promise.race(executing); // waiting for some task to be done
    }
  }

  return Promise.all(results);
}

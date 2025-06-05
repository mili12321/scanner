import * as dotenv from "dotenv";
import { getLastSha, saveLastSha } from "./storage";
import { scanForAwsSecrets } from "./scanner";
import {
  getBranches,
  getCommitDetails,
  getCommitDetailsMock,
  getCommits,
} from "./api";

dotenv.config();

type Finding = {
  sha: string;
  committer: string;
  date: string;
  message: string;
  secrets: string[];
  file: string;
};

async function getCommitsAndScan(
  owner: string,
  repo: string,
  perPage = 5,
  maxPages = 10,
  branch = "main"
) {
  let page = 1;
  let allFindings: Finding[] = [];
  const lastScannedSha = getLastSha();
  let foundLastSha = !lastScannedSha;

  while (page <= maxPages) {
    try {
      const response = await getCommits(owner, repo, perPage, page, branch);
      if (!response) break;

      const commits = response.commits;
      const headers = response.headers;
      console.log(`Page ${page} - fetched ${commits.length} commits`);

      for (const commit of commits) {
        if (!foundLastSha) {
          if (commit.sha === lastScannedSha) {
            foundLastSha = true;
            continue; // Skip already scanned commit
          }
          continue; // Skip commits until we reach last scanned SHA
        }

        const commitDetails = await getCommitDetails(owner, repo, commit.sha);
        console.log("commitDetails", commitDetails);
        if (!commitDetails || !commitDetails.files) continue;

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
            // console.log(
            //   `Leak found in commit ${commit.sha} in file ${file.filename}:`,
            //   secrets
            // );
            console.log(`🕵️‍♀️ Leak found!
  🔸 Commit: ${commit.sha}
  📁 File: ${file.filename}
  👤 Committer: ${commit.commit.committer.name}
  📅 Date: ${commit.commit.committer.date}
  📝 Message: ${commit.commit.message.split("\n")[0]}
  🧪 Secrets: ${secrets.join(", ")}
`);
          }
        }
        if (scannedCommitFully) {
          saveLastSha(commit.sha);
        }
      }

      // Handle rate limiting
      const remaining = parseInt(headers["x-ratelimit-remaining"], 10);
      const resetTime = parseInt(headers["x-ratelimit-reset"], 10) * 1000;

      if (remaining === 0) {
        const waitTime = resetTime - Date.now();
        console.log(
          `Rate limit reached, waiting for ${waitTime / 1000} seconds...`
        );
        if (waitTime > 0) await new Promise((r) => setTimeout(r, waitTime));
      }

      // Check if there's a next page
      const linkHeader = response.headers.link;
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        break;
      }

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

  for (const branch of branches) {
    const branchName = branch.name;
    console.log(`\n🔎 Scanning branch: ${branchName}`);

    const findings = await getCommitsAndScan(owner, repo, 5, 10, branchName);
    allFindings.push(...findings);
  }

  console.log(`🎯 Total leaks across all branches: ${allFindings.length}`);
  return allFindings;
}

// (async () => {
//   const owner = "facebook";
//   const repo = "react";

//   //   const findings = await getCommitsAndScan(owner, repo, 5, 3);
//   const findings = await scanAllBranches(owner, repo);

//   console.log(`Scan complete. Found ${findings.length} leaks.`);
//   // TODO save findings to a file or DB here
// })();

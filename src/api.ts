import axios, { AxiosError } from "axios";
import axiosRetry from "axios-retry";
import * as dotenv from "dotenv";
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is missing");
}

const api = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  },
});

axiosRetry(api, {
  retries: 3, // Number of retries before failing
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors, 429 (rate limit), and 5xx server errors
    if (axiosRetry.isNetworkError(error)) {
      return true;
    }

    if (typeof error === "object" && error !== null) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      if (typeof status === "number") {
        return status === 429 || (status >= 500 && status < 600);
      }
    }

    return false;
  },
});

export async function getCommitDetails(
  owner: string,
  repo: string,
  sha: string
) {
  try {
    const response = await api.get(`/repos/${owner}/${repo}/commits/${sha}`);
    return response.data;
  } catch (err: any) {
    console.error(
      `Failed to fetch details for commit ${sha}:`,
      err.message || err
    );
    return null;
  }
}

export async function getCommits(
  owner: string,
  repo: string,
  perPage: number,
  page: number,
  branch?: string
) {
  try {
    const params: any = { per_page: perPage, page };
    if (branch) params.sha = branch;

    const response = await api.get(`/repos/${owner}/${repo}/commits`, {
      params,
    });
    return {
      commits: response.data,
      headers: response.headers,
    };
  } catch (err) {
    console.error(`Failed to fetch commits on page ${page}:`, err);
    return null;
  }
}

export async function getBranches(owner: string, repo: string) {
  try {
    const response = await api.get(`/repos/${owner}/${repo}/branches`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch branches:", err);
    return null;
  }
}

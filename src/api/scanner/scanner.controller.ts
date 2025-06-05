// scanner.controller.ts

import { Request, Response } from "express";
import { getCommitsAndScan, scanAllBranches } from "../../main";

export async function scanCommitsController(req: Request, res: Response) {
  try {
    console.log("Received /scan POST request with body:", req.body);
    const { owner, repo, perPage, maxPages, branch } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({ error: "Missing owner or repo parameter" });
    }

    const findings = await getCommitsAndScan(
      owner as string,
      repo as string,
      perPage ? Number(perPage) : 5,
      maxPages ? Number(maxPages) : 10,
      branch ? String(branch) : "main"
    );

    res.status(200).json(findings);
  } catch (error) {
    res.status(400).json({
      error: error,
    });
  }
}

export async function scanBranchesController(req: Request, res: Response) {
  try {
    const { owner, repo } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({ error: "Missing owner or repo parameter" });
    }

    const findings = await scanAllBranches(owner as string, repo as string);
    res.status(200).json(findings);
  } catch (error) {
    res.status(400).json({
      error: error,
    });
  }
}

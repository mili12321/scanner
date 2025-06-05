import { RequestHandler, Router } from "express";
import {
  scanCommitsController,
  scanBranchesController,
} from "./scanner.controller";

export const scannerRouter = Router();

scannerRouter.post("/scan-commits", scanCommitsController as RequestHandler);
scannerRouter.post("/scan-branches", scanBranchesController as RequestHandler);

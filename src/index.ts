import express, { Express } from "express";
import { scanAllBranches } from "./main";

const app: Express = express();

app.use(express.json());
app.post("/scan", async (req: any, res: any) => {
  const { owner, repo } = req.body;

  if (!owner || !repo) {
    return res
      .status(400)
      .json({ error: "Missing owner or repo in request body" });
  }

  try {
    const findings = await scanAllBranches(owner, repo);
    return res.json({ findings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to scan repository" });
  }
});
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

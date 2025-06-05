import express, { Express } from "express";
import path from "path";
import dotenv from "dotenv";
import { scannerRouter } from "./api/scanner/scanner.routes";
import { createServer } from "http";

dotenv.config();

const app: Express = express();

const httpServer = createServer(app);
app.use(express.json());

// Static files for production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public")));
  app.get("/**", (_, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
}

app.use("/api/scanner", scannerRouter);

const port = process.env.PORT || 8001;

httpServer.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});

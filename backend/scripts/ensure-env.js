import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const exampleEnvPath = path.join(projectRoot, ".env.example");

async function ensureEnvFile() {
  try {
    await fs.access(envPath);
    return;
  } catch {
    // .env does not exist yet, continue below.
  }

  const exampleContents = await fs.readFile(exampleEnvPath, "utf8");
  await fs.writeFile(envPath, exampleContents, "utf8");

  console.log("Created .env from .env.example. Update DB values if needed.");
}

ensureEnvFile().catch((error) => {
  console.error("Failed to ensure .env file:", error);
  process.exit(1);
});

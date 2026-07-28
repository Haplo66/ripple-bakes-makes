import * as fs from "node:fs";
import * as path from "node:path";
import type { DoctorCheck, DoctorResult } from "../types.ts";

function fileExists(...segments: string[]): boolean {
  return fs.existsSync(path.resolve(...segments));
}

const configRequiredFiles: DoctorCheck = {
  id: "CONFIG-001",
  category: "Configuration",
  run(): DoctorResult {
    const requiredFiles = [
      "package.json",
      "astro.config.mjs",
      "src/content/products.json",
      "src/content/collections.json",
      "src/content/forms.json",
    ];
    const missing: string[] = [];
    for (const f of requiredFiles) {
      if (!fileExists(f)) {
        missing.push(f);
      }
    }
    if (missing.length === 0) {
      return { id: "CONFIG-001", category: "Configuration", status: "PASS", summary: "All required project files exist." };
    }
    return {
      id: "CONFIG-001",
      category: "Configuration",
      status: "FAIL",
      summary: "Missing required files.",
      details: missing,
      recommendation: "Restore missing files or re-run the data pipeline.",
    };
  },
};

const configRequiredDirs: DoctorCheck = {
  id: "CONFIG-002",
  category: "Configuration",
  run(): DoctorResult {
    const requiredDirs = ["src", "scripts", "public", "public/images", "scripts/pipeline", "scripts/doctor"];
    const missing: string[] = [];
    for (const d of requiredDirs) {
      const resolved = path.resolve(d);
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
        missing.push(d);
      }
    }
    if (missing.length === 0) {
      return { id: "CONFIG-002", category: "Configuration", status: "PASS", summary: "All required directories exist." };
    }
    return {
      id: "CONFIG-002",
      category: "Configuration",
      status: "FAIL",
      summary: "Missing required directories.",
      details: missing,
      recommendation: "Create the missing directories or restore them from version control.",
    };
  },
};

const configEnvVars: DoctorCheck = {
  id: "CONFIG-003",
  category: "Configuration",
  run(): DoctorResult {
    const requiredVars = [
      "GOOGLE_DRIVE_ROOT_FOLDER_ID",
      "INVENTORY_GOOGLE_SHEETS_ID",
      "PUBLIC_SUBMISSION_ENDPOINT",
    ];
    const envValues: Record<string, string> = {};
    const envPath = path.resolve(".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (key) envValues[key] = val;
      }
    }
    for (const key of requiredVars) {
      if (!envValues[key] && !process.env[key]) {
        return {
          id: "CONFIG-003",
          category: "Configuration",
          status: "FAIL",
          summary: "Required configuration missing.",
          details: [key + " is not set in .env or environment."],
          recommendation: "Add " + key + " to the .env file or set it in the environment.",
        };
      }
    }
    return { id: "CONFIG-003", category: "Configuration", status: "PASS", summary: "Required configuration values are available." };
  },
};

const configChecks: DoctorCheck[] = [configRequiredFiles, configRequiredDirs, configEnvVars];

export default configChecks;
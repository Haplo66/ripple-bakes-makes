/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { DoctorCheck, DoctorResult } from "../types.ts";

const IMAGE_DIR = path.resolve("public/images");
const SUPPORTED_FORMATS = /\.(jpg|jpeg|png|webp)$/i;

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function scanFolder(folderPath: string): string[] {
  try {
    if (!fs.existsSync(folderPath)) return [];
    return fs.readdirSync(folderPath).filter((f) => SUPPORTED_FORMATS.test(f));
  } catch {
    return [];
  }
}

type ProductRecord = {
  id: string;
  name?: string;
  active?: boolean;
  imageFolder?: string;
  images?: string[];
  primaryImage?: string;
  collection?: string;
  businessArea?: string;
};

type CollectionRecord = {
  id: string;
  name?: string;
  imageFolder?: string | null;
  heroImage?: string | null;
  images?: string[];
};

const assetProductFolders: DoctorCheck = {
  id: "ASSET-001",
  category: "Asset Health",
  run(): DoctorResult {
    const products = readJson<{ data: ProductRecord[] }>(path.resolve("src/content/products.json"));
    if (!products) {
      return { id: "ASSET-001", category: "Asset Health", status: "FAIL", summary: "Cannot check product image folders; products.json missing.", recommendation: "Run the data pipeline first." };
    }
    const missing: string[] = [];
    for (const p of products.data) {
      if (p.active === false) continue;
      if (!p.imageFolder) {
        missing.push(p.id + " has no imageFolder defined.");
        continue;
      }
      const folderPath = path.join(IMAGE_DIR, p.imageFolder);
      if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        missing.push(p.id + " (" + (p.name || "unknown") + ") image folder missing.\n  Expected: public/images/" + p.imageFolder);
      }
    }
    if (missing.length === 0) {
      return { id: "ASSET-001", category: "Asset Health", status: "PASS", summary: "All active product image folders exist." };
    }
    return {
      id: "ASSET-001", category: "Asset Health", status: "FAIL",
      summary: missing.length + " product image folder(s) missing.",
      details: missing,
      recommendation: "Add images to the expected product image folders.",
    };
  },
};

const assetProductImages: DoctorCheck = {
  id: "ASSET-002",
  category: "Asset Health",
  run(): DoctorResult {
    const products = readJson<{ data: ProductRecord[] }>(path.resolve("src/content/products.json"));
    if (!products) {
      return { id: "ASSET-002", category: "Asset Health", status: "FAIL", summary: "Cannot check product images; products.json missing.", recommendation: "Run the data pipeline first." };
    }
    const empty: string[] = [];
    for (const p of products.data) {
      if (p.active === false) continue;
      if (!p.imageFolder) continue;
      const folderPath = path.join(IMAGE_DIR, p.imageFolder);
      const files = scanFolder(folderPath);
      if (files.length === 0) {
        empty.push(p.id + " (" + (p.name || "unknown") + ") folder has no supported images.\n  Folder: public/images/" + p.imageFolder);
      }
    }
    if (empty.length === 0) {
      return { id: "ASSET-002", category: "Asset Health", status: "PASS", summary: "All active products have at least one image." };
    }
    return {
      id: "ASSET-002", category: "Asset Health", status: "WARN",
      summary: empty.length + " product(s) have empty image folders.",
      details: empty,
      recommendation: "Add product images (jpg, jpeg, png, webp) to the folder.",
    };
  },
};

const assetProductRefs: DoctorCheck = {
  id: "ASSET-003",
  category: "Asset Health",
  run(): DoctorResult {
    const products = readJson<{ data: ProductRecord[] }>(path.resolve("src/content/products.json"));
    if (!products) {
      return { id: "ASSET-003", category: "Asset Health", status: "FAIL", summary: "Cannot check image references; products.json missing.", recommendation: "Run the data pipeline first." };
    }
    const broken: string[] = [];
    for (const p of products.data) {
      if (p.active === false) continue;
      if (!p.imageFolder || !p.images || p.images.length === 0) continue;
      const folderPath = path.join(IMAGE_DIR, p.imageFolder);
      if (!fs.existsSync(folderPath)) continue;
      const existingFiles = new Set(scanFolder(folderPath));
      for (const img of p.images) {
        if (!existingFiles.has(img)) {
          broken.push(p.id + " (" + (p.name || "unknown") + ") references missing image: " + img);
        }
      }
    }
    if (broken.length === 0) {
      return { id: "ASSET-003", category: "Asset Health", status: "PASS", summary: "All product image references resolve correctly." };
    }
    return {
      id: "ASSET-003", category: "Asset Health", status: "FAIL",
      summary: broken.length + " broken product image reference(s).",
      details: broken,
      recommendation: "Restore the missing image assets or re-run the image import.",
    };
  },
};

const assetCollectionImages: DoctorCheck = {
  id: "ASSET-004",
  category: "Asset Health",
  run(): DoctorResult {
    const collections = readJson<{ data: CollectionRecord[] }>(path.resolve("src/content/collections.json"));
    if (!collections) {
      return { id: "ASSET-004", category: "Asset Health", status: "FAIL", summary: "Cannot check collection images; collections.json missing.", recommendation: "Run the data pipeline first." };
    }
    const issues: string[] = [];
    for (const c of collections.data) {
      if (!c.imageFolder) continue;
      const folderPath = path.join(IMAGE_DIR, c.imageFolder);
      if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        issues.push(c.name || c.id + " collection folder missing.\n  Expected: public/images/" + c.imageFolder);
        continue;
      }
      const files = scanFolder(folderPath);
      if (files.length === 0) {
        issues.push(c.name || c.id + " collection folder exists but contains no images.\n  Folder: public/images/" + c.imageFolder);
        continue;
      }
      if (c.heroImage && c.heroImage !== "null" && !files.includes(c.heroImage)) {
        issues.push(c.name || c.id + " references hero image not found in folder: " + c.heroImage);
      }
    }
    if (issues.length === 0) {
      return { id: "ASSET-004", category: "Asset Health", status: "PASS", summary: "All collection images are present." };
    }
    return {
      id: "ASSET-004", category: "Asset Health", status: "WARN",
      summary: issues.length + " collection image issue(s).",
      details: issues,
      recommendation: "Add missing collection artwork or re-run the image import.",
    };
  },
};

const assetUnused: DoctorCheck = {
  id: "ASSET-005",
  category: "Asset Health",
  run(): DoctorResult {
    const products = readJson<{ data: ProductRecord[] }>(path.resolve("src/content/products.json"));
    const collections = readJson<{ data: CollectionRecord[] }>(path.resolve("src/content/collections.json"));
    const referencedFolders = new Set<string>();
    if (products) {
      for (const p of products.data) {
        if (p.imageFolder) referencedFolders.add(p.imageFolder.replace(/\\/g, "/"));
      }
    }
    if (collections) {
      for (const c of collections.data) {
        if (c.imageFolder) referencedFolders.add(c.imageFolder.replace(/\\/g, "/"));
      }
    }
    const unused: string[] = [];
    const imagesDir = IMAGE_DIR;
    if (!fs.existsSync(imagesDir)) {
      return { id: "ASSET-005", category: "Asset Health", status: "INFO", summary: "No unused assets detected." };
    }
    function scanLeafFolders(dir: string, relative: string, depth: number): void {
      let entries: string[];
      try {
        entries = fs.readdirSync(dir);
      } catch {
        return;
      }
      const subdirs = entries.filter((e) => {
        try {
          return fs.statSync(path.join(dir, e)).isDirectory();
        } catch {
          return false;
        }
      });
      if (subdirs.length === 0) {
        if (depth >= 2) {
          const relPath = relative.replace(/\\/g, "/");
          if (!referencedFolders.has(relPath)) {
            unused.push("public/images/" + relPath);
          }
        }
        return;
      }
      for (const sub of subdirs) {
        scanLeafFolders(path.join(dir, sub), relative ? relative + "/" + sub : sub, depth + 1);
      }
    }
    const scanRoots = ["products", "collections"];
    for (const root of scanRoots) {
      const rootPath = path.join(imagesDir, root);
      if (fs.existsSync(rootPath)) {
        scanLeafFolders(rootPath, root, 1);
      }
    }
    if (unused.length === 0) {
      return { id: "ASSET-005", category: "Asset Health", status: "PASS", summary: "No unused asset folders detected." };
    }
    return {
      id: "ASSET-005", category: "Asset Health", status: "INFO",
      summary: unused.length + " unused asset folder(s) detected.",
      details: unused,
      recommendation: "Review and remove unused asset folders if no longer needed.",
    };
  },
};

const assetChecks: DoctorCheck[] = [assetProductFolders, assetProductImages, assetProductRefs, assetCollectionImages, assetUnused];

export default assetChecks;
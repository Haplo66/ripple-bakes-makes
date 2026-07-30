/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
 *
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { DoctorCheck, DoctorResult } from "../types.ts";

const PRODUCTS_PATH = path.resolve("src/content/products.json");
const COLLECTIONS_PATH = path.resolve("src/content/collections.json");
const FORMS_PATH = path.resolve("src/content/forms.json");

function readJsonSafe(filePath: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: "File not found." };
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return { ok: true, data: parsed };
  } catch (err) {
    return { ok: false, error: err instanceof SyntaxError ? "Invalid JSON." : String(err) };
  }
}

const dataProductsFile: DoctorCheck = {
  id: "DATA-001",
  category: "Business Data",
  run(): DoctorResult {
    const result = readJsonSafe(PRODUCTS_PATH);
    if (!result.ok) {
      return {
        id: "DATA-001", category: "Business Data", status: "FAIL",
        summary: "Products data file is missing or invalid.",
        details: [result.error],
        recommendation: "Regenerate product data by running the data pipeline.",
      };
    }
    const obj = result.data as Record<string, unknown>;
    if (!Array.isArray(obj.data) || obj.data.length === 0) {
      return {
        id: "DATA-001", category: "Business Data", status: "FAIL",
        summary: "Products data file has no products.",
        recommendation: "Regenerate product data by running the data pipeline.",
      };
    }
    return {
      id: "DATA-001", category: "Business Data", status: "PASS",
      summary: "Products data file exists with " + obj.data.length + " products.",
    };
  },
};

const dataCollectionsFile: DoctorCheck = {
  id: "DATA-002",
  category: "Business Data",
  run(): DoctorResult {
    const result = readJsonSafe(COLLECTIONS_PATH);
    if (!result.ok) {
      return {
        id: "DATA-002", category: "Business Data", status: "FAIL",
        summary: "Collections data file is missing or invalid.",
        details: [result.error],
        recommendation: "Regenerate collection data by running the data pipeline.",
      };
    }
    const obj = result.data as Record<string, unknown>;
    if (!Array.isArray(obj.data) || obj.data.length === 0) {
      return {
        id: "DATA-002", category: "Business Data", status: "FAIL",
        summary: "Collections data file has no collections.",
        recommendation: "Regenerate collection data by running the data pipeline.",
      };
    }
    return {
      id: "DATA-002", category: "Business Data", status: "PASS",
      summary: "Collections data file exists with " + obj.data.length + " collections.",
    };
  },
};

const dataFormsFile: DoctorCheck = {
  id: "DATA-003",
  category: "Business Data",
  run(): DoctorResult {
    const result = readJsonSafe(FORMS_PATH);
    if (!result.ok) {
      return {
        id: "DATA-003", category: "Business Data", status: "FAIL",
        summary: "Forms data file is missing or invalid.",
        details: [result.error],
        recommendation: "Regenerate form data by running the data pipeline.",
      };
    }
    const obj = result.data as Record<string, unknown>;
    if (!Array.isArray(obj.data) || obj.data.length === 0) {
      return {
        id: "DATA-003", category: "Business Data", status: "FAIL",
        summary: "Forms data file has no forms.",
        recommendation: "Regenerate form data by running the data pipeline.",
      };
    }
    return {
      id: "DATA-003", category: "Business Data", status: "PASS",
      summary: "Forms data file exists with " + obj.data.length + " forms.",
    };
  },
};

const dataProductFields: DoctorCheck = {
  id: "DATA-004",
  category: "Business Data",
  run(): DoctorResult {
    const result = readJsonSafe(PRODUCTS_PATH);
    if (!result.ok) {
      return {
        id: "DATA-004", category: "Business Data", status: "FAIL",
        summary: "Cannot validate product fields; products file is missing or invalid.",
        details: [result.error],
        recommendation: "Fix the products data file first.",
      };
    }
    const obj = result.data as { data: Record<string, unknown>[] };
    const products = obj.data;
    const requiredFields = ["id", "name", "businessArea", "collection", "status"];
    const issues: string[] = [];
    for (const product of products) {
      for (const field of requiredFields) {
        const val = product[field];
        if (val === undefined || val === null || val === "") {
          issues.push("Product " + (product.id || "(unknown)") + " missing " + field + ".");
        }
      }
    }
    if (issues.length === 0) {
      return {
        id: "DATA-004", category: "Business Data", status: "PASS",
        summary: "All " + products.length + " products have required fields.",
      };
    }
    return {
      id: "DATA-004", category: "Business Data", status: "WARN",
      summary: issues.length + " product field issue" + (issues.length === 1 ? "" : "s") + " found.",
      details: issues,
      recommendation: "Complete missing product information in the source data.",
    };
  },
};

const dataCollectionRefs: DoctorCheck = {
  id: "DATA-005",
  category: "Business Data",
  run(): DoctorResult {
    const productsResult = readJsonSafe(PRODUCTS_PATH);
    const collectionsResult = readJsonSafe(COLLECTIONS_PATH);
    if (!productsResult.ok || !collectionsResult.ok) {
      return {
        id: "DATA-005", category: "Business Data", status: "FAIL",
        summary: "Cannot validate collection references; data files are missing.",
        recommendation: "Ensure products.json and collections.json exist.",
      };
    }
    const products = (productsResult.data as { data: Record<string, unknown>[] }).data;
    const collections = (collectionsResult.data as { data: Record<string, unknown>[] }).data;
    const validIds = new Set(collections.map((c) => c.id as string));
    const referenceIssues: string[] = [];
    for (const product of products) {
      const ref = product.collection as string | undefined;
      if (ref && !validIds.has(ref)) {
        referenceIssues.push("Product " + product.id + " references missing collection: " + ref);
      }
    }
    if (referenceIssues.length === 0) {
      return {
        id: "DATA-005", category: "Business Data", status: "PASS",
        summary: "All " + products.length + " product collection references are valid.",
      };
    }
    return {
      id: "DATA-005", category: "Business Data", status: "FAIL",
      summary: referenceIssues.length + " invalid collection reference" + (referenceIssues.length === 1 ? "" : "s") + " found.",
      details: referenceIssues,
      recommendation: "Fix product collection assignments to match existing collections.",
    };
  },
};

const dataChecks: DoctorCheck[] = [dataProductsFile, dataCollectionsFile, dataFormsFile, dataProductFields, dataCollectionRefs];

export default dataChecks;
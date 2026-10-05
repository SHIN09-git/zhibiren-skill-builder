#!/usr/bin/env node
import fs from "node:fs";

const file = process.argv[2];

if (!file) {
  fail("Usage: node validate-skill-json.mjs <skill.json>");
}

let data;
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
  fail(`JSON parse failed: ${error.message}`);
}

const errors = [];
if (!isRecord(data)) fail("JSON root must be an object.");
const styleRules = data.style_rules || {};
const mustRules = Array.isArray(styleRules.must) ? styleRules.must : [];
const evidence = data.rule_evidence || {};

if (!data.skillName) errors.push("skillName is required.");
if (!data.handle) errors.push("handle is required.");
if (!data.description) errors.push("description is required.");
if (!isRecord(data.style_rules)) errors.push("style_rules must be an object.");
for (const field of ["must", "recommended", "optional"]) {
  if (field in Object(styleRules) && !Array.isArray(styleRules[field])) {
    errors.push(`style_rules.${field} must be an array.`);
  }
}

for (const rule of mustRules) {
  const normalizedRule = typeof rule === "string" ? rule : rule?.rule;
  const item = evidence[normalizedRule];
  if (!normalizedRule) {
    errors.push("style_rules.must contains an empty rule.");
    continue;
  }
  if (!Object.hasOwn(evidence, normalizedRule) || !isRecord(item)) {
    errors.push(`Missing rule_evidence for must rule: ${normalizedRule}`);
    continue;
  }
  if (!Number.isInteger(item.support_count) || item.support_count < 2) {
    errors.push(`Must rule support_count must be an integer of at least 2: ${normalizedRule}`);
  }
  if (!["medium", "high"].includes(item.confidence)) {
    errors.push(`Must rule confidence must be medium or high: ${normalizedRule}`);
  }
  const documentIds = item.support_doc_ids;
  if (!Array.isArray(documentIds) ||
      documentIds.some(id => typeof id !== "string" || !id.trim()) ||
      new Set(documentIds.map(id => typeof id === "string" ? id.trim() : id)).size < 2) {
    errors.push(`Must rule needs at least two distinct, nonblank support_doc_ids: ${normalizedRule}`);
  }
}

const testReport = data.test_report || data.qualityReport?.test_report || {};
const overall = testReport.overall_result || {};
for (const field of ["privacy_leak_count", "case_specific_leak_count", "fabrication_risk_count"]) {
  if (field in Object(overall) && (!Number.isInteger(overall[field]) || overall[field] < 0)) {
    errors.push(`${field} must be a nonnegative integer.`);
  }
}
const blocked =
  Number(overall.privacy_leak_count || 0) > 0 ||
  Number(overall.case_specific_leak_count || 0) > 0 ||
  Number(overall.fabrication_risk_count || 0) > 0;

if (blocked && overall.save_allowed !== false) {
  errors.push("save_allowed must be false when privacy/case-specific/fabrication risk exists.");
}

if (data.mixed_sample_warning && String(data.overall_confidence || "").toLowerCase() === "high") {
  errors.push("overall_confidence cannot be high when mixed_sample_warning is true.");
}

if (errors.length) {
  fail(errors.join("\n"));
}

console.log(`OK: ${file}`);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}


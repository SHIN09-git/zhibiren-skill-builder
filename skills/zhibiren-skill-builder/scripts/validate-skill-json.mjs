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
const styleRules = data.style_rules || {};
const mustRules = Array.isArray(styleRules.must) ? styleRules.must : [];
const evidence = data.rule_evidence || {};

if (!data.skillName) errors.push("skillName is required.");
if (!data.handle) errors.push("handle is required.");
if (!data.description) errors.push("description is required.");
if (!data.style_rules || typeof data.style_rules !== "object") errors.push("style_rules is required.");
if (!Array.isArray(styleRules.recommended || [])) errors.push("style_rules.recommended must be an array.");
if (!Array.isArray(styleRules.optional || [])) errors.push("style_rules.optional must be an array.");

for (const rule of mustRules) {
  const normalizedRule = typeof rule === "string" ? rule : rule?.rule;
  const item = evidence[normalizedRule];
  if (!normalizedRule) {
    errors.push("style_rules.must contains an empty rule.");
    continue;
  }
  if (!item) {
    errors.push(`Missing rule_evidence for must rule: ${normalizedRule}`);
    continue;
  }
  if (Number(item.support_count || 0) < 2) {
    errors.push(`Must rule support_count is below 2: ${normalizedRule}`);
  }
  if (String(item.confidence || "low").toLowerCase() === "low") {
    errors.push(`Must rule confidence cannot be low: ${normalizedRule}`);
  }
  if (!Array.isArray(item.support_doc_ids) || item.support_doc_ids.length < 2) {
    errors.push(`Must rule needs at least two support_doc_ids: ${normalizedRule}`);
  }
}

const testReport = data.test_report || data.qualityReport?.test_report || {};
const overall = testReport.overall_result || {};
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


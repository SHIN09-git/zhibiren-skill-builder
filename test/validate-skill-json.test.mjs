import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const validator = fileURLToPath(new URL("../skills/zhibiren-skill-builder/scripts/validate-skill-json.mjs", import.meta.url));
const example = JSON.parse(readFileSync(new URL("../examples/minimal-output/skill.json", import.meta.url), "utf8"));

function validate(data) {
  const directory = mkdtempSync(join(tmpdir(), "zhibiren-validation-"));
  try {
    const file = join(directory, "skill.json");
    writeFileSync(file, JSON.stringify(data));
    return spawnSync(process.execPath, [validator, file], { encoding: "utf8" });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("the documented example passes", () => {
  assert.equal(validate(example).status, 0);
});

for (const [name, mutate, message] of [
  ["must rules must be an array", data => { data.style_rules.must = "unverified rule"; }, /style_rules.must/],
  ["rule collections cannot be null", data => { data.style_rules.recommended = null; }, /style_rules.recommended/],
  ["confidence must be medium or high", data => { Object.values(data.rule_evidence)[0].confidence = "unknown"; }, /confidence/],
  ["support count must be a number", data => { Object.values(data.rule_evidence)[0].support_count = "unknown"; }, /support_count/],
  ["two copies of one document are not two sources", data => { Object.values(data.rule_evidence)[0].support_doc_ids = ["doc_001", "doc_001"]; }, /support_doc_ids/],
  ["blank document IDs cannot establish support", data => { Object.values(data.rule_evidence)[0].support_doc_ids = ["doc_001", "  "]; }, /support_doc_ids/],
  ["risk counts cannot be nonnumeric", data => { data.test_report.overall_result.privacy_leak_count = "unknown"; }, /privacy_leak_count/],
  ["reported risk must block saving", data => { data.test_report.overall_result.fabrication_risk_count = 1; }, /save_allowed/],
]) {
  test(name, () => {
    const data = structuredClone(example);
    mutate(data);
    const result = validate(data);
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
  });
}

test("null is rejected with a validation message", () => {
  const result = validate(null);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /JSON root must be an object/);
  assert.doesNotMatch(result.stderr, /TypeError/);
});

test("an explicitly blocked report remains valid", () => {
  const data = structuredClone(example);
  data.test_report.overall_result.privacy_leak_count = 1;
  data.test_report.overall_result.save_allowed = false;
  assert.equal(validate(data).status, 0);
});

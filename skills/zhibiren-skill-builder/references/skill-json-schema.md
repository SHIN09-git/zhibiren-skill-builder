# skill.json 结构约定

这是轻量结构约定，不要求引入大型 JSON Schema 依赖。

## 顶层字段

```json
{
  "skillName": "学校通知执笔人",
  "handle": "学校通知执笔人",
  "description": "用于生成校内通知类事务文档。",
  "applicableScopes": [],
  "userInputFields": [],
  "documentStructureTemplate": [],
  "style_rules": {
    "must": [],
    "recommended": [],
    "optional": []
  },
  "rule_evidence": {},
  "common_expression_library": [],
  "scenario_variants": [],
  "forbidden": [],
  "privacy_filters": [],
  "case_specific_exclusions": [],
  "generation_steps": [],
  "self_checklist": [],
  "mixed_sample_warning": false,
  "aggregation_policy": "",
  "feedback_classification": {
    "global_skill_rules": [],
    "current_task_only_facts": [],
    "forbidden_or_negative_preferences": []
  },
  "test_report": {
    "test_cases": [],
    "overall_result": {
      "passed": true,
      "score": 0,
      "must_rule_miss_count": 0,
      "privacy_leak_count": 0,
      "case_specific_leak_count": 0,
      "fabrication_risk_count": 0,
      "save_allowed": true
    }
  }
}
```

## 强规则证据

`style_rules.must` 可以是字符串数组，但每条必须在 `rule_evidence` 中有对应证据：

```json
{
  "rule_evidence": {
    "正文应采用分条列项方式展开。": {
      "support_count": 3,
      "support_doc_ids": ["doc_001", "doc_002", "doc_004"],
      "scope": "document_type",
      "confidence": "high"
    }
  }
}
```

证据要求：

- `support_count` 必须是至少为 2 的整数
- `confidence` 为 `medium` 或 `high`
- `support_doc_ids` 至少包含 2 个不同的非空文档 ID
- `scope` 可为 `all`、`document_type`、`scenario`、`section`

## 禁止进入强规则的内容

- 具体人名
- 具体时间
- 具体地点
- 具体活动名称
- 临时安排
- 一次性政策
- 单篇样本才出现的表达
- 用户反馈中的本次事实

## 测试门禁

`test_report.overall_result.save_allowed` 为 `false` 时，不应保存为正式执笔人。

计数必须是非负整数，不能用字符串、负数或空值绕过门禁。

以下任一计数大于 0 时必须拦截：

- `privacy_leak_count`
- `case_specific_leak_count`
- `fabrication_risk_count`


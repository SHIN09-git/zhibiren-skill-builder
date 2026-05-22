# 执笔人生成器 Skill

`zhibiren-skill-builder` 是从「摹文拟笔工作台」中拆出的可独立开源技能，用于把多篇同类中文事务文档提炼为可复用、可编辑、可测试的「执笔人」。

它适合生成学校通知、工作总结、活动方案、会议纪要、请示报告等稳定文种的写作规则，但不会照抄样本文档，也不会把单篇样本里的偶然写法升级成长期规则。

## 核心能力

- 单篇样本分析：提取结构、文风、句式、变量槽位、隐私与个案信息。
- 多篇样本聚合：只把多篇共同验证过的规则提升为强规则。
- 混样本警告：样本跨文种或场景差异明显时，只提炼通用文风，不生成跨文种强结构。
- 反馈隔离：区分长期规则、本次事实和负面偏好，避免单次反馈污染长期执笔人。
- 三类测试：正常生成、缺失事实、泄漏诱导，拦截隐私泄漏、个案复用和事实编造。
- 运行时优先级：用户本次事实优先于执笔人规则；缺失事实使用【可替换占位符】。
- JSON 容错：关键模型输出需要解析、校验和最多 2 次修复，失败时停止链路。

## 安装

把技能目录复制到你的 Codex skills 目录：

```bash
cp -r skills/zhibiren-skill-builder "$CODEX_HOME/skills/"
```

Windows PowerShell 示例：

```powershell
Copy-Item -Recurse .\skills\zhibiren-skill-builder "$env:CODEX_HOME\skills\zhibiren-skill-builder"
```

安装后，在 Codex 中可以这样使用：

```text
使用 zhibiren-skill-builder，把这 5 篇学校通知提炼成一个执笔人，并输出 Skill说明.md 和 skill.json。
```

## 输出文件

典型输出包括：

- `Skill说明.md`：给人看的说明，便于文员、编辑或团队负责人修改。
- `skill.json`：给程序调用的结构化规则。
- `quality_report.json`：可选质量报告，记录规则命中、泄漏风险、编造风险和保存门禁。

## 仓库结构

```text
skills/zhibiren-skill-builder/
  SKILL.md
  agents/openai.yaml
  references/
    workflow.md
    prompt-library.md
    skill-json-schema.md
  scripts/
    validate-skill-json.mjs
examples/minimal-output/
  Skill说明.md
  skill.json
```

## 校验示例

```bash
npm run check
```

该命令会校验示例 `skill.json` 的核心字段、强规则证据门槛和测试门禁。

## 开源协议

MIT License。


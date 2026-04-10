# Synaptic Content Guide

## Directory Structure

```
content/
├── graph/
│   ├── nodes.json          ← skill definitions
│   ├── edges.json          ← prerequisite links
│   └── meta.json
├── questions/
│   ├── diagnostic/questions.json  ← 12 placement questions
│   └── by-skill/{skill_id}.json   ← one file per skill
├── explanations/
│   └── {skill_id}/{beginner,mid,advanced}.json
└── templates/
    ├── question_file.json
    └── explanation_file.json
```

## Adding Questions

1. Copy `content/templates/question_file.json`
2. Rename to `content/questions/by-skill/{skill_id}.json`
3. Add question IDs to the skill's `question_ids` array in `nodes.json`
4. Run `npm run validate` — must show 0 errors

### Minimum per skill file

| Tier | Format | Count |
|------|--------|-------|
| `same` | `mcq` | 1 required |
| `harder` | `mcq` | 1 required |
| `review` | `fill` | 1 required |

## Adding Explanations

1. Create directory: `content/explanations/{skill_id}/`
2. Add `beginner.json`, `mid.json`, `advanced.json`
3. Copy template from `content/templates/explanation_file.json`

### Depth Guide

- **beginner**: Use analogies. No jargon. Code examples 5–10 lines max.
- **mid**: Technical terminology. Real ML patterns. Code 10–30 lines.
- **advanced**: Production concerns. Performance. Research connections. Real tools/papers.

## Rules

```
✗ NEVER delete nodes from nodes.json → set "deprecated": true
✓ ALWAYS sync question_ids in nodes.json when adding question files
✓ ALWAYS run npm run validate after changes
```

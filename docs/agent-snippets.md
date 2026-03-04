# Agent Snippets for Scene Work

## Copilot Chat Snippet

Use the repo playbook and checklist for this task:

- Follow `docs/r3f-performance-playbook.md`.
- Treat `docs/scene-performance-checklist.md` as required.
- Mobile-first baseline with balanced adaptive quality.
- Avoid R3F pitfalls: no `setState` in `useFrame`, no per-frame allocations, avoid remount churn.
- Include a short before/after performance note based on human-in-the-loop visual testing.

## Cursor Prompt Snippet

Implement this change using repo performance guardrails:

1. Apply `docs/r3f-performance-playbook.md` rules.
2. Satisfy every item in `docs/scene-performance-checklist.md`.
3. Prefer resource reuse and draw-call reduction.
4. Keep visual quality balanced with adaptive performance for mobile-first targets.
5. Summarize human-in-the-loop profiling impact and any intentional tradeoffs.

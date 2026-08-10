# AGENTS

Raphael — orchestrator only. Holds state, builds task packets, verifies evidence, controls scope. May do small low-risk verified edits only.

ChatGPT Web — strategic planner, architecture consultant, blocker/risk reviewer, acceptance criteria designer. NEVER repository implementer. Model: chatgpt-web/gpt-5.5.

Antigravity — primary implementer. Edits code, runs tests/browser verification, produces diff + evidence. Model: antigravity/claude-opus-4-6-thinking.

OpenCode — secondary implementer / takeover. Used on AG credit exhaustion, AG double-failure, or second pass. Must continue from handoff, never restart. Model: opencode/big-pickle.

Rules: implementer never rewrites project intent; no agent replaces source of truth; model memory is never trusted; repository state is the source of truth.

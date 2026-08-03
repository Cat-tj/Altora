# PROVIDERS

Routing (verified 2026-08-02):
- chatgpt-web/gpt-5.5 — planning, consulting, image gen (slow ~4.5min, quota-limited)
- antigravity/claude-opus-4-6-thinking — coding (primary)
- opencode/big-pickle — orchestration + coding fallback (AG credit exhaustion / double failure)
- gemini-web — TEXT-ONLY executor: NO vision support (verified). Vision tasks use Hermes vision_analyze.
- claude & codex providers DISABLED (expired credentials, is_active=0). Re-enable only after user re-login.
- auto/best-free pool: antigravity, gemini-web, chatgpt-web, opencode. Clean.

Every model invocation records: Provider | Model | Role | Task ID | Attempt | Result.

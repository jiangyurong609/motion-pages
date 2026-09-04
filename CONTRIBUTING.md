# Contributing

The repo is one skill plus the demos that prove it. Two kinds of contribution fit
naturally:

## Fix or sharpen a recipe

`motion-pages/SKILL.md` is the product. If a recipe led your agent somewhere wrong
(a trap we didn't document, a headless rendering surprise, a mobile breakpoint that
broke), open an issue with the prompt you used and what came out — or PR the fix
straight into the relevant SKILL.md section. Root `SKILL.md` and
`motion-pages/SKILL.md` are the same file in two places; change both (CI diffs them).

## Add an archetype

A new archetype ships as a set — PRs missing a piece will be asked for it:

1. **A recipe section in `SKILL.md`** — not a tutorial: the layer stack, the
   parameter ranges that look right, and above all the traps (what silently breaks
   under SwiftShader, on phones, in still mode).
2. **A bundled example** in `motion-pages/examples/` — one self-contained HTML file,
   no build step, vendored deps only (see `examples/vendor/`). It must support
   `?still` (deterministic frame for screenshots) and any state only user input can
   reach needs a forcing query param (`?p=0.5`, `?focus=40` style).
3. **A build-spec prompt** in `docs/prompts/` — the full pinned spec (palette,
   geometry params, timings, responsive rules, self-verify recipe), not a one-liner.
4. **A passing audit**: `node scripts/audit.mjs motion-pages/examples/your-page.html`
   — zero blockers at all three viewports. CI runs this on every example.

Fictional brands only (like Fernline / SONA / Archive° / BOREAL) — never a real
company's name or assets, and studies of real sites must be original code, original
copy, original art.

## Ground rules

- Single HTML file per example; text lives in DOM, never in 3D.
- No new runtime dependencies. The audit stays zero-dep (Node ≥ 22 + Chrome).
- Run the multi-viewport screenshot loop before opening the PR — the skill's own
  standard applies to the repo.

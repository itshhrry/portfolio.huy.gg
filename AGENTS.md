# AGENTS.md

The portfolio site at huy.gg: static HTML, CSS, and JavaScript served by GitHub Pages from this repository (`CNAME`, `_config.yml`). The repository is public.

## Sources of truth

- `DESIGN.md` wins on any visual question and `PRODUCT.md` on any strategic one. Read the one that applies before changing a page.
- Copy follows `~/.claude/WRITING_STYLE.md` in full, including the recruiter-cliché pass.

## Layout

- Pages are the top-level `.html` files (`index`, `about`, `projects`, `resume`, `dashboard`, `codemap`, `claude-analytics`, `above-and-beyond`).
- `css/ink.css` is the one stylesheet; `js/` holds page scripts; `img/` holds images; `sphere/` holds the Sphere views.
- `_config.yml` excludes `PRODUCT.md`, `.impeccable`, and `build-static.py` from the published site.

## Rules

- Nothing private goes in a commit: the repository is public, so no vault paths, machine names, secrets, or personal data beyond what the site already shows.
- Check a change in a browser render before reporting it done.
- Commit subjects follow `type: what changed` from the twelve types in `~/.claude/CLAUDE.md`, with no scope.

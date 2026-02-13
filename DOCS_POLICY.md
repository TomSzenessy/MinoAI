# Docs Policy

This repository now has two active documentation tracks.

## What Goes Where

- `/docs` is the internal blueprint track.
- `/docs-site` is the public documentation track (deployment, API, operator runbooks).

Use `/docs` for:

- architecture decisions
- design system rules
- product model and long-range roadmap

Use `/docs-site` for:

- setup and deployment guides
- linking/auth runbooks
- API endpoint docs
- troubleshooting and integration references

## Contribution Rules

- If a change affects strategy/architecture, update `/docs`.
- If a change affects setup/integration/public usage, update `/docs-site`.
- If both are affected, update both in the same PR.

## PR Checklist

- [ ] I updated `/docs` for blueprint-level changes (if relevant).
- [ ] I updated `/docs-site` for public/operator/API changes (if relevant).
- [ ] I verified links and paths do not reference removed `docstart` files.

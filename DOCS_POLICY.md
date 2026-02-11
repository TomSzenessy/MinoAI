# Docs Policy

This repository has two documentation tracks.

## What Goes Where

- `/docs` is the blueprint track.
- `/docstart` is the implementation and usage track.

Use `/docs` for:
- architecture decisions
- design system rules
- product model, security model, long-term roadmap

Use `/docstart` for:
- Portainer setup guides
- linking/auth runbooks
- local build instructions
- troubleshooting and integration references

## Section Mapping (`MASTER_PLAN.md` -> `/docs`)

- Product overview and hosting model -> `docs/README.md`
- Design system and visual language -> `docs/design-system.md`
- Architecture, deployment, CI/CD -> `docs/architecture.md`
- Server and API model -> `docs/server.md`
- Web/mobile interfaces -> `docs/frontend.md`
- AI agent model -> `docs/ai-agent.md`
- Security posture -> `docs/security.md`
- Phasing and delivery plan -> `docs/roadmap.md`

## Contribution Rules

- If a change affects strategy/architecture, update `/docs`.
- If a change affects setup/integration steps, update `/docstart`.
- If both are affected, update both in the same PR.

## Transition Rule for `MASTER_PLAN.md`

- `MASTER_PLAN.md` remains transitional while this frontend phase is being completed.
- After frontend MVP parity is confirmed in `/docs`, remove `MASTER_PLAN.md` in a dedicated cleanup PR.

## PR Checklist

- [ ] I updated `/docs` for blueprint-level changes.
- [ ] I updated `/docstart` for operator/integrator changes.
- [ ] I kept `/docs` and `/docstart` responsibilities separate.
- [ ] I checked section-level parity with `MASTER_PLAN.md` when relevant.

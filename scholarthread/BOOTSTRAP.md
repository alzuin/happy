# ScholarThread bootstrap plan

Handoff doc for the new chat session that will work from this directory.

## Context

ScholarThread is a spin-off of Actora (`~/Development/actora/`, hosted on GitLab `actora-ea`). Same founder, same shared AWS infrastructure (EKS, Neo4j, Cloudflare Tunnel apps, S3), but hosted entirely on GitHub from day one. The double-hosting period is also the testbed for a possible future migration of Actora itself to GitHub.

## What already exists

- GitHub org `scholarthread` (Free plan)
- Project board: https://github.com/orgs/scholarthread/projects/1
- Three private repos, cloned into this directory:
  - `scholarthread-api` — backend service
  - `scholarthread-web` — frontend
  - `scholarthread-gitops` — Flux manifests
- Repo defaults applied: squash-merge only, delete branch on merge, no wiki, no repo-level Projects (org Project is canonical), issues enabled
- All three repos linked to the Project board
- **Deferred:** branch protection / rulesets (Free org private repos can't have them — needs Team plan @ $4/mo)
- **Pending one-click UI:** 2FA enforcement at https://github.com/organizations/scholarthread/settings/security

## Shared-infra plan

| Concern | Actora (GitLab) | ScholarThread (GitHub) |
|---|---|---|
| Container images | `registry.gitlab.com/actora-ea/...` | `ghcr.io/scholarthread/...` |
| Flux source | `gitlab.com/actora-ea/gitops` | `github.com/scholarthread/scholarthread-gitops` |
| K8s namespace (prod) | `production-actora-apps` | `production-scholarthread-apps` |
| Neo4j DB | default DB on shared EC2, Community Edition | **AuraDB Free** (separate Neo4j SaaS instance — Community doesn't support multi-DB, so reusing the EC2 isn't an option without an Enterprise upgrade). Graduate to AuraDB Pro or a second EC2 when ScholarThread outgrows Free (200k nodes / 400k relationships cap). |
| CI runner pool | `gitlab-runner` HelmRelease | (later) Actions Runner Controller; GH-hosted is fine for hello-world |
| Verify-after-deploy | GitLab cluster agent (KAS) | in-cluster ARC runner w/ ServiceAccount |

Tofu refactor needed in `actora-aws-infrastructure/modules/flux/`: scalar `container_registry_username` / `_password` (`variables.tf:82-89`) must widen to `map(object({username, password}))` keyed by registry host so both `registry.gitlab.com` and `ghcr.io` land in one `dockerconfigjson`. The `locals.registry_hosts` loop at `main.tf:1-15` already iterates per-host.

## Next steps (this chat)

### 1. Bootstrap `scholarthread-gitops` skeleton

Mirror Actora's layout:

```
scholarthread-gitops/
  README.md
  clusters/
    production/
      kustomization.yaml          # lists each overlay under apps/*/overlays/production
  apps/
    hello-world/
      base/
        deployment.yaml
        service.yaml
        kustomization.yaml
      overlays/
        production/
          kustomization.yaml      # namespace + image pin w/ $imagepolicy annotation
          patches-image-pull-secret.yaml
```

The `kustomization.yaml` `images:` block + `# {"$imagepolicy": "flux-system:...:tag"}` annotation must follow the exact Actora pattern so Flux's ImageUpdateAutomation Setter strategy works identically.

### 2. Hello-world service in `scholarthread-api`

Smallest possible thing — a single-route FastAPI app or even `python -m http.server`. Goal is to prove the loop, not to be useful.

- Dockerfile (multi-arch capable)
- `.github/workflows/build.yml`:
  - Trigger: push to `main`
  - Steps: log in to GHCR (uses `GITHUB_TOKEN`), `docker/build-push-action` for `linux/amd64` only (skip arm64 for hello-world; add when we move to ARC)
  - Tag format: **must match** `^production-[0-9]{14}-[0-9a-f]{8}$` so Flux's existing ImagePolicy regex in `actora-aws-infrastructure/modules/flux/main.tf:273` works unchanged
  - Push to `ghcr.io/scholarthread/scholarthread-api:production-<ts>-<sha>`
- GHCR package visibility: set to private; grant the `scholarthread-gitops` Flux pull credentials access

### 3. What's NOT in scope for this chat

- ARC runner (GH-hosted runners are free for public repos / 2000 min/mo on Free org for private — enough for hello-world)
- Real product code or schema design
- DNS / Ingress (verify via `kubectl port-forward`)
- Tofu changes — those are a separate chat in `~/Development/actora/`
- Actual cluster reconciliation — that requires the tofu changes first; for now we just push files that *would* deploy

## Pointers back to Actora (templates to mirror)

| What | Path |
|---|---|
| Cluster kustomization | `~/Development/actora/actora-gitops/clusters/production/kustomization.yaml` |
| App overlay (canonical example) | `~/Development/actora/actora-gitops/apps/actora-graph-api/overlays/production/kustomization.yaml` |
| Image-pull-secret patch | `~/Development/actora/actora-gitops/apps/actora-graph-api/overlays/production/patches-image-pull-secret.yaml` |
| Deployment base | `~/Development/actora/actora-gitops/apps/actora-graph-api/base/deployment.yaml` |
| Flux Terraform module | `~/Development/actora/actora-aws-infrastructure/modules/flux/main.tf` |
| Image-tag regex | `actora-aws-infrastructure/modules/flux/main.tf:273` |

## Exit ramps (why none of this locks you in)

1. ScholarThread succeeds → migrate to its own AWS account / EKS later
2. GitHub feels wrong → fold ScholarThread back into GitLab; throw away the gitops repo, keep the code
3. GitHub feels great → migrate Actora over too (this exercise pre-validated GHA + GHCR + Flux end-to-end)

# OpsPilot API Contract (v1)

All endpoints are JSON under `/api`. Session is an httpOnly, `SameSite=Strict` cookie named `op_session`.

**CSRF rule:** every non-GET request MUST send header `X-OpsPilot: 1` (otherwise `403 csrf`).

**Errors:** `{"error": {"code": "string", "message": "human readable", "details": [...]?}}` with proper status
(400 validation, 401 unauthenticated, 403 forbidden/csrf, 404 not_found, 409 conflict, 413 too_large, 415, 429 rate_limited, 500).

**Roles:** `owner` > `admin` > `member` > `viewer`. Viewers are read-only. Only owner/admin manage team, integrations, environments.

## Auth
| Method | Path | Body | Response |
|---|---|---|---|
| POST | /api/auth/signup | `{name, email, password(min 10), orgName}` | `201 {user, org}` + cookie |
| POST | /api/auth/login | `{email, password}` | `200 {user, org}` + cookie |
| POST | /api/auth/logout | – | `204` |
| GET | /api/auth/me | – | `{user:{id,name,email,role}, org:{id,name,plan}}` |

## Overview (home)
`GET /api/overview` →
```json
{ "health": {"score": 0-100, "status": "healthy|degraded|down", "summary": "plain English"},
  "counts": {"apps": 0, "environments": 0, "integrations": 0, "runsActive": 0, "openIncidents": 0},
  "recentRuns": [Run], "openIncidents": [Incident], "monthlyCost": 0, "nextSteps": [{"title","description","route"}] }
```

## Integrations (Jenkins, Git, Maven, npm, Docker, Kubernetes, Terraform, ...)
- `GET /api/integrations/catalog` → `[{type, name, category, description, icon, fields:[{key,label,type:"text|url|secret|select", required, options?, help, placeholder?}]}]`
  categories: `source-control | ci-cd | build | package-registry | containers | orchestration | iac | config-mgmt | testing | security | observability | notifications | secrets`
- `GET /api/integrations` → `[{id, type, name, category, status:"connected|error|untested", config:{...secrets masked as "••••1234"}, createdAt, lastCheckedAt, lastMessage}]`
- `POST /api/integrations` `{type, name, config}` → `201 Integration`
- `POST /api/integrations/:id/test` → `{ok, message, checks:[{name, ok, detail}]}`
- `DELETE /api/integrations/:id` → `204`

## Environments (cloud / on-prem / hybrid)
- `GET /api/environments` → `[Environment]`
- `POST /api/environments` `{name, tier:"development|staging|production", hosting:"cloud|on-prem|hybrid", provider:"aws|gcp|azure|digitalocean|vmware|openstack|bare-metal", region, runtime:"kubernetes|docker|vm", size:"small|medium|large", nodes:1-100}` → `201 Environment`
  Environment adds: `{id, status:"healthy|degraded|down|provisioning", monthlyCost, createdAt}`
  `hybrid` requires `onPremProvider` (vmware|openstack|bare-metal) in addition to `provider` (cloud).
- `GET /api/environments/:id`, `DELETE /api/environments/:id` (409 if apps still deployed there)

## Apps (the "projects" a non-technical user sets up via wizard)
- `GET /api/apps` → `[App]`
- `POST /api/apps` `{name, language:"java|node|python|go|dotnet|static", buildTool:"maven|gradle|npm|yarn|pnpm|pip|poetry|go|dotnet|none", repoUrl, branch?, ciProvider:"jenkins|github-actions|gitlab-ci", strategy:"rolling|blue-green|canary", port, healthPath?, environmentIds:[id]}` → `201 App`
  App adds `{id, slug, currentVersions:{[envId]: "v12"}, createdAt}`
- `GET /api/apps/:id`, `DELETE /api/apps/:id`
- `GET /api/apps/:id/blueprint` → `{files:[{path, language, title, explanation, content}], policy:{score, passed, findings:[{id, severity:"critical|high|medium|low", file, message, fix}]}}`
  files: Dockerfile, .dockerignore, Jenkinsfile|.github/workflows/deploy.yml|.gitlab-ci.yml, k8s/*.yaml, terraform/*.tf, ansible/playbook.yml (on-prem/hybrid), monitoring/alerts.yml, docker-compose.yml

## Pipelines (runs)
- `POST /api/apps/:id/runs` `{environmentId, version?}` → `202 Run`
- `GET /api/runs?appId=&limit=` → `[Run]` newest first
- `GET /api/runs/:id` → Run
- `POST /api/runs/:id/cancel` → Run
- `POST /api/apps/:id/rollback` `{environmentId}` → `202 Run` (redeploys previous successful version)
- `GET /api/runs/:id/events` → `text/event-stream`; events: `snapshot` (full Run), `stage` ({index, stage}), `log` ({index, line}), `done` (full Run)

Run: `{id, appId, appName, environmentId, environmentName, version, kind:"deploy|rollback", status:"queued|running|succeeded|failed|cancelled|rolled_back", trigger, createdAt, startedAt, finishedAt, durationMs, stages:[{key, label, plainLabel, status:"pending|running|passed|failed|skipped", startedAt, finishedAt, logs:[{ts, level:"info|warn|error", msg}]}], summary}`
Stage keys: `checkout, build, unit-tests, integration-tests, security-scan, package, deploy, verify`.

## Reliability (SRE)
- `GET /api/slos` → `[{id, appId, appName, name, indicator:"availability|latency", target, windowDays, current, errorBudgetRemaining(0-1), burnRate, status:"ok|at_risk|breached"}]`
- `POST /api/slos` `{appId, name, indicator, target, windowDays, latencyThresholdMs?}`
- `DELETE /api/slos/:id`
- `GET /api/incidents?status=open|resolved` → `[{id, appId, environmentId, title, severity:"sev1|sev2|sev3", status:"open|mitigated|resolved", detectedAt, resolvedAt, timeline:[{ts, msg}], playbook, plainSummary}]`
- `POST /api/incidents/:id/resolve`
- `GET /api/playbooks` → `[{id, name, trigger, action, enabled, description}]`; `PATCH /api/playbooks/:id` `{enabled}`
- `POST /api/chaos` `{appId, environmentId, scenario:"cpu-spike|memory-leak|bad-deploy|node-failure|cert-expiry"}` → `{incident}` (self-healing playbook runs automatically if enabled)
- `POST /api/telemetry` `{appId, environmentId, requests, errors, p95Ms}` – ingest metrics sample.

## Costs
`GET /api/costs` → `{monthlyTotal, currency:"USD", byEnvironment:[{environmentId, name, hosting, provider, monthlyCost, breakdown:[{item, cost}]}], recommendations:[{id, title, description, monthlySavings, environmentId}]}`

## Security
`GET /api/security` → `{score, grade:"A-F", findings:[{id, severity, source, appId?, environmentId?, message, fix}]}`

## Team & audit
- `GET /api/team` → `[{id, name, email, role, createdAt}]`
- `POST /api/team` `{name, email, role, password}` (owner/admin) → `201`
- `PATCH /api/team/:id` `{role}`; `DELETE /api/team/:id` (cannot remove last owner / yourself)
- `GET /api/audit?limit=` → `[{id, ts, actor, action, target, details}]`

## Assistant (plain-English helper)
`POST /api/assistant` `{message}` → `{reply, actions:[{label, route}]}`

## Ops endpoints
`GET /healthz` → `{status:"ok"}`; `GET /metrics` → Prometheus text format.

## Additions (v1.1)
- `POST /api/security/scan` `{kind:"dockerfile|kubernetes", content}` (content ≤ 200 KB) → `{score, passed, findings:[{id, severity, line?, message, fix}]}` — "Check my config" for users who paste an existing Dockerfile / Kubernetes YAML.
- SLO objects may carry `noData: true` and `current: null` when no telemetry has arrived yet; treat as "Waiting for data".
- `GET /api/environments/:id` also returns `apps:[{id,name,version}]` deployed there.

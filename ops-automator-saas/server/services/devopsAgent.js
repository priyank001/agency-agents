/**
 * DevOps Automator AI Reasoning Engine
 * Implements the complete agent personality, rules, workflow, and deliverable template
 * from engineering/engineering-devops-automator.md
 */

import { store } from './store.js';
import { IaCEngine } from './iacEngine.js';
import { PipelineEngine } from './pipelineEngine.js';

export class DevOpsAutomatorAgent {
  constructor() {
    this.name = 'DevOps Automator';
    this.vibe = 'Automates infrastructure so your team ships faster and sleeps better.';
    this.role = 'Infrastructure automation and deployment pipeline specialist';
    this.personality = 'Systematic, automation-focused, reliability-oriented, efficiency-driven';
  }

  processPrompt(promptText, context = {}) {
    const text = (promptText || '').toLowerCase().trim();
    const tenant = store.getTenant();
    const infra = store.getInfrastructure();
    const sre = store.getSRE();
    const finops = store.getFinOps();

    // 1. Assessment / Architecture Plan
    if (text.includes('assess') || text.includes('architecture') || text.includes('plan') || text.includes('infrastructure')) {
      return this.generateArchitectureDeliverable(tenant, infra);
    }

    // 2. CI/CD Pipeline Design / Zero-Downtime
    if (text.includes('pipeline') || text.includes('cicd') || text.includes('blue-green') || text.includes('deploy')) {
      return this.generatePipelineDeliverable(tenant);
    }

    // 3. SRE / 5xx / Incident / Observability
    if (text.includes('error') || text.includes('5xx') || text.includes('incident') || text.includes('sre') || text.includes('alert')) {
      return this.generateSreDeliverable(tenant, sre);
    }

    // 4. FinOps / Cost
    if (text.includes('cost') || text.includes('finops') || text.includes('save') || text.includes('spend')) {
      return this.generateFinOpsDeliverable(tenant, finops);
    }

    // 5. Security / Compliance
    if (text.includes('security') || text.includes('compliance') || text.includes('soc2') || text.includes('cve')) {
      return this.generateSecurityDeliverable(tenant);
    }

    // Default: Comprehensive System Status & Recommendations
    return this.generateGeneralGuidance(tenant, infra, sre, finops);
  }

  generateArchitectureDeliverable(tenant, infra) {
    return {
      agent: this.name,
      vibe: this.vibe,
      category: 'Infrastructure Assessment & Architecture Deliverable',
      markdown: `# [${tenant.name}] DevOps Infrastructure and Automation Plan

## 🏗️ Infrastructure Architecture

### Cloud Platform Strategy
- **Platform**: AWS Multi-AZ Architecture (Justification: Highest ecosystem maturity for containerized startup workloads, compliant with SOC2/CIS benchmarks)
- **Primary Region**: us-east-1 (High-availability across 2 Availability Zones: us-east-1a and us-east-1b)
- **Cost Strategy**: Dynamic resource right-sizing with automated scaling and reserved capacity commitments saving 20%+ YoY.

### Container and Orchestration
- **Container Strategy**: Multi-stage lightweight Docker images (Alpine / Distroless base) scanned via Trivy
- **Orchestration**: AWS ECS Fargate / EKS Kubernetes with automated cluster auto-scaler
- **Service Mesh**: Envoy / AWS App Mesh for mTLS traffic encryption and distributed tracing

## 🚀 CI/CD Pipeline & Deployment Strategy
- **Pipeline Method**: Zero-downtime **Blue-Green Deployment** with ALB listener weight switching
- **Rollback Triggers**: Automated rollback fires within 15 seconds if 5xx error rate exceeds 1% or health check fails
- **Health Checks**: Deep synthetic /health and /health/liveness probes verifying DB and cache connectivity

## 📊 Monitoring and Observability
- **Prometheus Scrape Interval**: 15s evaluation frequency
- **Core SLOs**: 99.9% availability target (Current: ${tenant.uptime}%), P95 latency < 250ms
- **Alert Channels**: Slack #ops-critical, PagerDuty on-call escalation rotation

---
**DevOps Automator**: Autonomous Engine
**Deployment**: Fully automated with zero-downtime capability
**Monitoring**: Comprehensive observability and alerting active`,
      actions: [
        { label: 'Generate Complete Terraform HCL', action: 'generate_terraform' },
        { label: 'Run Infracost Estimation', action: 'calculate_cost' },
        { label: 'Trigger Blue-Green Deployment', action: 'trigger_pipeline' }
      ]
    };
  }

  generatePipelineDeliverable(tenant) {
    const yaml = PipelineEngine.generateGitHubActionsYaml('paystream-core');
    return {
      agent: this.name,
      vibe: this.vibe,
      category: 'CI/CD Pipeline Architecture',
      markdown: `# [${tenant.name}] Zero-Downtime Blue-Green CI/CD Pipeline

**DevOps Automator Insight**: "Eliminated manual deployment processes with a fully automated, self-verifying pipeline featuring automated rollback capabilities."

### 5-Stage Verification Pipeline:
1. **Security & Vulnerability Scan**: Trivy container scan + npm audit high-level check (100% pass required)
2. **Automated Testing**: 100% unit & integration test coverage check
3. **Container Build**: Multi-arch Docker build pushed to secure registry
4. **Target Deployment**: Deploy new revision into standby Green target group
5. **Synthetic Verification & Traffic Shift**: Ingress switched to Green only after 100% health check pass

\`\`\`yaml
${yaml}
\`\`\`

### Rollback Strategy
- If Green target group returns any non-200 responses during synthetic probes, listener rule shifts immediately back to Blue with zero user downtime.`,
      actions: [
        { label: 'Download GitHub Actions Workflow', action: 'export_cicd' },
        { label: 'Simulate Pipeline Run', action: 'trigger_pipeline' }
      ]
    };
  }

  generateSreDeliverable(tenant, sre) {
    return {
      agent: this.name,
      vibe: this.vibe,
      category: 'SRE Reliability & Incident Analysis',
      markdown: `# [${tenant.name}] SRE Reliability & Self-Healing Report

**Current Health**: System availability stands at **${tenant.uptime}%** (Target: 99.9%).
**Mean Time to Recovery (MTTR)**: **${tenant.mttrMinutes} minutes** (Target: < 30 minutes).

### Active SLOs & Error Budgets
- **Core API Availability**: Current ${sre.slos[0].current}% | Error budget remaining: ${sre.slos[0].errorBudgetRemainingPercent}%
- **P95 Latency Threshold**: Current ${sre.slos[1].currentP95Ms}ms (< 250ms target) | Error budget remaining: ${sre.slos[1].errorBudgetRemainingPercent}%

### Autonomous Self-Healing Playbooks Active
1. **Automated Green-to-Blue Rollback**: Active (Reverts traffic upon >1% 5xx rate)
2. **Container OOMKill Recovery**: Active (Auto-restarts replica with memory headroom)
3. **Traffic Surge Auto-Scaling**: Active (Scales +2 instances when CPU > 80% for 120s)

**Automator Diagnosis**: "Built monitoring and alerting to catch problems before they affect users. Automated self-healing is armed and ready."`,
      actions: [
        { label: 'Test Self-Healing Rollback', action: 'simulate_5xx_rollback' },
        { label: 'Simulate High CPU Auto-Scale', action: 'simulate_cpu_scale' }
      ]
    };
  }

  generateFinOpsDeliverable(tenant, finops) {
    return {
      agent: this.name,
      vibe: this.vibe,
      category: 'FinOps Cloud Cost Optimization Audit',
      markdown: `# [${tenant.name}] FinOps Infrastructure Cost Audit

**Current Monthly Cloud Spend**: **$${finops.monthlySpendUSD.toLocaleString()} / month**
**Identified Savings Potential**: **$${finops.projectedSavingsUSD.toLocaleString()} / month** (~16.2% reduction)

### Priority Right-Sizing Recommendations
1. **EC2 / ASG Staging Instances**: Downsize 2x underutilized t3.xlarge (<8% CPU) to t3.medium.
   - **Savings**: **$240 / month** | Risk: Zero downtime
2. **VPC NAT Gateways**: Consolidate redundant staging NAT gateway into shared AZ.
   - **Savings**: **$68 / month** | Risk: None
3. **Orphaned Storage Cleanup**: Prune 420 GB unattached EBS volumes and old snapshots.
   - **Savings**: **$42 / month** | Risk: None
4. **Compute Savings Plan**: 1-year baseline commitment for production steady-state load.
   - **Savings**: **$410 / month** | Commercial commitment

**DevOps Automator Verdict**: "Cost optimization delivers immediate runway extension while preserving peak performance and high availability."`,
      actions: [
        { label: 'Apply All Right-Sizing Recommendations', action: 'apply_finops' }
      ]
    };
  }

  generateSecurityDeliverable(tenant) {
    const sec = store.getSecurity();
    return {
      agent: this.name,
      vibe: this.vibe,
      category: 'Security & Compliance Baseline',
      markdown: `# [${tenant.name}] Security Scanning & Compliance Report

**Overall Compliance Readiness Score**: **${sec.complianceScore}%**

### Framework Status
- **SOC 2 Type II Readiness**: ${sec.frameworks[0].passCount}/${sec.frameworks[0].totalCount} controls verified
- **CIS AWS Foundations Benchmark**: ${sec.frameworks[1].passCount}/${sec.frameworks[1].totalCount} controls verified
- **Secrets Scanning**: 0 leaked credentials across 8 tracked repositories

### Automated Pipeline Gating
- Dependency vulnerability scans run on every PR via Trivy.
- Commits containing critical severity CVEs are blocked automatically.`,
      actions: [
        { label: 'Run Full Container CVE Scan', action: 'run_security_scan' }
      ]
    };
  }

  generateGeneralGuidance(tenant, infra, sre, finops) {
    return {
      agent: this.name,
      vibe: this.vibe,
      category: 'Autonomous Operations Overview',
      markdown: `# Hello! I am your DevOps Automator Agent.

I manage, maintain, and build the entire infrastructure for **${tenant.name}**.

### Quick Operations Snapshot:
- **Infrastructure Status**: Multi-AZ AWS Architecture (${infra.architecture})
- **System Availability**: ${tenant.uptime}% (Uptime exceeds 99.9% target)
- **MTTR**: ${tenant.mttrMinutes} minutes (Well under 30-minute target)
- **Monthly Cloud Spend**: $${finops.monthlySpendUSD.toLocaleString()} (With $${finops.projectedSavingsUSD.toLocaleString()} savings available)

How would you like to optimize your infrastructure today? You can ask me to design IaC templates, build zero-downtime pipelines, simulate self-healing, or run a cost audit.`,
      actions: [
        { label: 'Assess Infrastructure', action: 'assess_infra' },
        { label: 'Design CI/CD Pipeline', action: 'design_pipeline' },
        { label: 'FinOps Cost Audit', action: 'audit_cost' },
        { label: 'Review SRE Health', action: 'review_sre' }
      ]
    };
  }
}

export const devopsAgent = new DevOpsAutomatorAgent();


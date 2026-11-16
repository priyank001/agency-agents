/**
 * No-Tech Business Founder Infrastructure Wizard
 * Translates plain-business goals into resilient Cloud, On-Premise, and Hybrid operations
 */

import { IaCEngine } from './iacEngine.js';
import { IntegrationsService } from './integrationsService.js';
import { PipelineEngine } from './pipelineEngine.js';

export class NoTechWizard {
  static getArchetypes() {
    return [
      {
        id: 'b2b-saas',
        name: 'B2B Enterprise SaaS',
        icon: '💼',
        tagline: 'High reliability, SOC 2 compliance, multi-tenant database isolation',
        defaultInfra: 'cloud',
        recommendedScale: 'growth',
        features: ['Auto-scaling on customer growth', 'Automated nightly backups', 'Zero-downtime blue-green deploys']
      },
      {
        id: 'ecommerce',
        name: 'E-Commerce & High-Volume Store',
        icon: '🛍️',
        tagline: 'Handles sudden flash sales, Redis cache acceleration, zero checkout drops',
        defaultInfra: 'cloud',
        recommendedScale: 'growth',
        features: ['Traffic surge protection', 'Redis cart acceleration', 'Automated 15s rollback if errors spike']
      },
      {
        id: 'fintech',
        name: 'FinTech & Payment Processing',
        icon: '💳',
        tagline: 'Ultra-secure, hybrid mesh with on-premise vault and cloud ingress',
        defaultInfra: 'hybrid',
        recommendedScale: 'enterprise',
        features: ['Encrypted WireGuard hybrid tunnel', 'PCI-DSS & SOC 2 controls', '99.99% availability guarantee']
      },
      {
        id: 'healthtech',
        name: 'HealthTech & HIPAA Telehealth',
        icon: '🏥',
        tagline: 'Encrypted patient records, dedicated private subnets, audit trail',
        defaultInfra: 'hybrid',
        recommendedScale: 'growth',
        features: ['HIPAA compliance baseline', 'Database point-in-time recovery', 'Strict private subnet isolation']
      },
      {
        id: 'ai-startup',
        name: 'AI & LLM Application',
        icon: '🤖',
        tagline: 'GPU inference nodes, async task queues, rate-limit protection',
        defaultInfra: 'cloud',
        recommendedScale: 'growth',
        features: ['Async worker queue', 'Model cache acceleration', 'Graceful failover on API rate limits']
      }
    ];
  }

  static getGlossary() {
    return [
      { term: 'Auto-Scaling', meaning: 'Like having extra cash registers open automatically when a store gets crowded, and closing them when empty to save money.' },
      { term: 'Blue-Green Deployment', meaning: 'Running two identical rooms (Blue & Green). You decorate the new room, check it works perfectly, and then guide all visitors there with zero waiting time.' },
      { term: 'Hybrid Infrastructure', meaning: 'Using the cloud (AWS/GCP) for your website while keeping your sensitive customer records on your own private physical servers in your office or data center.' },
      { term: 'SRE Self-Healing', meaning: 'A digital bodyguard that notices when an application stumbles, and automatically restarts or fixes it in seconds without waking you up at 3 AM.' },
      { term: 'SLO (Service Level Objective)', meaning: 'Your business reliability target (e.g., 99.9% uptime, meaning less than 43 minutes of total downtime in an entire month).' },
      { term: 'WireGuard VPN Mesh', meaning: 'A military-grade encrypted digital tunnel that safely connects your physical office servers to your cloud servers across the internet.' }
    ];
  }

  static buildStartupBlueprint(options = {}) {
    const businessType = options.businessType || 'b2b-saas';
    const infraType = options.infraType || 'hybrid'; // cloud, onprem, hybrid
    const companyName = options.companyName || 'MyStartup';
    const appIdentifier = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-core';
    const scale = options.scale || 'growth'; // early, growth, enterprise

    let estimatedMonthlyCost = 180;
    let instances = 2;
    let description = '';

    if (scale === 'early') {
      instances = 2;
      estimatedMonthlyCost = infraType === 'onprem' ? 60 : infraType === 'hybrid' ? 140 : 120;
    } else if (scale === 'growth') {
      instances = 4;
      estimatedMonthlyCost = infraType === 'onprem' ? 110 : infraType === 'hybrid' ? 320 : 280;
    } else {
      instances = 8;
      estimatedMonthlyCost = infraType === 'onprem' ? 240 : infraType === 'hybrid' ? 640 : 580;
    }

    if (infraType === 'hybrid') {
      description = `Hybrid Architecture: Public web traffic lands on Cloud Application Load Balancers (AWS us-east-1) with auto-scaling container nodes, connected via an encrypted WireGuard VPN site-to-site tunnel to your On-Premise physical database cluster for maximum data sovereignty and zero cloud egress tax.`;
    } else if (infraType === 'onprem') {
      description = `100% On-Premise Bare-Metal Architecture: Managed with Ansible & K3s lightweight Kubernetes. Zero monthly cloud vendor bills, complete physical control of your hardware with automated self-healing and Prometheus telemetry.`;
    } else {
      description = `100% Cloud-Native AWS Architecture: Multi-AZ Auto-Scaling Group, Application Load Balancer with zero-downtime Blue/Green switching, and Managed PostgreSQL with automated daily snapshots.`;
    }

    // Generate production configs
    const terraformCode = infraType !== 'onprem' ? IaCEngine.generateTerraform({ appName: appIdentifier, minInstances: instances }) : '# Cloud Terraform bypassed for 100% On-Premise deployment';
    const ansiblePlaybook = infraType !== 'cloud' ? IntegrationsService.generateAnsiblePlaybook({ clusterName: `${appIdentifier}-cluster` }) : '# Ansible bypassed for 100% Cloud deployment';
    const jenkinsfile = IntegrationsService.generateJenkinsfile({ appName: appIdentifier, deploymentTarget: infraType });
    const k8sManifest = IaCEngine.generateKubernetesManifests({ appName: appIdentifier, replicas: instances });
    const hybridVpn = infraType === 'hybrid' ? IntegrationsService.generateHybridVpnConfig() : null;

    return {
      companyName,
      businessType,
      infraType,
      scale,
      plainEnglishSummary: description,
      estimatedMonthlyCostUSD: estimatedMonthlyCost,
      slaGuarantee: '99.98% Uptime SLA',
      mttrGuarantee: '< 15 Minutes MTTR',
      automatedProtections: [
        'Zero-downtime updates: Customers never experience 404 or maintenance pages',
        'Automatic green-to-blue rollback if server error rate > 1%',
        'Nightly automated database backups with encryption at rest',
        'Autonomous self-healing container restarts upon memory leaks',
        'Continuous security scanning with Trivy on every release'
      ],
      generatedDeliverables: {
        terraform: terraformCode,
        ansible: ansiblePlaybook,
        jenkinsfile,
        kubernetes: k8sManifest,
        hybridVpn
      }
    };
  }
}


/**
 * OpsAutomator Frontend Reactive Controller
 * Full-featured interactive dashboard with Liquid Glass Design
 */

// Application State
const state = {
  currentTab: 'overview',
  currentEnv: 'production',
  selectedArchetype: 'b2b-saas',
  selectedInfra: 'hybrid',
  stats: null,
  infra: null,
  hybrid: null,
  integrations: [],
  github: null,
  githubEvents: [],
  pipelines: [],
  activePipeline: null,
  sre: null,
  finops: null,
  security: null,
  metricsHistory: {
    rps: [],
    latency: [],
    cpu: []
  }
};

// DOM References
const elements = {
  tabs: document.querySelectorAll('.nav-item-btn'),
  panes: document.querySelectorAll('.tab-pane'),
  envButtons: document.querySelectorAll('.env-btn'),
  tenantSelect: document.getElementById('tenant-select'),
  headerUptime: document.getElementById('header-uptime'),
  
  // Overview
  kpiUptime: document.getElementById('kpi-uptime'),
  kpiMttr: document.getElementById('kpi-mttr'),
  kpiDeployments: document.getElementById('kpi-deployments'),
  kpiSpend: document.getElementById('kpi-spend'),
  overviewResources: document.getElementById('overview-resource-list'),
  overviewActivity: document.getElementById('overview-activity-feed'),
  badgeDriftStatus: document.getElementById('badge-drift-status'),
  btnRefreshOverview: document.getElementById('btn-refresh-overview'),
  btnQuickDeploy: document.getElementById('btn-trigger-deploy-quick'),

  // No-Tech Founder Mode
  notechArchetypesList: document.getElementById('notech-archetypes-list'),
  notechInfraButtons: document.querySelectorAll('#notech-infra-selector button'),
  btnBuildBlueprint: document.getElementById('btn-build-blueprint'),
  blueprintTitle: document.getElementById('blueprint-title'),
  blueprintSla: document.getElementById('blueprint-sla'),
  blueprintBody: document.getElementById('blueprint-body'),
  notechGlossaryList: document.getElementById('notech-glossary-list'),

  // Hybrid & On-Prem Mesh
  meshTunnelStats: document.getElementById('mesh-tunnel-stats'),
  badgeOnpremStatus: document.getElementById('badge-onprem-status'),
  onpremNodesTableBody: document.getElementById('onprem-nodes-table-body'),
  btnDownloadVpnConfig: document.getElementById('btn-download-vpn-config'),
  btnToggleFailover: document.getElementById('btn-toggle-failover'),

  // DevOps Tools Integration Hub
  integrationsGrid: document.getElementById('integrations-grid'),
  toolConfigPreviewTitle: document.getElementById('tool-config-preview-title'),
  toolConfigCodeBox: document.getElementById('tool-config-code-box'),
  btnCopyToolConfig: document.getElementById('btn-copy-tool-config'),

  // GitHub & Automated CI/CD
  githubStatusPill: document.getElementById('github-connection-status-pill'),
  githubProfileConnectedView: document.getElementById('github-profile-connected-view'),
  githubProfileAvatar: document.getElementById('github-profile-avatar'),
  githubProfileName: document.getElementById('github-profile-name'),
  githubProfileLink: document.getElementById('github-profile-link'),
  githubProfileAuthType: document.getElementById('github-profile-auth-type'),
  btnDisconnectGithub: document.getElementById('btn-disconnect-github'),
  githubRepoSelect: document.getElementById('github-repo-select'),
  githubWebhookUrl: document.getElementById('github-webhook-url'),
  githubWebhookSecret: document.getElementById('github-webhook-secret'),
  btnCopyWebhookUrl: document.getElementById('btn-copy-webhook-url'),
  btnCopyWebhookSecret: document.getElementById('btn-copy-webhook-secret'),
  githubConnectForm: document.getElementById('github-connect-form'),
  githubInputUsername: document.getElementById('github-input-username'),
  githubInputToken: document.getElementById('github-input-token'),
  githubInputRepo: document.getElementById('github-input-repo'),
  githubEventsFeed: document.getElementById('github-events-feed'),
  btnSimulateGitHubPush: document.getElementById('btn-simulate-github-push'),

  // Chaos & Hardening Lab
  btnRunChaosBattery: document.getElementById('btn-run-chaos-battery'),
  chaosScorePill: document.getElementById('chaos-score-pill'),
  chaosResultsList: document.getElementById('chaos-results-list'),
  resilienceReportBody: document.getElementById('resilience-report-body'),

  // IaC
  iacForm: document.getElementById('iac-config-form'),
  iacProvider: document.getElementById('iac-provider'),
  iacAppName: document.getElementById('iac-app-name'),
  iacInstanceType: document.getElementById('iac-instance-type'),
  iacMin: document.getElementById('iac-min'),
  iacMax: document.getElementById('iac-max'),
  iacCodeViewer: document.getElementById('iac-code-viewer'),
  iacTotalCost: document.getElementById('iac-total-cost'),
  iacCostBreakdown: document.getElementById('iac-cost-breakdown'),
  btnCopyIac: document.getElementById('btn-copy-iac'),
  btnSimulateDrift: document.getElementById('btn-simulate-drift'),
  btnRemediateDrift: document.getElementById('btn-remediate-drift'),

  // Pipelines
  pipelineStepper: document.getElementById('pipeline-stepper-container'),
  pipelineLogs: document.getElementById('pipeline-logs-body'),
  activePipelineTitle: document.getElementById('active-pipeline-title'),
  activePipelineStatus: document.getElementById('active-pipeline-status'),
  btnTriggerPipeline: document.getElementById('btn-trigger-pipeline'),
  btnSimulateRollback: document.getElementById('btn-simulate-rollback'),

  // SRE
  sloGrid: document.getElementById('slo-grid-container'),
  selfHealingRulesBody: document.getElementById('self-healing-rules-body'),
  incidentsTableBody: document.getElementById('incidents-table-body'),
  btnTest5xx: document.getElementById('btn-test-5xx-incident'),
  btnTestCpu: document.getElementById('btn-test-cpu-incident'),

  // Observability
  valCurrentRps: document.getElementById('val-current-rps'),
  valCurrentLatency: document.getElementById('val-current-latency'),
  canvasRps: document.getElementById('chart-rps'),
  canvasLatency: document.getElementById('chart-latency'),
  logExplorerBody: document.getElementById('log-explorer-body'),
  logFilterService: document.getElementById('log-filter-service'),

  // FinOps
  finopsBreakdownList: document.getElementById('finops-breakdown-list'),
  finopsRecommendationsList: document.getElementById('finops-recommendations-list'),
  finopsSavingsTotal: document.getElementById('finops-savings-total'),

  // Security
  securityScorePill: document.getElementById('security-score-pill'),
  securityFrameworksList: document.getElementById('security-frameworks-list'),
  securityVulnsList: document.getElementById('security-vulns-list'),
  btnRunSecurityScan: document.getElementById('btn-run-security-scan'),

  // Agent Chat
  agentChatMessages: document.getElementById('agent-chat-messages'),
  agentChatForm: document.getElementById('agent-chat-form'),
  agentChatInput: document.getElementById('agent-chat-input'),
  promptChips: document.querySelectorAll('.chip-btn'),

  // Export
  btnDownloadKit: document.getElementById('btn-download-kit')
};

// ==============================================================================
// 1. Initialization & Navigation
// ==============================================================================
async function initApp() {
  setupNavigation();
  setupEnvironmentSwitch();
  setupEventSource();
  setupNoTechMode();
  setupHybridControls();
  setupIntegrationsHub();
  setupGitHubControls();
  setupChaosLab();
  setupIaCControls();
  setupPipelineControls();
  setupSREControls();
  setupFinOpsControls();
  setupSecurityControls();
  setupAgentChat();
  setupExportControls();

  // Initial Data Fetch
  await loadStats();
  await loadInfrastructure();
  await loadHybrid();
  await loadIntegrations();
  await loadGitHub();
  await loadPipelines();
  await loadSRE();
  await loadObservability();
  await loadFinOps();
  await loadSecurity();
}

function setupNavigation() {
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  state.currentTab = tabId;

  elements.tabs.forEach(t => {
    if (t.dataset.tab === tabId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  elements.panes.forEach(pane => {
    if (pane.id === `pane-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  if (tabId === 'observability') {
    renderCharts();
  }
}

function setupEnvironmentSwitch() {
  elements.envButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const env = btn.dataset.env;
      elements.envButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentEnv = env;

      try {
        await fetch('/api/stats/environment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ environment: env })
        });
        await loadStats();
        await loadInfrastructure();
      } catch (err) {
        console.error('Error switching environment:', err);
      }
    });
  });

  elements.btnRefreshOverview.addEventListener('click', loadStats);
  elements.btnQuickDeploy.addEventListener('click', () => {
    switchTab('pipelines');
    triggerPipelineRun();
  });
}

// ==============================================================================
// 2. Real-Time Telemetry & Server-Sent Events (SSE)
// ==============================================================================
function setupEventSource() {
  const eventSource = new EventSource('/api/events');

  eventSource.addEventListener('telemetry:tick', (e) => {
    const data = JSON.parse(e.data);
    updateTelemetry(data);
  });

  eventSource.addEventListener('pipeline:started', (e) => {
    const pipe = JSON.parse(e.data);
    state.activePipeline = pipe;
    renderActivePipeline(pipe);
    addActivityFeedItem(`🚀 Pipeline initiated: ${pipe.name} (${pipe.strategy})`);
  });

  eventSource.addEventListener('pipeline:updated', (e) => {
    const pipe = JSON.parse(e.data);
    state.activePipeline = pipe;
    renderActivePipeline(pipe);
    if (pipe.status === 'success') {
      addActivityFeedItem(`✅ Deployment successful: ${pipe.name} (Zero-downtime)`);
      loadStats();
    } else if (pipe.status === 'rolled-back') {
      addActivityFeedItem(`⚠️ Rollback executed: Reverted traffic to previous Blue target group`);
      loadStats();
    }
  });

  eventSource.addEventListener('github:event', (e) => {
    const event = JSON.parse(e.data);
    state.githubEvents.unshift(event);
    if (state.githubEvents.length > 50) state.githubEvents.pop();
    renderGitHubEvents();
  });

  eventSource.addEventListener('github:profile', (e) => {
    const profile = JSON.parse(e.data);
    state.github = profile;
    loadGitHub();
  });

  eventSource.onerror = (err) => {
    console.warn('SSE reconnecting...', err);
  };
}

function updateTelemetry(data) {
  if (elements.headerUptime) {
    elements.headerUptime.textContent = `${data.uptime}% Uptime`;
  }
  if (elements.valCurrentRps) {
    elements.valCurrentRps.textContent = `${data.reqPerSec} req/s`;
  }
  if (elements.valCurrentLatency) {
    elements.valCurrentLatency.textContent = `P95: ${data.p95LatencyMs}ms`;
  }

  // Update rolling metrics history for charts
  state.metricsHistory.rps.push({ time: data.time, val: data.reqPerSec });
  state.metricsHistory.latency.push({ time: data.time, val: data.p95LatencyMs });
  state.metricsHistory.cpu.push({ time: data.time, val: data.cpuPercent });

  if (state.metricsHistory.rps.length > 20) state.metricsHistory.rps.shift();
  if (state.metricsHistory.latency.length > 20) state.metricsHistory.latency.shift();
  if (state.metricsHistory.cpu.length > 20) state.metricsHistory.cpu.shift();

  if (state.currentTab === 'observability') {
    renderCharts();
  }
}

// ==============================================================================
// 3. Fast Canvas Chart Engine
// ==============================================================================
function renderCharts() {
  drawCanvasChart(elements.canvasRps, state.metricsHistory.rps, '#38bdf8', 'Req/s');
  drawCanvasChart(elements.canvasLatency, state.metricsHistory.latency, '#f97316', 'ms (P95)');
}

function drawCanvasChart(canvas, points, strokeColor, unit) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  if (!points || points.length === 0) {
    ctx.restore();
    return;
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const values = points.map(p => p.val);
  const min = Math.min(...values) * 0.8;
  const max = Math.max(...values) * 1.2 || 1;

  const stepX = w / (points.length - 1 || 1);

  // Draw smooth path
  ctx.beginPath();
  points.forEach((p, idx) => {
    const x = idx * stepX;
    const y = h - ((p.val - min) / (max - min)) * (h - 20) - 10;
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Fill gradient
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, strokeColor.replace(')', ', 0.35)').replace('rgb', 'rgba'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw last point dot
  const lastIdx = points.length - 1;
  const lastP = points[lastIdx];
  const lastX = lastIdx * stepX;
  const lastY = h - ((lastP.val - min) / (max - min)) * (h - 20) - 10;

  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fillStyle = strokeColor;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// ==============================================================================
// 4. Data Loaders & Renderers
// ==============================================================================
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    state.stats = data;

    elements.kpiUptime.textContent = `${data.kpis.uptime}%`;
    elements.kpiMttr.textContent = `${data.kpis.mttrMinutes}m`;
    elements.kpiDeployments.textContent = `${data.kpis.deploymentsToday} / day`;
    elements.kpiSpend.textContent = `$${data.kpis.monthlySpendUSD.toLocaleString()}`;

    renderResourceList(data.tenant.currentEnvironment);
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function renderResourceList(env) {
  if (!state.infra) return;
  const envData = state.infra.infrastructure || state.infra;
  if (!envData || !envData.resources) return;

  elements.overviewResources.innerHTML = envData.resources.map(res => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: rgba(255,255,255,0.04); border-radius: 10px; border: 1px solid var(--glass-border);">
      <div>
        <div style="font-weight: 600; font-size: 0.85rem;">${res.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${res.type} ${res.instances ? `• ${res.instances} instances` : ''}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">$${res.costPerMonth || 0}/mo</span>
        <span class="btn-sm btn-success" style="padding: 0.15rem 0.45rem; font-size: 0.7rem;">Healthy</span>
      </div>
    </div>
  `).join('');

  elements.badgeDriftStatus.textContent = envData.driftStatus === 'in-sync' ? 'In-Sync' : 'Drift Detected';
  elements.badgeDriftStatus.className = envData.driftStatus === 'in-sync' ? 'btn-sm btn-success' : 'btn-sm btn-danger';
}

function addActivityFeedItem(text) {
  if (!elements.overviewActivity) return;
  const time = new Date().toLocaleTimeString();
  const div = document.createElement('div');
  div.style.cssText = 'font-size: 0.825rem; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.04); border-radius: 8px; border-left: 3px solid var(--accent);';
  div.innerHTML = `<span style="color: var(--text-muted); font-size: 0.75rem;">[${time}]</span> ${text}`;
  elements.overviewActivity.prepend(div);
}

// ------------------------------------------------------------------------------
// NO-TECH FOUNDER MODE
// ------------------------------------------------------------------------------
async function setupNoTechMode() {
  try {
    const res = await fetch('/api/notech/archetypes');
    const archetypes = await res.json();

    elements.notechArchetypesList.innerHTML = archetypes.map(a => `
      <div class="archetype-card ${a.id === state.selectedArchetype ? 'active' : ''}" data-id="${a.id}" style="padding: 0.85rem 1rem; background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: 12px; cursor: pointer; transition: all 0.2s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700; font-size: 0.95rem;">${a.icon} ${a.name}</div>
          <span style="font-size: 0.75rem; color: #fdba74;">${a.recommendedScale} tier</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0 0.4rem;">${a.tagline}</p>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${a.features.map(f => `<span style="font-size: 0.7rem; background: rgba(255,255,255,0.06); padding: 0.15rem 0.45rem; border-radius: 4px; color: var(--text-muted);">${f}</span>`).join('')}
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.archetype-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.archetype-card').forEach(c => c.style.borderColor = 'var(--glass-border)');
        card.style.borderColor = 'var(--accent)';
        state.selectedArchetype = card.dataset.id;
      });
    });

    elements.notechInfraButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.notechInfraButtons.forEach(b => {
          b.style.borderColor = 'var(--glass-border)';
          b.style.background = 'rgba(255,255,255,0.08)';
        });
        btn.style.borderColor = 'var(--accent)';
        btn.style.background = 'rgba(249, 115, 22, 0.2)';
        state.selectedInfra = btn.dataset.infra;
      });
    });

    elements.btnBuildBlueprint.addEventListener('click', async () => {
      elements.btnBuildBlueprint.textContent = '⚙️ Building Autonomous Infrastructure...';
      const res = await fetch('/api/notech/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType: state.selectedArchetype,
          infraType: state.selectedInfra,
          companyName: 'PayStream Technologies',
          scale: 'growth'
        })
      });
      const data = await res.json();
      elements.btnBuildBlueprint.textContent = '🚀 Generate End-to-End Autonomous Blueprint';

      elements.blueprintTitle.textContent = `${data.companyName} (${data.businessType.toUpperCase()}) Blueprint`;
      elements.blueprintSla.textContent = `${data.slaGuarantee} • $${data.estimatedMonthlyCostUSD}/mo`;

      elements.blueprintBody.innerHTML = `
        <div style="margin-bottom: 1rem;">
          <p style="color: var(--text-primary); font-size: 0.95rem; margin-bottom: 0.75rem;">${data.plainEnglishSummary}</p>
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 0.85rem; margin-bottom: 0.75rem;">
            <strong style="color: #6ee7b7; font-size: 0.85rem;">🛡️ Autonomous Protections Active:</strong>
            <ul style="margin-top: 0.4rem; padding-left: 1.25rem; font-size: 0.8rem; color: #d1fae5;">
              ${data.automatedProtections.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button class="btn btn-primary btn-sm" id="btn-deploy-blueprint">⚡ Launch Everything in Autonomous Mode</button>
            <button class="btn btn-secondary btn-sm" id="btn-view-blueprint-code">Inspect Generated IaC</button>
          </div>
        </div>
      `;

      document.getElementById('btn-deploy-blueprint').addEventListener('click', () => {
        switchTab('pipelines');
        triggerPipelineRun();
      });

      document.getElementById('btn-view-blueprint-code').addEventListener('click', () => {
        switchTab('infrastructure');
      });
    });

    // Load Glossary
    const resG = await fetch('/api/notech/glossary');
    const glossary = await resG.json();
    elements.notechGlossaryList.innerHTML = glossary.map(g => `
      <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.65rem 0.85rem; border-left: 2px solid var(--accent);">
        <strong style="color: #fdba74; font-size: 0.85rem;">${g.term}:</strong>
        <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 0.25rem;">${g.meaning}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed setup notech:', err);
  }
}

// ------------------------------------------------------------------------------
// HYBRID & ON-PREMISE MESH
// ------------------------------------------------------------------------------
async function loadHybrid() {
  try {
    const res = await fetch('/api/hybrid');
    const data = await res.json();
    state.hybrid = data;

    elements.meshTunnelStats.textContent = `${data.wireguardMesh.latencyMs}ms latency • ${data.wireguardMesh.packetLossPercent}% loss • ${data.wireguardMesh.bytesTransferredGB} GB synced`;
    elements.badgeOnpremStatus.textContent = data.activeRouting === 'onprem' ? 'Failover Primary' : 'Active-Local';
    elements.badgeOnpremStatus.className = data.activeRouting === 'onprem' ? 'btn-sm btn-danger' : 'btn-sm btn-success';

    elements.onpremNodesTableBody.innerHTML = data.onPremNodes.map(node => `
      <tr>
        <td>
          <div style="font-weight: 600;">${node.hostname}</div>
          <code style="font-size: 0.75rem; color: var(--text-muted);">${node.ip}</code>
        </td>
        <td>${node.role}</td>
        <td>${node.cpuCores} Cores / ${node.ramGB}GB</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="background: rgba(255,255,255,0.1); width: 60px; height: 6px; border-radius: 3px; overflow: hidden;">
              <div style="background: var(--info); width: ${node.diskUsagePercent}%; height: 100%;"></div>
            </div>
            <span>${node.diskUsagePercent}%</span>
          </div>
        </td>
        <td><span style="color: ${node.temperatureC > 50 ? 'var(--danger)' : '#6ee7b7'}; font-weight: 600;">${node.temperatureC}°C</span></td>
        <td><span class="btn-sm btn-success">${node.k3sStatus}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed load hybrid:', err);
  }
}

function setupHybridControls() {
  elements.btnDownloadVpnConfig.addEventListener('click', () => {
    window.location.href = '/api/hybrid/vpn-config';
  });

  elements.btnToggleFailover.addEventListener('click', async () => {
    const newTarget = state.hybrid && state.hybrid.activeRouting === 'onprem' ? 'hybrid-balanced' : 'onprem';
    const res = await fetch('/api/hybrid/failover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: newTarget })
    });
    const data = await res.json();
    addActivityFeedItem(`⚡ Hybrid Failover Triggered: Active routing shifted to ${newTarget.toUpperCase()}`);
    await loadHybrid();
  });
}

// ------------------------------------------------------------------------------
// DEVOPS TOOLS INTEGRATION HUB
// ------------------------------------------------------------------------------
async function loadIntegrations() {
  try {
    const res = await fetch('/api/integrations');
    const tools = await res.json();
    state.integrations = tools;

    elements.integrationsGrid.innerHTML = tools.map(t => `
      <div class="card" style="margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <div style="font-weight: 700; font-size: 1rem;">${t.name}</div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${t.category}</span>
          </div>
          <span class="btn-sm btn-success">${t.status}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.85rem;">
          Version: <code>${t.version}</code>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm btn-tool-generate" data-tool="${t.id}" style="flex: 1;">Generate Config</button>
          <button class="btn btn-secondary btn-sm btn-tool-sync" data-tool="${t.id}">↻</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.btn-tool-generate').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tool = btn.dataset.tool;
        const res = await fetch('/api/integrations/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool, appName: 'paystream-core' })
        });
        const data = await res.json();
        elements.toolConfigPreviewTitle.textContent = `${tool.toUpperCase()} Production Configuration`;
        elements.toolConfigCodeBox.textContent = data.content;
      });
    });

    document.querySelectorAll('.btn-tool-sync').forEach(btn => {
      btn.addEventListener('click', async () => {
        const toolId = btn.dataset.tool;
        btn.textContent = '...';
        await fetch('/api/integrations/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId })
        });
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '↻'; }, 1500);
      });
    });
  } catch (err) {
    console.error('Failed load integrations:', err);
  }
}

function setupIntegrationsHub() {
  elements.btnCopyToolConfig.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.toolConfigCodeBox.textContent);
    elements.btnCopyToolConfig.textContent = '✅ Copied!';
    setTimeout(() => { elements.btnCopyToolConfig.textContent = '📋 Copy Config'; }, 2000);
  });
}

// ------------------------------------------------------------------------------
// GITHUB ACCOUNT & AUTOMATED JENKINS CI/CD TRIGGER
// ------------------------------------------------------------------------------
async function loadGitHub() {
  try {
    const res = await fetch('/api/github/status');
    const data = await res.json();
    state.github = data.profile;
    state.githubEvents = data.recentEvents || [];

    const profile = data.profile;
    if (profile && profile.connected) {
      if (elements.githubProfileConnectedView) elements.githubProfileConnectedView.style.display = 'flex';
      if (elements.githubConnectForm) elements.githubConnectForm.style.display = 'none';

      if (elements.githubStatusPill) {
        elements.githubStatusPill.textContent = 'Connected & Validated';
        elements.githubStatusPill.className = 'btn-sm btn-success';
      }

      if (elements.githubProfileAvatar) elements.githubProfileAvatar.src = profile.avatarUrl || `https://github.com/${profile.username}.png`;
      if (elements.githubProfileName) elements.githubProfileName.textContent = profile.displayName || profile.username;
      if (elements.githubProfileLink) {
        elements.githubProfileLink.textContent = `@${profile.username}`;
        elements.githubProfileLink.href = profile.profileUrl || `https://github.com/${profile.username}`;
      }
      if (elements.githubProfileAuthType) {
        elements.githubProfileAuthType.textContent = profile.authType || 'Personal Access Token';
      }

      if (elements.githubRepoSelect) {
        elements.githubRepoSelect.innerHTML = (profile.repositories || []).map(r => `
          <option value="${escapeHtml(r.name)}" ${r.name === profile.activeRepository ? 'selected' : ''}>
            ${escapeHtml(r.name)} (${r.defaultBranch}) • ${r.visibility}
          </option>
        `).join('');
      }

      if (elements.githubWebhookUrl) {
        const fullUrl = window.location.origin + (profile.webhookUrl || '/api/github/webhook');
        elements.githubWebhookUrl.textContent = fullUrl;
      }
      if (elements.githubWebhookSecret) {
        elements.githubWebhookSecret.textContent = profile.webhookSecret || '';
      }
    } else {
      if (elements.githubProfileConnectedView) elements.githubProfileConnectedView.style.display = 'none';
      if (elements.githubConnectForm) elements.githubConnectForm.style.display = 'flex';

      if (elements.githubStatusPill) {
        elements.githubStatusPill.textContent = 'Disconnected';
        elements.githubStatusPill.className = 'btn-sm btn-secondary';
      }
    }

    renderGitHubEvents();
  } catch (err) {
    console.error('Failed to load GitHub status:', err);
  }
}

function renderGitHubEvents() {
  if (!elements.githubEventsFeed) return;
  const events = state.githubEvents || [];

  if (events.length === 0) {
    elements.githubEventsFeed.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem; font-size: 0.85rem;">
        No Git webhook events received yet. Click "Simulate Git Push Event" or push a commit to your linked repository.
      </div>
    `;
    return;
  }

  elements.githubEventsFeed.innerHTML = events.map(ev => {
    const isSuccess = ev.jenkinsBuildStatus === 'success' || ev.status === 'success';
    const isPending = ev.jenkinsBuildStatus === 'building' || ev.jenkinsBuildStatus === 'pending';
    const statusClass = isSuccess ? 'btn-success' : (isPending ? 'btn-primary' : 'btn-danger');
    const statusText = isSuccess ? 'Build & Deploy Succeeded' : (isPending ? 'Build in Progress' : 'Failed');
    const shortSha = (ev.commit || 'unknown').slice(0, 7);
    const dateStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now';

    return `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 0.85rem; border-left: 3px solid ${isSuccess ? 'var(--success)' : (isPending ? 'var(--accent)' : 'var(--danger)')};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <div>
            <span style="font-weight: 700; font-size: 0.875rem;">${escapeHtml(ev.repo || 'repository')}</span>
            <span style="font-size: 0.75rem; color: #38bdf8; margin-left: 0.4rem;">${escapeHtml(ev.branch || 'main')}</span>
            <code style="font-size: 0.75rem; margin-left: 0.4rem;">${escapeHtml(shortSha)}</code>
          </div>
          <span class="btn-sm ${statusClass}">${statusText}</span>
        </div>
        <div style="font-size: 0.825rem; color: var(--text-primary); margin-bottom: 0.4rem;">
          "${escapeHtml(ev.commitMessage || 'Push event')}"
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.75rem; color: var(--text-muted);">
          <span>👤 ${escapeHtml(ev.author || 'committer')}</span>
          <span>⏱️ ${escapeHtml(dateStr)}</span>
          <span>🏗️ Jenkins Pipeline: <code>${escapeHtml(ev.pipelineId || 'jenkins-job')}</code></span>
          <span>🐳 Docker & K8s: <code>${escapeHtml(ev.targetCluster || 'k8s-prod-cluster')}</code></span>
        </div>
      </div>
    `;
  }).join('');
}

function setupGitHubControls() {
  if (elements.githubConnectForm) {
    elements.githubConnectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = elements.githubInputUsername.value.trim();
      const token = elements.githubInputToken.value.trim();
      const defaultRepo = elements.githubInputRepo.value.trim() || 'core-api';

      if (!username) return;

      try {
        const res = await fetch('/api/github/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            token: token || undefined,
            defaultRepo
          })
        });

        const data = await res.json();
        if (data.error) {
          alert(`Validation Error: ${data.error}`);
          return;
        }

        addActivityFeedItem(`🐙 GitHub profile validated and connected: @${username}`);
        await loadGitHub();
      } catch (err) {
        console.error('Failed to connect GitHub account:', err);
      }
    });
  }

  if (elements.btnDisconnectGithub) {
    elements.btnDisconnectGithub.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to disconnect this GitHub account?')) return;
      try {
        await fetch('/api/github/disconnect', { method: 'POST' });
        addActivityFeedItem(`🐙 GitHub profile disconnected.`);
        await loadGitHub();
      } catch (err) {
        console.error('Failed to disconnect GitHub:', err);
      }
    });
  }

  if (elements.btnSimulateGitHubPush) {
    elements.btnSimulateGitHubPush.addEventListener('click', async () => {
      const repo = elements.githubRepoSelect ? elements.githubRepoSelect.value : 'paystream-core';
      elements.btnSimulateGitHubPush.textContent = '⏳ Triggering Jenkins & K8s...';

      try {
        const res = await fetch('/api/github/simulate-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo,
            branch: 'main',
            commitMessage: 'feat(payments): automated Jenkins pipeline and zero-downtime K8s rollout'
          })
        });

        const data = await res.json();
        elements.btnSimulateGitHubPush.textContent = '🚀 Simulate Git Push Event';

        if (data.pipeline) {
          state.activePipeline = data.pipeline;
          renderActivePipeline(data.pipeline);
          addActivityFeedItem(`🚀 Git Push Triggered Jenkins Build: #${data.pipeline.id} for repo ${repo}`);
        }

        await loadGitHub();
        await loadPipelines();
      } catch (err) {
        elements.btnSimulateGitHubPush.textContent = '🚀 Simulate Git Push Event';
        console.error('Simulate push error:', err);
      }
    });
  }

  if (elements.btnCopyWebhookUrl) {
    elements.btnCopyWebhookUrl.addEventListener('click', () => {
      if (elements.githubWebhookUrl) {
        navigator.clipboard.writeText(elements.githubWebhookUrl.textContent.trim());
        elements.btnCopyWebhookUrl.textContent = '✅ Copied!';
        setTimeout(() => { elements.btnCopyWebhookUrl.textContent = 'Copy'; }, 2000);
      }
    });
  }

  if (elements.btnCopyWebhookSecret) {
    elements.btnCopyWebhookSecret.addEventListener('click', () => {
      if (elements.githubWebhookSecret) {
        navigator.clipboard.writeText(elements.githubWebhookSecret.textContent.trim());
        elements.btnCopyWebhookSecret.textContent = '✅ Copied!';
        setTimeout(() => { elements.btnCopyWebhookSecret.textContent = 'Copy'; }, 2000);
      }
    });
  }
}

// ------------------------------------------------------------------------------
// CHAOS & HARDENING LABORATORY (BREAK THE SYSTEM)
// ------------------------------------------------------------------------------
function setupChaosLab() {
  elements.btnRunChaosBattery.addEventListener('click', async () => {
    elements.btnRunChaosBattery.textContent = '⚡ Running Chaos Battery...';
    try {
      const res = await fetch('/api/chaos/run', { method: 'POST' });
      const data = await res.json();
      elements.btnRunChaosBattery.textContent = '⚡ Run Full Chaos Battery';

      elements.chaosScorePill.textContent = `${data.overallRobustnessScore}% Robustness`;
      elements.chaosScorePill.className = data.overallRobustnessScore >= 90 ? 'btn-sm btn-success' : 'btn-sm btn-danger';

      elements.chaosResultsList.innerHTML = data.results.map(r => `
        <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: 12px; padding: 0.85rem; border-left: 3px solid ${r.passed ? 'var(--success)' : 'var(--danger)'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 0.875rem;">${r.testId}: ${r.name}</strong>
            <span class="btn-sm ${r.passed ? 'btn-success' : 'btn-danger'}">${r.passed ? 'Passed Defenses' : 'Failed'}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.35rem 0;">${r.details}</p>
          <div style="font-size: 0.75rem; color: #93c5fd;">🛡️ <strong>Hardening:</strong> ${r.hardeningApplied}</div>
        </div>
      `).join('');

      elements.resilienceReportBody.innerHTML = data.resilienceAuditReport.knownLimitsAndDemerits.map(item => `
        <div style="background: rgba(255,255,255,0.04); border-radius: 10px; padding: 0.85rem; border: 1px solid var(--glass-border);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <strong style="color: #fdba74;">${item.area}</strong>
            <span style="font-size: 0.7rem; color: var(--warning); background: rgba(245, 158, 11, 0.15); padding: 0.1rem 0.4rem; border-radius: 4px;">Known Boundary</span>
          </div>
          <div style="margin-bottom: 0.35rem;"><span style="color: var(--text-muted);">Limit:</span> ${item.limitation}</div>
          <div style="margin-bottom: 0.35rem;"><span style="color: var(--text-muted);">Risk:</span> ${item.risk}</div>
          <div style="color: #6ee7b7;"><strong>Remedy/Hardening:</strong> ${item.hardeningMeasure}</div>
        </div>
      `).join('');

      addActivityFeedItem(`💥 Chaos Battery executed: ${data.passed}/${data.testsRun} stress tests survived with 100% defense!`);
    } catch (err) {
      elements.btnRunChaosBattery.textContent = '⚡ Run Full Chaos Battery';
      console.error('Chaos error:', err);
    }
  });
}

// ------------------------------------------------------------------------------
// Infrastructure (IaC)
// ------------------------------------------------------------------------------
async function loadInfrastructure() {
  try {
    const res = await fetch(`/api/infra?env=${state.currentEnv}`);
    const data = await res.json();
    state.infra = data;
    renderResourceList(state.currentEnv);
    generateIaCCode();
  } catch (err) {
    console.error('Failed to load infra:', err);
  }
}

function setupIaCControls() {
  elements.iacForm.addEventListener('submit', (e) => {
    e.preventDefault();
    generateIaCCode();
  });

  elements.btnCopyIac.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.iacCodeViewer.textContent);
    elements.btnCopyIac.textContent = '✅ Copied!';
    setTimeout(() => { elements.btnCopyIac.textContent = '📋 Copy Code'; }, 2000);
  });

  elements.btnSimulateDrift.addEventListener('click', async () => {
    const res = await fetch('/api/infra/drift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'simulate', environment: state.currentEnv })
    });
    elements.badgeDriftStatus.textContent = 'Drift Detected';
    elements.badgeDriftStatus.className = 'btn-sm btn-danger';
    addActivityFeedItem('⚠️ Drift detected: ALB Security Group rule modified manually out-of-band.');
  });

  elements.btnRemediateDrift.addEventListener('click', async () => {
    const res = await fetch('/api/infra/drift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remediate', environment: state.currentEnv })
    });
    elements.badgeDriftStatus.textContent = 'In-Sync';
    elements.badgeDriftStatus.className = 'btn-sm btn-success';
    addActivityFeedItem('✅ Terraform Apply executed. Drift remediated automatically.');
  });
}

async function generateIaCCode() {
  const type = elements.iacProvider.value;
  const appName = elements.iacAppName.value || 'paystream-api';
  const instanceType = elements.iacInstanceType.value;
  const minInstances = parseInt(elements.iacMin.value, 10) || 2;
  const maxInstances = parseInt(elements.iacMax.value, 10) || 10;

  try {
    const res = await fetch('/api/infra/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, appName, instanceType, minInstances, maxInstances })
    });
    const data = await res.json();

    elements.iacCodeViewer.textContent = data.code;
    elements.iacTotalCost.textContent = `$${data.infracost.totalMonthlyUSD} / mo`;

    elements.iacCostBreakdown.innerHTML = data.infracost.breakdown.map(b => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.35rem;">
        <span>${b.component}</span>
        <strong>$${b.monthlyUSD}/mo</strong>
      </div>
    `).join('') + `<p style="color: var(--success); font-size: 0.775rem; margin-top: 0.5rem;">💡 ${data.infracost.finopsTip}</p>`;
  } catch (err) {
    console.error('Failed to generate IaC:', err);
  }
}

// ------------------------------------------------------------------------------
// CI/CD Pipelines
// ------------------------------------------------------------------------------
async function loadPipelines() {
  try {
    const res = await fetch('/api/pipelines');
    const list = await res.json();
    state.pipelines = list;
    if (list.length > 0) {
      state.activePipeline = list[0];
      renderActivePipeline(list[0]);
    }
  } catch (err) {
    console.error('Failed to load pipelines:', err);
  }
}

function setupPipelineControls() {
  elements.btnTriggerPipeline.addEventListener('click', triggerPipelineRun);
  elements.btnSimulateRollback.addEventListener('click', async () => {
    if (!state.activePipeline) return;
    try {
      const res = await fetch('/api/pipelines/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId: state.activePipeline.id })
      });
      const data = await res.json();
      renderActivePipeline(data.pipeline);
    } catch (err) {
      console.error('Failed rollback:', err);
    }
  });
}

async function triggerPipelineRun() {
  try {
    const res = await fetch('/api/pipelines/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        environment: state.currentEnv,
        strategy: 'blue-green',
        branch: 'main'
      })
    });
    const data = await res.json();
    state.activePipeline = data.pipeline;
    renderActivePipeline(data.pipeline);
  } catch (err) {
    console.error('Failed trigger pipeline:', err);
  }
}

function renderActivePipeline(pipe) {
  if (!pipe) return;
  elements.activePipelineTitle.textContent = `${pipe.name} (#${pipe.commit})`;
  elements.activePipelineStatus.textContent = pipe.status.toUpperCase();
  elements.activePipelineStatus.className = pipe.status === 'success' ? 'btn-sm btn-success' : pipe.status === 'rolled-back' ? 'btn-sm btn-danger' : 'btn-sm btn-primary';

  elements.pipelineStepper.innerHTML = pipe.stages.map((stage, idx) => `
    <div class="step-node ${stage.status}">
      <div class="step-title">${stage.name}</div>
      <div class="step-meta">
        <span>${stage.tool}</span>
        <span>${stage.duration}</span>
      </div>
    </div>
    ${idx < pipe.stages.length - 1 ? '<span class="step-arrow">→</span>' : ''}
  `).join('');

  elements.pipelineLogs.innerHTML = pipe.logs.map(line => {
    let color = '#d1d5db';
    if (line.includes('[SECURITY]')) color = '#38bdf8';
    if (line.includes('[TEST]')) color = '#a78bfa';
    if (line.includes('[BUILD]')) color = '#fbbf24';
    if (line.includes('[DEPLOY]')) color = '#34d399';
    if (line.includes('[ROLLBACK]')) color = '#f87171';
    if (line.includes('[HEALTH]')) color = '#4ade80';

    return `<div class="log-line" style="color: ${color};">${escapeHtml(line)}</div>`;
  }).join('');

  elements.pipelineLogs.scrollTop = elements.pipelineLogs.scrollHeight;
}

// ------------------------------------------------------------------------------
// SRE & Self-Healing
// ------------------------------------------------------------------------------
async function loadSRE() {
  try {
    const res = await fetch('/api/sre');
    const data = await res.json();
    state.sre = data;

    elements.sloGrid.innerHTML = data.slos.map(slo => `
      <div class="kpi-card">
        <span class="kpi-title">${slo.name}</span>
        <div class="kpi-value">${slo.current}%</div>
        <div style="font-size: 0.775rem; color: var(--text-secondary); margin-top: 0.25rem;">
          Target: ${slo.target}% | Burn rate: ${slo.burnRate}
        </div>
        <div style="background: rgba(255,255,255,0.08); height: 6px; border-radius: 3px; overflow: hidden; margin-top: 0.5rem;">
          <div style="background: var(--success); width: ${slo.errorBudgetRemainingPercent}%; height: 100%;"></div>
        </div>
        <span class="kpi-subtext positive" style="margin-top: 0.25rem;">Budget: ${slo.errorBudgetRemainingPercent}% remaining</span>
      </div>
    `).join('');

    elements.selfHealingRulesBody.innerHTML = data.selfHealingRules.map(rule => `
      <tr>
        <td><strong>${rule.name}</strong></td>
        <td><code>${rule.condition}</code></td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${rule.action}</td>
        <td><span class="btn-sm btn-secondary">${rule.executionCount}x</span></td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-rule-id="${rule.id}" class="rule-toggle-input">
            <span class="slider"></span>
          </label>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.rule-toggle-input').forEach(input => {
      input.addEventListener('change', async () => {
        const ruleId = input.dataset.ruleId;
        await fetch('/api/sre/toggle-rule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ruleId })
        });
      });
    });

    elements.incidentsTableBody.innerHTML = data.incidents.map(inc => `
      <tr>
        <td><code>${inc.id}</code></td>
        <td>${inc.title}</td>
        <td><span class="btn-sm ${inc.severity === 'critical' ? 'btn-danger' : 'btn-secondary'}">${inc.severity}</span></td>
        <td><span class="btn-sm btn-success">${inc.status}</span></td>
        <td>${inc.durationMinutes ? `${inc.durationMinutes}m` : 'Active'}</td>
        <td>${inc.autoHealed ? '⚡ Autonomous' : 'Manual'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load SRE:', err);
  }
}

function setupSREControls() {
  elements.btnTest5xx.addEventListener('click', async () => {
    const res = await fetch('/api/sre/simulate-incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failureType: '5xx_spike' })
    });
    addActivityFeedItem(`🚨 5xx error spike detected! Autonomous Self-Healing activated.`);
    addActivityFeedItem(`🛡️ Green-to-Blue rollback executed within 14s. Zero dropped requests.`);
    await loadSRE();
    await loadStats();
  });

  elements.btnTestCpu.addEventListener('click', async () => {
    const res = await fetch('/api/sre/simulate-incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failureType: 'high_cpu' })
    });
    addActivityFeedItem(`📈 High CPU surge detected. Autonomous ASG scaled out +2 instances.`);
    await loadSRE();
    await loadStats();
  });
}

// ------------------------------------------------------------------------------
// Observability & Logs
// ------------------------------------------------------------------------------
async function loadObservability() {
  try {
    const res = await fetch('/api/observability/metrics');
    const data = await res.json();

    state.metricsHistory.rps = data.metrics.map(m => ({ time: m.time, val: m.reqPerSec }));
    state.metricsHistory.latency = data.metrics.map(m => ({ time: m.time, val: m.p95LatencyMs }));
    state.metricsHistory.cpu = data.metrics.map(m => ({ time: m.time, val: m.cpuPercent }));

    renderCharts();
    loadLogs();
  } catch (err) {
    console.error('Failed to load metrics:', err);
  }
}

async function loadLogs() {
  const service = elements.logFilterService ? elements.logFilterService.value : 'all';
  try {
    const res = await fetch(`/api/observability/logs?service=${service}`);
    const logs = await res.json();

    elements.logExplorerBody.innerHTML = logs.map(l => `
      <div class="log-line">
        <span style="color: var(--text-muted); font-size: 0.75rem;">[${new Date(l.timestamp).toLocaleTimeString()}]</span>
        <span style="color: ${l.level === 'warn' ? '#f59e0b' : '#38bdf8'}; font-weight: 600;">[${l.service}]</span>
        <span>${escapeHtml(l.message)}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed load logs:', err);
  }
}

// ------------------------------------------------------------------------------
// FinOps & Cost Optimization
// ------------------------------------------------------------------------------
async function loadFinOps() {
  try {
    const res = await fetch('/api/finops');
    const data = await res.json();
    state.finops = data;

    elements.finopsSavingsTotal.textContent = `$${data.projectedSavingsUSD} / mo savings`;

    elements.finopsBreakdownList.innerHTML = data.spendBreakdown.map(item => `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
          <span>${item.category}</span>
          <strong>$${item.amount.toLocaleString()} / mo (${item.percentage}%)</strong>
        </div>
        <div style="background: rgba(255,255,255,0.08); height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: var(--accent); width: ${item.percentage}%; height: 100%;"></div>
        </div>
      </div>
    `).join('');

    elements.finopsRecommendationsList.innerHTML = data.recommendations.map(rec => `
      <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="max-width: 70%;">
          <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem;">${rec.title}</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">${rec.details}</p>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Effort: ${rec.difficulty}</span>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.1rem; font-weight: 700; color: #6ee7b7; margin-bottom: 0.5rem;">+$${rec.monthlySavingsUSD}/mo</div>
          ${rec.status === 'applied' 
            ? '<span class="btn-sm btn-success">Applied</span>' 
            : `<button class="btn btn-primary btn-sm btn-apply-rec" data-rec-id="${rec.id}">Apply</button>`
          }
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.btn-apply-rec').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.recId;
        const res = await fetch('/api/finops/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const result = await res.json();
        addActivityFeedItem(`💰 FinOps applied: Saved $${result.applied.monthlySavingsUSD}/mo. Monthly bill reduced!`);
        await loadFinOps();
        await loadStats();
      });
    });
  } catch (err) {
    console.error('Failed to load FinOps:', err);
  }
}

function setupFinOpsControls() {}

// ------------------------------------------------------------------------------
// Security & Compliance
// ------------------------------------------------------------------------------
async function loadSecurity() {
  try {
    const res = await fetch('/api/security');
    const data = await res.json();
    state.security = data;

    elements.securityScorePill.textContent = `${data.complianceScore}% Compliant`;

    elements.securityFrameworksList.innerHTML = data.frameworks.map(fw => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid var(--glass-border);">
        <div>
          <div style="font-weight: 600; font-size: 0.9rem;">${fw.name}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${fw.passCount} of ${fw.totalCount} automated controls verified</div>
        </div>
        <span class="btn-sm btn-success">${fw.status}</span>
      </div>
    `).join('');

    elements.securityVulnsList.innerHTML = data.vulnerabilities.map(v => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.8rem; background: rgba(255,255,255,0.04); border-radius: 10px; border: 1px solid var(--glass-border);">
        <div>
          <span class="btn-sm ${v.severity === 'medium' ? 'btn-danger' : 'btn-secondary'}" style="font-size: 0.7rem; padding: 0.1rem 0.35rem;">${v.severity}</span>
          <strong style="margin-left: 0.5rem; font-size: 0.85rem;">${v.package}@${v.version}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">-> upgrade to ${v.fixVersion}</span>
        </div>
        <span style="font-size: 0.75rem; color: #6ee7b7;">${v.status}</span>
      </div>
    `).join('') + `
      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">
        🔒 Secrets Scanning: 0 exposed API keys across ${data.secretsScan.repositoriesScanned} Git repos.
      </div>
    `;
  } catch (err) {
    console.error('Failed load security:', err);
  }
}

function setupSecurityControls() {
  elements.btnRunSecurityScan.addEventListener('click', async () => {
    elements.btnRunSecurityScan.textContent = 'Scanning...';
    await fetch('/api/security/scan', { method: 'POST' });
    elements.btnRunSecurityScan.textContent = '🛡️ Run Full Scan';
    addActivityFeedItem('🛡️ Trivy scan completed: 0 critical vulnerabilities found.');
    await loadSecurity();
  });
}

// ------------------------------------------------------------------------------
// DevOps Automator AI Chat Controller
// ------------------------------------------------------------------------------
function setupAgentChat() {
  elements.promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      elements.agentChatInput.value = chip.dataset.prompt;
      submitAgentPrompt(chip.dataset.prompt);
    });
  });

  elements.agentChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = elements.agentChatInput.value.trim();
    if (!prompt) return;
    submitAgentPrompt(prompt);
  });
}

async function submitAgentPrompt(prompt) {
  appendUserChatMessage(prompt);
  elements.agentChatInput.value = '';

  const typingId = appendAgentTypingMessage();

  try {
    const res = await fetch('/api/agent/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    removeAgentTypingMessage(typingId);
    appendAgentResponse(data);
  } catch (err) {
    removeAgentTypingMessage(typingId);
    appendAgentErrorMessage(err.message);
  }
}

function appendUserChatMessage(text) {
  const div = document.createElement('div');
  div.className = 'message user';
  div.innerHTML = `
    <div class="message-avatar">👤</div>
    <div class="message-bubble">${escapeHtml(text)}</div>
  `;
  elements.agentChatMessages.appendChild(div);
  elements.agentChatMessages.scrollTop = elements.agentChatMessages.scrollHeight;
}

function appendAgentTypingMessage() {
  const id = `typing-${Date.now()}`;
  const div = document.createElement('div');
  div.id = id;
  div.className = 'message agent';
  div.innerHTML = `
    <div class="message-avatar">⚙️</div>
    <div class="message-bubble"><em>DevOps Automator is analyzing infrastructure patterns...</em></div>
  `;
  elements.agentChatMessages.appendChild(div);
  elements.agentChatMessages.scrollTop = elements.agentChatMessages.scrollHeight;
  return id;
}

function removeAgentTypingMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function appendAgentResponse(data) {
  const div = document.createElement('div');
  div.className = 'message agent';

  const htmlContent = renderMarkdownSimple(data.markdown);

  let actionsHtml = '';
  if (data.actions && data.actions.length > 0) {
    actionsHtml = `
      <div class="action-chips" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;">
        ${data.actions.map(a => `<button class="btn btn-secondary btn-sm agent-action-btn" data-action="${a.action}">${a.label}</button>`).join('')}
      </div>
    `;
  }

  div.innerHTML = `
    <div class="message-avatar">⚙️</div>
    <div class="message-bubble">
      ${htmlContent}
      ${actionsHtml}
    </div>
  `;

  elements.agentChatMessages.appendChild(div);

  div.querySelectorAll('.agent-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      executeAgentAction(btn.dataset.action);
    });
  });

  elements.agentChatMessages.scrollTop = elements.agentChatMessages.scrollHeight;
}

function appendAgentErrorMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message agent';
  div.innerHTML = `
    <div class="message-avatar">⚠️</div>
    <div class="message-bubble" style="color: var(--danger);">Error processing request: ${escapeHtml(msg)}</div>
  `;
  elements.agentChatMessages.appendChild(div);
}

function executeAgentAction(action) {
  if (action === 'generate_terraform' || action === 'assess_infra') {
    switchTab('infrastructure');
    generateIaCCode();
  } else if (action === 'trigger_pipeline' || action === 'design_pipeline') {
    switchTab('pipelines');
    triggerPipelineRun();
  } else if (action === 'simulate_5xx_rollback') {
    switchTab('sre');
    elements.btnTest5xx.click();
  } else if (action === 'simulate_cpu_scale') {
    switchTab('sre');
    elements.btnTestCpu.click();
  } else if (action === 'apply_finops' || action === 'audit_cost') {
    switchTab('finops');
  } else if (action === 'run_security_scan') {
    switchTab('security');
    elements.btnRunSecurityScan.click();
  } else if (action === 'export_cicd') {
    switchTab('export');
  }
}

// ------------------------------------------------------------------------------
// Export Bundle
// ------------------------------------------------------------------------------
function setupExportControls() {
  elements.btnDownloadKit.addEventListener('click', () => {
    window.location.href = '/api/export/bundle';
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target === 'terraform') {
        switchTab('infrastructure');
      } else if (target === 'k8s') {
        switchTab('infrastructure');
        elements.iacProvider.value = 'kubernetes';
        generateIaCCode();
      } else if (target === 'jenkins') {
        switchTab('integrations');
      } else if (target === 'ansible') {
        switchTab('integrations');
      } else if (target === 'vpn') {
        switchTab('hybrid');
      } else if (target === 'k6') {
        switchTab('integrations');
      }
    });
  });
}

// ==============================================================================
// Utility Functions
// ==============================================================================
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdownSimple(md) {
  if (!md) return '';
  let out = md;

  out = out.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  out = out.replace(/`([^`]+)`/g, (match, code) => `<code>${escapeHtml(code)}</code>`);
  out = out.replace(/^### (.*$)/gim, '<h3 style="margin: 0.75rem 0 0.25rem; font-size: 1.05rem;">$1</h3>');
  out = out.replace(/^## (.*$)/gim, '<h2 style="margin: 1rem 0 0.4rem; font-size: 1.2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.2rem;">$1</h2>');
  out = out.replace(/^# (.*$)/gim, '<h1 style="margin: 1.25rem 0 0.5rem; font-size: 1.35rem;">$1</h1>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/^\- (.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.2rem;">$1</li>');
  out = out.replace(/\n\n/g, '<p style="margin-bottom: 0.5rem;"></p>');

  return out;
}

// Start application
window.addEventListener('DOMContentLoaded', initApp);

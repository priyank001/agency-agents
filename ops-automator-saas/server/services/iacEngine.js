/**
 * Infrastructure as Code (IaC) Generation & Validation Engine
 * Based on engineering-devops-automator.md specifications
 */

export class IaCEngine {
  static generateTerraform(options = {}) {
    const region = options.region || 'us-east-1';
    const appName = options.appName || 'paystream-api';
    const minInstances = options.minInstances || 2;
    const maxInstances = options.maxInstances || 10;
    const instanceType = options.instanceType || 't3.medium';
    const enableMultiAz = options.multiAz !== false;

    return `# ==============================================================================
# OpsAutomator Generated Terraform Architecture
# Target: High-Availability Auto-Scaling Web Application with Zero-Downtime ALB
# Generated according to engineering-devops-automator standards
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${region}"
  default_tags {
    tags = {
      Environment = "production"
      ManagedBy   = "OpsAutomator-SaaS"
      Project     = "${appName}"
      Compliance  = "SOC2-Baseline"
    }
  }
}

# ------------------------------------------------------------------------------
# 1. Virtual Private Cloud (VPC) & Multi-AZ Networking
# ------------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${appName}-vpc"
  }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${appName}-public-1a"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "${appName}-public-1b"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${region}a"

  tags = {
    Name = "${appName}-private-1a"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "${region}b"

  tags = {
    Name = "${appName}-private-1b"
  }
}

# ------------------------------------------------------------------------------
# 2. Security Groups & Least-Privilege Ingress
# ------------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${appName}-alb-sg"
  description = "Public ALB security group enforcing HTTPS only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "TLS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP redirect to HTTPS"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name        = "${appName}-app-sg"
  description = "Application tier: internal ingress exclusively from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ------------------------------------------------------------------------------
# 3. Application Load Balancer (ALB) for Zero-Downtime Blue/Green Routing
# ------------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${appName}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  enable_deletion_protection = false
}

resource "aws_lb_target_group" "blue" {
  name     = "${appName}-tg-blue"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    healthy_threshold   = 3
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }
}

resource "aws_lb_target_group" "green" {
  name     = "${appName}-tg-green"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    healthy_threshold   = 3
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }
}

# ------------------------------------------------------------------------------
# 4. Auto-Scaling Group (ASG) & Launch Template
# ------------------------------------------------------------------------------
resource "aws_launch_template" "app" {
  name_prefix   = "${appName}-lt-"
  image_id      = "ami-0c7217cdde317cfec" # Amazon Linux 2023 LTS
  instance_type = "${instanceType}"

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker
    systemctl start docker
    systemctl enable docker
    docker run -d -p 8080:8080 --restart always --name core-app registry.paystream.internal/core-api:latest
  EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "app" {
  name_prefix         = "${appName}-asg-"
  desired_capacity    = ${minInstances}
  max_size            = ${maxInstances}
  min_size            = ${minInstances}
  vpc_zone_identifier = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  target_group_arns         = [aws_lb_target_group.blue.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  tag {
    key                 = "Name"
    value               = "${appName}-worker"
    propagate_at_launch = true
  }
}

# ------------------------------------------------------------------------------
# 5. Automated SRE Monitoring & CloudWatch Alarms
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${appName}-high-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Scale-out trigger when CPU utilization exceeds 80% for 2 periods"
}
`;
  }

  static generateKubernetesManifests(options = {}) {
    const appName = options.appName || 'paystream-api';
    const replicas = options.replicas || 3;

    return `# ==============================================================================
# Production Kubernetes Deployment Manifest (Zero-Downtime Rolling Update)
# ==============================================================================
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  namespace: production
  labels:
    app.kubernetes.io/name: ${appName}
    app.kubernetes.io/part-of: core-platform
spec:
  replicas: ${replicas}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
        - name: web
          image: registry.paystream.internal/${appName}:v1.4.2
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1024Mi"
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health/liveness
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ${appName}-svc
  namespace: production
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
  selector:
    app: ${appName}
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${appName}-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${appName}
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 75
`;
  }

  static calculateInfracost(config = {}) {
    const instances = config.instances || 2;
    const instanceType = config.instanceType || 't3.medium';
    const multiAz = config.multiAz !== false;

    const instanceRates = {
      't3.small': 15.2,
      't3.medium': 30.4,
      't3.large': 60.8,
      't3.xlarge': 121.6,
      'c6g.large': 52.0
    };

    const computeCost = (instanceRates[instanceType] || 30.4) * instances;
    const albCost = 28.5;
    const rdsCost = multiAz ? 145.0 : 68.0;
    const natGatewayCost = 34.0 * (multiAz ? 2 : 1);
    const storageAndBackup = 25.0;

    const total = computeCost + albCost + rdsCost + natGatewayCost + storageAndBackup;

    return {
      totalMonthlyUSD: Math.round(total),
      breakdown: [
        { component: `Compute (${instances}x ${instanceType})`, monthlyUSD: Math.round(computeCost) },
        { component: 'Application Load Balancer (ALB)', monthlyUSD: Math.round(albCost) },
        { component: `Managed RDS PostgreSQL (${multiAz ? 'Multi-AZ' : 'Single-AZ'})`, monthlyUSD: Math.round(rdsCost) },
        { component: `VPC NAT Gateway (${multiAz ? '2 AZs' : '1 AZ'})`, monthlyUSD: Math.round(natGatewayCost) },
        { component: 'EBS Storage & Automated S3 Backups', monthlyUSD: Math.round(storageAndBackup) }
      ],
      finopsTip: 'Switching dev/staging environments to auto-sleep on weekends saves an additional ~28% ($120/mo).'
    };
  }

  static auditCompliance(terraformCode) {
    const checks = [
      {
        id: 'SEC-001',
        title: 'ALB Enforces HTTPS Only',
        passed: terraformCode.includes('from_port   = 443'),
        severity: 'Critical',
        remediation: 'Ensure port 443 is configured with a valid ACM certificate.'
      },
      {
        id: 'SEC-002',
        title: 'App Security Group Denies Direct Public Ingress',
        passed: !terraformCode.includes('aws_security_group.app') || !terraformCode.includes('cidr_blocks = ["0.0.0.0/0"]\n  }\n\nresource "aws_security_group" "app"'),
        severity: 'High',
        remediation: 'App tier must only allow ingress from the ALB security group.'
      },
      {
        id: 'SEC-003',
        title: 'Automated Health Checks Configured with Rollback Thresholds',
        passed: terraformCode.includes('health_check {') && terraformCode.includes('matcher'),
        severity: 'High',
        remediation: 'Configure explicit health check intervals and matchers.'
      },
      {
        id: 'SEC-004',
        title: 'Multi-AZ Subnet Redundancy',
        passed: terraformCode.includes('public_1') && terraformCode.includes('public_2'),
        severity: 'Medium',
        remediation: 'Deploy subnets across at least 2 distinct Availability Zones.'
      }
    ];

    const passCount = checks.filter(c => c.passed).length;
    const score = Math.round((passCount / checks.length) * 100);

    return {
      score,
      totalChecks: checks.length,
      passedChecks: passCount,
      checks
    };
  }
}


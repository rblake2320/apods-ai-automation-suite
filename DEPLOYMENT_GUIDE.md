# APODS AI-Automation Suite - Comprehensive Deployment Guide

This guide provides detailed instructions for deploying the APODS AI-Automation Suite in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployments](#cloud-deployments)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB
- OS: Linux (Ubuntu 20.04+ recommended)

**Recommended for Production:**
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 50+ GB SSD
- OS: Linux (Ubuntu 22.04 LTS)

### Software Requirements

- Docker >= 24.0
- Docker Compose >= 2.20
- Node.js >= 20.0 (if building locally)
- Python >= 3.12 (if running scripts)
- kubectl >= 1.28 (for Kubernetes deployments)
- Helm >= 3.12 (optional, for Helm deployments)

## Environment Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/rblake2320/apods-ai-automation-suite.git
cd apods-ai-automation-suite
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Application
NODE_ENV=production
APP_PORT=8000
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/apods
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-strong-secret-key-change-this
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-domain.com

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
```

## Deployment Options

### Option 1: Docker Compose (Recommended for Development/Small Scale)

Easiest way to get started. All services run in containers.

### Option 2: Kubernetes (Recommended for Production)

Scalable, production-ready deployment with high availability.

### Option 3: Cloud Platform (AWS, GCP, Azure)

Managed services with auto-scaling and monitoring.

### Option 4: Manual Installation

Direct installation on bare metal or VMs.

## Docker Deployment

### Development Environment

```bash
# Build and start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PgAdmin: http://localhost:5050

### Production Environment

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Docker Compose Configuration

The production setup includes:
- **Frontend**: Nginx serving optimized static files
- **Backend**: Node.js API server
- **PostgreSQL**: Database with persistence
- **Redis**: Caching and session storage
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

### SSL/TLS Configuration

1. **Generate SSL Certificates**

```bash
# Using Let's Encrypt
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com
```

2. **Update Nginx Configuration**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Rest of configuration...
}
```

3. **Mount Certificates in Docker**

```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

## Kubernetes Deployment

### 1. Prepare Kubernetes Cluster

```bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

### 2. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 3. Configure Secrets

```bash
# Create secrets from .env file
kubectl create secret generic apods-secrets \
  --from-env-file=.env \
  -n apods-ai

# Or create individual secrets
kubectl create secret generic db-credentials \
  --from-literal=username=dbuser \
  --from-literal=password=dbpassword \
  -n apods-ai
```

### 4. Deploy ConfigMaps

```bash
kubectl apply -f k8s/configmap.yaml
```

### 5. Deploy Database (PostgreSQL)

```bash
kubectl apply -f k8s/postgres-deployment.yaml
```

### 6. Deploy Redis

```bash
kubectl apply -f k8s/redis-deployment.yaml
```

### 7. Deploy Backend

```bash
kubectl apply -f k8s/backend-deployment.yaml
```

### 8. Deploy Frontend

```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

### 9. Configure Ingress

```bash
kubectl apply -f k8s/ingress.yaml
```

### 10. Verify Deployment

```bash
# Check all resources
kubectl get all -n apods-ai

# Check pods status
kubectl get pods -n apods-ai

# View logs
kubectl logs -f deployment/backend -n apods-ai

# Check services
kubectl get svc -n apods-ai
```

### Auto-Scaling Configuration

The deployments include Horizontal Pod Autoscaler (HPA):

```bash
# Check HPA status
kubectl get hpa -n apods-ai

# Scale manually if needed
kubectl scale deployment backend --replicas=5 -n apods-ai
```

## Cloud Deployments

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Build and Push Images**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t apods-frontend:latest ./apps/frontend
docker tag apods-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/apods-frontend:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/apods-frontend:latest
```

2. **Create ECS Task Definitions**

3. **Configure Load Balancer**

4. **Set up Auto Scaling**

#### Using EKS (Elastic Kubernetes Service)

```bash
# Create cluster
eksctl create cluster --name apods-cluster --region us-east-1

# Configure kubectl
aws eks update-kubeconfig --name apods-cluster --region us-east-1

# Deploy using k8s manifests
kubectl apply -f k8s/
```

### Google Cloud Platform

```bash
# Create GKE cluster
gcloud container clusters create apods-cluster \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --region=us-central1

# Deploy application
kubectl apply -f k8s/
```

### Microsoft Azure

```bash
# Create AKS cluster
az aks create \
  --resource-group apods-rg \
  --name apods-cluster \
  --node-count 3 \
  --enable-addons monitoring

# Get credentials
az aks get-credentials --resource-group apods-rg --name apods-cluster

# Deploy application
kubectl apply -f k8s/
```

## Monitoring and Maintenance

### Prometheus Metrics

Access Prometheus at: http://your-domain.com:9090

Key metrics to monitor:
- `http_requests_total`
- `http_request_duration_seconds`
- `process_cpu_seconds_total`
- `nodejs_heap_size_used_bytes`

### Grafana Dashboards

Access Grafana at: http://your-domain.com:3001

Default credentials:
- Username: admin
- Password: admin (change immediately)

Import the provided dashboard: `monitoring/grafana-dashboard.json`

### Health Checks

```bash
# Backend health
curl http://your-api-domain.com/health

# Liveness probe
curl http://your-api-domain.com/alive

# Readiness probe
curl http://your-api-domain.com/ready
```

### Log Management

#### Docker Logs

```bash
# View logs
docker-compose logs -f app

# Export logs
docker-compose logs --no-color > app.log
```

#### Kubernetes Logs

```bash
# View pod logs
kubectl logs -f deployment/backend -n apods-ai

# View previous container logs
kubectl logs deployment/backend --previous -n apods-ai

# Stream logs from multiple pods
kubectl logs -f -l app=backend -n apods-ai
```

### Database Backups

#### Automated Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker exec postgres pg_dump -U apods_user apods_db > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab
crontab -e
0 2 * * * /path/to/backup.sh
```

#### Manual Backup

```bash
# Backup database
docker exec postgres pg_dump -U apods_user apods_db > backup.sql

# Restore database
docker exec -i postgres psql -U apods_user apods_db < backup.sql
```

### Updates and Rollbacks

#### Docker Updates

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d
```

#### Kubernetes Rolling Update

```bash
# Update image
kubectl set image deployment/backend backend=apods-backend:v2.0 -n apods-ai

# Check rollout status
kubectl rollout status deployment/backend -n apods-ai

# Rollback if needed
kubectl rollout undo deployment/backend -n apods-ai
```

## Troubleshooting

### Common Issues

#### 1. Service Not Starting

```bash
# Check logs
docker-compose logs app

# Check container status
docker-compose ps

# Restart service
docker-compose restart app
```

#### 2. Database Connection Errors

```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker exec -it postgres psql -U apods_user -d apods_db
```

#### 3. High Memory Usage

```bash
# Check resource usage
docker stats

# Adjust memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

#### 4. SSL Certificate Issues

```bash
# Verify certificate validity
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout

# Renew Let's Encrypt certificate
certbot renew --dry-run
```

### Performance Optimization

1. **Enable Redis Caching**
2. **Configure CDN for static assets**
3. **Optimize database queries**
4. **Use connection pooling**
5. **Enable gzip compression**

### Security Checklist

- [ ] Change all default passwords
- [ ] Configure firewall rules
- [ ] Enable SSL/TLS
- [ ] Set up rate limiting
- [ ] Regular security updates
- [ ] Configure CORS properly
- [ ] Use secrets management
- [ ] Enable audit logging
- [ ] Set up intrusion detection
- [ ] Regular vulnerability scans

## Support

For issues and questions:
- GitHub Issues: https://github.com/rblake2320/apods-ai-automation-suite/issues
- Documentation: https://github.com/rblake2320/apods-ai-automation-suite/docs

## License

MIT License - See LICENSE file for details

# APODS AI-Automation Suite - Deployment Guide

## Prerequisites

### System Requirements

- Node.js 20.x or higher
- pnpm 8.x or higher
- Docker 24.x or higher
- Docker Compose 2.x or higher
- Kubernetes 1.28+ (for production)
- PostgreSQL 16.x
- Redis 7.x

### Required Accounts

- GitHub account (for CI/CD)
- Cloud provider account (AWS/GCP/Azure)
- Domain and SSL certificates

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/rblake2320/apods-ai-automation-suite.git
cd apods-ai-automation-suite
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
# Root environment
cp .env.example .env

# Frontend environment
cp apps/frontend/.env.example apps/frontend/.env.local

# Backend environment
cp apps/backend/.env.example apps/backend/.env
```

Edit the `.env` files with your configuration.

### 4. Start Development Environment

```bash
# Using Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or run services individually
pnpm dev
```

### 5. Access Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PgAdmin: http://localhost:5050
- Redis Commander: http://localhost:8081

## Docker Deployment

### Build Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Run Services

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Stop Services

```bash
docker-compose down

# Remove volumes
docker-compose down -v
```

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
# Install helm
# Configure kubectl to connect to your cluster
```

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Configure Secrets

```bash
# Create secrets from file
kubectl create secret generic apods-secrets \
  --from-file=.env.production \
  --namespace=apods

# Or create secrets manually
kubectl create secret generic apods-secrets \
  --from-literal=JWT_SECRET='your-secret-here' \
  --from-literal=DATABASE_URL='postgresql://...' \
  --namespace=apods
```

### 3. Apply ConfigMaps

```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Deploy Database

```bash
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
```

Wait for databases to be ready:

```bash
kubectl wait --for=condition=ready pod -l component=postgres --namespace=apods --timeout=300s
kubectl wait --for=condition=ready pod -l component=redis --namespace=apods --timeout=300s
```

### 5. Deploy Application

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

### 6. Configure Ingress

```bash
# Install cert-manager for SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Apply ingress configuration
kubectl apply -f k8s/ingress.yaml
```

### 7. Verify Deployment

```bash
# Check all pods
kubectl get pods -n apods

# Check services
kubectl get services -n apods

# Check ingress
kubectl get ingress -n apods

# View logs
kubectl logs -f deployment/apods-backend -n apods
kubectl logs -f deployment/apods-frontend -n apods
```

## Database Migrations

### Run Migrations

```bash
# Development
pnpm --filter backend migrate

# Production (in Kubernetes)
kubectl exec -it deployment/apods-backend -n apods -- npm run migrate
```

## SSL/TLS Configuration

### Let's Encrypt (Automated)

```bash
# Already configured in k8s/ingress.yaml
# Cert-manager will automatically obtain certificates
```

### Custom Certificates

```bash
# Create TLS secret
kubectl create secret tls apods-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  --namespace=apods
```

## Monitoring Setup

### Prometheus

```bash
# Install Prometheus operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Apply custom configuration
kubectl apply -f monitoring/prometheus.yml
```

### Grafana

```bash
# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Import dashboard
# Navigate to http://localhost:3000
# Import monitoring/grafana-dashboard.json
```

## Backup and Restore

### Backup Database

```bash
# Manual backup
kubectl exec -it apods-postgres-0 -n apods -- \
  pg_dump -U apods apods > backup-$(date +%Y%m%d).sql

# Automated backup (CronJob)
kubectl apply -f k8s/backup-cronjob.yaml
```

### Restore Database

```bash
# Copy backup to pod
kubectl cp backup.sql apods-postgres-0:/tmp/backup.sql -n apods

# Restore
kubectl exec -it apods-postgres-0 -n apods -- \
  psql -U apods apods < /tmp/backup.sql
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment apods-backend --replicas=5 -n apods

# Scale frontend
kubectl scale deployment apods-frontend --replicas=3 -n apods
```

### Auto-scaling

Auto-scaling is already configured via HPA in deployment files.

```bash
# Check HPA status
kubectl get hpa -n apods
```

## Rollback

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/apods-backend -n apods

# Rollback to previous version
kubectl rollout undo deployment/apods-backend -n apods

# Rollback to specific revision
kubectl rollout undo deployment/apods-backend --to-revision=2 -n apods
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n apods
kubectl describe pod <pod-name> -n apods
```

### View Logs

```bash
# Recent logs
kubectl logs deployment/apods-backend -n apods

# Follow logs
kubectl logs -f deployment/apods-backend -n apods

# Previous container logs (if crashed)
kubectl logs deployment/apods-backend -n apods --previous
```

### Check Events

```bash
kubectl get events -n apods --sort-by='.lastTimestamp'
```

### Debug Container

```bash
# Execute shell in container
kubectl exec -it deployment/apods-backend -n apods -- /bin/sh

# Run diagnostics
kubectl exec -it deployment/apods-backend -n apods -- npm run health-check
```

### Common Issues

**Pod stuck in Pending:**

- Check resource quotas
- Verify PVC is bound
- Check node resources

**Pod CrashLoopBackOff:**

- Check logs: `kubectl logs`
- Verify environment variables
- Check database connectivity

**Service not accessible:**

- Verify service selectors
- Check ingress configuration
- Verify DNS resolution

## Security Checklist

- [ ] All secrets configured properly
- [ ] SSL/TLS certificates installed
- [ ] Network policies applied
- [ ] RBAC configured
- [ ] Pod security policies enforced
- [ ] Regular security scans scheduled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

## Performance Optimization

### Database Optimization

- Enable connection pooling
- Configure proper indexes
- Regular VACUUM and ANALYZE
- Monitor slow queries

### Cache Optimization

- Configure Redis maxmemory
- Set appropriate TTLs
- Monitor cache hit ratio

### Application Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement response caching
- Optimize database queries

## Maintenance

### Regular Tasks

**Daily:**

- Monitor application logs
- Check system metrics
- Verify backups completed

**Weekly:**

- Review security scan results
- Update dependencies
- Check disk space
- Review performance metrics

**Monthly:**

- Security audits
- Load testing
- Capacity planning
- Review and update documentation

## Support

For issues and questions:

- GitHub Issues: https://github.com/rblake2320/apods-ai-automation-suite/issues
- Documentation: https://docs.apods.example.com
- Email: support@apods.example.com

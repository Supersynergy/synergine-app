# Synergine App — Deployment Checklist

**Last Updated:** March 18, 2026
**Status:** Ready for Development/Staging/Production

---

## Pre-Deployment Verification

### Infrastructure Setup

- [ ] **Colima/Docker Installation**
  ```bash
  make colima-start  # Auto-starts with optimized settings
  # or
  colima start --vm-type vz --arch aarch64 --cpu 8 --memory 16 --disk 60 --mount-type virtiofs --vz-rosetta --runtime docker
  ```

- [ ] **Docker Compose & Bun**
  ```bash
  docker --version          # 24.0+
  docker compose --version  # 2.20+
  bun --version             # Latest
  ```

- [ ] **.env Configuration**
  ```bash
  cp env.example .env
  # Review and update sensitive values
  make env-check
  ```

### Service Health

- [ ] **All Core Services Running**
  ```bash
  make dev          # Starts everything
  # OR
  ./dev.sh
  ```

- [ ] **Health Checks Passing**
  ```bash
  make health
  ```
  Expected output:
  ```
  SurrealDB:  ✓ HEALTHY
  Dragonfly:  ✓ HEALTHY
  NATS:       ✓ HEALTHY
  ```

- [ ] **Service Ports Available**
  ```bash
  lsof -i :3001     # API
  lsof -i :5173     # Frontend
  lsof -i :8000     # SurrealDB
  lsof -i :6379     # Dragonfly
  lsof -i :4222     # NATS
  ```

---

## Development Environment

### Initial Setup

- [ ] **Clone Repository**
  ```bash
  cd /Users/master/synergine-app
  git status
  ```

- [ ] **Install Dependencies**
  ```bash
  bun install
  ```

- [ ] **Create .env File**
  ```bash
  cp env.example .env
  ```

- [ ] **Start Infrastructure**
  ```bash
  make dev
  # or: ./dev.sh
  ```

### Application Testing

- [ ] **Frontend Accessibility**
  - [ ] http://localhost:5173 loads
  - [ ] No CORS errors
  - [ ] API calls work (http://localhost:3001)

- [ ] **API Functionality**
  - [ ] Health check: `curl http://localhost:3001/health`
  - [ ] Database connection works
  - [ ] Authentication flow functional

- [ ] **Database Connection**
  ```bash
  make db-shell
  # Should show SurrealDB prompt
  ```

### Resource Monitoring

- [ ] **CPU Usage** (target: <50% on 8-core system)
  ```bash
  make docker-stats
  ```

- [ ] **Memory Usage** (target: <8GB of 16GB allocated)
  ```bash
  make docker-stats
  ```

- [ ] **Disk Space** (target: >20GB free)
  ```bash
  df -h /Users/master/synergine-app
  ```

---

## Optional Services Verification

### Monitoring Stack

- [ ] **Langfuse (LLM Observability)**
  ```bash
  docker compose --profile monitoring up -d
  # curl http://localhost:3100
  ```

- [ ] **Uptime Kuma (Health Monitoring)**
  ```bash
  # Visit http://localhost:3200 (auto-starts with monitoring)
  ```

### Logging & Debugging

- [ ] **Dozzle (Docker Logs Viewer)**
  ```bash
  docker compose --profile dashboard up -d
  # Visit http://localhost:9999
  ```

### Full-Text Search

- [ ] **Meilisearch (Optional)**
  ```bash
  docker compose --profile search up -d
  # curl http://localhost:7700/health
  ```

### Reverse Proxy (Production)

- [ ] **Caddy (Gateway)**
  ```bash
  docker compose --profile gateway up -d
  # Configure in infra/Caddyfile
  ```

---

## Staging Deployment

### Pre-Staging Checklist

- [ ] **Code Review**
  - [ ] All commits reviewed
  - [ ] Tests passing: `make test`
  - [ ] Build successful: `make build`

- [ ] **Configuration**
  - [ ] .env updated for staging environment
  - [ ] Database backups created: `make db-export`
  - [ ] Passwords changed from defaults

- [ ] **Database**
  - [ ] Migrations applied
  - [ ] Data integrity verified
  - [ ] Backup location confirmed

### Staging Deployment Steps

1. **Stop Development Environment**
   ```bash
   make stop
   ```

2. **Switch Configuration**
   ```bash
   # Create .env.staging
   cp env.example .env.staging
   # Edit .env.staging with staging values
   ```

3. **Deploy Infrastructure**
   ```bash
   # Option 1: Using existing docker-compose.yml
   docker compose --profile monitoring up -d

   # Option 2: With gateway
   docker compose --profile monitoring --profile gateway up -d
   ```

4. **Verify Staging Setup**
   ```bash
   # Check health
   curl http://staging-domain.com/health

   # Check Langfuse
   curl http://staging-domain.com:3100/api/health
   ```

5. **Monitor for Issues**
   ```bash
   docker compose logs -f
   ```

---

## Production Deployment

### Production Readiness

- [ ] **Security Audit**
  - [ ] All default credentials changed
  - [ ] Secrets in environment variables (not .env)
  - [ ] SSL/TLS enabled (via Caddy or reverse proxy)
  - [ ] Database password strong (32+ characters)
  - [ ] API keys stored securely

- [ ] **Database**
  - [ ] PostgreSQL or managed DB for production
  - [ ] Automated backups configured
  - [ ] Replication set up
  - [ ] Connection pooling enabled

- [ ] **Monitoring**
  - [ ] Langfuse connected to prod logging
  - [ ] Uptime Kuma watching all endpoints
  - [ ] Alerts configured
  - [ ] Error tracking enabled (Sentry, etc.)

- [ ] **Performance**
  - [ ] Load testing completed
  - [ ] Cache hit rates acceptable (>60% for Dragonfly)
  - [ ] API response times <200ms p95
  - [ ] Database query times <50ms p95

### Production Deployment Process

1. **Pre-flight Checks**
   ```bash
   # On production machine:
   docker --version
   colima status        # or docker info
   free -h              # Check available memory
   df -h                # Check disk space
   ```

2. **Deploy Services**
   ```bash
   # Pull latest images
   docker compose pull

   # Start with monitoring
   docker compose --profile monitoring --profile gateway up -d

   # OR start with custom config
   docker compose -f docker-compose.prod.yml up -d
   ```

3. **Verify Deployment**
   ```bash
   docker compose ps

   # Check service health
   curl https://api.domain.com/health
   curl https://api.domain.com:3100/api/health  # Langfuse
   ```

4. **Monitor First 24 Hours**
   - [ ] Check error rates
   - [ ] Monitor resource usage
   - [ ] Verify backups running
   - [ ] Test recovery procedures

---

## Security Checklist

### Development Environment
- [ ] `.env` file created and .gitignored
- [ ] No secrets in source code
- [ ] Local database only (SQLite or local PostgreSQL)
- [ ] Localhost access only

### Staging Environment
- [ ] Strong passwords (16+ characters)
- [ ] SSL/TLS enabled
- [ ] Database backups enabled
- [ ] Monitoring active
- [ ] Error logs checked daily

### Production Environment
- [ ] All default credentials changed
- [ ] Secrets in environment manager (AWS Secrets, Vault, etc.)
- [ ] SSL/TLS with valid certificates
- [ ] Database encryption at rest
- [ ] Network isolation (firewalls, VPNs)
- [ ] DDoS protection (if needed)
- [ ] Regular security audits
- [ ] Incident response plan

---

## Backup & Recovery

### Backup Strategy

- [ ] **Database Backups**
  ```bash
  # Manual backup
  make db-export  # Creates backup.json

  # Automated backups (cron)
  0 2 * * * cd /path && make db-export && mv backup.json backups/$(date +%Y%m%d_%H%M%S).json
  ```

- [ ] **Volume Backups**
  - [ ] surrealdb-data mounted on persistent storage
  - [ ] dragonfly-data backed up daily
  - [ ] nats-data retention policy set

- [ ] **Backup Location**
  - [ ] Off-site storage (S3, etc.)
  - [ ] Encryption enabled
  - [ ] Retention policy enforced
  - [ ] Recovery tested quarterly

### Recovery Procedures

- [ ] **Database Recovery**
  ```bash
  # Restore from backup
  docker exec synergine-surrealdb surreal import \
    --username root \
    --password synergine \
    rocksdb:/data/surreal.db < backup.json
  ```

- [ ] **Volume Recovery**
  ```bash
  # For docker volumes, restore from snapshot
  docker run --rm -v surrealdb-data:/data -v /backup:/backup \
    alpine cp /backup/surreal.db /data/
  ```

- [ ] **Full Stack Recovery**
  1. Stop all containers: `make stop`
  2. Restore volumes from backup
  3. Start fresh: `make dev`

---

## Monitoring & Maintenance

### Daily Checks
- [ ] All services healthy: `make health`
- [ ] No error spikes in logs: `make logs`
- [ ] Resource usage normal: `make docker-stats`
- [ ] Backups completed successfully

### Weekly Checks
- [ ] Review error logs
- [ ] Check API response times
- [ ] Verify database performance
- [ ] Update dependencies: `bun upgrade`

### Monthly Checks
- [ ] Security updates applied
- [ ] Database optimization (vacuum, analyze)
- [ ] Disaster recovery drill
- [ ] Performance review

### Quarterly Checks
- [ ] Security audit
- [ ] Capacity planning
- [ ] Cost optimization
- [ ] Architecture review

---

## Service-Specific Checks

### SurrealDB (8000)
```bash
# Health check
curl http://localhost:8000/health

# Connect to shell
make db-shell

# Export backup
make db-export

# Monitor storage
du -sh /path/to/surrealdb-data
```

### Dragonfly (6379)
```bash
# Health check
docker exec synergine-dragonfly redis-cli ping

# Check memory
docker exec synergine-dragonfly redis-cli info memory

# Monitor keys
docker exec synergine-dragonfly redis-cli dbsize
```

### NATS (4222/8222)
```bash
# Health check
curl http://localhost:8222/healthz

# Monitor connections
curl http://localhost:8222/connz

# Check JetStream
curl http://localhost:8222/jsz
```

### Langfuse (3100)
```bash
# Health check
curl http://localhost:3100/api/health

# Check database
docker exec synergine-langfuse-db psql -U langfuse -c "\l"
```

### Uptime Kuma (3200)
```bash
# Web interface
# Visit http://localhost:3200

# Check logs
docker compose logs uptime-kuma
```

### Dozzle (9999)
```bash
# Web interface
# Visit http://localhost:9999

# No configuration needed
```

---

## Rollback Procedures

### Application Rollback
```bash
# Stop current version
make stop

# Checkout previous commit
git checkout <previous-commit>

# Start old version
make dev
```

### Database Rollback
```bash
# Restore from backup
make db-export  # Save current state first
docker exec synergine-surrealdb surreal import \
  --username root --password synergine \
  rocksdb:/data/surreal.db < backup.json

# Restart
make stop
make dev
```

### Full Stack Rollback
1. Backup current state
2. Restore infrastructure from snapshot
3. Restore database from backup
4. Rollback application code
5. Verify all services

---

## Performance Baselines

### Expected Resource Usage

| Component | CPU | Memory | Disk |
|-----------|-----|--------|------|
| SurrealDB | <50% | 500MB | Variable |
| Dragonfly | <20% | 512MB | 1GB cache |
| NATS | <10% | 100MB | Variable |
| App Stack | <30% | 300MB | N/A |
| **Total** | **<100%** (8 cores) | **~1.5GB** | **40GB+** |

### Expected Response Times

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| API health check | <10ms | <20ms | <50ms |
| SurrealDB query | <20ms | <50ms | <100ms |
| Full page load | <500ms | <1000ms | <2000ms |

---

## Incident Response

### Service Down
1. Check health: `make health`
2. Check logs: `make logs`
3. Restart service: `docker compose up -d {service}`
4. Verify recovery: `make health`

### High CPU
1. Check stats: `make docker-stats`
2. Identify service: which has >50% CPU?
3. Check logs: `make logs-{service}`
4. Consider restart or scaling

### Memory Issues
1. Check stats: `make docker-stats`
2. Identify service: which is consuming >75% of limit?
3. Increase limit in docker-compose.yml
4. Restart: `make stop && make dev`

### Database Issues
1. Check connectivity: `make db-shell`
2. Check logs: `make logs-surrealdb`
3. Check disk: `du -sh surrealdb-data/`
4. Restart: `docker compose restart surrealdb`

---

## Sign-Off Checklist

- [ ] All services passing health checks
- [ ] No errors in logs
- [ ] Resource usage within acceptable limits
- [ ] Backups verified and tested
- [ ] Documentation updated
- [ ] Team trained on deployment process
- [ ] Runbook shared with on-call team
- [ ] Monitoring and alerting configured
- [ ] Incident response plan in place
- [ ] Ready for deployment

**Deployed by:** ___________________
**Deployment Date:** ___________________
**Sign-off by:** ___________________

---

## Related Documentation

- **QUICK_START.md** — Quick reference for common commands
- **INFRA_OPTIMIZATION.md** — Detailed optimization guide
- **INFRASTRUCTURE_SUMMARY.md** — Complete summary of changes
- **docker-compose.yml** — Service definitions and profiles
- **env.example** — Environment variable template
- **Makefile** — All development targets

---

## Support Contacts

- **DevOps:** [Team email/Slack]
- **Database:** [Team email/Slack]
- **On-Call:** [Rotation link]
- **Escalation:** [Manager/Director]

---

**Last Review:** March 18, 2026
**Next Review:** June 18, 2026
**Status:** APPROVED

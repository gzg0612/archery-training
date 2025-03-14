# 部署文档

## 1. 系统要求

### 1.1 硬件要求
- CPU: 8核心以上
- 内存: 16GB以上
- 存储: 500GB SSD
- GPU: NVIDIA GPU (用于AI模型推理)

### 1.2 软件要求
- 操作系统: Ubuntu 20.04 LTS
- Docker: 20.10+
- Kubernetes: 1.22+
- NVIDIA Driver: 450.80.02+
- NVIDIA Container Toolkit

### 1.3 网络要求
- 带宽: 100Mbps以上
- 固定IP地址
- 开放端口:
  - 80/443 (HTTP/HTTPS)
  - 6379 (Redis)
  - 5432 (PostgreSQL)
  - 9090 (Prometheus)
  - 3000 (Grafana)

## 2. 开发环境搭建

### 2.1 本地开发环境
```bash
# 安装Go
wget https://golang.org/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装开发工具
go install golang.org/x/tools/cmd/goimports@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

### 2.2 开发环境配置
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: archery
      POSTGRES_USER: archery
      POSTGRES_PASSWORD: archery
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

## 3. 生产环境部署

### 3.1 Kubernetes集群配置
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: archery-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: archery-api
  template:
    metadata:
      labels:
        app: archery-api
    spec:
      containers:
      - name: api
        image: archery/api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: archery-config
              key: db_host
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 3.2 服务配置
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: archery-api
spec:
  selector:
    app: archery-api
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

### 3.3 数据库配置
```yaml
# database-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: archery-config
data:
  db_host: "postgres-service"
  db_port: "5432"
  db_name: "archery"
  redis_host: "redis-service"
  redis_port: "6379"
```

## 4. CI/CD配置

### 4.1 GitHub Actions配置
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Go
      uses: actions/setup-go@v2
      with:
        go-version: 1.21
    
    - name: Run tests
      run: go test ./...
    
    - name: Run linter
      uses: golangci/golangci-lint-action@v2

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Build Docker image
      run: docker build -t archery/api:latest .
    
    - name: Push to registry
      run: |
        docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
        docker push archery/api:latest
```

## 5. 监控配置

### 5.1 Prometheus配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'archery-api'
    static_configs:
      - targets: ['archery-api:8080']
```

### 5.2 Grafana Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Archery Training Dashboard",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "http_request_duration_seconds"
          }
        ]
      }
    ]
  }
}
```

## 6. 安全配置

### 6.1 SSL/TLS配置
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: archery-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.archery-training.com
    secretName: archery-tls
  rules:
  - host: api.archery-training.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: archery-api
            port:
              number: 80
```

### 6.2 网络策略
```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: archery-network-policy
spec:
  podSelector:
    matchLabels:
      app: archery-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

## 7. 备份策略

### 7.1 数据库备份
```bash
#!/bin/bash
# backup.sh

# 设置变量
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="archery"

# 创建备份
pg_dump -U archery -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

### 7.2 对象存储备份
```yaml
# minio-backup.yaml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: minio-backup
spec:
  schedule: "0 0 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: minio/mc
            command:
            - /bin/sh
            - -c
            - |
              mc mirror /data/minio s3://backup/
          restartPolicy: OnFailure
```

## 8. 扩展配置

### 8.1 自动扩缩容
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: archery-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: archery-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 8.2 资源配额
```yaml
# resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: archery-quota
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
```

## 9. 故障恢复

### 9.1 数据库恢复
```bash
#!/bin/bash
# restore.sh

# 设置变量
BACKUP_FILE=$1
DB_NAME="archery"

# 恢复数据库
gunzip -c $BACKUP_FILE | psql -U archery -d $DB_NAME

# 验证恢复
psql -U archery -d $DB_NAME -c "SELECT COUNT(*) FROM users;"
```

### 9.2 服务恢复
```yaml
# rollback.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: archery-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
```

## 10. 性能优化

### 10.1 数据库优化
```sql
-- 性能优化配置
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
```

### 10.2 缓存优化
```yaml
# redis-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
data:
  redis.conf: |
    maxmemory 4gb
    maxmemory-policy allkeys-lru
    appendonly yes
    appendfsync everysec
``` 
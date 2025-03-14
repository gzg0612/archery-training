.PHONY: all build clean test deps dev lint proto docker-build docker-push deploy

# 变量定义
BINARY_NAME=archery-training
BINARY_API=archery-api
BINARY_USER=archery-user
BINARY_ANALYSIS=archery-analysis
VERSION=1.0.0
BUILD_DIR=./build
REGISTRY=yourusername
DOCKER_IMAGE_API=$(REGISTRY)/archery-api
DOCKER_IMAGE_AI=$(REGISTRY)/archery-ai

# 默认目标
all: clean deps lint test build

# 清理
clean:
	@echo "==> 清理项目..."
	rm -rf $(BUILD_DIR)
	go clean

# 安装依赖
deps:
	@echo "==> 安装Go依赖..."
	go mod tidy
	go mod download
	@echo "==> 安装Python依赖..."
	pip install -r ai-service/requirements.txt

# 代码检查
lint:
	@echo "==> 执行代码检查..."
	golangci-lint run ./...

# 运行测试
test:
	@echo "==> 执行单元测试..."
	go test -v ./test/unit/...
	@echo "==> 执行集成测试..."
	go test -v ./test/integration/...

# 构建所有服务
build: build-api build-ai

# 构建API服务
build-api:
	@echo "==> 构建API服务..."
	CGO_ENABLED=1 go build -o $(BUILD_DIR)/$(BINARY_API) ./cmd/api
	CGO_ENABLED=1 go build -o $(BUILD_DIR)/$(BINARY_USER) ./cmd/user
	CGO_ENABLED=1 go build -o $(BUILD_DIR)/$(BINARY_ANALYSIS) ./cmd/analysis

# 构建AI服务
build-ai:
	@echo "==> 构建AI服务..."
	# 这里可以添加Python打包命令

# 启动开发环境
dev:
	@echo "==> 启动开发环境..."
	docker-compose -f deployments/docker/docker-compose.dev.yml up -d

# 生成API Proto
proto:
	@echo "==> 生成Proto文件..."
	protoc --go_out=. --go-grpc_out=. ./api/proto/*.proto

# 构建Docker镜像
docker-build:
	@echo "==> 构建Docker镜像..."
	docker build -t $(DOCKER_IMAGE_API):$(VERSION) -f deployments/docker/api/Dockerfile .
	docker build -t $(DOCKER_IMAGE_AI):$(VERSION) -f deployments/docker/ai/Dockerfile .

# 推送Docker镜像
docker-push:
	@echo "==> 推送Docker镜像..."
	docker push $(DOCKER_IMAGE_API):$(VERSION)
	docker push $(DOCKER_IMAGE_AI):$(VERSION)

# 部署到Kubernetes
deploy:
	@echo "==> 部署到Kubernetes..."
	kubectl apply -f deployments/k8s/

# 数据库迁移
migrate:
	@echo "==> 执行数据库迁移..."
	go run scripts/migration/main.go

# 数据库回滚
migrate-down:
	@echo "==> 回滚数据库迁移..."
	go run scripts/migration/main.go down

# 启动API服务
run-api:
	@echo "==> 启动API服务..."
	go run ./cmd/api/main.go

# 启动用户服务
run-user:
	@echo "==> 启动用户服务..."
	go run ./cmd/user/main.go

# 启动分析服务
run-analysis:
	@echo "==> 启动分析服务..."
	go run ./cmd/analysis/main.go

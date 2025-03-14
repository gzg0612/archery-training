# 基于Go 1.21构建API服务
FROM golang:1.21-bullseye AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

# 拷贝Go模块定义
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 拷贝源代码
COPY . .

# 构建API服务
RUN CGO_ENABLED=1 GOOS=linux go build -a -o /go/bin/api ./cmd/api

# 使用精简的基础镜像
FROM debian:bullseye-slim

WORKDIR /app

# 安装运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopencv-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 从构建阶段复制二进制文件
COPY --from=builder /go/bin/api /app/api

# 复制配置文件
COPY configs/config.yaml /app/configs/

# 设置环境变量
ENV GIN_MODE=release

# 暴露API端口
EXPOSE 8080

# 命令
CMD ["/app/api"]

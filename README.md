# 智能射箭训练系统

## 项目概述
本项目是一个基于人工智能的射箭训练辅助系统，旨在通过视频分析、图像识别和数据分析技术，为射箭运动员提供专业的训练指导和建议。系统能够分析运动员的动作姿态、箭靶命中情况，并根据不同训练阶段和目标提供个性化的训练计划。

## 技术栈
- 后端：Go
- 前端：Vue.js + Element UI
- 数据库：PostgreSQL + Redis
- AI服务：Python
- 视频处理：GoCV + MediaPipe
- 部署：Docker + Kubernetes

## 项目结构
```
archery-training/
├── frontend/                # 前端项目（Vue.js）
│   ├── public/             # 静态资源
│   ├── src/               # 源代码
│   │   ├── api/          # API服务
│   │   ├── assets/       # 资源文件
│   │   ├── components/   # 组件
│   │   ├── config/       # 配置
│   │   ├── router/       # 路由
│   │   ├── store/        # 状态管理
│   │   ├── utils/        # 工具函数
│   │   ├── views/        # 页面
│   │   ├── App.vue       # 根组件
│   │   └── main.js       # 入口文件
│   ├── .env              # 环境变量
│   └── package.json      # 项目配置
│
├── backend/                # 后端项目（Go）
│   ├── cmd/              # 主程序入口
│   ├── internal/         # 内部包
│   │   ├── api/         # API处理
│   │   ├── config/      # 配置
│   │   ├── middleware/  # 中间件
│   │   ├── model/       # 数据模型
│   │   ├── repository/  # 数据访问
│   │   ├── service/     # 业务逻辑
│   │   └── utils/       # 工具函数
│   ├── pkg/             # 可导出包
│   ├── configs/         # 配置文件
│   ├── scripts/         # 脚本
│   ├── test/           # 测试
│   ├── go.mod          # Go模块
│   └── README.md       # 说明文档
│
└── docs/                  # 项目文档
    ├── api/             # API文档
    ├── architecture/    # 架构文档
    ├── database/        # 数据库文档
    ├── deployment/      # 部署文档
    ├── modules/         # 模块文档
    └── ui/             # UI文档
```

## 主要功能模块

### 用户管理模块
- 用户注册与登录
- 用户信息管理
- 权限控制
- 用户等级管理

### 训练计划模块
- 训练计划生成
- 计划进度跟踪
- 计划调整
- 训练建议生成

### 视频分析模块
- 视频上传和处理
- 姿态识别分析
- 动作轨迹分析
- 实时动作分析
- 技术动作评分

### 箭靶分析模块
- 箭靶图像识别
- 得分计算
- 散布分析
- 命中率统计
- 进步趋势分析

### 训练建议模块
- 技术动作建议
- 训练计划调整建议
- 进步报告生成
- 个性化建议生成

## 安装与运行

### 环境要求
- Go 1.21+
- Python 3.10+
- Docker 20.10+
- Kubernetes 1.22+ (生产环境)
- PostgreSQL 15+
- Redis 7+

### 本地开发环境
1. 克隆仓库
```bash
git clone https://github.com/yourusername/archery-training.git
cd archery-training
```

2. 安装依赖
```bash
make deps
```

3. 启动开发环境
```bash
make dev
```

### 构建与部署
```bash
# 构建API服务
make build-api

# 构建AI服务
make build-ai

# 部署到Kubernetes
make deploy
```

## 贡献指南
请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 文件

## 许可证
本项目采用 MIT 许可证，详情请参阅 [LICENSE](LICENSE) 文件

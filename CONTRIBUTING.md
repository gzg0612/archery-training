# 贡献指南

感谢您对本项目的关注！以下是参与贡献的基本流程和一些建议。

## 环境搭建
1. Fork 本仓库并克隆到本地。
2. 进入 `backend` 目录执行 `make deps` 安装依赖。
3. 运行 `make dev` 启动开发环境。

## 代码规范
- Go 代码请使用 `gofmt` 格式化，并通过 `golangci-lint` 进行静态检查。
- Node.js 代码请执行 `npm run lint` 保持一致的代码风格。
- 提交前请确保所有测试通过，例如 `npm test` 或 `go test ./...`。

## Pull Request 流程
1. 基于 `main` 或 `develop` 分支创建功能分支。
2. 完成功能开发后提交 Commit，并同步上游更新解决可能的冲突。
3. 在 PR 描述中清晰说明变更内容和动机。
4. 等待项目维护者 Review 通过并合并。

欢迎提出 Issue 或提交 Pull Request，与我们一起改进项目！

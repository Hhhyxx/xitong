# GitHub Pages 发布说明

这个项目已经加好了 GitHub Pages 自动部署工作流，发布的是 `frontend/` 目录中的静态站点。

## 发布步骤

1. 把 `competition-system` 目录作为一个 GitHub 仓库推到 GitHub。
2. 默认分支使用 `main` 或 `master`。
3. 进入 GitHub 仓库页面：
   `Settings` -> `Pages` -> `Build and deployment`
4. Source 选择 `GitHub Actions`。
5. 推送代码后，GitHub 会自动执行 `.github/workflows/deploy-pages.yml`。

## 发布结果

- Pages 站点发布的是前端演示版。
- 在 `github.io` 域名下会自动启用本地演示数据，不依赖本地 Spring Boot 后端。
- 登录、注册、公告、论坛、收藏等前端交互可在浏览器 `localStorage` 中演示。
- 文件上传和真实后端持久化能力不在 GitHub Pages 中提供。

## 访问地址

发布成功后，地址通常是：

`https://<你的 GitHub 用户名>.github.io/<仓库名>/`

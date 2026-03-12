# 部署说明

## Cloudflare Pages

该项目是标准静态前端应用，直接部署 `dist/` 即可。

### 推荐配置

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 20+

## 部署步骤

1. 将仓库推送到 GitHub。
2. 在 Cloudflare Pages 创建新项目并连接仓库。
3. 填写构建命令与输出目录。
4. 首次构建完成后即可直接访问。

## 为什么本地与线上行为一致

- 页面不依赖后端 API
- 不使用登录、订阅、权限校验
- 图片不上传到服务器
- 下载通过浏览器原生对象 URL 完成

## 发布前检查

- `npm run format:check`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 缓存注意事项

- 更新 `public/` 下的静态资源后，建议让 Cloudflare Pages 重新部署一次。
- 如果后续引入更强缓存策略，需要同步更新文档。

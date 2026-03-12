# 开发说明

## 环境要求

- Node.js 20+
- npm 10+

## 安装与启动

```bash
npm install
npm run dev
```

## 目录约定

- `references/`：只读参考实现
- `public/`：品牌资源和 mask 图片
- `src/components/`：UI 组件
- `src/lib/`：业务逻辑与工具函数
- `src/workers/`：Web Worker 入口
- `src/test/`：单测

## 开发原则

- 保持文件可读，避免把 UI、状态、算法全部混在一个组件里。
- 任何新增功能都必须确认仍然符合“纯前端、本地处理、无后端”的边界。
- 改动算法、目录结构、构建命令或部署说明时，要同步更新 `README` 和 `docs/`。
- 不要把大段二进制内容写入 TypeScript 源码，优先放在 `public/`。

## 测试与校验

```bash
npm run format
npm run typecheck
npm run test
npm run build
```

## 常见修改入口

- 调整文案：`src/lib/i18n/messages.ts`
- 调整队列行为：`src/lib/queue/batchQueue.ts`
- 调整像素恢复逻辑：`src/lib/watermark/engine.ts`
- 调整页面布局：`src/App.tsx` 与 `src/components/`

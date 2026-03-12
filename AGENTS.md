# 仓库协作指南

## 项目目标

- 这个仓库交付的是一个部署在 Cloudflare Pages 上的单页工具，用于在浏览器本地移除 Gemini 图片水印。
- 产品范围保持收敛：本地上传、本地处理、预览和下载。不引入后端、登录、配额或付费能力。

## 目录职责

- `references/`：历史实现的参考代码，只读；除非参考源本身变化，否则不要修改。
- `src/components/`：UI 组件目录，组件职责保持聚焦、可组合。
- `src/lib/watermark/`：去水印算法、文件辅助逻辑和处理器编排。
- `src/lib/queue/`：批处理队列逻辑。
- `src/lib/i18n/`：语言检测与翻译文案。
- `src/workers/`：仅放 Web Worker 入口；重像素计算必须放在主线程之外。
- `docs/`：中文主文档；英文镜像文档位于 `docs/en/`。
- `public/`：静态品牌资源和遮罩图资源。
- `docs/design-context.md`：产品语气、视觉方向与交互原则的唯一基线。任何设计或 UX 改动前先阅读。

## 工作规则

- 优先拆成可读模块，不要堆成超大的全能文件。
- 对外 API 保持类型明确、行为稳定。只有在算法或异步流程不直观时才加注释。
- 当行为、命令、架构或部署步骤变化时，在同一次改动里同步更新 `README.md`、`README.en.md` 和 `docs/` 中相关文档。
- 当视觉方向、交互风格或产品语气变化时，先更新 `docs/design-context.md`，再落实到实现。
- 中文文档是事实来源，英文文档应保持结构和含义一致。
- 保持“纯本地处理”原则，禁止增加图片或结果上传到网络的逻辑。

## 常用命令

- `npm run dev`：启动本地开发服务器。
- `npm run build`：构建用于 Cloudflare Pages 的生产包。
- `npm run preview`：本地预览构建产物。
- `npm run typecheck`：执行 TypeScript 类型检查。
- `npm run test`：运行单元测试和组件测试。
- `npm run format`：使用 Prettier 格式化仓库。
- `npm run format:check`：仅检查格式，不写入文件。

## 代码约定

- 应用代码统一使用 TypeScript。
- 图片批处理必须继续使用顺序队列。除非产品要求变更，否则不要改成并行 Worker 处理。
- 谨慎管理浏览器 object URL，在清空或卸载时及时释放。
- 语言回退规则必须保持：`zh-* -> zh-CN`，`ja-* -> ja-JP`，其他全部回退到 `en-US`。
- Worker 通信协议保持显式、无版本设计，除非未来出现第二个 Worker。

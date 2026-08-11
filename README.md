# 白橙铺

面向电商和新媒体从业者的浏览器本地商品图抠图工具。前端使用
Next.js 兼容的 vinext 运行时，生产环境部署到 Cloudflare Workers。

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
pnpm install
pnpm run dev
pnpm run build
```

## Cloudflare 资源

- Worker 配置：`wrangler.jsonc`
- D1 数据库绑定：`DB`
- Cloudflare Images 绑定：`IMAGES`
- 数据库迁移：`drizzle/*.sql`

首次部署前先创建 D1 数据库，并将 Cloudflare 返回的真实
`database_id` 写入 `wrangler.jsonc`。

```bash
pnpm exec wrangler login
pnpm exec wrangler d1 create baichengpu-db --location=apac
pnpm run db:migrate:remote
pnpm run deploy:cloudflare
```

## 账户认证

账户系统由 Worker 和 D1 直接提供：

- `/api/auth/register`：邮箱密码注册
- `/api/auth/login`：邮箱密码登录
- `/api/auth/logout`：退出登录
- 密码使用 PBKDF2-SHA256 加盐派生后保存
- 登录会话使用随机令牌、D1 令牌摘要和 HttpOnly Cookie
- 认证接口执行同源校验、请求大小限制和登录频率限制

商品原图和抠图结果仍只在用户浏览器中处理，不写入 D1。

## 常用命令

- `pnpm run dev`：本地开发
- `pnpm run build`：构建 Cloudflare Worker
- `pnpm test`：构建并运行服务端与认证测试
- `pnpm run db:generate`：生成 Drizzle 迁移
- `pnpm run db:migrate:remote`：应用生产 D1 迁移
- `pnpm run deploy:cloudflare`：构建、迁移并部署

## 独立测试环境

收费和 Webhook 联调使用独立的 `baichengpu-staging` Worker 与
`baichengpu-staging-db` 数据库。测试环境不绑定正式域名，也不共享正式
D1 数据，配置文件为 `wrangler.staging.jsonc`。

- `pnpm run build:staging`：使用测试配置构建部署成品
- `pnpm run db:migrate:staging`：只迁移测试 D1
- `pnpm run deploy:staging`：构建、迁移并发布测试 Worker

Stripe 测试密钥只能写入 `baichengpu-staging`。不要把测试密钥写入
`wrangler.jsonc` 或正式 Worker，否则正式域名也可能启用测试收银台。

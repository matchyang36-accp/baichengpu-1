# edit-photo 正式收费上线清单

> 目标：只有当 Stripe 正式账户、正式价格、Webhook 和 Cloudflare 正式环境全部准备完成后才开放真钱支付。

## 当前状态

- staging 已完成 Pro 测试付款、Webhook 升级、重复事件幂等和取消订阅降级测试。
- 生产站没有 Stripe 正式密钥，付款接口会安全返回“未配置”，不会误收款。
- 管理员可在 `/admin/billing` 查看订单和订阅状态。
- 用户可在账户页进入 Stripe 官方账单门户管理订阅。

## 上线前必须完成

1. 在 Stripe 切换到正式模式并完成企业/个人经营资料、收款账户和身份验证。
2. 创建正式 Pro 与 Team 月付产品，记录两个 `price_` ID。
3. 创建正式 Webhook：`https://edit-photo.com/api/webhook`。
4. Webhook 至少订阅：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. 在生产 Worker `baichengpu` 写入：
   - `STRIPE_SECRET_KEY`（必须以 `sk_live_` 开头）
   - `STRIPE_WEBHOOK_SECRET`（必须以 `whsec_` 开头）
   - `STRIPE_PRICE_PRO`
   - `STRIPE_PRICE_TEAM`
6. 配置 Stripe Customer Portal：允许用户更新付款方式、查看账单和取消订阅。
7. 准备退款政策、服务条款、隐私政策、联系方式和账单名称。

## 本地预检

在 PowerShell 临时设置正式配置后运行；不要把密钥写进代码、截图、GitHub 或聊天：

```powershell
$env:SITE_URL="https://edit-photo.com"
$env:STRIPE_SECRET_KEY="从安全位置读取"
$env:STRIPE_WEBHOOK_SECRET="从安全位置读取"
$env:STRIPE_PRICE_PRO="正式 Pro price ID"
$env:STRIPE_PRICE_TEAM="正式 Team price ID"
pnpm billing:preflight
```

成功只显示 `READY`，不会显示密钥。失败会列出缺少的变量并返回非零退出码。

## 小额真钱验收

1. 先将正式产品临时设为最低可接受价格，使用管理员之外的真实测试账号购买一次。
2. 确认 Stripe 付款成功、D1 订单为 `completed`、用户套餐升级、后台收入正确。
3. 重放同一个 Webhook，确认没有重复升级或重复订单。
4. 从账单门户取消，确认到期策略符合预期；立即取消时确认用户降级。
5. 测试支付失败、过期卡、退款和争议通知。
6. 完成后恢复正式价格，并再次核对价格页文案与 Stripe Checkout 金额。

## 回滚方案

- 紧急停收款：删除生产 Worker 的任意一个 Stripe 必需配置，付款接口会立即安全关闭，抠图仍可用。
- 页面回滚：回退 GitHub 提交并让 CI 重新部署。
- 已付款用户：不要直接删 D1 数据；先在 Stripe 处理退款或取消，再由 Webhook 同步状态。

## 禁止事项

- 不得把 `sk_live_`、Webhook secret 或银行卡资料提交到 Git。
- 不得把测试密钥和正式价格混用。
- 不得仅凭前端“付款成功”页面升级会员；必须以签名通过的 Stripe Webhook 为准。
- 不得人工修改订单为成功来替代真实支付确认。

# 📋 予約管理システム (Yoyaku Viewer)

基于 Google Sheets 的预约管理系统，提供网页化查看界面。

## ✨ 功能特性

- 🔐 简单的用户名密码验证
- 📱 响应式设计（PC/手机完美适配）
- 🔍 实时搜索过滤
- 📄 分页浏览大数据集
- 🔄 一键刷新数据
- ⚡ Cloudflare Pages 快速部署

## 🚀 技术栈

- **框架:** React + Vite
- **样式:** Tailwind CSS
- **数据源:** Google Sheets CSV 导出
- **部署:** Cloudflare Pages

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🌐 部署到 Cloudflare Pages

### 方式一：使用 Wrangler CLI

```bash
# 登录 Cloudflare（首次）
wrangler login

# 创建项目
wrangler pages project create yoyaku-viewer

# 部署
CLOUDFLARE_API_TOKEN="your-token" wrangler pages deploy dist --project-name=yoyaku-viewer
```

### 方式二：GitHub Actions

配置 `cloudflare-pages.yml` 后，push 到 GitHub 自动部署。

## 🔒 安全说明

默认管理员账号:
- 用户：`admin`
- 密码：`admin123`

**注意:** 生产环境请修改认证逻辑！建议集成后端 API 或使用 OAuth。

## 📝 自定义 Google Sheet

要连接到自己的 Google Sheet：

1. 确保 Sheet 已设置 "Anyone with the link can view"
2. 获取 Sheet ID（URL 中的 `/d/XXX/edit` 部分）
3. 修改 `src/App.jsx` 中的 `SHEET_CSV_URL`:

```javascript
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0'
```

## 🎨 域名配置

使用 Cloudflare 子域名（如 `.cshub.click`）：

1. 在 Cloudflare Dashboard → My Pages → Custom domains
2. 添加你的自定义域名
3. 配置 DNS CNAME 记录
4. 等待 SSL 证书生成

## 📄 License

MIT

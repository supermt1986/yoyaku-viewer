# Sheets API Integration - Setup Guide

## Current Status

代码已更新支持 Google Sheets API v4，但需要先配置 API key。

## Quick Setup (3 步)

### 1. 获取 API Key
访问 https://console.cloud.google.com/apis/credentials
- 创建新 Project (如 "Yoyaku Viewer")
- Enable "Google Sheets API"
- Create credentials → API Key

### 2. 复制到密钥
例如：`AIzaSyxxxxxxxxxxxxxxxxxxxxx`

### 3. 部署时设置环境变量
```bash
npx wrangler pages deploy dist \
  --project-name=yoyaku-viewer \
  --env GOOGLE_SHEETS_API_KEY="YOUR_KEY_HERE"
```

或者直接告诉我您的 API key，我来帮您部署。

## Without API Key

应用仍可以使用基础功能:
- ✅ 数据查看
- ✅ 筛选/搜索/分页  
- ❌ 链接按钮显示"🔒 リンクなし"

---

**准备好了吗？把 API key 给我，我立即部署完整版!** 🚀

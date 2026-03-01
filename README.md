# 🏨 Yoyaku Viewer (予約ビューア / 预约查看器)

A reservation management system for viewing hotel booking data from Google Sheets with secure authentication.  
Google スプレッドシートからホテルの予約データを表示する管理システム。  
从 Google 表格查看酒店预订数据的管理系统。

---

## 🌟 Features / 機能 / 功能

### English
- 🔐 Secure login system with admin authentication
- 📊 Real-time data synchronization from Google Sheets API v4
- 🔗 Direct links to booking details, cancellation, and guide documents
- 🎯 Advanced filtering (status multi-select, hotel selection, full-text search)
- 📅 Date formatting in Japanese style (yyyy 年 mm 月 dd 日)
- ⏭️ Option to hide past reservations
- 💻 Deployed on Cloudflare Pages for global access

### 日本語
- 🔐 安全なログインシステムと管理者認証
- 📊 Google スプレッドシート API v4 からのリアルタイムデータ同期
- 🔗 予約詳細、キャンセル、案内書への直接リンク
- 🎯 高度なフィルタリング機能（状態の多選択、ホテル選択、全文検索）
- 📅 日本語形式の日付表示（yyyy 年 mm 月 dd 日）
- ⏭️ 過去分の予約を非表示にするオプション
- 💻 グローバルアクセスのための Cloudflare Pages へのデプロイ

### 中文
- 🔐 安全的登录系统和管理员认证
- 📊 与 Google 表格 API v4 的实时数据同步
- 🔗 直接链接到预订详情、取消和指南文件
- 🎯 高级筛选功能（状态多选、酒店选择、全文搜索）
- 📅 日式日期格式显示（yyyy 年 mm 月 dd 日）
- ⏭️ 可选隐藏过去的预订
- 💻 部署在 Cloudflare Pages 上全球访问

---

## 🚀 Quick Start / クイックスタート / 快速开始

### Prerequisites / 前提条件

**English:**
- Node.js 16+ and npm installed
- Access credentials provided by administrator

**日本語:**
- Node.js 16+ と npm がインストールされていること
- 管理者から提供されたアクセス情報

**中文:**
- 已安装 Node.js 16+ 和 npm
- 由管理员提供的访问凭据

### Installation / インストール / 安装

```bash
git clone https://github.com/supermt1986/yoyaku-viewer.git
cd yoyaku-viewer
npm install
npm run build
```

### Configuration / 設定 / 配置

**⚠️ Important / 重要事項:**

Create a `.env` file in the root directory with your API key:

```env
VITE_SHEETS_API_KEY=your_actual_api_key_here
```

The username, password, and sheet ID are already encrypted in the source code for security.  
ユーザー名、パスワード、シート ID はセキュリティのためソースコードで暗号化されています。  
出于安全考虑，用户名、密码和 Sheet ID 已在源代码中加密。

### Run Locally / ローカル実行 / 本地运行

```bash
# Development server
npm run dev

# Production build
npm run build
npm run preview
```

---

## 🔒 Security / セキュリティ / 安全

**English:**
- Credentials are obfuscated using Base64 encoding + string reversal
- Google Sheets API key should be stored as environment variable
- Admin-only access via session-based authentication
- No sensitive data exposed in public repository

**日本語:**
- 資格情報は Base64 エンコーディングと文字逆転で暗号化
- Google スプレッドシート API キーは環境変数として保存
- セッションベース認証による管理者のみアクセス可能
- パブリックリポジトリに機密データを公開しない

**中文:**
- 凭据使用 Base64 编码 + 字符串反转进行混淆处理
- Google 表格 API 密钥应存储在环境变量中
- 基于会话认证的仅限管理员访问
- 不在公共仓库中暴露敏感数据

---

## 📋 Column Descriptions / カラムの説明 / 列说明

| Column | 日本語 | 中文 | Description |
|--------|--------|------|-------------|
| 受付番号 | 受付番号 | 受理编号 | Reservation receipt number |
| 予約者 | 予約者 | 预订者 | Name of the person making the reservation |
| 宿泊日 | 宿泊日 | 住宿日期 | Check-in date |
| ホテル | ホテル | 酒店 | Hotel name/location |
| 部屋タイプ | 部屋タイプ | 房间类型 | Room type/category |
| キャンセル料発生日 | キャンセル料発生日 | 取消费发生日 | Cancellation fee effective date |
| 詳細登録 | 詳細登録 | 详细登记 | Link to detailed registration |
| キャンセル | キャンセル | 取消 | Link to cancel reservation |
| 利用案内書 | 利用案内書 | 使用说明书 | Link to usage guide document |
| 状態 | 状態 | 状态 | Current status (e.g., 申込済，利用者登録済) |

---

## 🛠️ Technical Stack / 技術スタック / 技术栈

**English:**
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend Service:** Google Sheets API v4 (`spreadsheets.get` endpoint)
- **Authentication:** Custom session-based auth with sessionStorage
- **Deployment:** Cloudflare Pages (CDN-hosted static site)
- **Data Processing:** Excel serial date conversion to YYYY-MM-DD format

**日本語:**
- **フロントエンド:** React 18 + Vite + Tailwind CSS
- **バックエンドサービス:** Google スプレッドシート API v4 (`spreadsheets.get` エンドポイント)
- **認証:** sessionStorage を使用したカスタムセッションベース認証
- **デプロイ:** Cloudflare Pages (CDN ホスティング静的サイト)
- **データ処理:** Excel シリアル日付を YYYY-MM-DD 形式に変換

**中文:**
- **前端:** React 18 + Vite + Tailwind CSS
- **后端服务:** Google 表格 API v4 (`spreadsheets.get` 端点)
- **认证:** 使用 sessionStorage 的自定义会话认证
- **部署:** Cloudflare Pages (CDN 托管静态站点)
- **数据处理:** Excel 序列日期转换为 YYYY-MM-DD 格式

---

## 🌐 Deployment / デプロイ / 部署

**To Cloudflare Pages:**

```bash
npm run build
npx wrangler pages deploy dist --project-name=yoyaku-viewer
```

Access your deployment at: `https://yoyaku-viewer.pages.dev`

---

## 📝 License / ライセンス / 许可证

Proprietary - For internal use only.  
著作権所有 - 内部使用専用。  
专有财产 - 仅供内部使用。

---

## 👥 Support / サポート / 支持

For questions or issues, contact the development team.  
ご質問や問題については、開発チームにお問い合わせください。  
如有问题或疑问，请联系开发团队。

---

*Last Updated: March 1, 2026 / 最終更新：2026 年 3 月 1 日 / 最后更新：2026 年 3 月 1 日*

# 链接问题说明

## 现状

Google Sheets 里的链接是通过 `HYPERLINK` 函数创建的，例如：
```excel
=HYPERLINK("https://xxx.com/page123", "@")
```

但是：
1. **CSV export**: 只导出显示值 `"@"`，不包含 URL
2. **GVIZ API**: 同样只返回 `"@"`
3. **formula_values=true**: 仍然只返回 `"@"`

这是 Google Sheets API 的**已知限制** - 它不会导出 HYPERLINK 函数的第一个参数（URL）。

## 临时解决方案

由于无法通过 API 获取原始 URL，当前代码使用了固定 URL 模式生成链接：

```javascript
if (columnName === '詳細登録') {
  url = `http://yoyaku.com/?id=${receiptNo}`
} else if (columnName === 'キャンセル') {
  url = `http://yoyaku.com/?id=${receiptNo}&action=cancel`
}
```

⚠️ 但这个可能不是正确的目标网站。

## 需要你做的事

请通过以下步骤帮我获取真实的 URL：

### 方法 1: 复制粘贴
1. 打开 Google Sheet: https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8
2. 找到任意一行的"詳細登録"列的 `@` 链接
3. 右键点击 → "复制链接地址"
4. 把完整的 URL 发给我

### 方法 2: 截图
1. 在浏览器中打开那个 sheet
2. 鼠标悬停在 `@` 上，会显示完整 URL（状态栏或工具提示）
3. 截图发给我

### 方法 3: 编辑单元格
1. 双击任意一个 `@` 单元格进入编辑模式
2. 你会看到完整的公式如：`=HYPERLINK("https://xxx.com/...","@")`
3. 把完整的 URL 部分（引号内的内容）告诉我

拿到真实 URL 后，我就能：
1. 分析 URL 模式规律
2. 更新代码中的 URL 生成逻辑
3. 让所有链接都正确指向目标页面

谢谢！🙏

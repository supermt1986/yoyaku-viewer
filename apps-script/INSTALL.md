# 🔗 方案 A 安装指南 - Link URL Extractor

## 📋 概述

这个脚本会自动从你的 Google Sheets 中的 HYPERLINK 公式提取 URL，并创建对应的 `_URL` 列供网页读取。

**优点:**
- ✅ 不修改你的原程序
- ✅ 自动运行，一键设置
- ✅ 即使未来数据更新，URL 也会同步提取

---

## 🚀 安装步骤 (只需 5 分钟)

### Step 1: 打开 Apps Script 编辑器

1. 打开你的 Google Sheet: https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/edit
2. 点击菜单 `Extensions` > `Apps Script`
3. 右侧会打开新标签页的脚本编辑器

### Step 2: 粘贴脚本代码

在脚本编辑器中，删除所有现有内容，粘贴以下代码：

```javascript
/**
 * Google Apps Script: Extract URLs from HYPERLINK formulas
 */

function extractLinkUrls() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length < 2) return;
  
  const headers = values[0];
  const linkColumns = ['詳細登録', 'キャンセル', '利用案内書'];
  const formulas = dataRange.getFormulas();
  
  for (let row = 1; row < values.length; row++) {
    for (const linkCol of linkColumns) {
      const colIndex = headers.indexOf(linkCol);
      if (colIndex === -1) continue;
      
      const formula = formulas[row][colIndex] || '';
      
      if (formula.includes('HYPERLINK')) {
        const urlMatch = formula.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
        
        if (urlMatch && urlMatch[1]) {
          const url = urlMatch[1];
          const urlColumnName = `${linkCol}_URL`;
          let urlColIndex = headers.indexOf(urlColumnName);
          
          if (urlColIndex === -1) {
            urlColIndex = colIndex + 1;
            sheet.insertColumnAfter(colIndex);
            sheet.getRange(1, urlColIndex + 1).setValue(urlColumnName);
            const lastRow = sheet.getLastRow();
            if (lastRow > 1) {
              sheet.getRange(2, urlColIndex + 1, lastRow - 1, 1).clearContent();
            }
          }
          
          sheet.getRange(row + 1, urlColIndex + 1).setValue(url);
        }
      }
    }
  }
  
  Logger.log('✅ Link URLs extracted successfully!');
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔗 Link Tools')
    .addItem('Extract URLs', 'extractLinkUrls')
    .addItem('Clear URL Columns', 'clearUrlColumns')
    .addToUi();
}

function clearUrlColumns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length < 2) return;
  
  const headers = values[0];
  
  for (let col = 0; col < headers.length; col++) {
    if (headers[col].endsWith('_URL')) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, col + 1, lastRow - 1, 1).clearContent();
      }
    }
  }
  
  SpreadsheetApp.getUi().alert('✅ All _URL columns cleared!');
}
```

### Step 3: 保存并运行

1. 点击顶部工具栏的 **💾 Save** (或按 Ctrl+S)
2. 在项目名称处输入 `LinkExtractor` 
3. 点击工具栏的 **▶ Run** 按钮
4. 第一次运行会弹出授权请求：
   - 点击 **Review permissions**
   - 选择你的 Google 账号
   - 看到警告页面 "Google hasn't verified this app" → 点击 **Advanced** → **Go to LinkExtractor (unsafe)**
   - 勾选允许访问 → **Allow**

### Step 4: 验证结果

运行完成后：
1. 回到 Google Sheet
2. 刷新页面
3. 应该能看到新增的三列：
   - `詳細登録_URL`
   - `キャンセル_URL`
   - `利用案内書_URL`

这些列里包含了从 HYPERLINK 公式中提取的真实 URL！

---

## 🔄 后续使用

### 菜单方式（推荐）

每次添加新数据后：
1. 打开 Sheet
2. 点击顶部菜单 `🔗 Link Tools` > `Extract URLs`
3. 等待几秒钟完成处理

### 自动触发（可选）

如果你希望脚本在新数据插入时自动运行，可以添加以下代码：

```javascript
function onEdit(e) {
  // Uncomment below to auto-extract on edit
  // extractLinkUrls();
}
```

---

## ⚠️ 常见问题

### Q: 为什么有些单元格的 _URL 是空的？
A: 检查原始单元格是否真的是 HYPERLINK 公式，而不是简单的文本 "@"

### Q: 我误删了 _URL 列怎么办？
A: 重新运行 `Extract URLs` 即可重新创建

### Q: 我的原程序生成的数据会自动提取吗？
A: 是的！只要原程序生成的单元格包含 HYPERLINK 公式，下次运行脚本就会自动提取

---

## 📱 Web App 测试

安装完成后，访问最新部署的 web 应用测试链接是否正确显示。如果还有问题，可以点击表格中出现的 ⚠️ 图标查看调试信息。

---

**有任何问题随时告诉我！** 🙏
/**
 * Google Apps Script: Extract URLs from HYPERLINK formulas
 * 
 * How to install:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/edit
 * 2. Extensions > Apps Script
 * 3. Paste this code and save
 * 4. Click "Run" and authorize
 * 
 * This script will:
 * - Find columns with HYPERLINK formulas (詳細登録，キャンセル，利用案内書)
 * - Create new _URL columns next to them
 * - Extract and populate the actual URLs
 */

function extractLinkUrls() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length < 2) {
    Logger.log('Not enough data in sheet');
    return;
  }
  
  const headers = values[0];
  const linkColumns = ['詳細登録', 'キャンセル', '利用案内書'];
  
  // Get all formula values to extract URLs
  const formulas = dataRange.getFormulas();
  
  // Process each row (skip header)
  for (let row = 1; row < values.length; row++) {
    for (const linkCol of linkColumns) {
      const colIndex = headers.indexOf(linkCol);
      
      if (colIndex === -1) continue;
      
      const formula = formulas[row][colIndex] || '';
      
      // Check if it's a HYPERLINK formula
      if (formula.includes('HYPERLINK')) {
        // Extract URL from =HYPERLINK("url","@") format
        const urlMatch = formula.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
        
        if (urlMatch && urlMatch[1]) {
          const url = urlMatch[1];
          
          // Add or update URL column
          const urlColumnName = `${linkCol}_URL`;
          let urlColIndex = headers.indexOf(urlColumnName);
          
          // If URL column doesn't exist, create it
          if (urlColIndex === -1) {
            urlColIndex = colIndex + 1;
            
            // Insert new column
            sheet.insertColumnAfter(colIndex);
            
            // Set header
            sheet.getRange(row + 1, urlColIndex + 1).setValue(urlColumnName);
            
            // Clear any existing data in this column (except header)
            const lastRow = sheet.getLastRow();
            if (lastRow > 1) {
              sheet.getRange(2, urlColIndex + 1, lastRow - 1, 1).clearContent();
            }
          }
          
          // Set the URL value
          sheet.getRange(row + 1, urlColIndex + 1).setValue(url);
        }
      }
    }
  }
  
  Logger.log('✅ Link URLs extracted successfully!');
}

// Run automatically when script is installed
function onInstall() {
  extractLinkUrls();
}

// Optional: Create a custom menu
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔗 Link Tools')
    .addItem('Extract URLs', 'extractLinkUrls')
    .addItem('Clear URL Columns', 'clearUrlColumns')
    .addToUi();
}

// Utility: Clear all _URL columns
function clearUrlColumns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length < 2) return;
  
  const headers = values[0];
  
  // Find all _URL columns
  for (let col = 0; col < headers.length; col++) {
    if (headers[col].endsWith('_URL')) {
      // Clear the column (keep header)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, col + 1, lastRow - 1, 1).clearContent();
      }
    }
  }
  
  SpreadsheetApp.getUi().alert('✅ All _URL columns cleared!');
}

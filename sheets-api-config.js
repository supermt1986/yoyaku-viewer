// Google Sheets API v4 Configuration
// Extract HYPERLINK formulas using authenticated API

export const SHEETS_CONFIG = {
    sheetId: '1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8',
    apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    
    // Column indices (0-based)
    columns: {
        receiptNo: 1,      // B 列 - 受付番号
        linkDetails: 7,    // H 列 - 詳細登録
        linkCancel: 8,     // I 列 - キャンセル  
        linkGuide: 9,      // J 列 - 利用案内書
        status: 10         // K 列 - 状態
    }
};

/**
 * Extract URL from HYPERLINK formula string
 * @param {string} formula - e.g., '=HYPERLINK("https://example.com", "@")'
 * @returns {string|null} - extracted URL or null
 */
export function extractUrlFromFormula(formula) {
    if (!formula || typeof formula !== 'string') return null;
    
    // Match HYPERLINK(url, display_text) pattern
    const match = formula.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
    return match ? match[1] : null;
}

/**
 * Fetch data using Google Sheets API v4
 * Requires API key with spreadsheets.readonly scope
 */
export async function fetchFromSheetsAPI() {
    if (!SHEETS_CONFIG.apiKey) {
        throw new Error('GOOGLE_SHEETS_API_KEY not configured');
    }
    
    try {
        const range = 'A2:K'; // Get all data from row 2 onwards
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.sheetId}/values/${range}?key=${SHEETS_CONFIG.apiKey}&includeValuesInFormula=true`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Sheets API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.values || [];
    } catch (error) {
        console.error('Failed to fetch from Sheets API:', error);
        throw error;
    }
}

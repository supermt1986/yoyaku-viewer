// Cloudflare Worker - Proxy for Google Sheets API
// This keeps the API key secure on the server side

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Only allow GET requests from our domain
        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405 });
        }
        
        const sheetId = '1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8';
        const apiKey = env.GOOGLE_SHEETS_API_KEY;
        
        if (!apiKey) {
            return new Response('API key not configured', { status: 500 });
        }
        
        try {
            // Fetch all data with formulas
            const range = 'A2:K'; // All rows from row 2
            const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}&includeValuesInFormula=true`;
            
            const sheetsResponse = await fetch(sheetsUrl);
            
            if (!sheetsResponse.ok) {
                const errorText = await sheetsResponse.text();
                console.error('Sheets API Error:', sheetsResponse.status, errorText);
                return new Response(JSON.stringify({ 
                    error: 'Failed to fetch from Sheets', 
                    status: sheetsResponse.status,
                    message: errorText 
                }), { 
                    status: sheetsResponse.status,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            const data = await sheetsResponse.json();
            
            // Process and extract URLs from HYPERLINK formulas
            const processedData = processSheetData(data.values || []);
            
            return new Response(JSON.stringify(processedData), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
            
        } catch (error) {
            console.error('Worker Error:', error);
            return new Response(JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};

// Extract URL from HYPERLINK formula string
function extractUrlFromFormula(formula) {
    if (!formula || typeof formula !== 'string') return null;
    
    const match = formula.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
    return match ? match[1] : null;
}

// Process raw sheet data and extract URLs
function processSheetData(rows) {
    const headers = [
        '受付番号', '予約者', '宿泊日', 'ホテル', '部屋タイプ', 
        'キャンセル料発生日', '詳細登録', 'キャンセル', '利用案内書', '状態'
    ];
    
    return rows.map((row, index) => {
        const record = { _id: index + 2 };
        
        // Map basic fields
        record['受付番号'] = row[1] || '';
        record['予約者'] = row[2] || '';
        record['宿泊日'] = row[3] || '';
        record['ホテル'] = row[4] || '';
        record['部屋タイプ'] = row[5] || '';
        record['キャンセル料発生日'] = row[6] || '';
        record['状態'] = row[10] || '';
        
        // Extract URLs from HYPERLINK formulas
        record['詳細登録'] = extractUrlFromFormula(row[7]) || '';
        record['キャンセル'] = extractUrlFromFormula(row[8]) || '';
        record['利用案内書'] = extractUrlFromFormula(row[9]) || '';
        
        return record;
    });
}

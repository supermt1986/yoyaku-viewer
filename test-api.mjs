#!/usr/bin/env node
// Test script for Google Sheets API v4
// Usage: node test-api.mjs YOUR_API_KEY

const SHEET_ID = '1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8';

async function testAPI(apiKey) {
    if (!apiKey) {
        console.log('Please provide API key: node test-api.mjs YOUR_API_KEY');
        process.exit(1);
    }

    try {
        const range = 'A2:K10'; // Test with first 8 rows
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${apiKey}&includeValuesInFormula=true`;
        
        console.log('🔍 Fetching from:', url.substring(0, 80) + '...');
        
        const response = await fetch(url);
        console.log('Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('\n✅ Success! Fetched', data.values?.length || 0, 'rows');
        
        if (data.values && data.values.length > 0) {
            const row = data.values[0];
            console.log('\nFirst row sample:');
            console.log('  Receipt No:', row[1]);
            console.log('  Details Link Formula:', row[7]?.substring(0, 60) + '...');
            
            // Test URL extraction
            const formula = row[7];
            if (formula) {
                const match = formula.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
                if (match) {
                    console.log('\n✅ Extracted URL:', match[1].substring(0, 50) + '...');
                } else {
                    console.log('\n⚠️ No HYPERLINK pattern found in:', formula.substring(0, 50));
                }
            }
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

testAPI(import.meta.argv[2]);

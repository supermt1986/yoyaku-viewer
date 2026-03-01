import { fetch } from 'undici';
import fs from 'fs';

async function checkFormula() {
    const url = 'https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/gviz/tq?tqx=out:json&headers=1';
    
    console.log('Fetching GVIZ JSON...');
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    
    // Extract JSON from callback
    const match = text.match(/\*\/\s*(.+?)\)\s*$/s);
    if (!match) {
        console.error('Failed to parse response');
        return;
    }
    
    const data = JSON.parse(match[1].replace(/\);$/, ''));
    const rows = data.table.rows;
    
    let foundLinks = 0;
    const results = [];
    
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const cells = rows[i].c || [];
        const receiptNo = cells[1]?.v;  // Column B
        
        if (receiptNo) {
            for (let colIdx of [7, 8, 9]) {  // H, I, J
                const cell = cells[colIdx];
                if (cell) {
                    const hasF = 'f' in cell;
                    const v = cell.v;
                    
                    if (hasF && v === '@') {
                        const fObj = cell.f;
                        const formulaStr = typeof fObj === 'object' ? fObj.v : fObj;
                        
                        const urlMatch = formulaStr?.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
                        if (urlMatch) {
                            foundLinks++;
                            results.push({
                                row: i + 2,
                                receiptNo,
                                url: urlMatch[1],
                                formula: formulaStr?.substring(0, 80)
                            });
                        }
                    }
                }
            }
        }
    }
    
    const output = `GVIZ Formula Check Results\n`;
    output += `Total rows: ${rows.length}\n`;
    output += `Links extracted: ${foundLinks}\n\n`;
    
    results.forEach(r => {
        output += `Row ${r.row} (#${r.receiptNo}):\n`;
        output += `  URL: ${r.url.substring(0, 100)}...\n`;
        output += `  Formula: ${r.formula}\n\n`;
    });
    
    fs.writeFileSync('/tmp/formula-check.txt', output);
    console.log('Saved to /tmp/formula-check.txt');
    console.log(`Found ${foundLinks} links!`);
}

checkFormula().catch(console.error);

import { fetch } from 'undici';
import fs from 'fs';

let output = '';

output += '🔍 Testing link extraction methods\n\n';

// Method 1: GVIZ JSON API
output += 'Method 1: GVIZ JSON with formula values\n';

try {
    const res = await fetch('https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/gviz/tq?tqx=out:json&headers=1', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (res.ok) {
        output += '✓ Request successful\n';
        
        const text = await res.text();
        const match = text.match(/\*\/\s*(.+?)\)\s*$/s);
        
        if (match) {
            const data = JSON.parse(match[1].replace(/\);$/, ''));
            
            output += `Found ${data.table.rows.length} rows\n`;
            
            const cells = data.table.rows[0]?.c || [];
            output += `First row has ${cells.length} columns\n`;
            
            // Check column H (index 7)
            const cellH = cells[7];
            if (cellH) {
                output += 'Column H keys: ' + Object.keys(cellH).join(', ') + '\n';
                output += 'Column H value: ' + cellH.v + '\n';
                
                if (cellH.f) {
                    const formula = typeof cellH.f === 'object' ? cellH.f.v : cellH.f;
                    output += '✓ Has formula field!\n';
                    output += 'Formula: ' + formula + '\n';
                    
                    // Try to extract URL
                    const urlMatch = formula?.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
                    if (urlMatch) {
                        output += '🎯 Extracted URL: ' + urlMatch[1] + '\n';
                    }
                } else {
                    output += '✗ No formula field\n';
                }
            }
        }
    }
} catch (e) {
    output += 'Error: ' + e.message + '\n';
}

output += '\n---\n';

// Save to file
fs.writeFileSync('/tmp/link-debug.txt', output);
console.log('Saved to /tmp/link-debug.txt');

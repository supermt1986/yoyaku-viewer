// Native Node 22+ has global fetch built-in
async function test() {
    console.log('Testing GVIZ JSON API...\n');
    
    const res = await fetch('https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/gviz/tq?tqx=out:json&headers=1', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    let text = await res.text();
    
    // Handle different response formats
    if (text.startsWith('/*O_o*/')) {
        text = text.substring(7).trim();
    }
    
    // Extract JSON between { and last }
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}') + 1;
    const jsonStr = text.substring(startIdx, endIdx);
    
    const data = JSON.parse(jsonStr);
    
    console.log(`Total rows: ${data.table.rows.length}`);
    console.log('\nChecking rows for HYPERLINK formulas in columns H(7), I(8), J(9):\n');
    
    let foundLinks = 0;
    const linkStats = {'詳細登録': 0, 'キャンセル': 0, '利用案内書': 0};
    
    for (let i = 2; i < Math.min(data.table.rows.length + 1, 15); i++) {
        const row = data.table.rows[i];
        const cells = row?.c || [];
        
        if (cells[1]?.v) {
            const receiptNo = cells[1].v;
            let rowFound = false;
            
            for (let colIdx of [7, 8, 9]) {
                const colNames = ['詳細登録', 'キャンセル', '利用案内書'];
                const cell = cells[colIdx];
                
                if (cell && cell.v === '@') {
                    const hasF = 'f' in cell;
                    const fVal = cell.f;
                    
                    if (hasF && fVal) {
                        const formulaStr = typeof fVal === 'object' ? fVal.v : fVal;
                        
                        const match = formulaStr.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
                        if (match) {
                            foundLinks++;
                            linkStats[colNames[colIdx - 7]]++;
                            rowFound = true;
                            console.log(`✅ Row ${i+1} (#${receiptNo}) - ${colNames[colIdx - 7]}: ${match[1].substring(0, 60)}...`);
                        }
                    }
                }
            }
            
            if (!rowFound && cells[7] || cells[8] || cells[9]) {
                const firstLinkCol = cells[7]?.v === '@' ? 7 : cells[8]?.v === '@' ? 8 : cells[9]?.v === '@' ? 9 : null;
                if (firstLinkCol !== null) {
                    console.log(`❌ Row ${i+1} (#${receiptNo}) - No HYPERLINK pattern in column ${String.fromCharCode(65+firstLinkCol)}`);
                    console.log(`   Formula: ${typeof cells[firstLinkCol].f}${cells[firstLinkCol].f}\n`);
                }
            }
        }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total links extracted: ${foundLinks}`);
    Object.entries(linkStats).forEach(([name, count]) => {
        console.log(`  ${name}: ${count}`);
    });
}

test().catch(console.error);

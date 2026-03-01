import { fetch } from 'undici';

async function test() {
    console.log('Testing GVIZ JSON API...\n');
    
    const res = await fetch('https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/gviz/tq?tqx=out:json&headers=1', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const text = await res.text();
    
    // Remove /*O_o*/ callback wrapper
    const jsonStr = text.replace(/\/\*O_o\*\//, '').replace(/\);$/, '');
    const data = JSON.parse(jsonStr.trim());
    
    console.log(`Total rows: ${data.table.rows.length}`);
    console.log('\nChecking rows for HYPERLINK formulas in columns H(7), I(8), J(9):\n');
    
    let foundLinks = 0;
    
    for (let i = 2; i < Math.min(data.table.rows.length + 1, 10); i++) {
        const row = data.table.rows[i];
        const cells = row?.c || [];
        
        if (cells[1]?.v) {
            const receiptNo = cells[1].v;
            
            for (let colIdx of [7, 8, 9]) {
                const cell = cells[colIdx];
                if (cell && cell.v === '@') {
                    const hasF = 'f' in cell;
                    const fVal = cell.f;
                    
                    console.log(`Row ${i+1} (#${receiptNo}), Col ${String.fromCharCode(65+colIdx)}:`);
                    console.log(`  v='${cell.v}', has_f=${hasF}`);
                    
                    if (hasF && fVal) {
                        const formulaStr = typeof fVal === 'object' ? fVal.v : fVal;
                        console.log(`  formula: ${formulaStr.substring(0, 80)}...`);
                        
                        const match = formulaStr.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
                        if (match) {
                            foundLinks++;
                            console.log(`  ✅ Extracted URL: ${match[1].substring(0, 60)}...`);
                        } else {
                            console.log(`  ❌ No HYPERLINK pattern found`);
                        }
                    } else {
                        console.log(`  ❌ No formula field`);
                    }
                    console.log();
                }
            }
        }
    }
    
    console.log(`\n📊 Summary: Found ${foundLinks} links with extractable URLs`);
}

test().catch(console.error);

import * as XLSX from 'xlsx';
import fs from 'fs';

if (!fs.existsSync('/tmp/sheet.xlsx')) {
    console.log('❌ /tmp/sheet.xlsx not found, need to download first');
    process.exit(1);
}

console.log('Loading XLSX...');
const buf = fs.readFileSync('/tmp/sheet.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets[wb.SheetNames[0]];

// Get all cells with formulas
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
console.log(`Rows: ${rows.length}`);

let count = 0;
for (let r = 1; r < Math.min(rows.length, 20); r++) {
    const row = rows[r];
    const receipt = row[1] || '?';
    
    for (let c of [7, 8, 9]) {
        if (row[c] === '@') {
            const addr = `${String.fromCharCode(65+c)}${r+1}`;
            const cell = ws[addr];
            
            console.log(`${addr}: ${receipt}, formula=${JSON.stringify(cell?.f)}`);
            
            if (cell?.f) {
                const m = cell.f.match(/HYPERLINK\(\s*"([^"]+)"/i);
                if (m) {
                    console.log(`  -> ${m[1].substring(0, 70)}`);
                    count++;
                }
            }
        }
    }
}

console.log(`\nTotal URLs found: ${count}`);

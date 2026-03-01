import * as XLSX from 'xlsx';
import fs from 'fs';

async function parse() {
    console.log('📊 Parsing XLSX file for HYPERLINK formulas...\n');
    
    try {
        const buf = fs.readFileSync('/tmp/sheet.xlsx');
        const workbook = XLSX.read(buf, { type: 'buffer' });
        
        // Get first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON with formulas
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null,
            raw: false  // Get displayed values
        });
        
        console.log(`Total rows in XLSX: ${jsonData.length}`);
        
        // Also get formula-only data
        const formulaData = XLSX.utils.sheet_to_json(worksheet, {
            formulae: true,
            header: 1
        });
        
        console.log('\nFirst row (headers):', formulaData[0]);
        
        // Check columns H(7), I(8), J(9) for formulas
        console.log('\nChecking link columns for HYPERLINK formulas:\n');
        
        let foundCount = 0;
        for (let i = 1; i < Math.min(formulaData.length + 1, 20); i++) {
            const row = formulaData[i];
            if (!row) continue;
            
            const receiptNo = row[1];
            
            for (let col of [7, 8, 9]) {
                const cellVal = row[col];
                
                // Check both the value and formula property
                if (cellVal === '@') {
                    // Try to access underlying formula
                    const cellAddr = `${String.fromCharCode(65+col)}${i+1}`;
                    const cellObj = worksheet[cellAddr];
                    
                    console.log(`Row ${i+1} (#${receiptNo}), Col ${String.fromCharCode(65+col)}:`);
                    console.log(`  Cell object keys:`, cellObj ? Object.keys(cellObj) : 'undefined');
                    console.log(`  f (formula):`, cellObj?.f);
                    console.log(`  v (value):`, cellObj?.v);
                    
                    if (cellObj?.f) {
                        const match = cellObj.f.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
                        if (match) {
                            foundCount++;
                            console.log(`  ✅ URL: ${match[1].substring(0, 80)}...`);
                        }
                    }
                    console.log();
                }
            }
        }
        
        console.log(`\n📊 Found ${foundCount} extractable URLs in XLSX format`);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

parse().catch(console.error);

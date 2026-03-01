async function debug() {
    console.log('Deep debugging cell structure...\n');
    
    const res = await fetch('https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/gviz/tq?tqx=out:json&headers=1', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    let text = await res.text();
    
    if (text.startsWith('/*O_o*/')) text = text.substring(7).trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}') + 1;
    const jsonStr = text.substring(startIdx, endIdx);
    const data = JSON.parse(jsonStr);
    
    console.log(`Rows: ${data.table.rows.length}\n`);
    
    // Check row 2 (first data row)
    const row = data.table.rows[2];
    const cells = row?.c || [];
    const receiptNo = cells[1]?.v;
    
    console.log(`Row 3, Receipt: ${receiptNo}`);
    console.log(`Total columns in this row: ${cells.length}\n`);
    
    // Check columns H(7), I(8), J(9)
    for (let colIdx of [7, 8, 9]) {
        const cell = cells[colIdx];
        console.log(`\nColumn ${String.fromCharCode(65+colIdx)} (index ${colIdx}):`);
        
        if (!cell) {
            console.log('  Cell is undefined/null');
        } else {
            console.log('  Full cell object:', JSON.stringify(cell, null, 2));
            console.log('  Keys:', Object.keys(cell));
            console.log('  v:', cell.v);
            console.log('  f property exists:', 'f' in cell);
            console.log('  f value:', cell.f);
            console.log('  f type:', typeof cell.f);
        }
    }
    
    // Check ALL properties in the cell
    console.log('\n\n=== Checking all cell properties ===');
    if (cells[7]) {
        for (const key of Object.keys(cells[7])) {
            console.log(`${key}:`, JSON.stringify(cells[7][key]));
        }
    }
}

debug().catch(console.error);

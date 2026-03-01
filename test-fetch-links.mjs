import { fetch } from 'undici';

async function test() {
    console.log('🔍 Testing link extraction methods...\n');
    
    // Method 1: GVIZ JSON API with formula
    console.log('Method 1: GVIZ JSON with formula values');
    try {
        const res = await fetch('https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/gviz/tq?tqx=out:json&headers=1', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const text = await res.text();
        
        const match = text.match(/\*\/\s*(.+?)\)\s*$/s);
        if (match) {
            const data = JSON.parse(match[1].replace(/\);$/, ''));
            const cells = data.table.rows[0]?.c || [];
            
            console.log(`Found ${cells.length} columns in first row`);
            
            // Check column H (index 7) for formula
            const cellH = cells[7];
            if (cellH) {
                console.log('Column H structure:', Object.keys(cellH));
                console.log('Column H value:', cellH.v);
                
                if (cellH.f) {
                    console.log('✓ Column H has formula field!');
                    console.log('Formula:', typeof cellH.f === 'object' ? cellH.f.v : cellH.f);
                } else {
                    console.log('✗ No formula field found');
                }
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    
    console.log('\n---\n');
    
    // Method 2: Try to access the actual URL
    console.log('Method 2: Testing google.com/url redirect');
    const testUrl = 'https://www.google.com/url?q=https://as.its-kenpo.or.jp/all_cancel/auth?apply_guid%3D45ed60a6-3962-4670-a971-dabfd6315705&sa=D&source=editors';
    
    try {
        const res = await fetch(testUrl, { method: 'HEAD', redirect: 'manual' });
        console.log('Status:', res.status);
        
        const location = res.headers.get('location');
        console.log('Redirect location:', location);
        
        // Parse the q parameter
        const urlObj = new URL(testUrl);
        const qParam = urlObj.searchParams.get('q');
        console.log('Decoded q param:', qParam ? decodeURIComponent(qParam) : 'null');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();

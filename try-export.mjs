async function tryExports() {
    console.log('🔍 Trying various Google Sheets export methods...\n');
    
    const sheetId = '1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8';
    
    // Method 1: Download as XLSX (might preserve formulas)
    console.log('Method 1: XLSX export');
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const blob = await res.blob();
            console.log(`Size: ${blob.size} bytes - downloading to /tmp/sheet.xlsx`);
            const buf = await blob.arrayBuffer();
            import('fs').then(fs => fs.default.writeFileSync('/tmp/sheet.xlsx', Buffer.from(buf)));
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    
    console.log('\n---\n');
    
    // Method 2: Check if there's a "Download" column with actual URLs
    console.log('Method 2: Checking CSV for any URL patterns in data columns');
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const csv = await res.text();
        
        // Look for any URLs anywhere in the CSV
        const urlMatches = [...csv.matchAll(/(https?:\/\/[^\s,"]+)/g)];
        if (urlMatches.length > 0) {
            console.log(`Found ${urlMatches.length} URLs in CSV:\n`);
            urlMatches.slice(0, 10).forEach((m, i) => {
                console.log(`${i+1}. ${m[1]}`);
            });
        } else {
            console.log('No URLs found in CSV data');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    
    console.log('\n---\n');
    
    // Method 3: Try htmlview from different perspective
    console.log('Method 3: Try embed view');
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/e/${sheetId}/pubhtml?widget=false&headers=true&single=true`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log(`Pubhtml status: ${res.status}`);
        if (res.ok) {
            const html = await res.text();
            const links = [...html.matchAll(/google\.com\/url\?q=([^&]+)/g)];
            console.log(`Found ${links.length} google redirect links in pubhtml`);
            if (links.length > 0) {
                links.slice(0, 5).forEach((l, i) => {
                    try {
                        const decoded = decodeURIComponent(l[1]);
                        console.log(`${i+1}. ${decoded.substring(0, 80)}...`);
                    } catch {}
                });
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

tryExports();

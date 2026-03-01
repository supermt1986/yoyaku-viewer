async function scrape() {
    console.log('🔍 Attempting to scrape Sheet HTML view...\n');
    
    const url = 'https://docs.google.com/spreadsheets/d/1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8/htmlview?single=true&pid=0';
    
    try {
        const res = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml'
            }
        });
        
        console.log(`Status: ${res.status} ${res.statusText}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}\n`);
        
        if (res.status === 403 || res.status === 400) {
            console.log('❌ Direct access blocked. Need browser automation.');
            return;
        }
        
        const html = await res.text();
        console.log(`HTML length: ${html.length} bytes`);
        
        // Try to find google.com/url links
        const linkRegex = /<a[^>]+href=["']([^"']*google\.com\/url[^"'])["'][^>]*>([^<]+)<\/a>/gi;
        let match;
        let count = 0;
        
        console.log('\nSearching for google.com/url links...\n');
        
        while ((match = linkRegex.exec(html)) !== null && count < 10) {
            const href = match[1];
            const text = match[2]?.trim().substring(0, 50) || '';
            
            // Extract real URL from q parameter
            try {
                const urlObj = new URL(href);
                const qParam = urlObj.searchParams.get('q');
                const realUrl = qParam ? decodeURIComponent(qParam) : href;
                
                console.log(`Link ${++count}:`);
                console.log(`  Text: ${text}`);
                console.log(`  Href: ${href.substring(0, 80)}...`);
                console.log(`  Real: ${realUrl.substring(0, 80)}...`);
                console.log();
            } catch (e) {
                console.log(`Failed to parse: ${href.substring(0, 50)}\n`);
            }
        }
        
        console.log(`Total links found in first 10: ${count}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

scrape();

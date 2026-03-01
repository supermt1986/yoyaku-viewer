import { chromium } from 'playwright';

const SHEET_ID = '1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

async function main() {
  console.log('🚀 Starting link extraction...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the sheet in HTML view to get actual links
    const htmlViewUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/htmlview?single=true&pid=0`;
    
    console.log('📄 Opening:', htmlViewUrl);
    await page.goto(htmlViewUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for table to load
    await page.waitForSelector('table[data-gviz-type="table"]', { timeout: 10000 }).catch(() => {});
    
    // Extract all links with google.com/url
    const links = await page.evaluate(() => {
      const anchorTags = document.querySelectorAll('a[href*="google.com/url"]');
      const results = [];
      
      anchorTags.forEach((link, index) => {
        const href = link.href;
        const text = link.textContent?.trim();
        
        if (href && text) {
          // Extract the real URL from the google redirect
          try {
            const urlObj = new URL(href);
            const qParam = urlObj.searchParams.get('q');
            let realUrl = href;
            
            if (qParam) {
              realUrl = decodeURIComponent(qParam);
            }
            
            results.push({
              index,
              text,
              href: href.substring(0, 100),
              realUrl: realUrl.substring(0, 150),
              cellPosition: link.parentElement?.getAttribute('data-colspan') || ''
            });
          } catch (e) {
            results.push({
              index,
              text,
              error: e.message
            });
          }
        }
      });
      
      return results;
    });
    
    console.log(`\n✅ Found ${links.length} links!\n`);
    
    // Show first few links
    links.slice(0, 10).forEach(link => {
      console.log(`Text: "${link.text}"`);
      if (link.realUrl) {
        console.log(`Real URL: ${link.realUrl}`);
      }
      console.log('---');
    });
    
    // Save to file
    import fs from 'fs';
    fs.writeFileSync('extracted-links.json', JSON.stringify(links, null, 2));
    console.log('\n💾 Saved to extracted-links.json');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();

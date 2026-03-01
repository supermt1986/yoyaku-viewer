import http from 'http';

const baseHost = 'yoyaku.com';
const receiptNo = '8194660';

// Try different path patterns for each link type
const patterns = {
  '詳細登録 (booking)': [
    `/reservation/${receiptNo}`,
    `/reservations/${receiptNo}`,
    `/reserve/${receiptNo}`,
    `/book/${receiptNo}`,
    `/details/${receiptNo}`,
    `/view/${receiptNo}`,
    `/?id=${receiptNo}`,
    `/?r=${receiptNo}`
  ],
  'キャンセル (cancel)': [
    `/cancel/${receiptNo}`,
    `/cancellation/${receiptNo}`,
    `/cancel/?id=${receiptNo}`
  ],
  '利用案内書 (guide)': [
    `/guide/${receiptNo}`,
    `/manual/${receiptNo}`,
    `/info/${receiptNo}`,
    `/instructions/${receiptNo}`
  ]
};

async function testPath(path) {
  return new Promise((resolve) => {
    const req = http.request(`http://${baseHost}${path}`, (res) => {
      resolve({ path, status: res.statusCode });
    });
    
    req.on('error', () => resolve({ path, error: true }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ path, timeout: true });
    });
    
    req.end();
  });
}

console.log(`Testing ${baseHost} paths for receipt #${receiptNo}\n`);

for (const [category, paths] of Object.entries(patterns)) {
  console.log(`\n${category}:`);
  
  for (const path of paths) {
    const result = await testPath(path);
    
    if (result.status === 200) {
      console.log(`  ✅ ${path}`);
    } else if (result.status === 404) {
      console.log(`  ❌ 404: ${path}`);
    } else {
      console.log(`  🟡 ${result.status || 'error'}: ${path}`);
    }
  }
}

console.log('\n\nAlso testing homepage structure...');
const homeReq = http.get(`http://${baseHost}/`, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    // Extract links from homepage HTML
    const hrefMatches = body.match(/href=["']([^"']*?\.[a-z]+[^"']*)["']/gi);
    if (hrefMatches && hrefMatches.length > 0) {
      console.log('\nFound some links on homepage:');
      hrefMatches.slice(0, 10).forEach(link => console.log('  ' + link));
    }
    
    // Check title
    const titleMatch = body.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      console.log(`\nPage title: ${titleMatch[1]}`);
    }
  });
});

homeReq.on('error', err => console.error('Home error:', err));

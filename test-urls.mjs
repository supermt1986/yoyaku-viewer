import https from 'https';
import http from 'http';

const urls = [
  { protocol: 'https', host: 'yoyaku.co', path: '/' },
  { protocol: 'http', host: 'yoyaku.co', path: '/' },
  { protocol: 'https', host: 'www.yoyaku.co', path: '/' },
  { protocol: 'http', host: 'www.yoyaku.co', path: '/' },
  { protocol: 'https', host: 'yoyaku.com', path: '/' },
  { protocol: 'http', host: 'yoyaku.com', path: '/' }
];

console.log('Testing URL patterns...\n');

async function testUrl(config) {
  return new Promise((resolve, reject) => {
    const lib = config.protocol === 'https' ? https : http;
    const urlStr = `${config.protocol}://${config.host}${config.path}`;
    
    console.log(`Checking: ${urlStr}`);
    
    const req = lib.request(urlStr, (res) => {
      console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log('  ✅ Accessible!');
      }
      resolve({ url: urlStr, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ Error: ${error.message}`);
      resolve({ url: urlStr, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('  ⏱️ Timeout');
      resolve({ url: urlStr, error: 'Timeout' });
    });
    
    req.end();
  });
}

async function main() {
  let workingUrl = null;
  
  for (const config of urls) {
    const result = await testUrl(config);
    console.log('---\n');
    
    if (result.ok) {
      workingUrl = result.url.replace(/\/$/, '');
      break;
    }
  }
  
  if (workingUrl) {
    // Test booking link with working base URL
    const bookingUrl = `${workingUrl}/booking/8194660`;
    console.log(`\n✅ Testing booking link: ${bookingUrl}\n`);
    await testUrl({
      protocol: workingUrl.startsWith('https') ? 'https' : 'http',
      host: new URL(bookingUrl).hostname,
      path: '/booking/8194660'
    });
  } else {
    console.log('\n❌ No working URL found. Domain may not exist or is blocking requests.');
  }
}

main().catch(console.error);

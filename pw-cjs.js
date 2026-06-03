const pw = require('@playwright/test');
const chromium = pw.chromium;
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  try {
    await page.goto('http://localhost:3000/dashboard/segments', { waitUntil: 'networkidle', timeout: 20000 });
  } catch(e) {
    console.log('networkidle timeout, continuing...');
  }
  await page.screenshot({ path: 'C:/Users/modys/AppData/Local/Temp/seg-1-full.png', fullPage: true });
  console.log('screenshot 1 saved, title:', await page.title());
  const cards = page.locator('button').filter({ has: page.locator('h3') });
  const cnt = await cards.count();
  console.log('cluster card buttons:', cnt);
  if (cnt > 0) {
    await cards.first().click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'C:/Users/modys/AppData/Local/Temp/seg-2-expanded.png', fullPage: true });
    console.log('screenshot 2 saved');
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });

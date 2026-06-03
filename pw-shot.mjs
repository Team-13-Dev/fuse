import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
try {
  await page.goto('http://localhost:3000/dashboard/segments', { waitUntil: 'networkidle', timeout: 20000 });
} catch(e) {
  await page.waitForTimeout(3000);
}
await page.screenshot({ path: 'C:/Users/modys/AppData/Local/Temp/seg-1-full.png', fullPage: true });
console.log('screenshot 1 saved:', await page.title());

const cards = page.locator('button').filter({ has: page.locator('h3') });
const count = await cards.count();
console.log('cluster cards found:', count);
if (count > 0) {
  await cards.first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'C:/Users/modys/AppData/Local/Temp/seg-2-expanded.png', fullPage: true });
  console.log('screenshot 2 saved: expanded cluster');
}
await browser.close();

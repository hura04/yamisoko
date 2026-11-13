// Browser check for the site layout. Usage: node scripts/check-site.cjs <url> [screenshotDir]
const { chromium } = require('playwright')

const url = process.argv[2]
const outDir = process.argv[3] || '.'
const fail = msg => { console.error('FAIL:', msg); process.exitCode = 1 }

;(async () => {
  const browser = await chromium.launch()
  const errors = []
  const watch = page => {
    page.on('pageerror', e => errors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  }

  // Desktop
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'ja-JP' })
  const page = await ctx.newPage(); watch(page)
  await page.goto(url)
  await page.waitForSelector('#changelog li')
  const box = sel => page.locator(sel).boundingBox()
  const [l, g, r] = [await box('#left'), await box('#game'), await box('#right')]
  if (!(l && g && r && l.x < g.x && g.x < r.x)) fail('desktop: columns not left < game < right')
  const c = await box('#game canvas')
  if (!c || Math.abs(c.width - c.height) > 1) fail('desktop: canvas not square')
  if (!(await page.isVisible('#news')) || !(await page.isVisible('#changelog'))) fail('desktop: panels hidden')
  if (await page.isVisible('.tabs')) fail('desktop: tabs should be hidden')
  await page.screenshot({ path: `${outDir}/site-desktop.png` })

  // Language toggle persists
  const before = await page.textContent('#news h2')
  await page.click('#lang-toggle')
  const after = await page.textContent('#news h2')
  if (before === after || !/News/.test(after)) fail(`lang toggle: "${before}" -> "${after}"`)
  if ((await page.getAttribute('html', 'lang')) !== 'en') fail('html lang not en')
  await page.reload()
  await page.waitForSelector('#news h2')
  if (!/News/.test(await page.textContent('#news h2'))) fail('lang not persisted after reload')
  await ctx.close()

  // Mobile
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'ja-JP', hasTouch: true, isMobile: true })
  const mp = await m.newPage(); watch(mp)
  await mp.goto(url)
  await mp.waitForSelector('#changelog li', { state: 'attached' })
  const sw = await mp.evaluate(() => document.documentElement.scrollWidth)
  if (sw > 390) fail(`mobile: horizontal overflow ${sw}`)
  if (!(await mp.isVisible('.tabs'))) fail('mobile: tabs not visible')
  const mg = await mp.locator('#game canvas').boundingBox()
  if (!mg || mg.width < 340) fail('mobile: game too small')
  await mp.click('.tabs [data-tab="changelog"]')
  if (!(await mp.isVisible('#changelog')) || (await mp.isVisible('#news'))) fail('mobile: changelog tab did not switch')
  if (!(await mp.isVisible('#best'))) fail('mobile: best not visible')
  await mp.screenshot({ path: `${outDir}/site-mobile.png`, fullPage: true })
  await m.close()

  // Small portrait phone: shop must fit inside the stage
  const se = await browser.newContext({ viewport: { width: 320, height: 568 }, locale: 'ja-JP', hasTouch: true, isMobile: true })
  const sp = await se.newPage(); watch(sp)
  await sp.goto(url)
  await sp.click('#overlay [data-action="shop"]')
  const st = await sp.locator('#stage').boundingBox()
  const tt = await sp.locator('#overlay .ov-title').boundingBox()
  const pb = await sp.locator('#overlay [data-action="play"]').boundingBox()
  if (tt.y < st.y - 1) fail(`320x568 shop: title clipped (title ${tt.y} < stage ${st.y})`)
  if (pb.y + pb.height > st.y + st.height + 1) fail(`320x568 shop: play button clipped (${pb.y + pb.height} > ${st.y + st.height})`)
  await se.close()

  // Landscape phone: whole stage and Play button on screen
  const ls = await browser.newContext({ viewport: { width: 844, height: 390 }, locale: 'ja-JP', hasTouch: true, isMobile: true })
  const lp = await ls.newPage(); watch(lp)
  await lp.goto(url)
  const lst = await lp.locator('#stage').boundingBox()
  const lpb = await lp.locator('#overlay [data-action="play"]').boundingBox()
  if (lst.height > 390) fail(`landscape: stage taller than viewport (${lst.height})`)
  if (lpb.y + lpb.height > 390) fail(`landscape: play button below fold (${lpb.y + lpb.height})`)
  await lp.screenshot({ path: `${outDir}/site-landscape.png` })
  await ls.close()

  if (errors.length) fail('console errors: ' + errors.join(' | '))
  await browser.close()
  if (!process.exitCode) console.log('PASS check-site')
})()

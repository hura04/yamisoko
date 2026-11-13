// Browser check for the playable game. Usage: node scripts/check-game.cjs <url> [screenshotDir]
const { chromium } = require('playwright')

const url = process.argv[2]
const outDir = process.argv[3] || '.'
const fail = msg => { console.error('FAIL:', msg); process.exitCode = 1 }

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto(url)
  await page.waitForSelector('#overlay [data-action="play"]', { timeout: 5000 })
  await page.click('#overlay [data-action="play"]')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${outDir}/game.png` })
  await page.keyboard.up('ArrowRight')
  if (await page.isVisible('#overlay')) fail('overlay still visible after starting play')
  if ((await page.evaluate(() => window.scrollY)) !== 0) fail('page scrolled while pressing arrow keys')

  // Losing window focus during play pauses the game
  await page.click('#overlay [data-action="play"]').catch(() => {})
  if (await page.isVisible('#overlay')) {
    // a game over may have happened; start again
    await page.click('#overlay [data-action="play"]')
  }
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.waitForTimeout(100)
  if (!(await page.isVisible('#overlay [data-action="resume"]'))) fail('blur did not pause the game')
  else {
    await page.click('#overlay [data-action="resume"]')
    if (await page.isVisible('#overlay')) fail('resume did not hide the overlay')
  }

  await page.evaluate(() => localStorage.setItem('yamisoko.save.v1', '{oops'))
  await page.reload()
  await page.waitForSelector('#overlay [data-action="play"]', { timeout: 5000 }).catch(() => fail('title not shown after corrupted save'))

  if (errors.length) fail('console errors: ' + errors.join(' | '))
  await browser.close()
  if (!process.exitCode) console.log('PASS check-game')
})()

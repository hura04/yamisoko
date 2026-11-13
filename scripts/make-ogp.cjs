// Renders the 1200x630 social preview image to public/ogp.png.  Usage: node scripts/make-ogp.cjs
const { chromium } = require('playwright')
const path = require('node:path')

const html = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;position:relative;overflow:hidden;background:#05060a;font-family:'Hiragino Sans','Noto Sans JP',system-ui,sans-serif">
  <div style="position:absolute;left:260px;top:315px;width:1100px;height:1100px;transform:translate(-50%,-50%);
    background:conic-gradient(from 60deg at 50% 50%, rgba(255,211,107,0.55) 0deg, rgba(255,211,107,0) 60deg, transparent 300deg, rgba(255,211,107,0) 300deg, rgba(255,211,107,0.55) 360deg);
    -webkit-mask:radial-gradient(circle, #000 0%, #000 20%, transparent 60%);mask:radial-gradient(circle, #000 0%, #000 20%, transparent 60%)"></div>
  <div style="position:absolute;left:236px;top:291px;width:48px;height:48px;border-radius:50%;background:#ffd36b;box-shadow:0 0 60px 20px rgba(255,211,107,.5)"></div>
  <div style="position:absolute;left:370px;top:225px;width:0;height:0;border-left:26px solid transparent;border-right:26px solid transparent;border-bottom:46px solid #7aa8ff;opacity:.9"></div>
  <div style="position:absolute;right:80px;top:170px;text-align:right;color:#ffd36b">
    <div style="font-size:150px;font-weight:800;letter-spacing:.08em;text-shadow:0 0 40px rgba(255,211,107,.5)">ヤミソコ</div>
    <div style="font-size:64px;font-weight:700;letter-spacing:.2em;color:#e7e7ea;margin-top:-6px">YAMISOKO</div>
    <div style="font-size:32px;color:#9a9cab;margin-top:20px">暗闇を照らして、地下へ。</div>
  </div>
</div></body></html>`

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.setContent(html)
  await page.screenshot({ path: path.join(__dirname, '..', 'public', 'ogp.png') })
  await browser.close()
  console.log('wrote public/ogp.png')
})()

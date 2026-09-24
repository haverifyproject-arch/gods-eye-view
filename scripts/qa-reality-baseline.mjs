import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage();
  await page.setViewport({width:1440,height:960});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__godsEyeView,{timeout:120000});
  await new Promise(r=>setTimeout(r,6000));
  await page.screenshot({path:'output/reality-baseline.png'});
  console.log(await page.evaluate(()=>({viewer:!!window.__godsEyeView.viewer,bodyChildren:[...document.body.children].map(e=>[e.tagName,e.id]),navigation:typeof window.__godsEyeView.styleManager._runExplicitNavigation})));
} finally {await browser.close();}

'use strict';
// Offline semantic shell fixtures. No official application, account, or chat is read.
// node Test-RendererShellRoutes.cjs result.json ambient.mp4 [renderer.js]
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=require('playwright');
const [output,media,sourcePath=path.resolve(__dirname,'..','renderer.js')]=process.argv.slice(2);
if(!output||!media)throw Error('Provide output and packaged ambient media paths');
const source=fs.readFileSync(sourcePath,'utf8');
const hostSource=fs.readFileSync(path.resolve(__dirname,'..','wallpaper-host-src','WallpaperSession.cs'),'utf8');
const hostObservationMatch=/const string LayoutObservation="((?:\\.|[^"\\])*)";/.exec(hostSource);
if(!hostObservationMatch)throw Error('Missing fixed host layout observation');
const hostObservation=JSON.parse('"'+hostObservationMatch[1]+'"');
const report={passed:false,checks:[],sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),networkBlocked:true,actualCodexStarted:false};
const check=(n,a,e=true)=>{assert.deepEqual(a,e,n);report.checks.push(n);};
const auditNames=['FrameCount','ActiveFrameCount','AnyMainCount','ActiveAnyMainCount','PageSurfaceFrameCount','LayoutTokenValid','PageLayoutTokenValid','FrameHashMatches','PageSurfaceFlag','DirectRowCount','DecorationCount','DecorationValid','ComposerCount','ComposerAmbiguous'];
function audit(s){return Object.fromEntries(auditNames.map(name=>[name,s['layoutAudit'+name]]));}
function boundedAudit(s){const keys=Object.keys(s).filter(key=>key.startsWith('layoutAudit'));check('Only fixed audit keys '+report.checks.length,keys.sort(),auditNames.map(name=>'layoutAudit'+name).sort());check('Only bounded numeric audit values '+report.checks.length,Object.values(audit(s)).every(v=>Number.isInteger(v)&&v>=-1&&v<=129));}
const composer='<div id="composer" class="_ComposerLayoutRoot_test2_8" data-composer-surface-variant="default"><textarea></textarea><button id="send">Send</button></div>';
const main='<main id="main" class="_MainContentSurface_test_2" data-app-shell-main-surface="default"><div class="_WorkspaceContent_test_2">'+composer+'</div></main>';
const shell='<div id="root"><div id="frame" class="_Layout_test_2 _PageSurfaceLayout_test_2" data-app-shell-frame="true" data-app-shell-page-surface="true"><div id="bar" class="_ApplicationMenuTopBar_test_2">Menu</div><div id="row" data-app-shell-workspace-row="true"><div id="decoration" class="_PageSurface_test_2" aria-hidden="true"></div><aside id="app-shell-sidebar" class="_LeftPanel_test_2"><nav data-app-navigation-rail>Navigation</nav></aside><section id="home">'+composer+'</section></div></div></div>';
const currentClasses={
 Layout:'WMJYvH',PageSurfaceLayout:'oqnRfB',PageSurface:'g2Llyi',MainContentSurface:'EnuIYE',
 WorkspaceContent:'dnr6uY',ComposerLayoutRoot:'XCKS7O',ApplicationMenuTopBar:'RkT2pZ',LeftPanel:'Klq782'
};
const withCurrentClasses=html=>html.replace(/_([A-Za-z]+)_test2?_\d+/g,(_,name)=>name+'-'+currentClasses[name]);
const windowsStoreShell=`<div id="root">
 <div id="storeFrame" data-app-shell-frame="true" data-app-shell-page-surface="true">
  <div id="storeRow" data-app-shell-workspace-row="true">
   <div id="storeWorkspace" data-app-shell-workspace="true">
    <div id="storeBacking" data-app-shell-surface-backing="true" aria-hidden="true"></div>
    <aside id="storeSidebar" class="app-shell-left-panel" data-app-shell-left-panel-appearance="content-surface">Navigation</aside>
    <div class="contents">
     <div id="storeRoute" class="contents windows:flex windows:flex-1 windows:overflow-hidden">
      <main id="storeMain" class="relative isolate flex min-h-0 min-w-0 flex-1 flex-col outline-none" tabindex="-1"
          data-app-shell-main-surface="default" data-codex-history-swipe-page="true">
       <div id="storeContent" class="relative isolate flex min-h-0 flex-1 overflow-hidden electron:before:bg-surface">
        <div id="storeLayout" data-app-shell-main-content-layout="default">
         <div>
          <div id="storeFade" aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 z-20 text-surface bg-[image:var(--app-shell-content-fade,none)]"></div>
         </div>
         <article id="storeArticle">Test conversation</article>
         <div id="storeFooter" class="footer-A8ZvKV pointer-events-none absolute inset-x-0 z-20">
          <div data-thread-scroll-footer="true">${withCurrentClasses(composer)}</div>
         </div>
        </div>
       </div>
      </main>
     </div>
    </div>
   </div>
  </div>
 </div>
</div>`;
const css='html,body,#root,#frame{width:1000px;height:700px;margin:0}#frame{background:#202020}#row{height:650px;position:relative}#decoration{position:absolute;inset:0;background:#202020;pointer-events:none}#home{position:relative;padding:80px 120px}#composer{position:relative;background:var(--composer-layout-surface-background,#343646);backdrop-filter:var(--composer-layout-surface-backdrop-filter,none)}:root{--color-surface:#1d1e2c;--color-surface-elevated-secondary:#343646;color:#fff}';
const windowsStoreCss=`
 #storeFrame, #storeRow, #storeWorkspace { min-height: 650px; }
 #storeBacking, #storeMain { background-color: rgb(32, 32, 32); }
 #storeContent::before { content: ""; background-color: rgb(32, 32, 32); }
 #storeArticle { background-color: rgb(54, 62, 68); }
 #storeSidebar { background-color: var(--color-surface); }
 #storeFade, #storeFooter, #storeFooter::before, #storeFooter::after {
  content: "";
  background-color: rgb(32, 32, 32);
  background-image: linear-gradient(rgb(32, 32, 32), transparent);
 }
`;
let browser;const started=Date.now();const deadline=setTimeout(()=>{if(browser)void browser.close();},27000);
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||path.join(process.env.ProgramFiles,'Google/Chrome/Application/chrome.exe'),headless:true,timeout:5000,args:['--disable-background-networking','--disable-component-update','--no-first-run']});
 const context=await browser.newContext({viewport:{width:1000,height:700}});await context.route('**/*',r=>r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(2500);
 const status=()=>page.evaluate(()=>__codexDragonWallpaperV1.status());
 async function setup(mutate=null,html=shell){await page.setContent('<html><head><style>'+css+windowsStoreCss+'</style></head><body>'+html+'</body></html>');if(mutate)await page.evaluate(mutate);const installed=await page.evaluate(source);check('Install '+report.checks.length,installed.ok);return status();}
 let s=await setup();check('Official frame route without conversation main supported',s.layoutSupported);check('Frame surface kind',s.layoutSurfaceKind,'frame');check('Frame reason',s.layoutReason,'ready');boundedAudit(s);check('Known frame audit evidence',audit(s),{FrameCount:1,ActiveFrameCount:1,AnyMainCount:0,ActiveAnyMainCount:0,PageSurfaceFrameCount:1,LayoutTokenValid:1,PageLayoutTokenValid:1,FrameHashMatches:1,PageSurfaceFlag:1,DirectRowCount:1,DecorationCount:1,DecorationValid:1,ComposerCount:1,ComposerAmbiguous:0});
 const observed=await page.evaluate(hostObservation);check('Actual host phase38 observation retains renderer kind',observed.layoutSurfaceKind,'frame');check('Actual host phase38 frame counters',[observed.layoutMainCount,observed.layoutActiveMainCount,observed.layoutFrameCount,observed.layoutActiveFrameCount,observed.layoutWorkspaceRowCount],[0,0,1,1,1]);check('Actual host phase45 audit fields survive observation',audit(observed),audit(s));
 await page.evaluate(()=>document.documentElement.setAttribute('data-codex-dragon-background','v1'));
 check('Audited inert page surface cleared',await page.locator('#decoration').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
 await page.evaluate(()=>document.getElementById('decoration').className='_PageSurface_test_99');check('Changed decoration token stays supported',(await status()).layoutSupported);check('Changed decoration binding refreshed',await page.locator('#decoration').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
 check('Frame composer keeps original glass alpha',await page.locator('#composer').evaluate(n=>getComputedStyle(n).backgroundColor.includes('/ 0.6)')));
 await page.locator('textarea').fill('Synthetic test');check('Typing preserved',await page.locator('textarea').inputValue(),'Synthetic test');await page.evaluate(()=>document.getElementById('send').onclick=()=>window.clicked=true);await page.locator('#send').click();check('Click preserved',await page.evaluate(()=>window.clicked));
 const currentShell=withCurrentClasses(shell),currentMain=withCurrentClasses(main);
 s=await setup(null,currentShell);check('Current frame validates independent component hashes',s.layoutSurfaceKind,'frame');
 await page.evaluate(()=>document.documentElement.setAttribute('data-codex-dragon-background','v1'));
 check('Current frame decoration is transparent',await page.locator('#decoration').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
 s=await setup(null,'<div id="root">'+currentMain+'</div>');check('Current conversation layout is accepted',s.layoutSurfaceKind,'main');
 await page.evaluate(()=>document.documentElement.setAttribute('data-codex-dragon-background','v1'));
 check('Current composer receives translucent style',await page.locator('#composer').evaluate(n=>getComputedStyle(n).backgroundColor.includes('/ 0.6)')));
 await page.evaluate(()=>document.querySelector('#main > div').className='_WorkspaceContent_test_2');
 check('Mixed legacy and current shell classes are rejected',(await status()).layoutReason,'workspace-shape');
 s=await setup(()=>document.getElementById('frame').className+=' Layout-abc123',currentShell);
 check('Duplicate current layout tokens remain ambiguous',s.layoutReason,'frame-token');
 const malformed=[
 ['frame-token',()=>document.getElementById('frame').className='unknown'],
 ['frame-token',()=>document.getElementById('frame').setAttribute('data-app-shell-page-surface','false')],
 ['frame-token',()=>document.getElementById('frame').className='_Layout_test_2'],
 ['frame-shape',()=>document.getElementById('decoration').remove()],
 ['frame-shape',()=>document.getElementById('row').append(document.getElementById('decoration').cloneNode(true))],
 ['frame-shape',()=>document.getElementById('row').insertAdjacentHTML('beforeend','<main data-app-shell-main-surface="unknown"></main>')],
 ['frame-token',()=>document.getElementById('frame').className+=' _Layout_other_2'],
 ['frame-count',()=>document.getElementById('root').append(document.getElementById('frame').cloneNode(true))],
 ['frame-row',()=>document.getElementById('row').removeAttribute('data-app-shell-workspace-row')],
 ['frame-row',()=>document.getElementById('frame').append(document.getElementById('row').cloneNode(true))],
 ['frame-shape',()=>document.getElementById('decoration').className='_PageSurface_foreign_2'],
 ['frame-shape',()=>document.getElementById('decoration').removeAttribute('aria-hidden')],
 ['shell-shape',()=>document.getElementById('bar').className='_ApplicationMenuTopBar_foreign_2'],
 ['main-count',()=>document.getElementById('frame').setAttribute('data-app-shell-active-page','false')]
 ];
 for(const[reason,mutate]of malformed){s=await setup(mutate);boundedAudit(s);check('Reject '+reason+' '+report.checks.length,s.layoutSupported,false);check('Reason '+report.checks.length,s.layoutReason,reason);check('No marker '+report.checks.length,await page.evaluate(()=>document.documentElement.hasAttribute('data-codex-dragon-background')),false);}
 s=await setup(null,'<div id="root"><main><h1>Sign in</h1><button>Sign in</button></main></div>');check('Ordinary login main stays unsupported',s.layoutSupported,false);check('Ordinary login reason',s.layoutReason,'main-count');boundedAudit(s);check('No known frame count is zero',s.layoutAuditFrameCount,0);check('Unexamined token remains unknown',s.layoutAuditLayoutTokenValid,-1);check('Unexamined composer remains unknown',s.layoutAuditComposerCount,-1);
 s=await setup(()=>{const n=document.createElement('main');n.setAttribute('data-app-shell-main-surface','default');n.setAttribute('data-app-shell-active-page','false');n.className='unknown';document.getElementById('row').append(n);});check('Inactive cached main does not block active audited frame',s.layoutSurfaceKind,'frame');check('Inactive main still counted',s.layoutAuditAnyMainCount,1);check('Inactive main is not active',s.layoutAuditActiveAnyMainCount,0);
 s=await setup(()=>{const n=document.createElement('main');n.setAttribute('data-app-shell-main-surface','default');n.className='unknown';document.getElementById('row').append(n);});check('Malformed active main cannot fall through to frame',s.layoutSupported,false);check('Malformed active main reason preserved',s.layoutReason,'main-token');
 s=await setup(()=>{for(let i=0;i<128;i++)document.getElementById('root').append(document.getElementById('frame').cloneNode(true));});boundedAudit(s);check('Excess frames report cap',s.layoutAuditFrameCount,129);check('Unexamined excess active frames remain unknown',s.layoutAuditActiveFrameCount,-1);
 s=await setup(()=>document.getElementById('composer').className+=' _ComposerLayoutRoot_other_2');boundedAudit(s);check('Composer ambiguity explicitly reported',s.layoutAuditComposerAmbiguous,1);check('Composer count independently reported',s.layoutAuditComposerCount,1);
 await setup();await page.locator('#codex-dragon-file-v1').setInputFiles(media);check('Real packaged video attaches',(await page.evaluate(()=>__codexDragonWallpaperV1.attach())).ok);await page.waitForFunction(()=>__codexDragonWallpaperV1.status().stageVisible,{},{timeout:10000});
 await page.evaluate(()=>{window.savedVideo=document.querySelector('#codex-dragon-stage-v1 video');window.savedHome=document.getElementById('home').outerHTML;});
 for(let cycle=0;cycle<4;cycle++){
  await page.evaluate(html=>{document.getElementById('home').remove();document.getElementById('row').insertAdjacentHTML('beforeend',html);},main);
  s=await status();boundedAudit(s);check('Main branch frame audit remains unknown '+cycle,s.layoutAuditFrameCount,-1);check('Main route supported '+cycle,s.layoutSurfaceKind,'main');const hostMain=await page.evaluate(hostObservation);check('Actual host main route counters '+cycle,[hostMain.layoutSurfaceKind,hostMain.layoutMainCount,hostMain.layoutActiveMainCount,hostMain.layoutFrameCount,hostMain.layoutActiveFrameCount,hostMain.layoutWorkspaceRowCount],['main',1,1,1,1,1]);await page.waitForFunction(()=>__codexDragonWallpaperV1.status().stageVisible,{},{timeout:2500});
  check('Main and frame share decoder '+cycle,await page.evaluate(()=>document.querySelector('#codex-dragon-stage-v1 video')===window.savedVideo));
  await page.evaluate(()=>{document.getElementById('main').remove();document.getElementById('row').insertAdjacentHTML('beforeend',window.savedHome);});s=await status();check('Home route recovers '+cycle,s.layoutSurfaceKind,'frame');await page.waitForFunction(()=>__codexDragonWallpaperV1.status().stageVisible,{},{timeout:2500});
  check('Only one video '+cycle,await page.locator('#codex-dragon-stage-v1 video').count(),1);
 }
 await page.emulateMedia({contrast:'more'});check('Higher contrast retains native frame',await page.locator('#frame').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(29, 30, 44)');await page.emulateMedia({contrast:'no-preference'});
 await page.evaluate(()=>__codexDragonWallpaperV1.dispose());check('Dispose restores inert page paint',await page.locator('#decoration').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(32, 32, 32)');check('Dispose removes owned nodes',await page.locator('#codex-dragon-stage-v1,#codex-dragon-file-v1,#codex-dragon-style-v1').count(),0);

 s=await setup(null,windowsStoreShell);
 check('Windows Store route with exact app-shell anchors is supported',s.layoutSupported);
 check('Windows Store route remains a main surface',s.layoutSurfaceKind,'main');
 check('Windows Store route reason',s.layoutReason,'ready');
 const storeObserved=await page.evaluate(hostObservation);
 check('Host recognizes the Windows Store main, frame and row',
  [storeObserved.layoutSurfaceKind,storeObserved.layoutActiveMainCount,storeObserved.layoutActiveFrameCount,storeObserved.layoutWorkspaceRowCount],['main',1,1,1]);
 for(const layout of ['thread-edge-scroll','document-edge-scroll','custom-titlebar','full-bleed']){
  s=await setup(null,windowsStoreShell.replace('data-app-shell-main-content-layout="default"','data-app-shell-main-content-layout="'+layout+'"'));
  check('Known Windows Store content layout is supported: '+layout,s.layoutSurfaceKind,'main');
 }
 s=await setup(()=>{
  document.getElementById('storeBacking').remove();
  document.getElementById('storeFrame').removeAttribute('data-app-shell-page-surface');
 },windowsStoreShell);
 check('Windows Store main without a backing layer still works',s.layoutSurfaceKind,'main');
 s=await setup(()=>{
  const inactive=document.getElementById('storeFrame').cloneNode(true);
  inactive.setAttribute('data-app-shell-active-page','false');
  document.getElementById('root').append(inactive);
 },windowsStoreShell);
 check('Inactive Windows Store routes cannot shadow the active route',s.layoutSurfaceKind,'main');

 const malformedStoreRoutes=[
  ['missing history page marker',()=>document.getElementById('storeMain').removeAttribute('data-codex-history-swipe-page')],
  ['wrong main tabindex',()=>document.getElementById('storeMain').setAttribute('tabindex','0')],
  ['missing Windows route class',()=>document.getElementById('storeRoute').classList.remove('windows:overflow-hidden')],
  ['missing main utility class',()=>document.getElementById('storeMain').classList.remove('outline-none')],
  ['missing direct content wrapper class',()=>document.getElementById('storeContent').classList.remove('overflow-hidden')],
  ['unrecognized content layout',()=>document.getElementById('storeLayout').setAttribute('data-app-shell-main-content-layout','unknown')],
  ['missing workspace anchor',()=>document.getElementById('storeWorkspace').removeAttribute('data-app-shell-workspace')],
  ['backing is no longer inert',()=>document.getElementById('storeBacking').removeAttribute('aria-hidden')],
  ['backing displaced outside the workspace',()=>document.getElementById('storeRow').append(document.getElementById('storeBacking'))],
  ['page-surface flag without its backing',()=>document.getElementById('storeBacking').remove()],
  ['unexpected backing when page-surface is absent',()=>document.getElementById('storeFrame').removeAttribute('data-app-shell-page-surface')],
  ['ambiguous active frame',()=>document.getElementById('root').append(document.getElementById('storeFrame').cloneNode(true))]
 ];
 for(const [label,mutate] of malformedStoreRoutes){
  s=await setup(mutate,windowsStoreShell);
  check('Reject malformed Windows Store route: '+label,s.layoutSupported,false);
  check('Rejected Windows Store route has no wallpaper marker: '+label,await page.evaluate(()=>document.documentElement.hasAttribute('data-codex-dragon-background')),false);
 }

 await setup(null,windowsStoreShell);
 const storeChromePaint=()=>page.evaluate(()=>{
  function paint(id,pseudo=null){
   const {backgroundColor,backgroundImage}=getComputedStyle(document.getElementById(id),pseudo);
   return [backgroundColor,backgroundImage];
  }
  return {sidebar:paint('storeSidebar'),fade:paint('storeFade'),footer:paint('storeFooter'),
   footerBefore:paint('storeFooter','::before'),footerAfter:paint('storeFooter','::after')};
 });
 const nativeChromePaint=await storeChromePaint();
 const nativeGradient=['rgb(32, 32, 32)','linear-gradient(rgb(32, 32, 32), rgba(0, 0, 0, 0))'];
 check('Windows Store chrome has native paint before wallpaper',nativeChromePaint,{
  sidebar:['rgb(29, 30, 44)','none'],fade:nativeGradient,footer:nativeGradient,
  footerBefore:nativeGradient,footerAfter:nativeGradient
 });
 const managedStoreVideo=await page.evaluate(()=>__codexDragonWallpaperV1.configure({managed:true,documentGeneration:'0123456789abcdef0123456789abcdef'}));
 check('Windows Store wallpaper accepts the managed document generation',managedStoreVideo.ok);
 await page.locator('#codex-dragon-file-v1').setInputFiles(media);
 check('Windows Store route prepares the packaged video', (await page.evaluate(()=>__codexDragonWallpaperV1.attach({deferReveal:true}))).ok);
 s=await status();
 check('Windows Store video preparation remains hidden',s.prepared&&!s.revealed&&!s.firstFrameConfirmed&&!s.stageVisible);
 check('Windows Store route accepts the prepare and commit sequence',await page.evaluate(()=>{
  const id='123456789abcdef0123456789abcdef0';
  const api=__codexDragonWallpaperV1;
  return api.prepare(id,performance.now()+1000).ok&&api.commit(id,performance.now()+1000).ok;
 }));
 await page.waitForFunction(()=>{
  const actual=__codexDragonWallpaperV1.status();
  return actual.wallpaperApplied&&actual.firstFrameConfirmed&&actual.stageVisible;
 },null,{timeout:5000});
 const storePaint=(selector,pseudo=null)=>page.locator(selector).evaluate((node,pseudoElement)=>getComputedStyle(node,pseudoElement).backgroundColor,pseudo);
 check('Windows Store backing paint is transparent',await storePaint('#storeBacking'),'rgba(0, 0, 0, 0)');
 check('Windows Store main paint is transparent',await storePaint('#storeMain'),'rgba(0, 0, 0, 0)');
 check('Windows Store content wrapper before paint is transparent',await storePaint('#storeContent','::before'),'rgba(0, 0, 0, 0)');
 const clearPaint=['rgba(0, 0, 0, 0)','none'];
 check('Windows Store sidebar, top fade and footer decorations clear over the wallpaper',await storeChromePaint(),{
  sidebar:clearPaint,fade:clearPaint,footer:clearPaint,footerBefore:clearPaint,footerAfter:clearPaint
 });
 check('Windows Store composer keeps its glass alpha',(await storePaint('#composer')).includes('/ 0.6)'));
 check('Conversation content keeps its own native paint',await storePaint('#storeArticle'),'rgb(54, 62, 68)');
 await page.locator('textarea').fill('Synthetic Windows Store test');
 check('Windows Store typing stays available',await page.locator('textarea').inputValue(),'Synthetic Windows Store test');
 await page.locator('#send').evaluate(node=>node.onclick=()=>{window.storeClicked=true;});
 await page.locator('#send').click();
 check('Windows Store click stays available',await page.evaluate(()=>window.storeClicked));

 await page.locator('#storeLayout').evaluate(node=>node.setAttribute('data-app-shell-main-content-layout','unknown'));
 s=await status();
 check('An unknown layout on a running route suspends the wallpaper',!s.layoutSupported&&!s.wallpaperApplied&&!s.stageVisible);
 check('Suspending the Windows Store route restores native paint',await storePaint('#storeBacking'),'rgb(32, 32, 32)');
 check('Suspending the Windows Store route restores chrome paint',await storeChromePaint(),nativeChromePaint);
 await page.locator('#storeLayout').evaluate(node=>node.setAttribute('data-app-shell-main-content-layout','thread-edge-scroll'));
 await page.waitForFunction(()=>__codexDragonWallpaperV1.status().stageVisible,null,{timeout:3000});
 check('The newly valid Windows Store route keeps a single decoder',await page.locator('#codex-dragon-stage-v1 video').count(),1);
 await page.evaluate(()=>__codexDragonWallpaperV1.dispose());
 check('Disposing the Windows Store route restores native paint',await storePaint('#storeBacking'),'rgb(32, 32, 32)');
 check('Disposing the Windows Store route restores chrome paint',await storeChromePaint(),nativeChromePaint);
 check('Disposing the Windows Store route removes owned nodes',await page.locator('#codex-dragon-stage-v1,#codex-dragon-file-v1,#codex-dragon-style-v1').count(),0);
 check('No page errors',errors,[]);report.passed=true;
})().catch(e=>{report.error=String(e.stack||e);process.exitCode=1;}).finally(async()=>{clearTimeout(deadline);if(browser)await browser.close();report.elapsedMs=Date.now()-started;fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,elapsedMs:report.elapsedMs,error:report.error}));});

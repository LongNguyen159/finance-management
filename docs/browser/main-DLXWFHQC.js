import{P as O,t as V}from"./chunk-QTWUJ5OJ.js";import"./chunk-EJJBCPAK.js";import{a as _,b as M,e as k,f as N,h as D,i as j,k as i,p as T,sa as E,wa as x}from"./chunk-6XGTMRGJ.js";import{$a as w,Eb as S,Ec as F,Ha as y,Sc as R,Y as p,Ya as c,Za as v,_ as m,ba as h,bb as b,cb as C,dc as P,ea as l,eb as A,ia as u,la as g,rc as I,za as f}from"./chunk-MQ3VJMD5.js";import"./chunk-GAL4ENT6.js";var U=[{path:i.Docs.split("/")[1],loadComponent:()=>import("./chunk-2Y5VWQ6S.js").then(o=>o.DocsPageComponent)},{path:i.MainPage.split("/")[1],loadComponent:()=>import("./chunk-U45GCQXA.js").then(o=>o.MainPageComponent)},{path:i.WelcomePage.split("/")[1],loadComponent:()=>import("./chunk-PMYGPOFW.js").then(o=>o.WelcomePageComponent)},{path:i.WhatsNewPage.split("/")[1],loadComponent:()=>import("./chunk-SSVWFKOP.js").then(o=>o.WhatsNewPageComponent)},{path:i.FinanceManagerPage.split("/")[1],loadComponent:()=>import("./chunk-KIC7RJBJ.js").then(o=>o.StoragePageComponent)},{path:i.HighlightedFeaturesPage.split("/")[1],loadComponent:()=>import("./chunk-NG5PJGLI.js").then(o=>o.HighlightedFeaturesPageComponent)},{path:"**",redirectTo:i.MainPage}];var Z="@",$=(()=>{class o{constructor(e,r,n,a,s){this.doc=e,this.delegate=r,this.zone=n,this.animationType=a,this.moduleImpl=s,this._rendererFactoryPromise=null,this.scheduler=l(w,{optional:!0}),this.loadingSchedulerFn=l(G,{optional:!0})}ngOnDestroy(){this._engine?.flush()}loadImpl(){let e=()=>this.moduleImpl??import("./chunk-YDOCMUCI.js").then(n=>n),r;return this.loadingSchedulerFn?r=this.loadingSchedulerFn(e):r=e(),r.catch(n=>{throw new p(5300,!1)}).then(({\u0275createEngine:n,\u0275AnimationRendererFactory:a})=>{this._engine=n(this.animationType,this.doc);let s=new a(this.delegate,this._engine,this.zone);return this.delegate=s,s})}createRenderer(e,r){let n=this.delegate.createRenderer(e,r);if(n.\u0275type===0)return n;typeof n.throwOnSyntheticProps=="boolean"&&(n.throwOnSyntheticProps=!1);let a=new d(n);return r?.data?.animation&&!this._rendererFactoryPromise&&(this._rendererFactoryPromise=this.loadImpl()),this._rendererFactoryPromise?.then(s=>{let H=s.createRenderer(e,r);a.use(H),this.scheduler?.notify(10)}).catch(s=>{a.use(n)}),a}begin(){this.delegate.begin?.()}end(){this.delegate.end?.()}whenRenderingDone(){return this.delegate.whenRenderingDone?.()??Promise.resolve()}static{this.\u0275fac=function(r){v()}}static{this.\u0275prov=m({token:o,factory:o.\u0275fac})}}return o})(),d=class{constructor(t){this.delegate=t,this.replay=[],this.\u0275type=1}use(t){if(this.delegate=t,this.replay!==null){for(let e of this.replay)e(t);this.replay=null}}get data(){return this.delegate.data}destroy(){this.replay=null,this.delegate.destroy()}createElement(t,e){return this.delegate.createElement(t,e)}createComment(t){return this.delegate.createComment(t)}createText(t){return this.delegate.createText(t)}get destroyNode(){return this.delegate.destroyNode}appendChild(t,e){this.delegate.appendChild(t,e)}insertBefore(t,e,r,n){this.delegate.insertBefore(t,e,r,n)}removeChild(t,e,r){this.delegate.removeChild(t,e,r)}selectRootElement(t,e){return this.delegate.selectRootElement(t,e)}parentNode(t){return this.delegate.parentNode(t)}nextSibling(t){return this.delegate.nextSibling(t)}setAttribute(t,e,r,n){this.delegate.setAttribute(t,e,r,n)}removeAttribute(t,e,r){this.delegate.removeAttribute(t,e,r)}addClass(t,e){this.delegate.addClass(t,e)}removeClass(t,e){this.delegate.removeClass(t,e)}setStyle(t,e,r,n){this.delegate.setStyle(t,e,r,n)}removeStyle(t,e,r){this.delegate.removeStyle(t,e,r)}setProperty(t,e,r){this.shouldReplay(e)&&this.replay.push(n=>n.setProperty(t,e,r)),this.delegate.setProperty(t,e,r)}setValue(t,e){this.delegate.setValue(t,e)}listen(t,e,r){return this.shouldReplay(e)&&this.replay.push(n=>n.listen(t,e,r)),this.delegate.listen(t,e,r)}shouldReplay(t){return this.replay!==null&&t.startsWith(Z)}},G=new h("");function W(o="animations"){return A("NgAsyncAnimations"),g([{provide:b,useFactory:(t,e,r)=>new $(t,e,r,o),deps:[F,_,f]},{provide:y,useValue:o==="noop"?"NoopAnimations":"BrowserAnimations"}])}var L={providers:[I({eventCoalescing:!0}),D(U),W(),R]};var B="2.0.1";var z=(()=>{class o{constructor(e,r){this.router=e,this.title="Easy Sankey",this.appVersion="",this.colorService=l(T),this.dataService=l(O),this.colorService.renderer=r,this.colorService.applyStoredThemeSettings()}ngOnInit(){window.electronAPI?(window.electronAPI.onUpdateAvailable(()=>{alert("Update available! Downloading now...")}),window.electronAPI.onUpdateDownloaded(()=>{confirm("Update downloaded. Restart now?")&&window.electronAPI.ipcRenderer.send("restart_app")})):console.error("Electron object is not available. Ensure preload.js is correctly configured."),this.appVersion=B,localStorage.getItem("firstTime")===null||localStorage.getItem("firstTime")==="true"||this.dataService.isOldVersion()?this.navigateToWelcome():this.checkForUpdate()}checkForUpdate(){let e=localStorage.getItem("appVersion");console.log("Stored version:",e),console.log("Current version pulled from package.json:",this.appVersion),(!e||e!==this.appVersion)&&(this.router.navigate([i.WhatsNewPage]),localStorage.setItem("appVersion",this.appVersion))}navigateToWelcome(){this.router.navigate([i.WelcomePage]),localStorage.setItem("appVersion",this.appVersion),localStorage.setItem("firstTime","false")}static{this.\u0275fac=function(r){return new(r||o)(c(N),c(C))}}static{this.\u0275cmp=u({type:o,selectors:[["app-root"]],standalone:!0,features:[P],decls:1,vars:0,template:function(r,n){r&1&&S(0,"router-outlet")},dependencies:[k,V,E,x,j]})}}return o})();M(z,L).catch(o=>console.error(o));

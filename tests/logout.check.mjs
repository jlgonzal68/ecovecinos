import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../scripts/serve.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const server=createPreviewServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=process.env.LOGOUT_CHECK_URL || `http://127.0.0.1:${server.address().port}/ecovecinos/`;
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8'));
const mock=`
let signedIn=true;
let admin=false;
let handler;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export function unwrap(r){if(r.error)throw r.error;return r.data;}
export function userMessage(e){return e.message;}
export async function identity(){await wait(10);return {user:signedIn?{id:'test-user',email_confirmed_at:'2026-10-12'}:null,enrolled:signedIn,admin:signedIn&&admin};}
export async function connectBackend(){
 window.logoutTest={calls:[],fail:false,delayMaterials:0,setAdmin:value=>{admin=value;handler('SIGNED_IN');},externalSignOut:()=>{signedIn=false;handler('SIGNED_OUT');}};
 return {auth:{onAuthStateChange:fn=>{handler=fn;},signOut:async options=>{window.logoutTest.calls.push(options);await wait(80);if(window.logoutTest.fail)return {error:new Error('No se pudo cerrar la sesión de prueba.')};signedIn=false;handler('SIGNED_OUT');return {data:null};}},from:name=>{const query={select:()=>query,eq:()=>query,order:()=>query,single:async()=>({data:{registration_open:true,privacy_approved:true}}),then:(resolve,reject)=>wait(name==='materials'?window.logoutTest.delayMaterials:10).then(()=>resolve({data:name==='materials'?window.mockMaterials:[]})).catch(reject)};return query;}};
}
export async function downloadMaterial(){}
export async function uploadMaterial(){}
`;
const browser=await chromium.launch(process.env.LOGOUT_CHROMIUM_PATH?{executablePath:process.env.LOGOUT_CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true});
const report=[];
async function pageFor(width=1440){const page=await browser.newPage({viewport:{width,height:1000}});await page.addInitScript(rows=>{window.mockMaterials=rows;},catalog);await page.route('**/js/backend.mjs',route=>route.fulfill({contentType:'application/javascript',body:mock}));await page.goto(base,{waitUntil:'networkidle'});await page.locator('#page-logout').waitFor({state:'visible'});return page;}
async function cleared(page){assert.equal(await page.locator('#classroom-dialog').evaluate(d=>d.open),false);assert.equal(await page.locator('#admin-dialog').evaluate(d=>d.open),false);assert.equal(await page.locator('#resource-list').textContent(),'');assert.equal(await page.locator('#admin-content').textContent(),'');assert.equal(await page.locator('[data-logout]:visible').count(),0);assert.match(await page.locator('#access-state').textContent(),/Inscríbete/);}
try{
 for(const width of [1440,1024,768,505,390,320]){const page=await pageFor(width);await page.locator('#enter-classroom').click();await page.locator('.resource-row').first().waitFor();assert.equal(await page.locator('#logout-button').isVisible(),true);const box=await page.locator('#logout-button').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);await page.locator('#logout-button').click();await page.locator('#toast').filter({hasText:'Sesión cerrada'}).waitFor();await cleared(page);assert.deepEqual(await page.evaluate(()=>window.logoutTest.calls),[{scope:'local'}]);await page.locator('#enter-classroom').click();await page.locator('#auth-dialog').waitFor({state:'visible'});report.push({width,classroomLogout:'correcto',privateAccessAfterLogout:'bloqueado'});await page.close();}
 const admin=await pageFor();await admin.evaluate(()=>window.logoutTest.setAdmin(true));await admin.locator('#admin-button').click();await admin.locator('#settings-form').waitFor();assert.equal(await admin.locator('#admin-logout').isVisible(),true);await admin.locator('#admin-logout').click();await admin.locator('#toast').filter({hasText:'Sesión cerrada'}).waitFor();await cleared(admin);report.push({administratorLogout:'correcto'});await admin.close();
 const landing=await pageFor();await landing.locator('#page-logout').click();await landing.locator('#toast').filter({hasText:'Sesión cerrada'}).waitFor();await cleared(landing);report.push({landingLogout:'correcto'});await landing.close();
 const failure=await pageFor();await failure.evaluate(()=>window.logoutTest.fail=true);await failure.locator('#page-logout').click();await failure.locator('#toast').filter({hasText:'No se pudo cerrar'}).waitFor();assert.equal(await failure.locator('#page-logout').isVisible(),true);assert.equal(await failure.locator('#page-logout').isDisabled(),false);report.push({failedLogout:'no afirma éxito y permite reintentar'});await failure.close();
 const cross=await pageFor();await cross.locator('#enter-classroom').click();await cross.locator('.resource-row').first().waitFor();await cross.evaluate(()=>window.logoutTest.externalSignOut());await cross.locator('#classroom-dialog').waitFor({state:'hidden'});await cleared(cross);report.push({externalSignedOut:'zona privada limpiada'});await cross.close();
 const race=await pageFor();await race.evaluate(()=>window.logoutTest.delayMaterials=300);await race.locator('#enter-classroom').click();await race.locator('#classroom-dialog').waitFor();await race.locator('#logout-button').click();await race.locator('#toast').filter({hasText:'Sesión cerrada'}).waitFor();await race.waitForTimeout(400);await cleared(race);report.push({pendingMaterialsAfterLogout:'no reaparecen'});await race.close();
 await mkdir(new URL('../.work/logout-oct12/',import.meta.url),{recursive:true});await writeFile(new URL('../.work/logout-oct12/logout-ui.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}

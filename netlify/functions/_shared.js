const crypto = require('crypto');
const cookieName = 'bahia_session';
const b64 = v => Buffer.from(v).toString('base64url');
function env(name){const v=process.env[name];if(!v)throw new Error('Missing environment variable: '+name);return v;}
function parseCookies(event){const raw=event.headers?.cookie||event.headers?.Cookie||'';const out={};for(const part of raw.split(';')){const i=part.indexOf('=');if(i<1)continue;const k=part.slice(0,i).trim(),v=part.slice(i+1).trim();try{out[k]=decodeURIComponent(v)}catch{out[k]=v}}return out;}
function sign(data){return crypto.createHmac('sha256',env('SESSION_SECRET')).update(data).digest('base64url');}
function makeSession(user){const payload=b64(JSON.stringify({sub:user.id,username:user.username,global_name:user.global_name||user.username,avatar:user.avatar,iat:Date.now()}));return payload+'.'+sign(payload);}
function getSession(event){const token=parseCookies(event)[cookieName];if(!token)return null;const [payload,sig]=token.split('.');if(!payload||!sig)return null;const expected=sign(payload);const a=Buffer.from(sig),b=Buffer.from(expected);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;try{const data=JSON.parse(Buffer.from(payload,'base64url').toString());if(!data.iat||Date.now()-data.iat>604800000)return null;return data;}catch{return null;}}
function isAdmin(user){return !!user && (process.env.ADMIN_DISCORD_IDS||'').split(',').map(x=>x.trim()).includes(user.sub);}
function cookie(value,maxAge=604800,name=cookieName){return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
function makeOAuthState(){const payload=b64(JSON.stringify({nonce:crypto.randomBytes(24).toString('base64url'),iat:Date.now()}));return payload+'.'+crypto.createHmac('sha256',env('SESSION_SECRET')).update(payload).digest('base64url');}
function verifyOAuthState(state){try{const [payload,sig]=String(state||'').split('.');if(!payload||!sig)return false;const expected=crypto.createHmac('sha256',env('SESSION_SECRET')).update(payload).digest('base64url');const a=Buffer.from(sig),b=Buffer.from(expected);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return false;const data=JSON.parse(Buffer.from(payload,'base64url').toString());return !!data.nonce&&Date.now()-data.iat>=0&&Date.now()-data.iat<=600000;}catch{return false;}}
function json(statusCode,body,headers={}){return {statusCode,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers},body:JSON.stringify(body)};}
function supabase(path,method='GET',body){const base=env('SUPABASE_URL').replace(/\/$/,'');const key=env('SUPABASE_SERVICE_ROLE_KEY');return fetch(base+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json',Prefer:method==='POST'?'return=representation':'return=minimal'},...(body?{body:JSON.stringify(body)}:{})});}
async function readBody(event){try{return JSON.parse(event.body||'{}')}catch{return {}}}
module.exports={env,makeSession,getSession,isAdmin,cookie,json,supabase,readBody,makeOAuthState,verifyOAuthState,parseCookies};

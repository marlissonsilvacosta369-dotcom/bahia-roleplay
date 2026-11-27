const crypto=require('crypto');
const {env,getSession,isAdmin,json,readBody}=require('./_shared');
const sameSecret=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length>0&&x.length===y.length&&crypto.timingSafeEqual(x,y);};
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 const user=getSession(event);if(!isAdmin(user))return json(403,{error:'Acesso restrito à administração'});
 try{
  const b=await readBody(event);if(!sameSecret(b.password,process.env.RULES_ADMIN_PASSWORD||''))return json(403,{error:'Senha administrativa incorreta ou não configurada.'});
  const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'},ext=types[b.mime_type];if(!ext)return json(400,{error:'Formato inválido. Use JPG, PNG ou WEBP.'});
  const bytes=Buffer.from(String(b.data||''),'base64');if(!bytes.length||bytes.length>2*1024*1024)return json(400,{error:'A imagem deve ter até 2 MB.'});
  const path=crypto.randomUUID()+'.'+ext,base=env('SUPABASE_URL').replace(/\\/$/,'');
  const r=await fetch(base+'/storage/v1/object/store-products/'+path,{method:'POST',headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':b.mime_type,'x-upsert':'false'},body:bytes});
  if(!r.ok)return json(502,{error:'Não foi possível enviar a foto para o armazenamento.'});
  return json(200,{ok:true,url:base+'/storage/v1/object/public/store-products/'+path});
 }catch(e){return json(500,{error:e.message||'Falha ao enviar imagem.'});}
};

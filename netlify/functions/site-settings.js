const {json,supabase}=require('./_shared');
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed'});
 try{const r=await supabase('site_tabs?select=slug,enabled');if(!r.ok)return json(500,{error:'Não foi possível carregar as abas'});const rows=await r.json();return json(200,{tabs:Object.fromEntries(rows.map(x=>[x.slug,x.enabled]))});}
 catch(e){return json(500,{error:'Configuração das abas indisponível'});}
};
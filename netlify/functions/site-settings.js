const {json,supabase}=require('./_shared');
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed'});
 try{
  const r=await supabase('site_tabs?select=slug,enabled');
  if(!r.ok)return json(500,{error:'Não foi possível carregar as abas'});
  const rows=await r.json();
  let content={};
  try{
   const c=await supabase('site_content?select=key,value');
   if(c.ok){const values=await c.json();content=Object.fromEntries(values.map(x=>[x.key,x.value]));}
  }catch(e){}
  return json(200,{tabs:Object.fromEntries(rows.map(x=>[x.slug,x.enabled])),content});
 }catch(e){return json(500,{error:'Configuração das abas indisponível'});}
};

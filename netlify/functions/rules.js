const crypto=require('crypto');
const {json,readBody,supabase}=require('./_shared');

function sameSecret(a,b){
  const x=Buffer.from(String(a||''),'utf8');
  const y=Buffer.from(String(b||''),'utf8');
  return x.length>0 && x.length===y.length && crypto.timingSafeEqual(x,y);
}

exports.handler=async(event)=>{
  if(event.httpMethod==='GET'){
    try{
      const r=await supabase('city_rules?select=id,title,content,section,updated_at&order=updated_at.desc');
      if(!r.ok)return json(500,{error:'Não foi possível carregar as regras.'});
      return json(200,{rules:await r.json()});
    }catch(e){return json(500,{error:'Configuração do banco indisponível.'});}
  }
  if(event.httpMethod==='POST'){
    const body=await readBody(event);
    const expected=process.env.RULES_ADMIN_PASSWORD||'';
    if(!sameSecret(body.password,expected))
      return json(403,{error:'Senha administrativa incorreta ou não configurada.'});
    const title=String(body.title||'').trim().slice(0,100);
    const section=String(body.section||'regulamentos');
    if(!['regulamentos','codigo','organizacoes','investigacoes','novidades'].includes(section))return json(400,{error:'Seção inválida.'});
    const content=String(body.content||'').trim().slice(0,20000);
    if(!title||!content)return json(400,{error:'Informe o título e o conteúdo da regra.'});
    try{
      const lookup=await supabase('city_rules?title=eq.'+encodeURIComponent(title)+'&section=eq.'+encodeURIComponent(section)+'&select=id&limit=1');
      if(!lookup.ok)return json(500,{error:'Não foi possível consultar as regras.'});
      const rows=await lookup.json();
      const payload={title,content,section,updated_at:new Date().toISOString()};
      const saved=rows[0]
        ? await supabase('city_rules?id=eq.'+encodeURIComponent(rows[0].id),'PATCH',payload)
        : await supabase('city_rules','POST',payload);
      if(!saved.ok)return json(500,{error:'Falha ao salvar no banco de dados.'});
      return json(200,{ok:true});
    }catch(e){return json(500,{error:'Configuração do banco indisponível.'});}
  }
  return json(405,{error:'Method not allowed'});
};

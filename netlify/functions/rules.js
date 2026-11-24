const {getSession,json,readBody,supabase}=require('./_shared');

exports.handler=async(event)=>{
  if(event.httpMethod==='GET'){
    try{
      const r=await supabase('city_rules?select=id,title,content,updated_at&order=updated_at.desc');
      if(!r.ok)return json(500,{error:'Não foi possível carregar as regras.'});
      return json(200,{rules:await r.json()});
    }catch(e){return json(500,{error:'Configuração do banco indisponível.'});}
  }
  if(event.httpMethod==='POST'){
    const body=await readBody(event);
    const supplied=String(body.password||'');
    const expected=process.env.RULES_ADMIN_PASSWORD||'';
    if(!expected || supplied.length!==expected.length || !require('crypto').timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))
      return json(403,{error:'Senha administrativa incorreta ou não configurada.'});
    const title=String(body.title||'').trim().slice(0,100);
    const content=String(body.content||'').trim().slice(0,20000);
    if(!title||!content)return json(400,{error:'Informe o título e o conteúdo da regra.'});
    try{
      const r=await supabase('city_rules','POST',{title,content,updated_at:new Date().toISOString()});
      if(!r.ok)return json(500,{error:'Falha ao salvar no banco de dados.'});
      return json(200,{ok:true});
    }catch(e){return json(500,{error:'Configuração do banco indisponível.'});}
  }
  return json(405,{error:'Method not allowed'});
};

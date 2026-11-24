const {getSession,json,readBody,supabase}=require('./_shared');

const validName=/^\p{L}+(?:[ '-]\p{L}+)*$/u;
function cleanName(value){
  return String(value||'').normalize('NFC').trim().replace(/\s+/g,' ');
}

exports.handler=async(event)=>{
  const user=getSession(event);
  if(!user) return json(401,{error:'Faça login com Discord para cadastrar seu nome RP.'});

  if(event.httpMethod==='GET'){
    const response=await supabase('portal_profiles?discord_id=eq.'+encodeURIComponent(user.sub)+'&select=first_name,last_name,rp_name&limit=1');
    if(!response.ok) return json(500,{error:'Falha ao consultar seu cadastro RP. Confira se a tabela portal_profiles existe no Supabase.'});
    const rows=await response.json();
    return json(200,{profile:rows[0]||null});
  }

  if(event.httpMethod!=='POST') return json(405,{error:'Método não permitido'});

  const body=await readBody(event);
  const first=cleanName(body.firstName);
  const last=cleanName(body.lastName);

  if(first.length<2||first.length>32||!validName.test(first)){
    return json(400,{error:'Digite um primeiro nome válido (2 a 32 letras). Pode usar espaço ou hífen entre nomes.'});
  }
  if(last.length<2||last.length>40||!validName.test(last)){
    return json(400,{error:'Digite um sobrenome válido (2 a 40 letras). Pode usar espaço, apóstrofo ou hífen.'});
  }

  const rpName=first+' '+last;
  const rpNameLower=rpName.toLocaleLowerCase('pt-BR');

  const existing=await supabase('portal_profiles?discord_id=eq.'+encodeURIComponent(user.sub)+'&select=first_name,last_name,rp_name&limit=1');
  if(!existing.ok) return json(500,{error:'Não foi possível verificar seu cadastro. Confira a conexão do Supabase.'});
  const existingRows=await existing.json();
  if(existingRows.length) return json(200,{ok:true,profile:existingRows[0],alreadyRegistered:true});

  const save=await supabase('portal_profiles','POST',{
    discord_id:user.sub,
    discord_username:user.username||'Discord',
    first_name:first,
    last_name:last,
    rp_name:rpName,
    rp_name_lower:rpNameLower
  });

  if(!save.ok){
    const details=await save.text();
    if(save.status===409||details.includes('23505')||details.includes('unique constraint')){
      return json(409,{error:'Este nome RP já está em uso ou sua conta já possui cadastro. Tente outro nome.'});
    }
    return json(500,{error:'O Supabase recusou o cadastro do nome RP. Verifique se a tabela portal_profiles foi criada com as colunas do arquivo supabase_schema.sql.'});
  }

  const rows=await save.json().catch(()=>[]);
  const saved=rows[0]||{first_name:first,last_name:last,rp_name:rpName};
  return json(201,{ok:true,profile:saved});
};

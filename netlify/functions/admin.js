const crypto=require('crypto');
const {getSession,isAdmin,json,readBody,supabase}=require('./_shared');
const allowedStatuses=['Aguardando liberação automática','Recebido','Em análise','Aprovado','Negado','Concluído','Falha na liberação MTA'];
function sameSecret(a,b){const x=Buffer.from(String(a||''));const y=Buffer.from(String(b||''));return x.length>0&&x.length===y.length&&crypto.timingSafeEqual(x,y);}
exports.handler=async(event)=>{
 const user=getSession(event);if(!isAdmin(user))return json(403,{error:'Acesso restrito à administração'});
 if(event.httpMethod==='GET'){const r=await supabase('portal_requests?select=*&order=created_at.desc&limit=200');if(!r.ok)return json(500,{error:'Erro ao carregar registros'});return json(200,{records:await r.json()});}
 if(event.httpMethod==='PATCH'){const b=await readBody(event);if(!b.id||!allowedStatuses.includes(b.status))return json(400,{error:'Status inválido'});const r=await supabase('portal_requests?id=eq.'+encodeURIComponent(b.id),'PATCH',{status:b.status,staff_note:String(b.staff_note||'').slice(0,1000),updated_at:new Date().toISOString()});if(!r.ok)return json(500,{error:'Não foi possível atualizar'});return json(200,{ok:true});}
 if(event.httpMethod==='POST'){
  const b=await readBody(event),secret=process.env.RULES_ADMIN_PASSWORD||'';if(!sameSecret(b.password,secret))return json(403,{error:'Senha administrativa incorreta ou não configurada.'});
  if(b.action==='tabs'){const tabs=b.tabs;if(!tabs||typeof tabs!=='object'||Array.isArray(tabs))return json(400,{error:'Configuração de abas inválida'});const allowed=['regulamentos','codigo','organizacoes','investigacoes','vendas','novidades','discord','suporte','denuncias','revisoes','liberacao-id','minha-area'];for(const slug of allowed){if(typeof tabs[slug]!=='boolean')continue;const q=await supabase('site_tabs?slug=eq.'+encodeURIComponent(slug),'PATCH',{enabled:tabs[slug]});if(!q.ok)return json(500,{error:'Falha ao salvar aba '+slug});}return json(200,{ok:true});}
  if(b.action==='content'){
   const content=b.content;
   if(!content||typeof content!=='object'||Array.isArray(content))return json(400,{error:'Conteúdo inválido'});
   const allowed=new Set(['brand_name','hero_title','hero_description','nav_regulamentos','nav_codigo','nav_organizacoes','nav_investigacoes','nav_vendas','nav_discord','nav_suporte','nav_denuncias','nav_revisoes','nav_liberacao-id','nav_minha-area','page_regulamentos_title','page_codigo_title','page_organizacoes_title','page_investigacoes_title','page_vendas_title','page_novidades_title','page_discord_title','page_suporte_title','page_denuncias_title','page_revisoes_title','page_liberacao-id_title','page_minha-area_title']);
   for(const [key,value] of Object.entries(content)){
    if(!allowed.has(key))continue;
    const text=String(value||'').trim().slice(0,180);
    if(!text)return json(400,{error:'Os nomes não podem ficar vazios'});
    const found=await supabase('site_content?key=eq.'+encodeURIComponent(key)+'&select=key');
    if(!found.ok)return json(500,{error:'Não foi possível consultar os textos do site'});
    const rows=await found.json();
    const saved=rows.length
      ? await supabase('site_content?key=eq.'+encodeURIComponent(key),'PATCH',{value:text,updated_at:new Date().toISOString()})
      : await supabase('site_content','POST',{key,value:text,updated_at:new Date().toISOString()});
    if(!saved.ok)return json(500,{error:'Falha ao salvar: '+key});
   }
   return json(200,{ok:true});
  }
  if(b.action==='clear'){if(b.confirmation!=='LIMPAR')return json(400,{error:'Digite LIMPAR para confirmar.'});const s=b.selected||{},ops=[];if(s.requests_id)ops.push(['Solicitações de ID','portal_requests?type=eq.id']);if(s.requests_denuncia)ops.push(['Denúncias','portal_requests?type=eq.denuncia']);if(s.requests_revisao)ops.push(['Revisões','portal_requests?type=eq.revisao']);if(s.profiles)ops.push(['Cadastros RP','portal_profiles?discord_id=not.is.null']);if(s.rules)ops.push(['Regras','city_rules?id=not.is.null']);if(!ops.length)return json(400,{error:'Selecione pelo menos um tipo de registro.'});const deleted=[];for(const [label,path] of ops){const d=await supabase(path,'DELETE');if(!d.ok)return json(500,{error:'Falha ao apagar: '+label});deleted.push(label);}return json(200,{ok:true,deleted});}

  if(b.action==='product_save'){
   const p=b.product||{};const name=String(p.name||'').trim().slice(0,100),category=String(p.category||'').trim().slice(0,50),description=String(p.description||'').trim().slice(0,1000),price=Number(p.price),role=String(p.discord_role_id||'').trim().slice(0,100),image_url=String(p.image_url||'').trim().slice(0,2000);
   if(!name||!category||!Number.isFinite(price)||price<0)return json(400,{error:'Informe nome, categoria e valor válido.'});
   if(role&&!/^\\d{1,100}$/.test(role))return json(400,{error:'O ID do cargo deve conter apenas números e ter no máximo 100 caracteres.'});
   const payload={name,category,description,price,discord_role_id:role||null,image_url:image_url||null,active:p.active===true,updated_at:new Date().toISOString()};
   let saved;if(p.id){saved=await supabase('store_products?id=eq.'+encodeURIComponent(p.id),'PATCH',payload);}else{payload.created_at=new Date().toISOString();saved=await supabase('store_products','POST',payload);}
   if(!saved.ok)return json(500,{error:'Não foi possível salvar o produto. Verifique se executou o SQL da loja no Supabase.'});return json(200,{ok:true});
  }
  if(b.action==='product_delete'){
   if(!b.id)return json(400,{error:'Produto inválido.'});const d=await supabase('store_products?id=eq.'+encodeURIComponent(b.id),'DELETE');if(!d.ok)return json(500,{error:'Não foi possível excluir o produto.'});return json(200,{ok:true});
  }
  return json(400,{error:'Ação administrativa inválida'});
 }
 return json(405,{error:'Method not allowed'});
};
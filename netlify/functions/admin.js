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
  if(b.action==='clear'){if(b.confirmation!=='LIMPAR')return json(400,{error:'Digite LIMPAR para confirmar.'});const s=b.selected||{},ops=[];if(s.requests_id)ops.push(['Solicitações de ID','portal_requests?type=eq.id']);if(s.requests_denuncia)ops.push(['Denúncias','portal_requests?type=eq.denuncia']);if(s.requests_revisao)ops.push(['Revisões','portal_requests?type=eq.revisao']);if(s.profiles)ops.push(['Cadastros RP','portal_profiles?discord_id=not.is.null']);if(s.rules)ops.push(['Regras','city_rules?id=not.is.null']);if(!ops.length)return json(400,{error:'Selecione pelo menos um tipo de registro.'});const deleted=[];for(const [label,path] of ops){const d=await supabase(path,'DELETE');if(!d.ok)return json(500,{error:'Falha ao apagar: '+label});deleted.push(label);}return json(200,{ok:true,deleted});}
  return json(400,{error:'Ação administrativa inválida'});
 }
 return json(405,{error:'Method not allowed'});
};
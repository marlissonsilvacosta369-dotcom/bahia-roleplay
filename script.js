const DISCORD_URL = "https://discord.gg/jAHKRnYMRf";
const MTA_SERVER_URL = "mtasa://144.225.189.145:22942";
const navLinks = [...document.querySelectorAll("[data-page]")];
const pages = [...document.querySelectorAll(".page")];

// Conectar ao MTA: mantém o botão original da cidade.
const connectButtons = ["discordHero"];
connectButtons.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", e => { e.preventDefault(); window.location.href = MTA_SERVER_URL; });
});

function showPage(name) {
  const page = document.getElementById("page-" + name);
  if (!page) return;
  pagesHide();
  page.classList.add("active");
  navLinks.forEach(a => a.classList.toggle("active", a.dataset.page === name));
  document.querySelector(".sidebar")?.classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
function pagesHide(){ pages.forEach(p=>p.classList.remove("active")); }
navLinks.forEach(a=>a.addEventListener("click",e=>{
  const name=a.dataset.page;
  if(name){e.preventDefault();showPage(name);history.replaceState(null,"","#"+name);}
}));
document.querySelectorAll("#discordSide, #discordPage, #discordSupport, #discordFoot").forEach(el=>el.addEventListener("click",e=>{
  e.preventDefault();
  if(DISCORD_URL.includes("COLOQUE-SEU-LINK")) alert("Configure o link do Discord no script.js");
  else window.open(DISCORD_URL,"_blank","noopener");
}));
const mobileMenu=document.getElementById("mobileMenu");
mobileMenu?.addEventListener("click",()=>document.querySelector(".sidebar")?.classList.toggle("open"));
const search=document.getElementById("searchInput");
function searchContent(value){
  const term=value.trim().toLocaleLowerCase("pt-BR"); if(!term)return;
  const cards=[...document.querySelectorAll(".doc-card")];
  const matched=cards.filter(c=>(c.innerText+" "+(c.dataset.search||"")).toLocaleLowerCase("pt-BR").includes(term));
  if(matched.length){const section=matched[0].closest(".page");if(section){showPage(section.id.replace("page-",""));setTimeout(()=>matched[0].scrollIntoView({behavior:"smooth",block:"center"}),150);}}
  else alert("Não encontrei resultados para: "+value+"\nAdicione os conteúdos oficiais para habilitar a busca completa.");
}
search?.addEventListener("keydown",e=>{if(e.key==="Enter")searchContent(search.value)});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();search?.focus();}});
// Modal de login (OAuth Discord depende de configuração segura no backend).
const loginModal=document.getElementById("loginModal");
function openLogin(){loginModal?.classList.add("show");}
function closeLogin(){loginModal?.classList.remove("show");}
document.getElementById("loginTop")?.addEventListener("click",()=>currentUser?showPage("minha-area"):openLogin());
document.getElementById("loginArea")?.addEventListener("click",()=>currentUser?showPage("minha-area"):openLogin());
document.getElementById("loginClose")?.addEventListener("click",closeLogin);
loginModal?.addEventListener("click",e=>{if(e.target===loginModal)closeLogin();});
document.getElementById("discordOAuth")?.addEventListener("click",()=>window.location.href="/.netlify/functions/discord-login");
// Portal autenticado: Discord OAuth, solicitações persistidas e painel staff.
async function api(path,options={}){const r=await fetch('/.netlify/functions/'+path,{credentials:'same-origin',headers:{'content-type':'application/json',...(options.headers||{})},...options});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'Falha de API');return d;}
let currentUser=null;
function setLoggedUI(user){currentUser=user;const top=document.getElementById('loginTop');if(top)top.textContent=user?('♙ '+(user.displayName||user.username)):'♙ Login';const loginBtn=document.getElementById('loginArea');if(loginBtn)loginBtn.textContent=user?'Conta conectada: '+(user.displayName||user.username):'♙ Entrar com Discord';if(user?.isAdmin&&!document.querySelector('[data-page="admin"]')){const nav=document.querySelector('.nav');const a=document.createElement('a');a.className='nav-link';a.href='#admin';a.dataset.page='admin';a.innerHTML='<span>⚙</span> Administração';a.addEventListener('click',e=>{e.preventDefault();showPage('admin');history.replaceState(null,'','#admin');loadAdmin();loadAdminControls();loadSiteTextAdmin();});nav.appendChild(a);navLinks.push(a);}if(user){const p=document.querySelector('#page-minha-area .page-heading');if(p){let profile=p.querySelector('.user-profile');if(!profile){profile=document.createElement('div');profile.className='user-profile notice';p.appendChild(profile);}profile.innerHTML=`<strong>Conectado: ${escapeHTML(user.displayName||user.username)}</strong><small>Discord: ${escapeHTML(user.username)} • ID ${escapeHTML(user.discordId)}</small><button class="button button-outline" id="logoutBtn" type="button">Sair</button>`;profile.querySelector('#logoutBtn').onclick=async()=>{await api('logout',{method:'POST'});location.reload();};}}}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
async function refreshAuth(){try{const d=await api('me');if(d.authenticated){setLoggedUI(d.user);showRPProfile(d.user);}else{const n=document.getElementById('rpProfileNotice');if(n)n.textContent='Entre com Discord para registrar seu nome RP e acessar os serviços do portal.';const f=document.getElementById('rpProfileForm');if(f)f.style.display='none';const id=document.getElementById('idForm');if(id)id.style.display='none';}}catch(e){console.error('Falha ao verificar sessão:',e);}}
function showRPProfile(user){const form=document.getElementById('rpProfileForm'),notice=document.getElementById('rpProfileNotice'),idForm=document.getElementById('idForm');if(!form||!notice)return;if(user.rpComplete&&user.rpProfile){form.style.display='none';notice.innerHTML='Nome RP registrado: <strong>'+escapeHTML(user.rpProfile.rp_name)+'</strong>. Esse nome é único e fica vinculado à sua conta Discord.';if(idForm)idForm.style.display='block';return;}form.style.display='block';if(idForm)idForm.style.display='none';notice.textContent='Seu primeiro acesso exige registrar um nome RP válido antes de enviar denúncias, revisões ou pedidos de ID.';form.onsubmit=async e=>{e.preventDefault();const submit=form.querySelector('button[type=submit]');const data=Object.fromEntries(new FormData(form).entries());if(submit){submit.disabled=true;submit.textContent='Salvando...';}notice.textContent='Validando e salvando seu nome RP...';try{const r=await api('profile',{method:'POST',body:JSON.stringify(data)});notice.innerHTML='Cadastro RP concluído: <strong>'+escapeHTML(r.profile.rp_name)+'</strong>';form.style.display='none';if(idForm)idForm.style.display='block';currentUser.rpComplete=true;currentUser.rpProfile=r.profile;await loadMyRequests();}catch(err){notice.textContent='Não foi possível salvar: '+err.message;notice.classList.add('error');}finally{if(submit){submit.disabled=false;submit.textContent='Salvar nome RP';}}};}
async function submitPortal(type,form){if(!currentUser){openLogin();return;}if(!currentUser.rpComplete){showPage('minha-area');alert('Antes de enviar, registre seu nome RP na Minha Área.');return;}const body=Object.fromEntries(new FormData(form).entries());body.type=type;try{const d=await api('submit',{method:'POST',body:JSON.stringify(body)});form.reset();await loadMyRequests();alert(d.message);}catch(e){alert(e.message);}}
[['denunciaForm','denuncia'],['revisaoForm','revisao'],['idForm','id']].forEach(([formId,type])=>{const form=document.getElementById(formId);if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();submitPortal(type,form);});});
async function loadAdmin(){const target=document.getElementById('adminContent');if(!target)return;target.innerHTML='<div class="notice">Carregando solicitações...</div>';try{const data=await api('admin');const rows=data.records||[];target.innerHTML=rows.length?rows.map(r=>`<article class="doc-card admin-record"><span class="tag">${escapeHTML(r.type)} • ${escapeHTML(r.status)}</span><h3>${escapeHTML(r.rp_name||r.identificacao||r.discord_username||'Solicitação')}</h3><p>${escapeHTML(r.description||'')}</p><p><b>ID solicitado:</b> ${escapeHTML(r.player_id||'—')} <b>Alvo:</b> ${escapeHTML(r.target||'—')}</p><p><b>Discord:</b> ${escapeHTML(r.discord_username||r.discord_id||'')}</p>${r.proof_url?`<a href="${escapeHTML(r.proof_url)}" target="_blank" rel="noopener">Abrir prova ↗</a>`:''}<div class="admin-actions"><select data-status="${escapeHTML(r.id)}"><option ${r.status==='Aguardando liberação automática'?'selected':''}>Aguardando liberação automática</option><option ${r.status==='Recebido'?'selected':''}>Recebido</option><option ${r.status==='Em análise'?'selected':''}>Em análise</option><option ${r.status==='Aprovado'?'selected':''}>Aprovado</option><option ${r.status==='Negado'?'selected':''}>Negado</option><option ${r.status==='Concluído'?'selected':''}>Concluído</option><option ${r.status==='Falha na liberação MTA'?'selected':''}>Falha na liberação MTA</option></select><input data-note="${escapeHTML(r.id)}" placeholder="Nota da staff" value="${escapeHTML(r.staff_note||'')}"><button class="button button-blue" data-save="${escapeHTML(r.id)}">Salvar</button></div></article>`).join(''):'<div class="notice">Nenhuma solicitação registrada ainda.</div>';target.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.save;const status=target.querySelector(`[data-status="${CSS.escape(id)}"]`).value;const note=target.querySelector(`[data-note="${CSS.escape(id)}"]`).value;try{await api('admin',{method:'PATCH',body:JSON.stringify({id,status,staff_note:note})});loadAdmin();}catch(e){alert(e.message);}});}catch(e){target.innerHTML=`<div class="notice">${escapeHTML(e.message)}. Confirme se sua conta Discord está na lista de administradores configurada no backend.</div>`;}}
refreshAuth().then(loadMyRequests);async function loadMyRequests(){if(!currentUser)return;const target=document.querySelector('#page-minha-area .user-profile');if(!target)return;try{const d=await api('my-requests');let box=document.getElementById('myRequestsHistory');if(!box){box=document.createElement('div');box.id='myRequestsHistory';box.className='saved-list';target.after(box);}box.innerHTML='<h3>Meu histórico</h3>'+(d.records.length?d.records.map(r=>`<article class=\"saved-card\"><b>${escapeHTML(r.type)} — ${escapeHTML(r.status)}</b><p>${escapeHTML(r.rp_name||r.description||r.identificacao||'Registro')}</p><small>${new Date(r.created_at).toLocaleString('pt-BR')}</small>${r.staff_note?`<p>Resposta da staff: ${escapeHTML(r.staff_note)}</p>`:''}</article>`).join(''):'<p class=\"saved-empty\">Nenhuma solicitação vinculada à sua conta.</p>');}catch(e){console.error('Falha ao carregar histórico:',e);}}if(new URLSearchParams(location.search).has('auth')){const reason=new URLSearchParams(location.search).get('reason')||'unknown';const messages={server_config:'Configuração OAuth incompleta no servidor/Netlify (variáveis de ambiente).',discord_denied:'Login cancelado ou negado no Discord.',missing_code:'Discord não retornou o código de autorização.',missing_state:'Cookie de segurança não chegou. Confira domínio HTTPS e navegador.',state_mismatch:'Validação de segurança do login falhou. Tente novamente.',token_exchange_400:'Redirect URI, Client ID ou Client Secret não correspondem à aplicação Discord.',token_exchange_401:'Client Secret inválido ou aplicação Discord configurada incorretamente.',profile_401:'Token de login inválido ao consultar perfil Discord.',profile_403:'Discord negou acesso ao perfil.',server_token:'Erro de configuração ao trocar código.',server_profile:'Erro ao consultar perfil Discord.'};alert('Falha no login Discord: '+(messages[reason]||reason)+'\n\nConfira se o Redirect URI na Discord Developer Portal é exatamente igual a DISCORD_REDIRECT_URI na Netlify.');}if(new URLSearchParams(location.search).has('login'))history.replaceState(null,'',location.pathname+location.hash);

// Conteúdo de regulamentos editável pela administração e publicado para todos.
let publishedRules=[];
async function loadPublishedRules(){
 const dataGrid=document.getElementById('publishedRules');if(!dataGrid)return;
 try{
  const data=await api('rules');publishedRules=data.rules||[];
  const sections=['regulamentos','codigo','organizacoes','investigacoes','vendas','novidades','discord','suporte','denuncias','revisoes','liberacao-id','minha-area'];
  for(const section of sections){
   let grid=section==='regulamentos'?dataGrid:document.getElementById('publishedRules-'+section);
   if(section!=='regulamentos'&&!grid){const page=document.getElementById('page-'+section);if(page){grid=document.createElement('div');grid.id='publishedRules-'+section;grid.className='doc-grid';const heading=page.querySelector('.page-heading');if(heading)heading.after(grid);else page.prepend(grid);}}
   if(grid){const rows=publishedRules.filter(r=>(r.section||'regulamentos')===section);grid.innerHTML=rows.map((r,i)=>'<article class="doc-card"><span class="doc-icon">▤</span><h3>'+escapeHTML(r.title)+'</h3><p>'+escapeHTML(r.content.slice(0,170))+(r.content.length>170?'…':'')+'</p><button class="text-button" type="button" data-rule-index="'+publishedRules.indexOf(r)+'">Ler regra ↗</button></article>').join('');grid.querySelectorAll('[data-rule-index]').forEach(btn=>btn.addEventListener('click',()=>{const r=publishedRules[Number(btn.dataset.ruleIndex)];document.getElementById('modalTitle').textContent=r.title;modal.querySelector('.modal-panel p').textContent=r.content;modal.classList.add('show');}));}
  }
 }catch(e){console.error('Falha ao carregar regras:',e);}
}
function setupRulesAdmin(){
 const form=document.getElementById('rulesAdminForm');if(!form)return;const notice=document.getElementById('rulesAdminNotice'),list=document.getElementById('rulesAdminList');
 const reload=async()=>{try{const d=await api('rules');list.innerHTML=(d.rules||[]).map(r=>'<article class="saved-card"><b>'+escapeHTML(r.title)+' — '+escapeHTML(r.section||'regulamentos')+'</b><p>'+escapeHTML(r.content.slice(0,180))+'</p><small>Atualizado: '+new Date(r.updated_at).toLocaleString('pt-BR')+'</small></article>').join('')||'<p class="saved-empty">Nenhuma regra publicada ainda.</p>';}catch(e){list.textContent=e.message;}};
 form.addEventListener('submit',async e=>{e.preventDefault();const b=form.querySelector('button[type=submit]');b.disabled=true;b.textContent='Salvando...';const data=Object.fromEntries(new FormData(form).entries());try{await api('rules',{method:'POST',body:JSON.stringify(data)});notice.textContent='Regra publicada na seção escolhida.';notice.classList.remove('error');const password=data.password;form.reset();form.elements.password.value=password;await reload();await loadPublishedRules();}catch(err){notice.textContent='Não foi possível salvar: '+err.message;notice.classList.add('error');}finally{b.disabled=false;b.textContent='Salvar regra';}});reload();
}
const tabLabels={regulamentos:'Regulamentos',codigo:'Código Penal',organizacoes:'Organizações',investigacoes:'Investigações',vendas:'Área de Vendas',novidades:'Novidades',discord:'Discord',suporte:'Suporte',denuncias:'Denúncias',revisoes:'Revisões','liberacao-id':'Liberação de ID','minha-area':'Minha área'};
async function applyTabSettings(){try{const d=await api('site-settings');const tabs=d.tabs||{};applySiteText(d.content||{});Object.entries(tabLabels).forEach(([slug])=>{if(typeof tabs[slug]!=='boolean')return;document.querySelectorAll('[data-page="'+slug+'"]').forEach(el=>el.style.display=tabs[slug]?'':'none');const page=document.getElementById('page-'+slug);if(page)page.style.display=tabs[slug]?'':'none';});const active=location.hash.slice(1);if(active&&tabs[active]===false)showPage('inicio');}catch(e){console.warn('Não foi possível carregar visibilidade das abas:',e);}}
async function loadAdminControls(){
 const tabsBox=document.getElementById('adminTabs'),clearForm=document.getElementById('adminClearForm');if(!tabsBox||tabsBox.dataset.ready)return;tabsBox.dataset.ready='1';
 try{const d=await api('site-settings');const tabs=d.tabs||{};tabsBox.innerHTML='<label>Senha administrativa<input id="tabsAdminPassword" type="password" autocomplete="current-password" required></label>'+Object.entries(tabLabels).map(([slug,label])=>'<label><input type="checkbox" data-tab="'+slug+'" '+(tabs[slug]!==false?'checked':'')+'> '+label+'</label>').join('')+'<button class="button button-blue" id="saveTabsButton" type="button">Salvar abas</button><p id="tabsNotice" class="notice"></p>';document.getElementById('saveTabsButton').onclick=async()=>{const password=document.getElementById('tabsAdminPassword').value;const values=Object.fromEntries([...tabsBox.querySelectorAll('[data-tab]')].map(x=>[x.dataset.tab,x.checked]));const n=document.getElementById('tabsNotice');try{await api('admin',{method:'POST',body:JSON.stringify({action:'tabs',password,tabs:values})});n.textContent='Abas atualizadas com sucesso.';await applyTabSettings();}catch(e){n.textContent=e.message;}};}catch(e){tabsBox.textContent=e.message;}
 if(clearForm&&!clearForm.dataset.ready){clearForm.dataset.ready='1';clearForm.addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(clearForm).entries());const selected={requests_id:!!clearForm.elements.requests_id.checked,requests_denuncia:!!clearForm.elements.requests_denuncia.checked,requests_revisao:!!clearForm.elements.requests_revisao.checked,profiles:!!clearForm.elements.profiles.checked,rules:!!clearForm.elements.rules.checked};const notice=document.getElementById('adminClearNotice');if(!Object.values(selected).some(Boolean)){notice.textContent='Selecione ao menos uma categoria.';return;}if(!confirm('A exclusão é permanente. Deseja continuar?'))return;try{const result=await api('admin',{method:'POST',body:JSON.stringify({action:'clear',password:data.password,confirmation:data.confirmation,selected})});notice.textContent='Excluído: '+result.deleted.join(', ');clearForm.reset();await loadAdmin();await loadPublishedRules();}catch(err){notice.textContent=err.message;}});}
}

const siteTextFields={
 brand_name:'Nome da marca (lateral)',
 hero_title:'Título principal da página inicial',
 hero_description:'Descrição da página inicial',
 nav_regulamentos:'Nome da aba: Regulamentos',
 nav_codigo:'Nome da aba: Código Penal',
 nav_organizacoes:'Nome da aba: Organizações',
 nav_investigacoes:'Nome da aba: Investigações',
 nav_vendas:'Nome da aba: Área de Vendas',
 nav_discord:'Nome da aba: Discord',
 nav_suporte:'Nome da aba: Suporte',
 nav_denuncias:'Nome da aba: Denúncias',
 nav_revisoes:'Nome da aba: Revisões',
 nav_liberacao-id:'Nome da aba: Liberação de ID',
 nav_minha-area:'Nome da aba: Minha área',
 page_regulamentos_title:'Título da página: Regulamentos',
 page_codigo_title:'Título da página: Código Penal',
 page_organizacoes_title:'Título da página: Organizações',
 page_investigacoes_title:'Título da página: Investigações',
 page_vendas_title:'Título da página: Área de Vendas',
 page_novidades_title:'Título da página: Novidades',
 page_discord_title:'Título da página: Discord',
 page_suporte_title:'Título da página: Suporte',
 page_denuncias_title:'Título da página: Denúncias',
 page_revisoes_title:'Título da página: Revisões',
 page_liberacao-id_title:'Título da página: Solicitar liberação de ID',
 page_minha-area_title:'Título da página: Minha área'
};
function applySiteText(content){
 Object.entries(content||{}).forEach(([key,value])=>{
  const el=document.querySelector('[data-site-key="'+CSS.escape(key)+'"]');
  if(el&&typeof value==='string'){
   if(key==='hero_title'&&value.includes('<em>'))return;
   el.textContent=value;
  }
 });
}
async function loadSiteTextAdmin(){
 const box=document.getElementById('adminSiteText');if(!box||box.dataset.ready)return;box.dataset.ready='1';
 try{
  const d=await api('site-settings');const current=d.content||{};
  box.innerHTML='<label>Senha administrativa<input id="siteTextPassword" type="password" autocomplete="current-password" required placeholder="Senha administrativa"></label>'+Object.entries(siteTextFields).map(([key,label])=>'<label>'+escapeHTML(label)+'<input data-site-text="'+key+'" maxlength="180" value="'+escapeHTML(current[key]||'')+'" placeholder="'+escapeHTML(label)+'"></label>').join('')+'<button class="button button-blue" id="saveSiteText" type="button">Salvar nomes e títulos</button><p class="notice" id="siteTextNotice"></p>';
  document.getElementById('saveSiteText').onclick=async()=>{
   const password=document.getElementById('siteTextPassword').value;
   const content=Object.fromEntries([...box.querySelectorAll('[data-site-text]')].map(el=>[el.dataset.siteText,el.value]));
   const notice=document.getElementById('siteTextNotice');
   try{await api('admin',{method:'POST',body:JSON.stringify({action:'content',password,content})});notice.textContent='Nomes e títulos atualizados para todos os visitantes.';applySiteText(content);}
   catch(e){notice.textContent=e.message;}
  };
 }catch(e){box.innerHTML='<p class="notice">'+escapeHTML(e.message)+'</p>';}
}

// Admin link is added only to accounts authorized by the backend.
loadPublishedRules();
setupRulesAdmin();
applyTabSettings();
// Navegação por link direto/refresh
const initial=location.hash.replace("#","");if(initial&&document.getElementById("page-"+initial))showPage(initial);
// Modal informativo de documentos
const modal=document.getElementById("modal");
document.querySelectorAll("[data-open]").forEach(btn=>btn.addEventListener("click",()=>{document.getElementById("modalTitle").textContent=btn.dataset.open;modal.classList.add("show");}));
function closeModal(){modal?.classList.remove("show");}
document.getElementById("modalClose")?.addEventListener("click",closeModal);
document.getElementById("modalOk")?.addEventListener("click",closeModal);
modal?.addEventListener("click",e=>{if(e.target===modal)closeModal();});

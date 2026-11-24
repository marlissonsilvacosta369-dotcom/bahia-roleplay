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
document.querySelectorAll("[id^=discord]").forEach(el=>el.addEventListener("click",e=>{
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
document.getElementById("loginTop")?.addEventListener("click",openLogin);
document.getElementById("loginArea")?.addEventListener("click",openLogin);
document.getElementById("loginClose")?.addEventListener("click",closeLogin);
loginModal?.addEventListener("click",e=>{if(e.target===loginModal)closeLogin();});
document.getElementById("discordOAuth")?.addEventListener("click",()=>window.location.href="/.netlify/functions/discord-login");
// Portal autenticado: Discord OAuth, solicitações persistidas e painel staff.
async function api(path,options={}){const r=await fetch('/.netlify/functions/'+path,{credentials:'same-origin',headers:{'content-type':'application/json',...(options.headers||{})},...options});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'Falha de API');return d;}
let currentUser=null;
function setLoggedUI(user){currentUser=user;const top=document.getElementById('loginTop');if(top)top.textContent=user?('♙ '+(user.displayName||user.username)):'♙ Login';const loginBtn=document.getElementById('loginArea');if(loginBtn)loginBtn.textContent=user?'Conta conectada: '+(user.displayName||user.username):'♙ Entrar com Discord';if(user?.isAdmin&&!document.querySelector('[data-page="admin"]')){const nav=document.querySelector('.nav');const a=document.createElement('a');a.className='nav-link';a.href='#admin';a.dataset.page='admin';a.innerHTML='<span>⚙</span> Administração';a.addEventListener('click',e=>{e.preventDefault();showPage('admin');history.replaceState(null,'','#admin');loadAdmin();});nav.appendChild(a);navLinks.push(a);}if(user){const p=document.querySelector('#page-minha-area .page-heading');if(p){let profile=p.querySelector('.user-profile');if(!profile){profile=document.createElement('div');profile.className='user-profile notice';p.appendChild(profile);}profile.innerHTML=`<strong>Conectado: ${escapeHTML(user.displayName||user.username)}</strong><small>Discord: ${escapeHTML(user.username)} • ID ${escapeHTML(user.discordId)}</small><button class="button button-outline" id="logoutBtn" type="button">Sair</button>`;profile.querySelector('#logoutBtn').onclick=async()=>{await api('logout',{method:'POST'});location.reload();};}}}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
async function refreshAuth(){try{const d=await api('me');if(d.authenticated){setLoggedUI(d.user);showRPProfile(d.user);}}catch{}}
function showRPProfile(user){const form=document.getElementById('rpProfileForm'),notice=document.getElementById('rpProfileNotice');if(!form||!notice)return;if(user.rpComplete&&user.rpProfile){form.style.display='none';notice.innerHTML='Nome RP registrado: <strong>'+escapeHTML(user.rpProfile.rp_name)+'</strong>. Esse nome é único e fica vinculado à sua conta Discord.';return;}form.style.display='block';notice.textContent='Seu primeiro acesso exige registrar um nome RP único antes de enviar denúncias, revisões ou pedidos de ID.';form.onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());try{const r=await api('profile',{method:'POST',body:JSON.stringify(data)});notice.innerHTML='Cadastro RP concluído: <strong>'+escapeHTML(r.profile.rp_name)+'</strong>';form.style.display='none';currentUser.rpComplete=true;currentUser.rpProfile=r.profile;}catch(err){alert(err.message);}};}
async function submitPortal(type,form){if(!currentUser){openLogin();return;}const body=Object.fromEntries(new FormData(form).entries());body.type=type;try{const d=await api('submit',{method:'POST',body:JSON.stringify(body)});form.reset();alert(d.message);form.closest('.page')?.querySelector('.saved-list')?.replaceChildren();}catch(e){alert(e.message);}}
[['denunciaForm','denuncia'],['revisaoForm','revisao'],['idForm','id']].forEach(([formId,type])=>{const form=document.getElementById(formId);if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();submitPortal(type,form);});});
async function loadAdmin(){const target=document.getElementById('adminContent');if(!target)return;target.innerHTML='<div class="notice">Carregando solicitações...</div>';try{const data=await api('admin');const rows=data.records||[];target.innerHTML=rows.length?rows.map(r=>`<article class="doc-card admin-record"><span class="tag">${escapeHTML(r.type)} • ${escapeHTML(r.status)}</span><h3>${escapeHTML(r.rp_name||r.identificacao||r.discord_username||'Solicitação')}</h3><p>${escapeHTML(r.description||'')}</p><p><b>ID solicitado:</b> ${escapeHTML(r.player_id||'—')} <b>Alvo:</b> ${escapeHTML(r.target||'—')}</p><p><b>Discord:</b> ${escapeHTML(r.discord_username||r.discord_id||'')}</p>${r.proof_url?`<a href="${escapeHTML(r.proof_url)}" target="_blank" rel="noopener">Abrir prova ↗</a>`:''}<div class="admin-actions"><select data-status="${escapeHTML(r.id)}"><option ${r.status==='Aguardando liberação automática'?'selected':''}>Aguardando liberação automática</option><option ${r.status==='Recebido'?'selected':''}>Recebido</option><option ${r.status==='Em análise'?'selected':''}>Em análise</option><option ${r.status==='Aprovado'?'selected':''}>Aprovado</option><option ${r.status==='Negado'?'selected':''}>Negado</option><option ${r.status==='Concluído'?'selected':''}>Concluído</option></select><input data-note="${escapeHTML(r.id)}" placeholder="Nota da staff" value="${escapeHTML(r.staff_note||'')}"><button class="button button-blue" data-save="${escapeHTML(r.id)}">Salvar</button></div></article>`).join(''):'<div class="notice">Nenhuma solicitação registrada ainda.</div>';target.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.save;const status=target.querySelector(`[data-status="${CSS.escape(id)}"]`).value;const note=target.querySelector(`[data-note="${CSS.escape(id)}"]`).value;try{await api('admin',{method:'PATCH',body:JSON.stringify({id,status,staff_note:note})});loadAdmin();}catch(e){alert(e.message);}});}catch(e){target.innerHTML=`<div class="notice">${escapeHTML(e.message)}. Confirme se sua conta Discord está na lista de administradores configurada no backend.</div>`;}}
refreshAuth().then(loadMyRequests);async function loadMyRequests(){if(!currentUser)return;const target=document.querySelector('#page-minha-area .user-profile');if(!target)return;try{const d=await api('my-requests');const box=document.createElement('div');box.className='saved-list';box.innerHTML='<h3>Meu histórico</h3>'+(d.records.length?d.records.map(r=>`<article class=\"saved-card\"><b>${escapeHTML(r.type)} — ${escapeHTML(r.status)}</b><p>${escapeHTML(r.rp_name||r.description||r.identificacao||'Registro')}</p><small>${new Date(r.created_at).toLocaleString('pt-BR')}</small>${r.staff_note?`<p>Resposta da staff: ${escapeHTML(r.staff_note)}</p>`:''}</article>`).join(''):'<p class=\"saved-empty\">Nenhuma solicitação vinculada à sua conta.</p>');target.after(box);}catch{}}if(new URLSearchParams(location.search).has('auth')){const reason=new URLSearchParams(location.search).get('reason')||'unknown';const messages={server_config:'Configuração OAuth incompleta no servidor/Netlify (variáveis de ambiente).',discord_denied:'Login cancelado ou negado no Discord.',missing_code:'Discord não retornou o código de autorização.',missing_state:'Cookie de segurança não chegou. Confira domínio HTTPS e navegador.',state_mismatch:'Validação de segurança do login falhou. Tente novamente.',token_exchange_400:'Redirect URI, Client ID ou Client Secret não correspondem à aplicação Discord.',token_exchange_401:'Client Secret inválido ou aplicação Discord configurada incorretamente.',profile_401:'Token de login inválido ao consultar perfil Discord.',profile_403:'Discord negou acesso ao perfil.',server_token:'Erro de configuração ao trocar código.',server_profile:'Erro ao consultar perfil Discord.'};alert('Falha no login Discord: '+(messages[reason]||reason)+'\n\nConfira se o Redirect URI na Discord Developer Portal é exatamente igual a DISCORD_REDIRECT_URI na Netlify.');}if(new URLSearchParams(location.search).has('login'))history.replaceState(null,'',location.pathname+location.hash);
// Admin link is added only to accounts authorized by the backend.
// Navegação por link direto/refresh
const initial=location.hash.replace("#","");if(initial&&document.getElementById("page-"+initial))showPage(initial);
// Modal informativo de documentos
const modal=document.getElementById("modal");
document.querySelectorAll("[data-open]").forEach(btn=>btn.addEventListener("click",()=>{document.getElementById("modalTitle").textContent=btn.dataset.open;modal.classList.add("show");}));
function closeModal(){modal?.classList.remove("show");}
document.getElementById("modalClose")?.addEventListener("click",closeModal);
document.getElementById("modalOk")?.addEventListener("click",closeModal);
modal?.addEventListener("click",e=>{if(e.target===modal)closeModal();});

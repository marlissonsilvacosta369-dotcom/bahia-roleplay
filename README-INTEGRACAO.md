# BAHIA ROLEPLAY — Portal autenticado / integração

## O que esta versão implementa
- OAuth2 oficial do Discord (não recebe senha do Discord).
- Sessão segura assinada pelo backend (cookie HttpOnly/Secure/SameSite).
- Formulários de denúncia, revisão e solicitação de ID persistidos no Supabase.
- Solicitação de ID registra Discord, ID inicial, primeiro nome e sobrenome RP.
- Painel staff para Discord IDs autorizados via `ADMIN_DISCORD_IDS`, com listagem e atualização de status/notas.
- Resource MTA que consulta IDs pendentes e tenta executar `addwl ID`, depois informa o resultado.
- Mantém os arquivos HTML/CSS e a identidade visual existente; o botão Entrar na Cidade permanece.

**A integração ainda exige configurar credenciais e fazer deploy. Não está online/ativada automaticamente por este ZIP.**

## 1) Supabase
1. Crie um projeto em https://supabase.com.
2. No SQL Editor, execute `supabase_schema.sql`.
3. Copie Project URL e `service_role` key para variáveis da Netlify. A `service_role` é secreta: nunca coloque no HTML/JS do navegador.

## 2) Discord OAuth2
1. Crie/abra uma aplicação no https://discord.com/developers/applications.
2. OAuth2: adicione Redirect URL exatamente: `https://SEU-DOMINIO/.netlify/functions/discord-callback` (use seu domínio Netlify ou domínio customizado final).
3. Em Netlify Site configuration > Environment variables, configure `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`.

## 3) Variáveis Netlify
Configure também:
- `SESSION_SECRET`: segredo aleatório forte (mínimo 32 bytes; não reutilize o token MTA).
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DISCORD_IDS`: IDs numéricos Discord dos administradores separados por vírgula (Developer Mode > copiar ID). Não coloque usernames.
- `MTA_SHARED_TOKEN`: segredo longo aleatório, igual no resource MTA.

Use `.env.example` como checklist. **Não publique segredos no ZIP, Git ou frontend.**

## 4) Deploy Netlify
Functions não funcionam no Netlify Drop estático. Publique via Git (recomendado) ou Netlify CLI:
- Coloque o conteúdo desta pasta no repositório.
- Netlify: conecte o repositório; publish directory `.`; functions directory `netlify/functions` (já definido em netlify.toml).
- Configure as variáveis antes do deploy e faça redeploy.
- Acesse `https://SEU-SITE/.netlify/functions/me`: deve retornar `authenticated:false` sem login.

## 5) Resource MTA para liberar ID
1. Copie `mta_resource/BahiaPortalWL` para `mods/deathmatch/resources/`.
2. Edite `config.lua`: troque URLs `SEU-SITE` e token pelo mesmo `MTA_SHARED_TOKEN` da Netlify.
3. No console MTA, `start BahiaPortalWL`.
4. Resource faz poll a cada 15 segundos; quando achar pedido de ID, executa `executeCommandHandler("addwl", false, tostring(id))` e envia o resultado para API.

### ATENÇÃO: teste em servidor de desenvolvimento
O resource assume que seu comando de whitelist é registrado como `addwl` e aceita ID como único argumento. Antes de usar em produção, confirme a sintaxe e teste manualmente com um ID de teste. Caso seu `addwl` seja comando de console nativo ou tenha formato diferente, o resource precisa ser adaptado. O retorno de execução do MTA pode apenas confirmar que o handler foi chamado; confirme a whitelist real em teste.


## 6) Admin
Após autenticar, a página “Administração” só aparece se o Discord ID da pessoa estiver na variável `ADMIN_DISCORD_IDS`. O painel lista registros, permite alterar status e adicionar nota staff. A rota API também valida autorização, então esconder a página não é a única proteção.

## 7) Fluxo do pedido de ID
1. Jogador loga pelo Discord.
2. Preenche ID inicial que aparece ao conectar, primeiro nome e sobrenome RP.
3. Backend registra pedido com status “Aguardando liberação automática”.
4. Resource MTA consulta pendências, tenta `addwl ID` e chama a API para registrar sucesso/falha.
5. Staff pode acompanhar no painel. O pedido não cria personagem nem salva nome dentro do banco MTA por conta própria; só solicita whitelist pelo comando addwl.

## Limitações / segurança
- O site não verifica se ID realmente corresponde ao jogador no MTA; validação e prevenção de fraude adicional são recomendadas.
- O sistema não deve permitir IDs reservados/duplicados; configure/teste a whitelist e política de IDs antes de produção.
- Denúncias e revisões guardam links de evidências, não fazem upload de arquivos.
- Administradores são autorizados por Discord ID.
- A liberação automática executa comando no servidor. Use token exclusivo, resource em servidor confiável, teste primeiro e não compartilhe config/token.
- Sem deploy Netlify + credenciais + SQL + resource configurado, login e persistência não estarão ativos.

## 8) Cadastro RP obrigatório e nome único (atualização)
- Execute novamente o SQL atualizado para criar `portal_profiles`.
- Após o login Discord, o usuário precisa cadastrar nome + um sobrenome RP antes de usar denúncias/revisões/liberação de ID.
- Nome completo é único por comparação minúscula, via `rp_name_lower` unique.
- O resource/site não tenta julgar automaticamente todo sobrenome do mundo; esta versão usa lista básica de sobrenomes comuns no backend. Nomes válidos fora da lista podem ser adicionados no `netlify/functions/profile.js`.
- Login OAuth: se falhar, a página exibe motivo. Confira Client ID, Client Secret, `DISCORD_REDIRECT_URI`, URL cadastrada no Discord OAuth2 (tem que ser idêntica), e faça redeploy após alterar env vars.
- Para admin: login com Discord, e seu Discord User ID precisa estar em `ADMIN_DISCORD_IDS`. Após autorização, o link Administração aparece no menu. URL direta também é protegida pela API.

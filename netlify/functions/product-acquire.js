const {env,getSession,json,supabase}=require('./_shared');
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 const user=getSession(event);if(!user)return json(401,{error:'Entre com Discord antes de adquirir.'});
 try{
  const body=JSON.parse(event.body||'{}');if(!body.product_id)return json(400,{error:'Produto inválido.'});
  const profile=await supabase('portal_profiles?discord_id=eq.'+encodeURIComponent(user.sub)+'&select=discord_id,rp_name');
  if(!profile.ok)return json(500,{error:'Não foi possível verificar seu cadastro RP.'});
  const profiles=await profile.json();if(!profiles.length)return json(403,{error:'Cadastre seu nome RP na Minha Área antes de adquirir.'});
  const productRes=await supabase('store_products?id=eq.'+encodeURIComponent(body.product_id)+'&select=id,name,active,discord_role_id');
  if(!productRes.ok)return json(500,{error:'Não foi possível consultar o produto.'});
  const products=await productRes.json(),product=products[0];if(!product||!product.active)return json(404,{error:'Produto indisponível.'});
  if(!product.discord_role_id)return json(400,{error:'Este produto ainda não tem um cargo Discord configurado.'});
  const token=env('DISCORD_BOT_TOKEN'),guild=env('DISCORD_GUILD_ID');
  const url='https://discord.com/api/v10/guilds/'+encodeURIComponent(guild)+'/members/'+encodeURIComponent(user.sub)+'/roles/'+encodeURIComponent(product.discord_role_id);
  const grant=await fetch(url,{method:'PUT',headers:{Authorization:'Bot '+token}});
  if(!grant.ok){const detail=await grant.text();return json(502,{error:grant.status===404?'Não encontrei você no servidor Discord ou o cargo não existe. Entre no Discord e tente novamente.':grant.status===403?'O bot não tem permissão para gerenciar cargos, ou o cargo está acima do bot.':'Discord recusou a entrega do cargo ('+grant.status+').'});}
  return json(200,{ok:true,message:'Cargo de '+product.name+' concedido no Discord!'});
 }catch(e){return json(500,{error:e.message||'Falha ao entregar o cargo Discord.'});}
};

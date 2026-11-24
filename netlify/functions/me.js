const {getSession,isAdmin,json,supabase}=require('./_shared');

exports.handler=async(event)=>{
  const user=getSession(event);
  if(!user) return json(200,{authenticated:false,user:null});

  try{
    const response=await supabase(
      'portal_profiles?discord_id=eq.'+encodeURIComponent(user.sub)+'&select=first_name,last_name,rp_name&limit=1'
    );
    if(!response.ok){
      const details=await response.text();
      return json(500,{error:'Não foi possível consultar seu cadastro RP.',details:details.slice(0,300)});
    }
    const rows=await response.json();
    const profile=rows[0]||null;

    return json(200,{
      authenticated:true,
      user:{
        discordId:user.sub,
        username:user.username,
        displayName:user.global_name,
        avatar:user.avatar,
        isAdmin:isAdmin(user),
        rpProfile:profile,
        rpComplete:!!profile
      }
    });
  }catch(error){
    return json(500,{error:'Falha ao consultar o perfil no banco de dados.'});
  }
};

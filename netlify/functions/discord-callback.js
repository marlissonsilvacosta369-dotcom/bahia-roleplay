const {env,makeSession,cookie,verifyOAuthState,parseCookies}=require('./_shared');

exports.handler=async(event)=>{
  const params=new URLSearchParams(event.rawQuery||(event.queryStringParameters&&new URLSearchParams(event.queryStringParameters).toString())||'');
  const code=params.get('code');
  const state=params.get('state');
  const stateCookie=parseCookies(event).bahia_oauth_state;

  const fail=(reason)=>({
    statusCode:302,
    headers:{
      location:'/?auth=failed&reason='+encodeURIComponent(reason),
      'set-cookie':cookie('',0,'bahia_oauth_state'),
      'cache-control':'no-store'
    },
    body:''
  });

  if(params.get('error')) return fail('discord_denied');
  if(!code) return fail('missing_code');
  if(!state||!stateCookie||state!==stateCookie||!verifyOAuthState(state)) return fail('state_invalid_or_expired');

  try{
    const redirect=env('DISCORD_REDIRECT_URI');
    const tokenRes=await fetch('https://discord.com/api/oauth2/token',{
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({
        client_id:env('DISCORD_CLIENT_ID'),
        client_secret:env('DISCORD_CLIENT_SECRET'),
        grant_type:'authorization_code',
        code,
        redirect_uri:redirect
      })
    });
    if(!tokenRes.ok) return fail('token_exchange_'+tokenRes.status);

    const token=await tokenRes.json();
    const meRes=await fetch('https://discord.com/api/users/@me',{
      headers:{authorization:'Bearer '+token.access_token}
    });
    if(!meRes.ok) return fail('profile_'+meRes.status);

    const me=await meRes.json();
    return {
      statusCode:302,
      headers:{location:'/?login=success','cache-control':'no-store'},
      multiValueHeaders:{
        'set-cookie':[
          cookie(makeSession(me)),
          cookie('',0,'bahia_oauth_state')
        ]
      },
      body:''
    };
  }catch(error){
    return fail('server_callback');
  }
};

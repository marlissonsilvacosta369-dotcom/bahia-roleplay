const {env,makeOAuthState,cookie}=require('./_shared');

exports.handler=async()=>{
  try{
    const redirect=env('DISCORD_REDIRECT_URI');
    const state=makeOAuthState();
    const params=new URLSearchParams({
      client_id:env('DISCORD_CLIENT_ID'),
      redirect_uri:redirect,
      response_type:'code',
      scope:'identify',
      state
    });
    return {
      statusCode:302,
      headers:{
        location:'https://discord.com/oauth2/authorize?'+params.toString(),
        'set-cookie':cookie(state,600,'bahia_oauth_state'),
        'cache-control':'no-store'
      },
      body:''
    };
  }catch(error){
    const missing = String(error && error.message || '').match(/Missing environment variable: ([A-Z0-9_]+)/);
    const reason = missing ? 'missing_env_' + missing[1] : 'server_config';
    return {
      statusCode:302,
      headers:{location:'/?auth=failed&reason=' + encodeURIComponent(reason),'cache-control':'no-store'},
      body:''
    };
  }
};

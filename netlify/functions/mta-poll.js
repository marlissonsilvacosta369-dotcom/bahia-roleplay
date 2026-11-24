const {env,json,supabase}=require('./_shared');

exports.handler=async(event)=>{
  const headers=event.headers||{};
  const suppliedToken=headers['x-mta-token']||headers['X-MTA-Token'];
  if(suppliedToken!==env('MTA_SHARED_TOKEN')) return json(401,{error:'Unauthorized'});

  const response=await supabase(
    'portal_requests?type=eq.id&status=eq.Aguardando%20libera%C3%A7%C3%A3o%20autom%C3%A1tica&select=id,player_id,rp_name&order=created_at.asc&limit=20'
  );
  if(!response.ok) return json(500,{error:'Database error'});
  return json(200,{requests:await response.json()});
};

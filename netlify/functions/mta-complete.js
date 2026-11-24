const {env,json,readBody,supabase}=require('./_shared');

exports.handler=async(event)=>{
  const headers=event.headers||{};
  const suppliedToken=headers['x-mta-token']||headers['X-MTA-Token'];
  if(suppliedToken!==env('MTA_SHARED_TOKEN')) return json(401,{error:'Unauthorized'});

  const body=await readBody(event);
  if(!body.id) return json(400,{error:'Missing id'});

  const success=body.success===true;
  const status=success?'Concluído':'Falha na liberação MTA';
  const note=success
    ?'ID liberado pelo comando addwl'
    :String(body.error||'Erro do resource MTA').slice(0,1000);

  const response=await supabase(
    'portal_requests?id=eq.'+encodeURIComponent(body.id),
    'PATCH',
    {status,staff_note:note,updated_at:new Date().toISOString()}
  );
  if(!response.ok) return json(500,{error:'Update database failed'});
  return json(200,{ok:true});
};

const {json,cookie}=require('./_shared');exports.handler=async()=>json(200,{ok:true},{'set-cookie':cookie('',0)});

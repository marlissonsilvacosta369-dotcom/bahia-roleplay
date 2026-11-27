const {json,supabase}=require('./_shared');
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed'});
 try{const r=await supabase('store_products?select=id,name,category,description,price,active&order=created_at.desc');if(!r.ok)return json(500,{error:'Não foi possível carregar os produtos'});return json(200,{products:await r.json()});}
 catch(e){return json(500,{error:'Loja indisponível. Execute o SQL da loja no Supabase.'});}
};

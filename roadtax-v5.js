// Car Bestie V5: roadtax-only renewal UI
const loginV5Base=login;
login=function(){
  loginV5Base();
  const lead=document.querySelector('.landing-lead');
  if(lead)lead.textContent='Car Bestie ingatkan bila nak service dan renew roadtax — sambil simpan resit dan harga yang pernah anda bayar.';
  document.querySelectorAll('.phone-alert').forEach(el=>{if(el.textContent.includes('Insurance'))el.remove();});
  const feature=document.querySelector('.landing-features article:last-child');
  if(feature)feature.innerHTML='<div>⏰</div><b>Roadtax reminder</b><p>Simpan tarikh tamat roadtax sekali dan Car Bestie bantu ingatkan bila dah dekat.</p>';
};

const carFormV5Base=carFormHtml;
carFormHtml=function(){
  let html=carFormV5Base();
  html=html.replace('<div class="form-divider"><span>Renewal reminders</span></div>','<div class="form-divider"><span>Roadtax reminder</span></div>');
  html=html.replace(/<div class="field"><label>Insurance expiry<\/label><input id="insuranceExpiry" type="date"><\/div>/,'<input id="insuranceExpiry" type="hidden">');
  html=html.replace(/<div class="field"><label>Insurance provider[\s\S]*?<input id="insuranceProvider"[^>]*><\/div>/,'<input id="insuranceProvider" type="hidden">');
  html=html.replace(/<div class="field"><label>Policy \/ certificate no\.[\s\S]*?<input id="insurancePolicy"[^>]*><\/div>/,'<input id="insurancePolicy" type="hidden">');
  return html;
};

editRenewalsV4=function(){
  if(!state.car)return;
  const w=document.createElement('div');w.className='modal-wrap';
  w.innerHTML=`<div class="modal"><div class="row"><h2>Roadtax reminder</h2><button class="btn small ghost" id="close">Close</button></div><p class="muted">Update the expiry date and Car Bestie will keep it visible on your dashboard.</p><div class="form"><div class="field"><label>Roadtax expiry</label><input id="rt" type="date" value="${esc(state.car.roadtax_expiry||'')}"></div><button class="btn" id="save">Save roadtax date ♡</button></div></div>`;
  document.body.appendChild(w);
  w.querySelector('#close').onclick=()=>w.remove();
  w.querySelector('#save').onclick=async()=>{try{const payload={roadtax_expiry:w.querySelector('#rt').value||null,updated_at:new Date().toISOString()};await api('cars?id=eq.'+encodeURIComponent(state.car.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)});Object.assign(state.car,payload);const i=state.cars.findIndex(c=>c.id===state.car.id);if(i>=0)Object.assign(state.cars[i],payload);w.remove();toast('Roadtax date saved ✨');render();}catch(e){console.error(e);toast('Could not save roadtax date');}};
};

const homeV5Base=home;
home=async function(){
  await homeV5Base();
  const wrap=document.querySelector('.renewal-wrap-v4');
  if(!wrap)return;
  const heading=wrap.querySelector('.section-title');if(heading)heading.textContent='roadtax reminder 🪪';
  const cards=wrap.querySelectorAll('.renewal-card');if(cards.length>1)cards[1].remove();
};
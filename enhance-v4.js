// Car Bestie V4 — brighter landing + roadtax & insurance reminders

login=function(){
  app.innerHTML=`<div class="landing-v4">
    <header class="landing-nav">
      <div class="landing-brand">🚗✨ Car <span>Bestie</span></div>
      <div class="landing-badge">Free • up to 2 cars</div>
    </header>

    <main class="landing-main">
      <section class="landing-copy">
        <div class="landing-kicker">YOUR CAR, MINUS THE MENTAL LOAD ✨</div>
        <h1>Tak payah hafal semua<br><em>pasal kereta.</em></h1>
        <p class="landing-lead">Car Bestie ingatkan bila nak service, roadtax & insurance — sambil simpan resit dan harga yang pernah anda bayar.</p>
        <button class="landing-google" id="google"><span>G</span> Continue with Google</button>
        <div class="landing-trust">✓ Free to start &nbsp; • &nbsp; ✓ No card needed &nbsp; • &nbsp; ✓ Your records stay private</div>
      </section>

      <section class="landing-phone" aria-label="Car Bestie preview">
        <div class="phone-top"><b>Car Bestie</b><span>SI PUTIH ▾</span></div>
        <div class="phone-car">🚙<div><b>Perodua Myvi</b><small>VCT 8821 • 54,320 km</small></div></div>
        <div class="phone-title">what needs attention? 👀</div>
        <div class="phone-alert coral"><span>🪪</span><div><b>Roadtax</b><small>Due in 18 days</small></div><strong>SOON</strong></div>
        <div class="phone-alert lilac"><span>🛡️</span><div><b>Insurance</b><small>12 Sep 2026</small></div><strong>OK</strong></div>
        <div class="phone-alert mint"><span>🛢️</span><div><b>Engine oil</b><small>At 60,000 km</small></div><strong>OK</strong></div>
        <div class="phone-total"><span>Total car care recorded</span><b>RM1,245</b></div>
      </section>
    </main>

    <section class="landing-features">
      <article><div>🔧</div><b>Service, simplified</b><p>Tick apa yang dibuat, letak harga, dan Car Bestie ingat next due.</p></article>
      <article><div>🧾</div><b>Receipts that don't disappear</b><p>Snap bil workshop dan tengok balik apa yang pernah anda bayar.</p></article>
      <article><div>⏰</div><b>Renewal reminders</b><p>Roadtax, insurance dan maintenance — semua dalam satu tempat.</p></article>
    </section>

    <div class="landing-bottom">Made for people who just want to know <b>what's next</b> — without needing to know cars.</div>
  </div>`;
  $('#google').onclick=googleLogin;
};

carFormHtml=function(){
  return `<div class="form">
    <button class="btn ghost" id="photoBtn">Take / upload car photo</button>
    <div id="photoPreview"></div>
    <div class="field"><label>Make</label><input id="make" placeholder="Perodua"></div>
    <div class="field"><label>Model</label><input id="model" placeholder="Myvi 1.5"></div>
    <div class="field"><label>Year</label><input id="year" type="number" placeholder="2022"></div>
    <div class="field"><label>Plate number</label><input id="plate" placeholder="VCT 8821"></div>
    <div class="field"><label>Current mileage</label><input id="mileage" type="number" placeholder="54320"></div>
    <div class="field"><label>Name / nickname</label><input id="nickname" placeholder="Si Putih"></div>
    <div class="form-divider"><span>Renewal reminders</span></div>
    <div class="field"><label>Roadtax expiry</label><input id="roadtaxExpiry" type="date"></div>
    <div class="field"><label>Insurance expiry</label><input id="insuranceExpiry" type="date"></div>
    <div class="field"><label>Insurance provider <span class="optional">optional</span></label><input id="insuranceProvider" placeholder="Etiqa / Zurich / Takaful Malaysia"></div>
    <div class="field"><label>Policy / certificate no. <span class="optional">optional</span></label><input id="insurancePolicy" placeholder="For your own reference"></div>
    <button class="btn" id="saveCar">Save my car ♡</button>
  </div>`;
};

wireCarForm=function(root,onDone){
  let photoFile=null;
  root.querySelector('#photoBtn').onclick=()=>pickFile(file=>{
    photoFile=file;let r=new FileReader();
    r.onload=()=>root.querySelector('#photoPreview').innerHTML=`<img class="preview-wide" src="${r.result}">`;
    r.readAsDataURL(file);
  });
  root.querySelector('#saveCar').onclick=async()=>{
    let make=root.querySelector('#make').value.trim(),model=root.querySelector('#model').value.trim();
    if(!make||!model)return toast('Add make & model first');
    try{
      root.querySelector('#saveCar').disabled=true;
      let photo_path=photoFile?await upload('car-photos',photoFile):null;
      let payload={
        user_id:state.user.id,make,model,
        year:Number(root.querySelector('#year').value)||null,
        plate_no:root.querySelector('#plate').value.trim()||null,
        mileage:Number(root.querySelector('#mileage').value)||0,
        nickname:root.querySelector('#nickname').value.trim()||null,
        roadtax_expiry:root.querySelector('#roadtaxExpiry').value||null,
        insurance_expiry:root.querySelector('#insuranceExpiry').value||null,
        insurance_provider:root.querySelector('#insuranceProvider').value.trim()||null,
        insurance_policy_no:root.querySelector('#insurancePolicy').value.trim()||null,
        photo_path
      };
      let rows=await api('cars',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      let c=rows[0];state.cars.push(c);state.car=c;state.selectedCarId=c.id;STORE.set('selected_car_id',c.id);state.services=[];
      if(onDone)onDone();
      render();
    }catch(e){
      console.error(e);
      let msg=String(e.message||'');
      toast(msg.includes('FREE_CAR_LIMIT')?'Free plan supports up to 2 cars.':'Could not save car');
      root.querySelector('#saveCar').disabled=false;
    }
  };
};

function renewalStatusV4(date){
  if(!date)return {label:'Add date',cls:'missing',detail:'Not set yet'};
  const today=new Date();today.setHours(0,0,0,0);
  const d=new Date(date+'T00:00:00');
  const days=Math.ceil((d-today)/86400000);
  if(days<0)return {label:'Expired',cls:'due',detail:`Expired ${Math.abs(days)} day${Math.abs(days)===1?'':'s'} ago`};
  if(days===0)return {label:'Due today',cls:'due',detail:'Renew today'};
  if(days<=30)return {label:'Due soon',cls:'soon',detail:`${days} day${days===1?'':'s'} left`};
  return {label:'All good',cls:'ok',detail:fmtDate(date)};
}

function renewalCardV4(icon,title,date,sub){
  const s=renewalStatusV4(date);
  return `<div class="card renewal-card ${s.cls}"><div class="renewal-icon">${icon}</div><div class="renewal-copy"><b>${title}</b><div class="muted">${esc(s.detail)}${sub?` • ${esc(sub)}`:''}</div></div><span class="status-tag">${s.label}</span></div>`;
}

function editRenewalsV4(){
  if(!state.car)return;
  let w=document.createElement('div');w.className='modal-wrap';
  w.innerHTML=`<div class="modal"><div class="row"><h2>Roadtax & insurance</h2><button class="btn small ghost" id="close">Close</button></div>
    <p class="muted">Update the expiry dates and Car Bestie will keep them visible on your dashboard.</p>
    <div class="form">
      <div class="field"><label>Roadtax expiry</label><input id="rt" type="date" value="${esc(state.car.roadtax_expiry||'')}"></div>
      <div class="field"><label>Insurance expiry</label><input id="ins" type="date" value="${esc(state.car.insurance_expiry||'')}"></div>
      <div class="field"><label>Insurance provider <span class="optional">optional</span></label><input id="provider" value="${esc(state.car.insurance_provider||'')}" placeholder="Etiqa / Zurich / Takaful Malaysia"></div>
      <div class="field"><label>Policy / certificate no. <span class="optional">optional</span></label><input id="policy" value="${esc(state.car.insurance_policy_no||'')}" placeholder="For your own reference"></div>
      <button class="btn" id="save">Save renewal details ♡</button>
    </div></div>`;
  document.body.appendChild(w);
  w.querySelector('#close').onclick=()=>w.remove();
  w.querySelector('#save').onclick=async()=>{
    try{
      let payload={
        roadtax_expiry:w.querySelector('#rt').value||null,
        insurance_expiry:w.querySelector('#ins').value||null,
        insurance_provider:w.querySelector('#provider').value.trim()||null,
        insurance_policy_no:w.querySelector('#policy').value.trim()||null,
        updated_at:new Date().toISOString()
      };
      await api('cars?id=eq.'+encodeURIComponent(state.car.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)});
      Object.assign(state.car,payload);
      let i=state.cars.findIndex(c=>c.id===state.car.id);if(i>=0)Object.assign(state.cars[i],payload);
      w.remove();toast('Renewal details saved ✨');render();
    }catch(e){console.error(e);toast('Could not save renewal details')}
  };
}

const homeBeforeV4=home;
home=async function(){
  await homeBeforeV4();
  if(!state.car)return;
  const firstSection=document.querySelector('.shell .section-title');
  if(!firstSection)return;
  const box=document.createElement('div');box.className='renewal-wrap-v4';
  box.innerHTML=`<div class="row renewal-heading"><div class="section-title">renewals & protection 🪪</div><button class="btn small soft" id="editRenewalsV4">Update</button></div>
    <div class="renewal-list-v4">
      ${renewalCardV4('🪪','Roadtax',state.car.roadtax_expiry,'')}
      ${renewalCardV4('🛡️','Insurance',state.car.insurance_expiry,state.car.insurance_provider||'')}
    </div>`;
  firstSection.before(box);
  box.querySelector('#editRenewalsV4').onclick=editRenewalsV4;
};

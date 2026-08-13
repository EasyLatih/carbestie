function carFormHtml(){
  return `<div class="form">
    <button class="btn ghost" id="photoBtn">Take / upload car photo</button>
    <div id="photoPreview"></div>
    <div class="field"><label>Make</label><input id="make" placeholder="Perodua"></div>
    <div class="field"><label>Model</label><input id="model" placeholder="Myvi 1.5"></div>
    <div class="field"><label>Year</label><input id="year" type="number" placeholder="2022"></div>
    <div class="field"><label>Plate number</label><input id="plate" placeholder="VCT 8821"></div>
    <div class="field"><label>Current mileage</label><input id="mileage" type="number" placeholder="54320"></div>
    <div class="field"><label>Name / nickname</label><input id="nickname" placeholder="Mimi"></div>
    <button class="btn" id="saveCar">Save my car ♡</button>
  </div>`;
}

function wireCarForm(root,onDone){
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
      let photo_path=photoFile?await upload('car-photos',photoFile):null,
          payload={
            user_id:state.user.id,make,model,
            year:Number(root.querySelector('#year').value)||null,
            plate_no:root.querySelector('#plate').value.trim()||null,
            mileage:Number(root.querySelector('#mileage').value)||0,
            nickname:root.querySelector('#nickname').value.trim()||null,
            photo_path
          };
      let rows=await api('cars',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      let c=rows[0];state.cars.push(c);state.car=c;state.selectedCarId=c.id;STORE.set('selected_car_id',c.id);state.services=[];
      if(onDone)onDone();
      render();
    }catch(e){console.error(e);toast('Could not save car')}
  };
}

function addCar(){
  shell(`<div class="hero"><div class="hero-empty">📸</div><div class="carname">Add your car</div>
    <p class="muted">Give your car a name — that is what you will see in the dropdown.</p>${carFormHtml()}</div>`);
  wireCarForm(document);
}

function addCarModal(){
  let w=document.createElement('div');w.className='modal-wrap';
  w.innerHTML=`<div class="modal"><div class="row"><h2>Add another car</h2><button class="btn small ghost" id="close">Close</button></div>${carFormHtml()}</div>`;
  document.body.appendChild(w);
  w.querySelector('#close').onclick=()=>w.remove();
  wireCarForm(w,()=>w.remove());
}

function parseItems(r){
  if(!r?.items)return [];
  try{
    let parsed=JSON.parse(r.items);
    if(parsed&&Array.isArray(parsed.items))return parsed.items;
    if(Array.isArray(parsed))return parsed;
  }catch{}
  return [{name:r.items,price:Number(r.total||0),next_due_date:null,next_due_mileage:null,legacy:true}];
}

function itemSummary(r){
  let items=parseItems(r);
  return items.map(i=>i.name).filter(Boolean).join(', ')||'Service';
}

function recordCard(r){
  return `<div class="card record">
    <div class="icon">🔧</div>
    <div><b>${esc(fmtDate(r.service_date)||r.service_date||'')}</b>
      <div class="muted">${Number(r.mileage||0).toLocaleString()} km • ${esc(r.workshop||'Workshop')}</div>
      <div class="muted">${esc(itemSummary(r))}</div>
    </div>
    <div class="money">${money(r.total)}</div>
  </div>`;
}

function dueState(item){
  let today=new Date(); today.setHours(0,0,0,0);
  let d=item.next_due_date?new Date(item.next_due_date+'T00:00:00'):null;
  let km=item.next_due_mileage?Number(item.next_due_mileage):null;
  let cur=Number(state.car?.mileage||0);
  if((d&&d<=today)||(km&&cur>=km))return {rank:0,label:'Due now',cls:'due'};
  let soonDate=d&&((d-today)/(86400000)<=30);
  let soonKm=km&&(km-cur<=1000);
  if(soonDate||soonKm)return {rank:1,label:'Coming soon',cls:'soon'};
  return {rank:2,label:'All good',cls:'ok'};
}

function currentMaintenance(){
  let seen=new Set(),list=[];
  for(let r of state.services){
    for(let i of parseItems(r)){
      let key=(i.name||'').trim().toLowerCase();
      if(!key||seen.has(key))continue;
      seen.add(key);
      if(i.next_due_date||i.next_due_mileage){
        let st=dueState(i);
        list.push({...i,status:st,service_date:r.service_date,paid:i.price||0});
      }
    }
  }
  return list.sort((a,b)=>a.status.rank-b.status.rank).slice(0,4);
}

async function home(){
  if(!state.car)return addCar();
  let last=state.services[0],spent=state.services.reduce((a,b)=>a+Number(b.total||0),0),
      p=await signed('car-photos',state.car.photo_path),
      photo=p?`<img class="hero-photo" src="${p}">`:`<div class="hero-empty">🚙</div>`,
      due=currentMaintenance();

  shell(`${photo}
    <div class="row"><div>
      <div class="carname">${esc(carLabel(state.car))}</div>
      <div class="muted">${esc(state.car.make)} ${esc(state.car.model)} • ${esc(state.car.plate_no||'')}</div>
    </div><span class="pill">${Number(state.car.mileage||0).toLocaleString()} km</span></div>

    <div class="section-title">how's your car? ✨</div>
    ${due.length?`<div class="due-list">${due.map(i=>`<div class="card maintenance ${i.status.cls}">
      <div><b>${esc(i.name)}</b><div class="muted">${i.next_due_date?'By '+esc(fmtDate(i.next_due_date)):''}${i.next_due_date&&i.next_due_mileage?' • ':''}${i.next_due_mileage?'At '+Number(i.next_due_mileage).toLocaleString()+' km':''}</div></div>
      <span class="status-tag">${i.status.label}</span>
    </div>`).join('')}</div>`:
    `<div class="card soon"><b>✨ Add next due</b><div class="muted">Record a service item and tell Car Bestie when it should be checked again.</div></div>`}

    <div class="grid">
      <div class="card"><div class="muted">Total recorded</div><div class="stat">${money(spent)}</div></div>
      <div class="card"><div class="muted">Service records</div><div class="stat">${state.services.length}</div></div>
    </div>

    <div class="section-title">last service</div>
    ${last?recordCard(last):`<div class="card empty"><div class="big">🧾</div>No service record yet.<br><br><button class="btn soft" id="first">I just serviced my car</button></div>`}`,true);
  if($('#first'))$('#first').onclick=serviceModal;
}


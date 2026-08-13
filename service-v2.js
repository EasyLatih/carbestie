function service(){
  if(!state.car)return addCar();
  shell(`<div class="section-title">Service</div>
    <div class="hero"><h2>just serviced? ✨</h2>
      <p class="muted">Tick what was done, add the price for each item and set when it is due again.</p>
      <button class="btn" id="addService">+ Record service</button>
    </div>
    <div class="section-title">smart reminders</div>
    <div class="card soon"><b>📧 Email reminders</b><p class="muted">Your Next Due Date / Mileage will power the reminders.</p></div>`);
  $('#addService').onclick=serviceModal;
}

function normalItemRow(name,idx){
  return `<div class="service-item" data-idx="${idx}">
    <label class="item-head"><input type="checkbox" class="item-check"> <b>${esc(name)}</b></label>
    <div class="item-fields">
      <div class="field"><label>Price (RM)</label><input class="item-price" type="number" step="0.01" placeholder="0.00"></div>
      <div class="field"><label>Next due date</label><input class="item-date" type="date"></div>
      <div class="field"><label>Next due mileage</label><input class="item-km" type="number" placeholder="65000"></div>
    </div>
  </div>`;
}

function customItemRow(idx){
  return `<div class="service-item custom checked" data-idx="${idx}">
    <div class="row"><div class="field grow"><label>Other item</label><input class="item-name" placeholder="Engine mounting"></div><button class="remove-item" type="button">×</button></div>
    <div class="item-fields show">
      <div class="field"><label>Price (RM)</label><input class="item-price" type="number" step="0.01" placeholder="0.00"></div>
      <div class="field"><label>Next due date</label><input class="item-date" type="date"></div>
      <div class="field"><label>Next due mileage</label><input class="item-km" type="number" placeholder="optional"></div>
    </div>
  </div>`;
}

function wireItemRows(w){
  w.querySelectorAll('.service-item:not(.custom)').forEach(row=>{
    let chk=row.querySelector('.item-check'),fields=row.querySelector('.item-fields');
    chk.onchange=()=>{row.classList.toggle('checked',chk.checked);fields.classList.toggle('show',chk.checked);calcTotal(w)};
    row.querySelector('.item-price').oninput=()=>calcTotal(w);
  });
  w.querySelectorAll('.custom .item-price').forEach(x=>x.oninput=()=>calcTotal(w));
  w.querySelectorAll('.remove-item').forEach(b=>b.onclick=()=>{b.closest('.service-item').remove();calcTotal(w)});
}

function calcTotal(w){
  let total=0;
  w.querySelectorAll('.service-item').forEach(row=>{
    let active=row.classList.contains('custom')||row.querySelector('.item-check')?.checked;
    if(active)total+=Number(row.querySelector('.item-price')?.value||0);
  });
  let t=w.querySelector('#serviceTotal');if(t)t.textContent=money(total);
  return total;
}

function collectItems(w){
  let items=[];
  w.querySelectorAll('.service-item').forEach(row=>{
    let custom=row.classList.contains('custom'),
        active=custom||row.querySelector('.item-check')?.checked;
    if(!active)return;
    let name=custom?row.querySelector('.item-name').value.trim():row.querySelector('.item-head b').textContent.trim();
    if(!name)return;
    items.push({
      name,
      price:Number(row.querySelector('.item-price')?.value||0),
      next_due_date:row.querySelector('.item-date')?.value||null,
      next_due_mileage:Number(row.querySelector('.item-km')?.value)||null
    });
  });
  return items;
}

function serviceModal(){
  if(!state.car)return toast('Add a car first');
  let w=document.createElement('div');w.className='modal-wrap';
  w.innerHTML=`<div class="modal">
    <div class="row"><div><h2>Record service</h2><div class="muted">${esc(carLabel(state.car))}</div></div><button class="btn small ghost" id="close">Close</button></div>
    <div class="form">
      <div class="two-col">
        <div class="field"><label>Date</label><input id="sdate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Mileage</label><input id="smileage" type="number" value="${state.car.mileage||''}"></div>
      </div>
      <div class="field"><label>Workshop</label><input id="sworkshop" placeholder="ABC Auto Service"></div>

      <div>
        <div class="section-mini">What did you do today? 🔧</div>
        <div id="normalItems">${NORMAL_ITEMS.map(normalItemRow).join('')}</div>
        <div id="customItems"></div>
        <button class="btn ghost" type="button" id="addOther">＋ Add other item</button>
      </div>

      <div class="service-total"><span>Total</span><b id="serviceTotal">RM0.00</b></div>

      <div class="field"><label>Notes</label><textarea id="snotes" placeholder="Optional"></textarea></div>
      <button class="btn ghost" id="receiptBtn">📸 Snap / upload receipt</button>
      <div id="preview"></div>
      <button class="btn" id="saveService">Save service ♡</button>
    </div>
  </div>`;
  document.body.appendChild(w);
  let receiptFile=null,customIndex=1000;
  w.querySelector('#close').onclick=()=>w.remove();
  wireItemRows(w);
  w.querySelector('#addOther').onclick=()=>{
    w.querySelector('#customItems').insertAdjacentHTML('beforeend',customItemRow(customIndex++));
    wireItemRows(w);
  };
  w.querySelector('#receiptBtn').onclick=()=>pickFile(file=>{
    receiptFile=file;let r=new FileReader();
    r.onload=()=>w.querySelector('#preview').innerHTML=`<br><img class="receipt" src="${r.result}">`;
    r.readAsDataURL(file);
  });
  w.querySelector('#saveService').onclick=async()=>{
    let items=collectItems(w);
    if(!items.length)return toast('Tick at least one item');
    try{
      w.querySelector('#saveService').disabled=true;
      let receipt_path=receiptFile?await upload('receipts',receiptFile):null,
          total=items.reduce((a,b)=>a+Number(b.price||0),0),
          payload={
            user_id:state.user.id,car_id:state.car.id,
            service_date:w.querySelector('#sdate').value,
            mileage:Number(w.querySelector('#smileage').value)||null,
            workshop:w.querySelector('#sworkshop').value.trim()||null,
            items:JSON.stringify({v:1,items}),
            total,
            receipt_path,
            notes:w.querySelector('#snotes').value.trim()||null
          };
      let rows=await api('service_records',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      state.services.unshift(rows[0]);
      if(payload.mileage){
        state.car.mileage=payload.mileage;
        let c=state.cars.find(x=>x.id===state.car.id);if(c)c.mileage=payload.mileage;
        await api('cars?id=eq.'+state.car.id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({mileage:payload.mileage,updated_at:new Date().toISOString()})});
      }
      w.remove();toast('Service saved ✨');render();
    }catch(e){console.error(e);toast('Could not save service');w.querySelector('#saveService').disabled=false}
  };
}

function priceHistory(){
  let map={};
  [...state.services].reverse().forEach(r=>{
    parseItems(r).forEach(i=>{
      let name=(i.name||'').trim();if(!name)return;
      (map[name]??=[]).push({date:r.service_date,price:Number(i.price||0),workshop:r.workshop});
    });
  });
  return map;
}

async function records(){
  if(!state.car)return addCar();
  let html='';
  for(let r of state.services){
    let u=await signed('receipts',r.receipt_path),items=parseItems(r);
    html+=`<div class="record-block">${recordCard(r)}
      <div class="card itemized-record">${items.map(i=>`<div class="history-item">
        <div><b>${esc(i.name)}</b>
          <div class="muted">${i.next_due_date?'Next: '+esc(fmtDate(i.next_due_date)):''}${i.next_due_date&&i.next_due_mileage?' • ':''}${i.next_due_mileage?Number(i.next_due_mileage).toLocaleString()+' km':''}</div>
        </div><b>${money(i.price||0)}</b>
      </div>`).join('')}
      ${u?`<a class="receipt-link" href="${u}" target="_blank">📸 View receipt</a>`:''}
      </div>
    </div>`;
  }
  let histories=priceHistory(),histHtml=Object.entries(histories).filter(([k,v])=>v.length>1).map(([name,rows])=>{
    let recent=rows.slice(-3).reverse();
    return `<div class="card price-card"><b>${esc(name)}</b>${recent.map(x=>`<div class="price-row"><span>${esc(fmtDate(x.date))}</span><b>${money(x.price)}</b></div>`).join('')}</div>`;
  }).join('');

  shell(`<div class="section-title">your car history 🧾</div>
    ${html||`<div class="empty"><div class="big">🧾</div>Your receipts & service history will appear here.</div>`}
    ${histHtml?`<div class="section-title">price history 💸</div>${histHtml}`:''}`);
}


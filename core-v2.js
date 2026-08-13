
const $=s=>document.querySelector(s), app=$('#app');
const CFG=window.CARBESTIE_CONFIG||{};
const BASE=(CFG.SUPABASE_URL||'https://plhubagdmrlefvnbpqlf.supabase.co').replace(/\/$/,'');
const KEY=CFG.SUPABASE_ANON_KEY||CFG.SUPABASE_PUBLISHABLE_KEY||'';
const APPURL=CFG.APP_URL||'https://carbestie.my';
const STORE={
  get(k,d){try{return JSON.parse(localStorage.getItem('cb_'+k))??d}catch{return d}},
  set(k,v){localStorage.setItem('cb_'+k,JSON.stringify(v))},
  del(k){localStorage.removeItem('cb_'+k)}
};

const NORMAL_ITEMS=[
  'Engine oil','Oil filter','Air filter','Cabin filter','Brake pad','Brake fluid',
  'Coolant','Transmission / CVT fluid','Spark plugs','Battery','Tyres','Wiper'
];

let state={
  session:STORE.get('session',null),
  user:null,
  cars:[],
  car:null,
  services:[],
  posts:[],
  tab:'home',
  loading:true,
  selectedCarId:STORE.get('selected_car_id',null)
};

const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'RM'+Number(n||0).toFixed(2);
const fmtDate=s=>s?new Date(s+'T00:00:00').toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'}):'';
const carLabel=c=>c?(c.nickname||c.model||'My Car'):'My Car';

function toast(t){
  let e=document.createElement('div');
  e.className='toast'; e.textContent=t; document.body.appendChild(e);
  setTimeout(()=>e.remove(),1800);
}

function parseOAuth(){
  if(!location.hash)return;
  let p=new URLSearchParams(location.hash.slice(1)),
      a=p.get('access_token'),r=p.get('refresh_token'),e=p.get('expires_in');
  if(a){
    state.session={access_token:a,refresh_token:r,expires_at:Date.now()+Number(e||3600)*1000};
    STORE.set('session',state.session);
    history.replaceState({},'',location.pathname+location.search);
  }
}

async function refresh(){
  if(!state.session?.refresh_token||!KEY)return false;
  let x=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{
    method:'POST',
    headers:{apikey:KEY,'Content-Type':'application/json'},
    body:JSON.stringify({refresh_token:state.session.refresh_token})
  });
  if(!x.ok)return false;
  let j=await x.json();
  state.session={access_token:j.access_token,refresh_token:j.refresh_token||state.session.refresh_token,expires_at:Date.now()+Number(j.expires_in||3600)*1000};
  STORE.set('session',state.session);
  return true;
}

async function authHeader(){
  if(state.session?.expires_at&&Date.now()>state.session.expires_at-60000)await refresh();
  return {apikey:KEY,Authorization:'Bearer '+(state.session?.access_token||''),'Content-Type':'application/json'};
}

async function api(path,opt={}){
  let h=await authHeader();
  let res=await fetch(BASE+'/rest/v1/'+path,{...opt,headers:{...h,...(opt.headers||{})}});
  if(!res.ok){let t=await res.text();throw new Error(t||res.statusText)}
  if(res.status===204)return null;
  let txt=await res.text();
  return txt?JSON.parse(txt):null;
}

async function getUser(){
  if(!state.session?.access_token||!KEY)return null;
  let h=await authHeader(),r=await fetch(BASE+'/auth/v1/user',{headers:h});
  if(!r.ok)return null;
  return r.json();
}

async function loadCars(){
  state.cars=await api('cars?select=*&order=created_at.asc');
  if(!state.cars.length){state.car=null;state.services=[];return}
  let chosen=state.cars.find(c=>c.id===state.selectedCarId)||state.cars[0];
  state.car=chosen;
  state.selectedCarId=chosen.id;
  STORE.set('selected_car_id',chosen.id);
  await loadCarServices();
}

async function loadCarServices(){
  if(!state.car){state.services=[];return}
  state.services=await api(
    'service_records?select=*&car_id=eq.'+encodeURIComponent(state.car.id)+'&order=service_date.desc,created_at.desc'
  );
}

async function loadData(){
  if(!state.user)return;
  try{
    await loadCars();
    state.posts=await api('community_posts?select=*&order=created_at.desc&limit=50');
  }catch(e){console.error(e);toast('Could not load data')}
  state.loading=false;
}

async function boot(){
  parseOAuth();
  if(!KEY){state.loading=false;render();return}
  state.user=await getUser();
  if(!state.user&&state.session){STORE.del('session');state.session=null}
  if(state.user)await loadData();else state.loading=false;
  render();
}

function googleLogin(){
  if(!KEY)return toast('Supabase publishable key belum dimasukkan');
  location.href=BASE+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(APPURL);
}

function logout(){
  STORE.del('session');
  state.session=null;state.user=null;state.cars=[];state.car=null;state.services=[];state.posts=[];
  render();
}

function login(){
  app.innerHTML=`<div class="login"><div class="loginbox">
    <div class="logo">🚗✨</div><h1>Car Bestie</h1>
    <p class="muted">we remember the boring car stuff,<br>so you don't have to.</p>
    <button class="btn" id="google">G&nbsp;&nbsp; Continue with Google</button>
    ${KEY?'':'<div class="notice">Final setup: Supabase publishable key belum dimasukkan.</div>'}
  </div></div>`;
  $('#google').onclick=googleLogin;
}

function nav(){
  return `<div class="nav">${[
    ['home','🏠','Home'],['service','🔧','Service'],['records','🧾','Records'],['community','💬','Community'],['me','👤','Me']
  ].map(x=>`<button data-tab="${x[0]}" class="${state.tab===x[0]?'active':''}"><b>${x[1]}</b>${x[2]}</button>`).join('')}</div>`;
}

function carSwitcher(){
  if(!state.cars.length)return '';
  return `<div class="car-switcher">
    <select id="carSelect" aria-label="Choose car">
      ${state.cars.map(c=>`<option value="${c.id}" ${c.id===state.car?.id?'selected':''}>${esc(carLabel(c))}</option>`).join('')}
    </select>
    <button class="mini-add" id="addCarQuick" title="Add car">＋</button>
  </div>`;
}

function shell(content,fab=false){
  let nm=state.user?.user_metadata?.full_name||state.user?.user_metadata?.name||state.user?.email||'B';
  app.innerHTML=`<main class="shell">
    <div class="top"><div class="brand">Car <span>Bestie</span></div><div class="avatar">${esc(String(nm)[0].toUpperCase())}</div></div>
    ${carSwitcher()}
    ${content}
  </main>${fab?'<button class="fab" id="fab">＋</button>':''}${nav()}`;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()});
  if($('#carSelect'))$('#carSelect').onchange=async e=>{
    state.selectedCarId=e.target.value;STORE.set('selected_car_id',state.selectedCarId);
    state.car=state.cars.find(c=>c.id===state.selectedCarId)||state.cars[0];
    await loadCarServices();render();
  };
  if($('#addCarQuick'))$('#addCarQuick').onclick=()=>addCarModal();
  if(fab)$('#fab').onclick=serviceModal;
}

async function upload(bucket,file){
  let ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase(),
      path=state.user.id+'/'+Date.now()+'.'+ext,h=await authHeader(),
      r=await fetch(BASE+'/storage/v1/object/'+bucket+'/'+path,{
        method:'POST',
        headers:{apikey:KEY,Authorization:h.Authorization,'Content-Type':file.type||'application/octet-stream','x-upsert':'true'},
        body:file
      });
  if(!r.ok)throw new Error(await r.text());
  return path;
}

async function signed(bucket,path){
  if(!path)return'';
  let h=await authHeader(),
      r=await fetch(BASE+'/storage/v1/object/sign/'+bucket+'/'+path,{
        method:'POST',headers:h,body:JSON.stringify({expiresIn:3600})
      });
  if(!r.ok)return'';
  let j=await r.json();
  return BASE+'/storage/v1'+j.signedURL;
}

function pickFile(cb){
  let f=$('#filePicker');f.value='';
  f.onchange=()=>{let file=f.files[0];if(file)cb(file)};
  f.click();
}


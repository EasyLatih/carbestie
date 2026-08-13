function render(){
  if(state.loading)return app.innerHTML='<div class="login"><div class="loginbox"><div class="logo">🚗✨</div><h2>Loading your Car Bestie…</h2></div></div>';
  if(!state.user)return login();
  let fn=({home,service,records,community,me}[state.tab]||home);
  Promise.resolve(fn()).catch(e=>{console.error(e);toast('Something went wrong')});
}

function loadBootScript(src){
  return new Promise(resolve=>{
    const s=document.createElement('script');s.src=src;
    s.onload=resolve;s.onerror=resolve;document.body.appendChild(s);
  });
}

(async()=>{
  await loadBootScript('optimize-v3.js');
  await loadBootScript('google-auth-v6.js');
  boot();
})();

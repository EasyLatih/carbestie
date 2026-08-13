function render(){
  if(state.loading)return app.innerHTML='<div class="login"><div class="loginbox"><div class="logo">🚗✨</div><h2>Loading your Car Bestie…</h2></div></div>';
  if(!state.user)return login();
  let fn=({home,service,records,community,me}[state.tab]||home);
  Promise.resolve(fn()).catch(e=>{console.error(e);toast('Something went wrong')});
}

boot();

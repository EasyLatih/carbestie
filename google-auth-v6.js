// Car Bestie V6 — Google Identity Services
(function(){
  const GCLIENT=(window.CARBESTIE_CONFIG||{}).GOOGLE_CLIENT_ID||'';
  const legacyGoogleLogin=window.googleLogin;
  let rawNonce='', hashedNonce='';

  function loadGIS(){return new Promise((resolve,reject)=>{if(window.google?.accounts?.id)return resolve();let s=document.querySelector('script[data-cb-gis]');if(s){s.addEventListener('load',resolve,{once:true});return;}s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.dataset.cbGis='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  function closeModal(){document.getElementById('cbGoogleModal')?.remove();}
  async function makeNonce(){
    const bytes=crypto.getRandomValues(new Uint8Array(32));
    rawNonce=btoa(String.fromCharCode(...bytes));
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(rawNonce));
    hashedNonce=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function finishGoogle(response){
    try{
      if(!response?.credential)throw new Error('No Google credential returned');
      const r=await fetch(BASE+'/auth/v1/token?grant_type=id_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({provider:'google',id_token:response.credential,nonce:rawNonce})});
      if(!r.ok)throw new Error(await r.text());
      const s=await r.json();
      state.session={access_token:s.access_token,refresh_token:s.refresh_token,expires_at:Date.now()+Number(s.expires_in||3600)*1000};
      STORE.set('session',state.session);state.user=s.user;state.loading=true;closeModal();await loadData();render();
    }catch(e){console.error(e);toast('Google sign-in tak berjaya. Cuba lagi.');}
  }
  window.googleLogin=async function(){
    if(!GCLIENT)return legacyGoogleLogin();
    try{
      await loadGIS();await makeNonce();closeModal();
      const w=document.createElement('div');w.id='cbGoogleModal';w.className='modal-wrap';
      w.innerHTML='<div class="modal" style="max-width:390px;text-align:center"><div style="font-size:38px">🚗✨</div><h2>Continue to Car Bestie</h2><p class="muted">Sign in securely with Google. We only use your name and email.</p><div id="cbGoogleButton" style="display:flex;justify-content:center;margin:20px 0"></div><button class="btn ghost" id="cbGoogleCancel">Cancel</button></div>';
      document.body.appendChild(w);w.querySelector('#cbGoogleCancel').onclick=closeModal;
      google.accounts.id.initialize({client_id:GCLIENT,callback:finishGoogle,nonce:hashedNonce,use_fedcm_for_prompt:true,context:'signin'});
      google.accounts.id.renderButton(w.querySelector('#cbGoogleButton'),{type:'standard',shape:'pill',theme:'outline',text:'continue_with',size:'large',logo_alignment:'left',width:300});
    }catch(e){console.error(e);toast('Google sign-in sedang unavailable.');}
  };
})();

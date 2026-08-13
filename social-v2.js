function community(){
  let nm=state.user?.user_metadata?.full_name||state.user?.user_metadata?.name||'Bestie';
  shell(`<div class="row"><div class="section-title">car talk 💬</div><button class="btn small soft" id="post">+ Post</button></div>
    <p class="muted">Members only. Anonymous to the community, but linked to your account for moderation.</p>
    ${state.posts.map(p=>`<div class="card community-post"><div class="meta">${p.is_anonymous?'Anonymous':esc(p.display_name||'Member')} • ${esc(p.location||'Malaysia')}</div><p>${esc(p.body)}</p><div class="muted">${p.user_id===state.user.id?'Your post':''}</div></div>`).join('')||'<div class="empty">Be the first to start Car Talk ✨</div>'}`);
  $('#post').onclick=()=>postModal(nm);
}

function postModal(nm){
  let w=document.createElement('div');w.className='modal-wrap';
  w.innerHTML=`<div class="modal"><h2>New post</h2><div class="form">
    <div class="field"><label>What's on your mind?</label><textarea id="text" placeholder="Workshop recommendation, price check, car question..."></textarea></div>
    <div class="field"><label>Area</label><input id="place" placeholder="Kuantan"></div>
    <label><input id="anon" type="checkbox" checked> Post anonymously</label>
    <button class="btn" id="publish">Post to Car Talk</button><button class="btn ghost" id="cancel">Cancel</button>
  </div></div>`;
  document.body.appendChild(w);
  w.querySelector('#cancel').onclick=()=>w.remove();
  w.querySelector('#publish').onclick=async()=>{
    let body=w.querySelector('#text').value.trim();if(!body)return;
    try{
      let rows=await api('community_posts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
        user_id:state.user.id,display_name:nm,is_anonymous:w.querySelector('#anon').checked,
        location:w.querySelector('#place').value.trim()||null,body
      })});
      state.posts.unshift(rows[0]);w.remove();render();
    }catch(e){console.error(e);toast('Could not post')}
  };
}

function me(){
  let nm=state.user?.user_metadata?.full_name||state.user?.user_metadata?.name||'Bestie';
  shell(`<div class="section-title">Me</div>
    <div class="card"><b>${esc(nm)}</b><div class="muted">${esc(state.user.email||'')}</div></div>
    <div class="row"><div class="section-title">My cars</div><button class="btn small soft" id="addCarProfile">+ Add</button></div>
    ${state.cars.map(c=>`<div class="card car-list-row"><div><b>${esc(carLabel(c))}</b><div class="muted">${esc(c.make)} ${esc(c.model)} • ${esc(c.plate_no||'')}</div></div>${c.id===state.car?.id?'<span class="pill">Active</span>':''}</div>`).join('')||'<div class="empty">No car yet.</div>'}
    <div class="section-title">Account</div><button class="btn ghost" id="logout">Log out</button>`);
  $('#logout').onclick=logout;
  $('#addCarProfile').onclick=()=>addCarModal();
}


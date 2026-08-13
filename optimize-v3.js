const FREE_CAR_LIMIT_V3=2;

async function optimizeUploadImage(file,bucket){
  if(!file?.type?.startsWith('image/')) return file;
  const profile=bucket==='receipts'?{maxW:1400,maxH:1800,quality:.72}:{maxW:1600,maxH:1600,quality:.76};
  const img=await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),image=new Image();image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};image.onerror=e=>{URL.revokeObjectURL(url);reject(e)};image.src=url;});
  const scale=Math.min(1,profile.maxW/img.width,profile.maxH/img.height),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',profile.quality));
  return blob?new File([blob],(file.name.replace(/\.[^.]+$/,'')||'image')+'.jpg',{type:'image/jpeg'}):file;
}

const originalUploadV3=upload;
upload=async function(bucket,file){return originalUploadV3(bucket,await optimizeUploadImage(file,bucket));};

const originalAddCarModalV3=addCarModal;
addCarModal=function(){if(state.cars.length>=FREE_CAR_LIMIT_V3){toast('Free plan supports up to 2 cars. More cars will be available on Paid.');return;}return originalAddCarModalV3();};

const originalAddCarV3=addCar;
addCar=function(){if(state.cars.length>=FREE_CAR_LIMIT_V3){shell(`<div class="hero"><div class="logo">🚗✨</div><h2>2 cars included on Free</h2><p class="muted">You have reached the Free plan limit. Paid will unlock more cars.</p></div>`);return;}return originalAddCarV3();};
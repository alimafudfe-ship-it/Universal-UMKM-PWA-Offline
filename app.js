'use strict';
window.APP_BUILD_VERSION='3.3.73';document.documentElement.dataset.appVersion='3.3.73';
const DB_NAME='UniversalUMKMProOffline', DB_VERSION=4;
let db, master, cart=[], lastReceipt=null, selectedPackageId=null, currentProfile=null, recipeDraft=[], businesses=[], activeBusinessId=null, licenseSlots=1, purchaseSearchSeq=0;
const $=id=>document.getElementById(id);
const money=n=>'Rp'+Number(n||0).toLocaleString('id-ID',{maximumFractionDigits:2});
// Clean floating-point residue for editable display values; calculations retain full precision.
function cleanNumberString(value,maxDecimals=4){const n=Number(value);if(!Number.isFinite(n))return '';const rounded=Number(n.toFixed(maxDecimals));return String(Object.is(rounded,-0)?0:rounded)}
const PREMIUM_RECIPE_YIELDS={799:50,800:40,801:20,802:30,803:25,804:25,805:25,806:30,807:20,808:25};
const PREMIUM_YIELD_BY_NAME={'klepon':50,'onde-onde':40,'kue lapis':20,'dadar gulung':30,'nagasari':25,'pastel sayur':25,'lemper ayam':25,'putu ayu':30,'kue cucur':20,'risoles sayur':25};
function defaultYieldForProductName(name){return PREMIUM_YIELD_BY_NAME[String(name||'').trim().toLocaleLowerCase('id')]||50}
function premiumYieldForProduct(product){const id=Number(product?.templateItemId||0);return PREMIUM_RECIPE_YIELDS[id]||50}
function isPremiumMarketTemplate(product){return Number(currentProfile?.packageId)===25&&Object.prototype.hasOwnProperty.call(PREMIUM_RECIPE_YIELDS,Number(product?.templateItemId||0))}
const dateNow=()=>new Date().toISOString();
// Simple drinks are sold as menu items by default, not enforced recipes. Users may still add a custom composition explicitly.
function isSimpleDrinkProductName(name){
 const n=String(name||'').trim().toLocaleLowerCase('id');
 if(!n||n.startsWith('paket '))return false;
 return ['kopi susu','kopi hitam','kopi tubruk','kopi sachet','es kopi','teh manis','es teh','teh tawar','teh tarik','wedang jahe','susu jahe','jus alpukat','jus mangga','jus jambu','es jeruk','jeruk hangat','air mineral','minuman es','minuman cokelat','minuman coklat','minuman sachet'].some(t=>n.includes(t));
}
function isDefaultDrinkRecipe(recipe){
 if(!recipe||!recipe.templateRecipeId)return false;
 const item=(master?.items||[]).find(i=>Number(i.id)===Number(recipe.productTemplateId||String(recipe.templateRecipeId).split('-').pop()));
 return isSimpleDrinkProductName(item?.nama_item||'');
}

function toast(s){const t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(toast.timer);const duration=String(s).includes('Stok bahan berikut tidak cukup')?Math.min(15000,Math.max(6500,String(s).length*45)):2600;toast.timer=setTimeout(()=>t.classList.remove('show'),duration)}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;for(const [name,key] of [['settings','key'],['products','id'],['transactions','id'],['details','id'],['materials','id'],['materialPurchases','id'],['recipes','id'],['assets','id'],['expenses','id']]){const st=d.objectStoreNames.contains(name)?req.transaction.objectStore(name):d.createObjectStore(name,{keyPath:key,autoIncrement:key==='id'});if(name!=='settings'&&!st.indexNames.contains('businessId'))st.createIndex('businessId','businessId',{unique:false});} };req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result)};req.onerror=()=>reject(req.error)})}
function request(store,mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode),s=tx.objectStore(store);let result;try{result=fn(s)}catch(e){reject(e);return}tx.oncomplete=()=>{resolve(result&&'result'in result?result.result:result);if(mode==='readwrite'&&!window.__restoringBackup) scheduleAutomaticBackup()};tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
const scopedStores=new Set(['products','transactions','details','materials','materialPurchases','recipes','assets','expenses']);
async function getAll(store){const rows=await request(store,'readonly',s=>s.getAll());return scopedStores.has(store)?rows.filter(x=>String(x.businessId??'legacy')===String(activeBusinessId??'legacy')):rows}
async function get(store,key){const row=await request(store,'readonly',s=>s.get(key));if(scopedStores.has(store)&&row&&String(row.businessId||'legacy')!==String(activeBusinessId||'legacy'))return undefined;return row}
function put(store,obj){if(scopedStores.has(store))obj={...obj,businessId:activeBusinessId||'legacy'};return request(store,'readwrite',s=>s.put(obj))}
function add(store,obj){if(scopedStores.has(store))obj={...obj,businessId:activeBusinessId||'legacy'};return request(store,'readwrite',s=>s.add(obj))}
async function saveBusinessList(){await put('settings',{key:'businesses',value:businesses});await put('settings',{key:'activeBusinessId',value:activeBusinessId});await put('settings',{key:'licenseSlots',value:licenseSlots})}
async function getCurrentProfile(){return businesses.find(b=>String(b.id)===String(activeBusinessId))||null}
function makeTransactionPrefix(name){const chars=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');return (chars.slice(0,2)||'US').padEnd(2,'X')}
function formatTransactionCode(prefix,sequence){return `${prefix}-${String(Math.max(1,Number(sequence)||1)).padStart(7,'0')}`}
// Atomic counter: settings and the transaction record are written in the same IndexedDB transaction.
function allocateTransactionCode(tx,businessId,onCode){const settings=tx.objectStore('settings'),req=settings.get('businesses');req.onsuccess=()=>{const list=Array.isArray(req.result?.value)?req.result.value:businesses.map(b=>({...b}));const profile=list.find(b=>String(b.id)===String(businessId));if(!profile){toast('Profil usaha tidak ditemukan. Transaksi tidak disimpan.');try{tx.abort()}catch{}return}const prefix=profile.transactionPrefix||makeTransactionPrefix(profile.name);const seq=Math.max(1,Math.floor(Number(profile.nextTransactionNumber)||1));profile.transactionPrefix=prefix;profile.nextTransactionNumber=seq+1;settings.put({key:'businesses',value:list});businesses=list;currentProfile=businesses.find(b=>String(b.id)===String(activeBusinessId))||currentProfile;onCode(formatTransactionCode(prefix,seq),profile)};req.onerror=()=>{toast('Nomor transaksi gagal disiapkan. Data tidak disimpan.');try{tx.abort()}catch{}}}
async function ensureTransactionNumbering(){if(!businesses.length)return;const [sales,purchases,expenses]=await Promise.all(['transactions','materialPurchases','expenses'].map(name=>request(name,'readonly',st=>st.getAll())));let changed=false;for(const profile of businesses){const prefix=profile.transactionPrefix||makeTransactionPrefix(profile.name);let max=0;for(const row of [...sales,...purchases,...expenses]){if(String(row.businessId??'legacy')!==String(profile.id))continue;const code=String(row.number||row.transactionCode||'');const match=code.match(/^([A-Z0-9]{2})-(\d+)$/);if(match&&match[1]===prefix)max=Math.max(max,Number(match[2])||0)}const next=Math.max(1,Math.floor(Number(profile.nextTransactionNumber)||1),max+1);if(profile.transactionPrefix!==prefix||Number(profile.nextTransactionNumber)!==next){profile.transactionPrefix=prefix;profile.nextTransactionNumber=next;changed=true}}if(changed)await saveBusinessList();currentProfile=await getCurrentProfile()}
function defaultCompositionMode(profile=currentProfile){
 const name=String(profile?.business||'').toLocaleLowerCase('id');
 const foodTerms=['makanan','minuman','kue','roti','bakery','catering','katering','gorengan','camilan','bakso','mi ayam','mie ayam','soto','martabak','jus buah','es campur','cafe','café','resto','warung makan','nasi uduk','nasi goreng','frozen food','donat','pempek','siomay','keripik','dessert','pizza','produksi'];
 return foodTerms.some(term=>name.includes(term))?'enabled':'disabled';
}
function compositionIsEnabled(profile=currentProfile){
 if(!profile)return false;
 const mode=profile.compositionMode||'auto';
 return mode==='enabled'||(mode==='auto'&&defaultCompositionMode(profile)==='enabled');
}
function updateCompositionVisibility(){
 const enabled=compositionIsEnabled();
 const navButton=$('navRecipes');if(navButton)navButton.hidden=!enabled;
 if($('compositionModeHelp')){
  const recommendation=defaultCompositionMode(currentProfile)==='enabled'?'Jenis usaha ini direkomendasikan memakai komposisi.':'Jenis usaha ini tidak memerlukan komposisi secara bawaan, tetapi Anda bisa mengaktifkannya.';
  $('compositionModeHelp').textContent=recommendation+' Pengaturan ini hanya mengubah tampilan; data komposisi yang tersimpan tidak dihapus.';
 }
 return enabled;
}
async function migrateMultiBusiness(){
 const settings=await getAll('settings'); const old=settings.find(x=>x.key==='profile');
 const saved=settings.find(x=>x.key==='businesses'); const lic=settings.find(x=>x.key==='licenseSlots'); const active=settings.find(x=>x.key==='activeBusinessId');
 if(saved&&Array.isArray(saved.value))businesses=saved.value.filter(b=>b&&b.id);
 if(!businesses.length&&old){const id=old.businessId||'business-legacy';const profile={...old,id,key:'profile-'+id};businesses=[profile];activeBusinessId=id;}
 else activeBusinessId=active?.value||businesses[0]?.id||null;
 licenseSlots=Math.max(1,Math.min(25,Number(lic?.value||1)));
 if(businesses.length&&!businesses.some(b=>String(b.id)===String(activeBusinessId)))activeBusinessId=businesses[0].id;
 // Assign orphaned pre-multibusiness rows to the legacy profile (or first profile) exactly once.
 const fallbackId=businesses.find(b=>String(b.id)==='business-legacy')?.id||businesses[0]?.id;
 if(fallbackId){for(const storeName of ['products','transactions','details','materials','materialPurchases','recipes','assets','expenses']){const rows=await request(storeName,'readonly',st=>st.getAll());for(const row of rows){if(!row.businessId||row.businessId==='legacy'){row.businessId=fallbackId;await request(storeName,'readwrite',st=>st.put(row));}}}}
 if(businesses.length)await saveBusinessList();
 currentProfile=await getCurrentProfile();
 await migrateInventoryModel();
}
async function migrateMasterV3(){
 if(!master||!Array.isArray(businesses)||!businesses.length)return;
 const originalId=activeBusinessId,originalProfile=currentProfile;let changed=false;
 for(const business of businesses){
  if(Number(business.masterDataVersion||0)>=5)continue;
  activeBusinessId=business.id;currentProfile=business;
  const pid=Number(business.packageId||0);if(!pid)continue;
  const templateItems=master.items.filter(i=>Number(i.paket_id)===pid);
  let products=await getAll('products'),materials=await getAll('materials'),assets=await getAll('assets'),recipes=await getAll('recipes');
  const byTemplate=(rows,templateId)=>rows.find(x=>Number(x.templateItemId)===Number(templateId));
  const productMap=new Map(),materialMap=new Map();
  // Keep existing rows and values; only fill missing catalog items and zero reference prices.
  for(const item of templateItems){
   if(item.kelompok==='Operasional'){
    let asset=byTemplate(assets,item.id);
    if(!asset){asset=assets.find(x=>x.source==='master'&&x.name===item.nama_item);if(!asset){const id=await add('assets',{businessId:activeBusinessId,name:item.nama_item,category:item.kategori||'Peralatan',cost:Number(item.harga_beli||0),date:'',lifeMonths:0,active:true,source:'master',templateItemId:item.id,referenceCost:true,createdAt:dateNow()});asset={id:Number(id),templateItemId:item.id,name:item.nama_item};assets.push(asset);changed=true}}
    // Earlier versions placed non-sellable operational equipment in Materials. Preserve its history but hide it from active stock ingredients.
    const oldMaterial=byTemplate(materials,item.id);if(oldMaterial&&oldMaterial.active!==false){oldMaterial.active=false;oldMaterial.legacyOperationalTemplate=true;await put('materials',oldMaterial);changed=true}
    continue;
   }
   if(item.kelompok==='Bahan Baku'||!item.bisa_dijual){
    let mat=byTemplate(materials,item.id);
    if(!mat){mat=materials.find(x=>x.source==='master'&&x.name===item.nama_item&&x.active!==false);if(!mat){const id=await add('materials',{name:item.nama_item,category:item.kategori||'Bahan baku',unit:item.satuan||'pcs',cost:Number(item.harga_beli||0),stock:0,stockEnabled:true,active:true,source:'master',templateItemId:item.id,referenceCost:true,referenceVersion:3,createdAt:dateNow()});mat={id:Number(id),templateItemId:item.id,name:item.nama_item,cost:Number(item.harga_beli||0),stock:0,unit:item.satuan||'pcs'};materials.push(mat);changed=true}}
    if(Number(mat.cost||0)<=0&&Number(item.harga_beli||0)>0){mat.cost=Number(item.harga_beli);mat.referenceCost=true;await put('materials',mat);changed=true}
    materialMap.set(Number(item.id),Number(mat.id));continue;
   }
   let prod=byTemplate(products,item.id);
   if(!prod){prod=products.find(x=>x.source==='master'&&x.name===item.nama_item&&x.active!==false);if(!prod){const hasRecipe=(master.recipes||[]).some(r=>Number(r.product_template_id)===Number(item.id)&&!isSimpleDrinkProductName(item.nama_item));const id=await add('products',{name:item.nama_item,category:item.kategori||item.kelompok||'',unit:item.satuan||'Pcs',price:Number(item.harga_jual||0),cost:Number(item.harga_beli||0),costMode:hasRecipe?'auto':'manual',stock:0,stockEnabled:!!item.pakai_stok,forSale:true,active:true,source:'master',templateItemId:item.id,referencePrice:true,referenceCost:true,referenceVersion:3,createdAt:dateNow()});prod={id:Number(id),templateItemId:item.id,name:item.nama_item,price:Number(item.harga_jual||0),cost:Number(item.harga_beli||0),costMode:hasRecipe?'auto':'manual',stock:0};products.push(prod);changed=true}}
   // Fill only empty prices/costs. A nonzero user value is never replaced by the master.
   if(Number(prod.price||0)<=0&&Number(item.harga_jual||0)>0){prod.price=Number(item.harga_jual);prod.referencePrice=true;await put('products',prod);changed=true}
   if(Number(prod.cost||0)<=0&&Number(item.harga_beli||0)>0){prod.cost=Number(item.harga_beli);prod.referenceCost=true;prod.costMode=(master.recipes||[]).some(r=>Number(r.product_template_id)===Number(item.id)&&!isSimpleDrinkProductName(item.nama_item))?'auto':'manual';await put('products',prod);changed=true}else if(Number(prod.cost||0)>0&&!prod.costMode){prod.costMode='manual';await put('products',prod);changed=true}
   productMap.set(Number(item.id),Number(prod.id));
  }
  // Add only missing recipe templates. Existing user recipes are left untouched.
  for(const r of (master.recipes||[]).filter(x=>Number(x.paket_id)===pid&&!isSimpleDrinkProductName(master.items.find(i=>Number(i.id)===Number(x.product_template_id))?.nama_item))){
   const productId=productMap.get(Number(r.product_template_id));if(!productId)continue;
   if(recipes.some(x=>Number(x.productId)===productId))continue;
   const lines=(r.lines||[]).map(l=>{const materialId=materialMap.get(Number(l.material_template_id))||Number(byTemplate(materials,l.material_template_id)?.id);const material=materials.find(m=>Number(m.id)===Number(materialId));return {materialId,qty:Number(l.qty||0),unit:material?.unit||l.unit||''}}).filter(l=>l.materialId&&l.qty>0);
   if(lines.length){await add('recipes',{productId,lines,mode:'auto',templateRecipeId:`v3-${r.product_template_id}`,recipeBasis:r.recipe_basis||'unit',targetFinishedGrams:Number(r.target_finished_grams)||0,expectedYieldUnits:Number(r.expected_yield_units)||1,yieldUnit:r.yield_unit||'Pcs',recipeStatus:r.recipe_status||'referensi',formulaVersion:Number(r.formula_version)||1,createdAt:dateNow(),updatedAt:dateNow()});recipes.push({productId,lines});const prod=products.find(x=>Number(x.id)===productId);if(prod&&Number(prod.cost||0)<=0){prod.costMode='auto';await put('products',prod)}changed=true}
  }
  business.masterDataVersion=5;business.packageVersion='3.0';business.masterUpdatedAt=dateNow();changed=true;
 }
 activeBusinessId=originalId;businesses=businesses.map(b=>({...b}));currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
 if(changed)await saveBusinessList();
 if(currentProfile)await recalculateRecipeCosts();
}
function clearStore(store){return request(store,'readwrite',s=>s.clear())}
function del(store,key){return request(store,'readwrite',s=>s.delete(key))}
async function loadMaster(){const r=await fetch('./master.json');if(!r.ok)throw Error('Master Paket Usaha tidak bisa dibaca');return r.json()}
function init(){document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));$('wizardRestart').onclick=restartWizard;$('wizardGoProducts').onclick=()=>showPage('products');$('startSetup').onclick=setupBusiness;$('cancelSetup').onclick=()=>{$('setupCard').hidden=true;selectedPackageId=null;document.querySelectorAll('.business-card').forEach(c=>c.classList.remove('selected'))};$('businessSearch').oninput=renderBusinessCatalog;$('addProduct').onclick=()=>openProduct();$('cancelProduct').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();$('productDialog').close('cancel')});$('productSearch').oninput=renderProducts;$('cashSearch').oninput=renderCashItems;$('checkout').onclick=checkout;$('saveShortageStock').onclick=saveShortageStock;$('cancelShortageStock').onclick=()=>$('stockShortageDialog').close();['taxRate','otherFee','cashReceived'].forEach(id=>$(id).addEventListener('input',()=>updateCheckoutSummary()));$('saveProfile').onclick=saveProfile;$('exitApp').onclick=exitApplication;$('importData').onchange=importBackup;$('importBackupButton').onclick=openBackupPicker;$('resetData').onclick=resetData;$('printReceipt').onclick=()=>{const width=$('receiptPaperWidth')?.value||'58';const content=$('receiptContent');content.classList.remove('paper-58','paper-80','paper-a4');content.classList.add(width==='80'?'paper-80':width==='a4'?'paper-a4':'paper-58');window.print()};$('closeReceipt').onclick=()=>$('receiptDialog').close();$('saveProduct').onclick=saveProduct;$('savePurchase').onclick=savePurchase;$('cancelPurchase').onclick=cancelPurchaseForm;$('purchaseQty').addEventListener('input',updatePurchaseTotal);$('purchaseUnitPrice').addEventListener('input',updatePurchaseTotal);$('purchasePackageContentQty').addEventListener('input',updatePurchaseTotal);$('purchasePackageUnit').addEventListener('input',updatePurchaseTotal);$('purchasePackageMode').addEventListener('change',togglePurchasePackageMode);$('newMaterialUnit').addEventListener('change',updatePurchaseTotal);$('purchaseMaterialSearch').oninput=renderPurchaseMaterialSuggestions;$('purchaseMaterialSearch').onfocus=renderPurchaseMaterialSuggestions;$('purchaseMaterial').onchange=toggleNewMaterialFields;$('purchaseHistoryDate').onchange=renderPurchaseHistory;$('clearPurchaseHistoryDate').onclick=()=>{$('purchaseHistoryDate').value='';renderPurchaseHistory()};if(!$('purchaseDate').value)$('purchaseDate').value=localDateValue();$('saveAsset').onclick=saveAsset;$('saveRecipePage').onclick=saveRecipePage;if($('recipeInstructions')){$('recipeInstructions').addEventListener('input',renderRecipeInstructionPreview);$('recipeInstructions').addEventListener('keydown',e=>{if(e.key!=='Enter'||e.shiftKey||e.ctrlKey||e.altKey||e.metaKey)return;const field=e.currentTarget,start=field.selectionStart,end=field.selectionEnd,before=field.value.slice(0,start),lineCount=before.split(/\r?\n/).length;const nextNumber=lineCount+1;e.preventDefault();const insertion='\n'+nextNumber+'. ';field.setRangeText(insertion,start,end,'end');field.dispatchEvent(new Event('input',{bubbles:true}));});}if($('toggleRecipeInstructions'))$('toggleRecipeInstructions').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const body=$('recipeInstructionsBody'),button=$('toggleRecipeInstructions');if(!body||!button){console.error('Bagian Proses Kerja tidak ditemukan.');return;}const opening=body.hidden;body.hidden=!opening;button.setAttribute('aria-expanded',String(opening));if(opening){renderRecipeInstructionPreview();const copy=button.querySelector('.recipe-process-toggle-copy small');if(copy)copy.textContent='Cara pembuatan ditampilkan di bawah';}else{const copy=button.querySelector('.recipe-process-toggle-copy small');if(copy)copy.textContent='Klik untuk melihat cara pembuatan langkah demi langkah';}});if($('saveExpense'))$('saveExpense').onclick=saveExpense;if($('expenseDate')&&!$('expenseDate').value)$('expenseDate').value=localDateValue();$('materialSearch').oninput=renderMaterials;$('assetSearch').oninput=renderAssets;$('recipeProductSelect').onchange=async()=>{const selected=$('recipeProductSelect').value;if(!selected)return;$('recipeProduct').value=selected;await renderRecipeForm()};$('recipeProduct').addEventListener('input',async()=>{const name=$('recipeProduct').value.trim(),ps=(await getAll('products')).filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false);const match=ps.find(p=>String(p.name).trim().toLocaleLowerCase('id')===name.toLocaleLowerCase('id'));$('recipeProductSelect').value=match?match.name:'';updateRecipeReferenceNote(name)});$('recipeProduct').onchange=async()=>{const name=$('recipeProduct').value.trim(),ps=(await getAll('products')).filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false);if(ps.some(p=>String(p.name).trim().toLocaleLowerCase('id')===name.toLocaleLowerCase('id')))await renderRecipeForm();else renderRecipePreviewLive()}; if($('addRecipeLine'))$('addRecipeLine').onclick=()=>{appendRecipeLine();renderRecipePreviewLive()};if($('recipeSizeMode'))$('recipeSizeMode').onchange=()=>renderRecipeVariantEditor();if($('recipeBasisMode'))$('recipeBasisMode').onchange=changeRecipeBasis;if($('recipeExpectedYield'))$('recipeExpectedYield').oninput=()=>{updateRecipeReferenceNote($('recipeProduct')?.value.trim());renderRecipePreviewLive()};if($('recipeTargetFinishedGrams'))$('recipeTargetFinishedGrams').oninput=()=>renderRecipePreviewLive();$('productDialog').addEventListener('close',()=>{$('productForm').reset()});window.addEventListener('online',networkState);window.addEventListener('offline',networkState);window.addEventListener('pagehide',()=>{if(automaticBackupTimer)clearTimeout(automaticBackupTimer);writeAutomaticBackup().catch(()=>{})});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(automaticBackupTimer)clearTimeout(automaticBackupTimer);writeAutomaticBackup().catch(()=>{})}});const pc=$('packageCount');if(pc){pc.value=String(licenseSlots);pc.addEventListener('change',async()=>{const n=Math.max(1,Math.min(25,Number(pc.value)||1));if(n<businesses.length){toast(`Anda sudah memiliki ${businesses.length} usaha tersimpan. Pilih minimal ${businesses.length} usaha.`);pc.value=String(licenseSlots);return}licenseSlots=n;await saveBusinessList();updatePackagePrice();renderBusinessCatalog();toast('Batas paket diperbarui di perangkat ini. Pembayaran belum diverifikasi.')});updatePackagePrice()}networkState()}
// Harga lisensi: 1 usaha Rp14.999, setiap usaha tambahan Rp15.000.
function priceForBusinessCount(count){const n=Math.max(1,Math.min(25,Math.floor(Number(count)||1)));return 14999+((n-1)*15000)}
function updatePackagePrice(){const n=Math.max(1,Math.min(25,Number($('packageCount')?.value||licenseSlots||1)));const price=priceForBusinessCount(n);if($('packagePrice'))$('packagePrice').textContent='Rp'+price.toLocaleString('id-ID');if($('packageSummary'))$('packageSummary').textContent=`Bisa mengaktifkan hingga ${n} jenis usaha`;if($('packageCount'))$('packageCount').value=String(n)}
function networkState(){$('netState').textContent=navigator.onLine?'Online • data lokal':'Offline • data lokal';$('netState').style.opacity=navigator.onLine?'1':'.85'}
function showPage(p){if(p==='wizard')renderWizard();if(p==='recipes'&&!compositionIsEnabled()){toast('Komposisi Produk disembunyikan untuk jenis usaha ini. Anda dapat mengaktifkannya di Profil & Backup.');p='products'}updateCompositionVisibility();document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('page-'+p).classList.add('active');document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===p));if(p==='home')renderHome();if(p==='products')renderProducts();if(p==='materials'){if(!$('purchaseDate').value)$('purchaseDate').value=localDateValue();initNewMaterialOptions();renderMaterials();}if(p==='recipes')renderRecipePage();if(p==='assets')renderAssets();if(p==='cashier'){renderCashItems();renderCart()}if(p==='reports')renderReports();if(p==='settings')loadProfileForm()}
function wizardStepDefinitions(profile=currentProfile){
 const biz=String(profile?.business||'').toLocaleLowerCase('id');
 const foodTerms=['café','cafe','resto','catering','frozen food','makanan','kue','bakery','warung makan','gorengan','camilan','kopi','minuman','nasi uduk','sarapan','pecel lele','bakso','mi ayam','soto','jajanan','martabak','roti bakar','jus buah','es campur'];
 const productionTerms=['catering','kue','bakery','frozen food','percetakan','fotokopi'];
 const serviceTerms=['laundry','cuci sepatu','salon','jasa','fotokopi','percetakan','servis','service','potong rambut','depot air'];
 const food=foodTerms.some(t=>biz.includes(t));
 const production=productionTerms.some(t=>biz.includes(t));
 const service=serviceTerms.some(t=>biz.includes(t));
 const print=biz.includes('percetakan')||biz.includes('fotokopi');
 const laundry=biz.includes('laundry')||biz.includes('cuci sepatu');
 const salon=biz.includes('salon');
 const depot=biz.includes('depot air');
 const pet=biz.includes('pet shop');
 const clothing=biz.includes('pakaian');
 const phone=biz.includes('konter hp');
 const cosmetics=biz.includes('kosmetik');
 const composition=compositionIsEnabled(profile);
 const guide6 =
  biz.includes('café')||biz.includes('cafe')||biz.includes('resto') ? {title:'Atur menu kafe dan restoran',desc:'Pilih menu makanan/minuman yang benar-benar dijual. Untuk menu racikan, masukkan bahan, jumlah, satuan, dan biaya per porsi pada Komposisi Produk.',target:composition?'recipes':'products',action:composition?'Buka komposisi menu':'Buka menu'} :
  biz.includes('catering') ? {title:'Atur paket katering dan porsi',desc:'Periksa nama paket, jumlah porsi, bahan utama, dan perkiraan biaya per porsi. Gunakan Komposisi Produk untuk paket yang perlu dihitung dari bahan.',target:composition?'recipes':'products',action:composition?'Buka komposisi paket':'Buka paket katering'} :
  biz.includes('depot air') ? {title:'Atur galon, isi ulang, dan antar',desc:'Periksa harga isi ulang, galon baru/tukar, dan biaya antar bila digunakan. Bedakan barang yang stoknya dipantau dari layanan antar.',target:'products',action:'Buka produk & layanan'} :
  biz.includes('frozen food') ? {title:'Atur stok produk beku',desc:'Periksa ukuran kemasan, harga, dan stok tiap produk beku. Simpan stok sesuai jumlah fisik; pisahkan varian atau ukuran yang berbeda.',target:'products',action:'Periksa produk beku'} :
  biz.includes('konter hp') ? {title:'Atur aksesori dan layanan konter',desc:'Periksa aksesori fisik, kartu perdana, pulsa atau jasa jika tersedia. Barang fisik dapat memakai stok; layanan nonfisik tidak perlu stok barang.',target:'products',action:'Buka produk & layanan'} :
  laundry ? {title:'Atur layanan dan satuan laundry',desc:'Periksa layanan cuci kiloan, potong, setrika, atau cuci sepatu. Pastikan satuan dan tarif jelas; bahan seperti deterjen dicatat bila ingin dipantau.',target:'products',action:'Buka layanan laundry'} :
  biz.includes('makanan online') ? {title:'Atur menu untuk pesanan online',desc:'Periksa nama menu, pilihan paket, harga, dan bahan. Gunakan komposisi untuk menu racikan; jangan menyimpan pesanan percobaan sebagai transaksi nyata.',target:composition?'recipes':'products',action:composition?'Buka komposisi menu':'Buka menu'} :
  print ? {title:'Atur layanan cetak dan bahan pendukung',desc:'Periksa layanan fotokopi/cetak, satuan lembar atau ukuran, tarif, serta kertas dan tinta di Bahan & Belanja. Komposisi opsional untuk menghitung biaya per pekerjaan.',target:'materials',action:'Buka bahan cetak'} :
  pet ? {title:'Atur produk hewan dan kemasan',desc:'Periksa pakan, pasir, aksesori, dan produk perawatan. Pastikan ukuran kemasan, satuan, harga, dan stok tiap produk tepat.',target:'products',action:'Buka produk pet shop'} :
  salon ? {title:'Atur layanan salon dan perlengkapan',desc:'Periksa tarif potong, perawatan, atau layanan lain. Catat produk/perlengkapan hanya jika perlu dipantau; layanan tidak perlu stok barang.',target:'products',action:'Buka layanan salon'} :
  cosmetics ? {title:'Atur kategori dan ukuran kosmetik',desc:'Periksa merek/nama produk, ukuran kemasan, harga jual, dan stok. Pisahkan varian yang berbeda agar jumlah stok akurat.',target:'products',action:'Buka katalog kosmetik'} :
  biz.includes('kue')||biz.includes('bakery') ? {title:'Atur resep dan ukuran kue',desc:'Periksa nama kue, ukuran, satuan jual, dan biaya bahan. Untuk kue buatan sendiri, susun komposisi per resep atau per loyang/porsi.',target:composition?'recipes':'products',action:composition?'Buka resep kue':'Buka katalog kue'} :
  clothing ? {title:'Atur ukuran dan varian pakaian',desc:'Periksa nama barang, ukuran/warna, harga, dan jumlah tiap varian. Jangan gabungkan stok ukuran yang berbeda jika jumlahnya tidak sama.',target:'products',action:'Periksa varian pakaian'} :
  biz.includes('retail') ? {title:'Atur kategori barang retail',desc:'Kelompokkan barang, pastikan satuan jual konsisten, lalu periksa harga dan stok fisik setiap barang.',target:'products',action:'Periksa barang retail'} :
  biz.includes('sembako')||biz.includes('grosir') ? {title:'Atur satuan eceran dan grosir',desc:'Periksa satuan seperti pcs, bungkus, kg, dus, atau karung. Pastikan harga jual dan stok sesuai satuan yang dipakai.',target:'products',action:'Periksa barang sembako'} :
  biz.includes('gorengan')||biz.includes('camilan') ? {title:'Atur resep gorengan dan camilan',desc:'Periksa jumlah per buah/porsi dan bahan seperti tepung, minyak, serta bumbu. Gunakan komposisi untuk memperkirakan biaya produksi.',target:composition?'recipes':'products',action:composition?'Buka komposisi camilan':'Buka produk camilan'} :
  biz.includes('kopi')||biz.includes('minuman') ? {title:'Atur resep minuman per gelas',desc:'Periksa ukuran gelas, gula, kopi/teh/susu, es, dan topping. Gunakan satuan yang mudah dihitung seperti gram, ml, atau gelas.',target:composition?'recipes':'products',action:composition?'Buka komposisi minuman':'Buka menu minuman'} :
  biz.includes('nasi uduk')||biz.includes('sarapan') ? {title:'Atur menu sarapan dan lauk',desc:'Periksa menu nasi, lauk, sambal, dan paket sarapan. Jika menghitung biaya per porsi, masukkan bahan dan jumlahnya dalam komposisi.',target:composition?'recipes':'products',action:composition?'Buka komposisi menu':'Buka menu sarapan'} :
  biz.includes('pecel lele') ? {title:'Atur menu pecel lele dan lauk',desc:'Periksa menu ikan/ayam, nasi, lalapan, sambal, dan paket. Gunakan komposisi untuk biaya bahan per porsi jika dibutuhkan.',target:composition?'recipes':'products',action:composition?'Buka komposisi menu':'Buka menu'} :
  biz.includes('bakso')||biz.includes('mi ayam')||biz.includes('mie ayam')||biz.includes('soto') ? {title:'Atur menu mangkuk dan topping',desc:'Periksa ukuran porsi, topping, kuah, mi/bakso, dan tambahan. Komposisi dapat membantu menghitung biaya bahan per mangkuk.',target:composition?'recipes':'products',action:composition?'Buka komposisi menu':'Buka menu'} :
  biz.includes('jajanan jalanan') ? {title:'Atur jajanan dan paket jual',desc:'Periksa varian jajanan, jumlah per porsi, saus/topping, dan harga. Gunakan komposisi untuk jajanan yang diracik sendiri.',target:composition?'recipes':'products',action:composition?'Buka komposisi jajanan':'Buka produk jajanan'} :
  biz.includes('martabak')||biz.includes('roti bakar') ? {title:'Atur topping dan ukuran menu',desc:'Periksa ukuran, rasa, topping, serta harga tiap varian. Untuk produk racikan, susun komposisi bahan per porsi.',target:composition?'recipes':'products',action:composition?'Buka komposisi menu':'Buka menu'} :
  biz.includes('jus buah')||biz.includes('es campur') ? {title:'Atur resep jus dan minuman dingin',desc:'Periksa ukuran gelas, buah, susu/sirup, es, dan topping. Masukkan takaran yang biasa digunakan untuk menghitung biaya per gelas.',target:composition?'recipes':'products',action:composition?'Buka komposisi minuman':'Buka menu minuman'} :
  {title:'Periksa perlengkapan usaha',desc:'Tinjau alat atau perlengkapan yang benar-benar digunakan. Langkah ini opsional dan tidak membuat atau mengubah catatan aset secara otomatis.',target:'assets',action:'Buka investasi & peralatan'};
 const specificStep6 = {...guide6,id:'recipe',optional:true,mandatory:false};
 const materialDesc=food
  ? 'Catat bahan baku yang benar-benar dipakai dan lakukan pembelian melalui menu ini agar stok bertambah. Periksa juga stok awal produk; jangan mengisi jumlah perkiraan.'
  : print
    ? 'Catat kertas, tinta, dan bahan cetak yang digunakan. Masukkan stok yang benar-benar tersedia dan gunakan Pembelian untuk menambah stok setelah belanja.'
    : laundry
      ? 'Catat deterjen dan perlengkapan jika stoknya ingin dipantau. Untuk stok awal, isi hanya jumlah yang benar-benar tersedia.'
      : service
        ? 'Bahan dan perlengkapan bersifat opsional untuk usaha jasa. Isi stok hanya untuk barang yang benar-benar Anda simpan dan pantau.'
        : 'Periksa barang dagangan atau bahan yang dipantau. Catat stok awal sesuai kondisi nyata; pembelian berikutnya dicatat melalui menu Bahan & Belanja.';
 return [
  {id:'profile',title:'Step 1 — Lengkapi profil usaha',desc:'Isi nama toko, alamat, nomor telepon, dan catatan nota. Profil tersimpan untuk usaha ini saja.',target:'settings',action:'Buka profil usaha',mandatory:true},
  {id:'businessSetup',title:'Step 2 — Pahami pengaturan usaha',desc:food?'Pastikan nama usaha dan alur menu sesuai. Usaha kuliner dapat memakai komposisi untuk menghitung biaya bahan per menu.':laundry?'Pastikan layanan, satuan kg/potong, dan tarif mudah dipahami pelanggan.':print?'Tentukan satuan layanan seperti lembar, halaman, ukuran, atau paket cetak.':service?'Pastikan setiap layanan mempunyai nama dan satuan yang jelas; stok hanya dipakai untuk barang yang memang disimpan.':'Tentukan satuan barang yang konsisten, misalnya pcs, botol, kg, atau dus, agar harga dan stok tidak membingungkan.',target:'products',action:'Periksa pengaturan produk',mandatory:true},
  {id:'products',title:'Step 3 — Masukkan produk, menu, atau jasa',desc:food?'Periksa menu/produk awal dan tambah menu yang benar-benar dijual. Nama bawaan boleh diedit sesuai usaha.':laundry?'Periksa layanan cuci, setrika, kiloan, atau cuci sepatu yang benar-benar ditawarkan.':'Periksa daftar produk atau layanan, lalu tambah atau edit sesuai yang benar-benar dijual.',target:'products',action:'Buka produk / jasa',mandatory:true},
  {id:'prices',title:'Step 4 — Atur harga jual dan modal',desc:'Harga dari template hanya referensi. Sesuaikan harga jual dan modal/HPP dengan kondisi nyata sebelum transaksi pertama.',target:'products',action:'Periksa harga',mandatory:true},
  {id:'materials',title:'Step 5 — Siapkan bahan dan stok awal',desc:materialDesc,target:'materials',action:'Buka bahan & belanja',mandatory:!service,optional:service},
  {...specificStep6,title:'Step 6 — '+specificStep6.title,mandatory:false},
  {id:'transaction',title:'Step 7 — Pelajari pembelian dan penjualan',desc:'Pembelian baru dicatat satu kali melalui Simpan Pembelian. Penjualan dicatat melalui kasir. Jangan menyimpan transaksi percobaan sebagai transaksi nyata.',target:'cashier',action:'Buka kasir',mandatory:true},
  {id:'reports',title:'Step 8 — Periksa laporan usaha',desc:'Pelajari laporan penjualan, pembelian, pengeluaran, dan ringkasan usaha. Nilai laporan akan mengikuti transaksi nyata yang tercatat.',target:'reports',action:'Buka laporan',mandatory:true}
 ];
}
function wizardStatus(){if(!currentProfile)return {};const w=currentProfile.setupWizard;return w&&w.completed&&typeof w.completed==='object'?w.completed:{}}
async function saveWizardStatus(stepId,status){const profile=await getCurrentProfile();if(!profile)return;const wizard=profile.setupWizard&&typeof profile.setupWizard==='object'?profile.setupWizard:{completed:{}};wizard.completed={...(wizard.completed||{})};if(status===null)delete wizard.completed[stepId];else wizard.completed[stepId]=status;wizard.updatedAt=dateNow();const steps=wizardStepDefinitions(profile);if(steps.every(s=>wizard.completed[s.id]))wizard.finishedAt=wizard.finishedAt||dateNow();else delete wizard.finishedAt;profile.setupWizard=wizard;const idx=businesses.findIndex(b=>String(b.id)===String(profile.id));if(idx>=0)businesses[idx]=profile;currentProfile=profile;await saveBusinessList();renderWizard();toast(status==='skipped'?'Langkah dilewati. Progres tersimpan tanpa mengubah data usaha.':'Progres panduan tersimpan.');}
function openWizardTarget(target){if(target==='recipes'&&!compositionIsEnabled()){toast('Aktifkan Komposisi Produk terlebih dahulu di Profil & Backup jika usaha Anda membutuhkannya.');showPage('settings');return}showPage(target)}
function renderWizard(){const root=$('wizardSteps');if(!root||!currentProfile)return;const steps=wizardStepDefinitions(currentProfile),status=wizardStatus(),done=steps.filter(s=>!!status[s.id]).length,pct=Math.round(done/Math.max(steps.length,1)*100);$('wizardTitle').textContent='Panduan '+(currentProfile.name||'Usaha Anda');$('wizardIntro').textContent=`Ikuti langkah untuk ${currentProfile.business||'usaha Anda'}. Panduan ini khusus untuk toko ini; progres toko lain terpisah.`;$('wizardProgressText').textContent=`${done} dari ${steps.length} langkah selesai`;$('wizardProgressPct').textContent=pct+'%';$('wizardProgressBar').style.width=pct+'%';$('wizardFinishTitle').textContent=done===steps.length?'Panduan selesai!':'Pemeriksaan akhir';$('wizardFinishText').textContent=done===steps.length?'Anda telah menandai semua langkah. Pastikan data sesuai kondisi nyata sebelum mulai bertransaksi.':'Selesaikan langkah yang diperlukan sesuai kondisi usaha. Anda tetap dapat membuka panduan ini kembali kapan saja.';root.innerHTML=steps.map((s,i)=>{const st=status[s.id],label=st==='done'?'Selesai':st==='skipped'?'Dilewati':`Step ${i+1}`;return `<article class="wizard-step ${st?'wizard-step-done':''}"><div class="wizard-step-number">${st==='done'?'✓':st==='skipped'?'↷':String(i+1).padStart(2,'0')}</div><div class="wizard-step-body"><div class="wizard-step-top"><strong>${esc(s.title)}</strong><span class="wizard-status ${st?'is-done':''}">${label}</span></div><p>${esc(s.desc)}</p>${s.optional?'<small class="wizard-optional">Opsional — dapat dilewati jika tidak sesuai kebutuhan usaha.</small>':''}<div class="buttonrow"><button type="button" data-wizard-open="${s.id}">${esc(s.action)}</button>${st?`<button type="button" data-wizard-state="${s.id}" data-state="reset">Tandai belum selesai</button>`:`<button type="button" class="primary" data-wizard-state="${s.id}" data-state="done">Tandai selesai</button>`}${s.optional&&!st?`<button type="button" data-wizard-state="${s.id}" data-state="skipped">Lewati</button>`:''}</div></div></article>`}).join('');root.querySelectorAll('[data-wizard-open]').forEach(b=>b.onclick=()=>{const step=steps.find(s=>s.id===b.dataset.wizardOpen);if(step)openWizardTarget(step.target)});root.querySelectorAll('[data-wizard-state]').forEach(b=>b.onclick=()=>saveWizardStatus(b.dataset.wizardState,b.dataset.state==='reset'?null:b.dataset.state));}
async function restartWizard(){const profile=await getCurrentProfile();if(!profile)return;if(!confirm('Ulangi panduan dari awal? Hanya tanda progres panduan yang direset. Produk, harga, stok, bahan, komposisi, pembelian, penjualan, dan riwayat tidak diubah.'))return;profile.setupWizard={completed:{},updatedAt:dateNow()};const idx=businesses.findIndex(b=>String(b.id)===String(profile.id));if(idx>=0)businesses[idx]=profile;currentProfile=profile;await saveBusinessList();renderWizard();toast('Progres panduan diulang. Semua data usaha tetap aman.')}

// v3.3.29: keep catering equipment (including Maspion 40 L thermos) in Assets, not stock/cashier.
// v3.3.31: clarify Product/Service vs Composition vs HPP and show per-size estimated HPP in catalog.
// v3.3.32: aggregate stock deductions per product when multiple variants are sold in one checkout.
// v3.3.43: merge missing template ingredients into existing recipes without replacing user quantities.
async function migrateMasterRecipeCompleteness(){
 if(!master||!Array.isArray(businesses))return;
 const originalId=activeBusinessId,originalProfile=currentProfile;
 for(const profile of businesses){
  const pid=Number(profile.packageId||0);if(!pid)continue;
  activeBusinessId=profile.id;currentProfile=profile;
  const templateRecipes=(master.recipes||[]).filter(r=>Number(r.paket_id)===pid&&!isSimpleDrinkProductName(master.items.find(i=>Number(i.id)===Number(r.product_template_id))?.nama_item));
  if(!templateRecipes.length)continue;
  let materials=await getAll('materials'),products=await getAll('products'),recipes=await getAll('recipes');
  const materialMap=new Map();
  const allReferenced=new Set();for(const r of templateRecipes)for(const line of r.lines||[])allReferenced.add(Number(line.material_template_id));
  for(const templateId of allReferenced){
   const item=(master.items||[]).find(i=>Number(i.id)===templateId);if(!item)continue;
   let mat=materials.find(m=>Number(m.templateItemId)===templateId);
   if(!mat)mat=materials.find(m=>m.source==='master'&&String(m.name||'').trim().toLocaleLowerCase('id')===String(item.nama_item||'').trim().toLocaleLowerCase('id')&&m.active!==false);
   if(!mat){const id=await add('materials',{name:item.nama_item,category:item.kategori||'Bahan Baku',unit:item.satuan||'Pcs',cost:Math.max(0,Number(item.harga_beli)||0),stock:0,stockEnabled:true,active:true,source:'master',templateItemId:item.id,referenceCost:true,referenceVersion:4,createdAt:dateNow(),updatedAt:dateNow()});mat={id:Number(id),name:item.nama_item,unit:item.satuan||'Pcs',cost:Math.max(0,Number(item.harga_beli)||0),stock:0,active:true,templateItemId:item.id};materials.push(mat);}
   materialMap.set(templateId,Number(mat.id));
  }
  for(const tr of templateRecipes){
   const templateProductId=Number(tr.product_template_id);
   const productItem=(master.items||[]).find(i=>Number(i.id)===templateProductId&&Number(i.paket_id)===pid);
   if(!productItem)continue;
   let product=products.find(p=>Number(p.templateItemId)===templateProductId);
   if(!product)product=products.find(p=>p.source==='master'&&String(p.name||'').trim().toLocaleLowerCase('id')===String(productItem.nama_item||'').trim().toLocaleLowerCase('id')&&p.active!==false);
   if(!product)continue;
   let recipe=recipes.find(r=>Number(r.productId)===Number(product.id));
   const lines=(tr.lines||[]).map(l=>{const materialId=materialMap.get(Number(l.material_template_id));const material=materials.find(m=>Number(m.id)===Number(materialId));return {materialId,qty:Number(l.qty||0),unit:material?.unit||l.unit||''}}).filter(l=>l.materialId&&l.qty>0);
   if(!lines.length)continue;
   if(!recipe){const rid=await add('recipes',{productId:Number(product.id),lines,mode:'auto',templateRecipeId:`v3-${templateProductId}`,createdAt:dateNow(),updatedAt:dateNow()});recipes.push({id:Number(rid),productId:Number(product.id),lines,templateRecipeId:`v3-${templateProductId}`});if(product.costMode!=='manual'){product.costMode='auto';await put('products',product)}continue;}
   // Untouched templates may be refreshed from master. For user-edited recipes,
   // add only ingredients that are missing; preserve all existing quantities and prices.
   if(String(recipe.templateRecipeId||'').startsWith('v3-')){
    recipe.lines=lines;recipe.recipeBasis=tr.recipe_basis||recipe.recipeBasis||'unit';recipe.targetFinishedGrams=Number(tr.target_finished_grams)||recipe.targetFinishedGrams||0;recipe.expectedYieldUnits=Number(tr.expected_yield_units)||recipe.expectedYieldUnits||1;recipe.yieldUnit=tr.yield_unit||recipe.yieldUnit||'Pcs';recipe.recipeStatus=tr.recipe_status||recipe.recipeStatus||'referensi';recipe.formulaVersion=Number(tr.formula_version)||recipe.formulaVersion||1;recipe.updatedAt=dateNow();await put('recipes',recipe);
    if(product.costMode!=='manual'){product.costMode='auto';await put('products',product)}
   }else{
    const existingLines=Array.isArray(recipe.lines)?recipe.lines:[];
    const existingNames=new Set(existingLines.map(line=>{
     const m=materials.find(x=>Number(x.id)===Number(line.materialId));
     return String(m?.name||'').trim().toLocaleLowerCase('id');
    }).filter(Boolean));
    const existingIds=new Set(existingLines.map(line=>Number(line.materialId)));
    let addedMissing=false;
    for(const line of lines){
     const mat=materials.find(m=>Number(m.id)===Number(line.materialId));
     const nameKey=String(mat?.name||'').trim().toLocaleLowerCase('id');
     if(existingIds.has(Number(line.materialId))||(nameKey&&existingNames.has(nameKey)))continue;
     existingLines.push({...line,unit:mat?.unit||line.unit||''});existingIds.add(Number(line.materialId));if(nameKey)existingNames.add(nameKey);addedMissing=true;
    }
    if(addedMissing){recipe.lines=existingLines;recipe.updatedAt=dateNow();await put('recipes',recipe);}
   }
  }
 }
 activeBusinessId=originalId;businesses=businesses.map(b=>({...b}));currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
 if(currentProfile)await recalculateRecipeCosts();
}

// v3.3.59: Air mineral adalah barang jual kembali, bukan produk resep.
// Bersihkan resep warisan yang keliru tanpa menyentuh stok, pembelian, atau transaksi lama.
async function migrateResaleProductRecipes(){
 if(!master||!Array.isArray(businesses))return;
 const originalId=activeBusinessId,originalProfile=currentProfile;
 const waterTemplateIds=new Set((master.items||[]).filter(i=>[537,966].includes(Number(i.id))||(/^air mineral (600|1500) ml$/i).test(String(i.nama_item||'').trim())).map(i=>Number(i.id)));
 for(const profile of businesses){
  activeBusinessId=profile.id;currentProfile=profile;
  const products=await getAll('products'),recipes=await getAll('recipes');
  for(const product of products){
   const templateId=Number(product.templateItemId||0);
   const isBottledWater=waterTemplateIds.has(templateId)||/^air mineral (600|1500) ml$/i.test(String(product.name||'').trim());
   if(!isBottledWater)continue;
   const attached=recipes.filter(r=>Number(r.productId)===Number(product.id));
   for(const recipe of attached)await del('recipes',recipe.id);
   if(attached.length||product.costMode==='auto'){
    product.costMode='manual';
    if(!(Number(product.cost)>0)){
     const item=(master.items||[]).find(i=>Number(i.id)===templateId);
     if(item)product.cost=Math.max(0,Number(item.harga_beli)||0);
    }
    product.updatedAt=dateNow();await put('products',product);
   }
  }
 }
 activeBusinessId=originalId;businesses=businesses.map(b=>({...b}));currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
}

async function migrateCateringEquipmentToAssets(){
 if(!master||!Array.isArray(businesses))return;
 const equipment=master.items.filter(i=>String(i.nama_item||'').toLowerCase().includes('termos')&&String(i.nama_item||'').toLowerCase().includes('maspion'));
 const originalId=activeBusinessId,originalProfile=currentProfile;
 for(const profile of businesses){
  const pid=Number(profile.packageId||0);const rows=equipment.filter(i=>Number(i.paket_id)===pid);if(!rows.length)continue;
  activeBusinessId=profile.id;currentProfile=profile;
  for(const item of rows){
   let assets=await getAll('assets');let asset=assets.find(a=>Number(a.templateItemId)===Number(item.id))||assets.find(a=>String(a.name||'').trim().toLowerCase()===String(item.nama_item).trim().toLowerCase());
   if(!asset){const id=await add('assets',{name:item.nama_item,category:'Investasi Peralatan',cost:Math.max(0,Number(item.harga_beli)||0),date:'',lifeMonths:0,active:true,source:'master',templateItemId:item.id,referenceCost:true,createdAt:dateNow()});asset={id:Number(id),name:item.nama_item,templateItemId:item.id};}
   else if(asset.category!=='Investasi Peralatan'){asset.category='Investasi Peralatan';await put('assets',asset)}
   // Keep historical rows for backup/audit, but prevent equipment appearing as sale or stock items.
   for(const storeName of ['materials','products']){const all=await getAll(storeName);for(const row of all){const matches=Number(row.templateItemId)===Number(item.id)||String(row.name||'').trim().toLowerCase()===String(item.nama_item).trim().toLowerCase();if(matches&&row.active!==false){row.active=false;row.legacyEquipmentAsset=true;await put(storeName,row)}}}
  }
 }
 activeBusinessId=originalId;currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
}
async function migratePremiumBatchRecipes(){
 if(!master||!Array.isArray(businesses))return;
 const originalId=activeBusinessId,originalProfile=currentProfile;
 for(const business of businesses){
  if(Number(business.packageId)!==25)continue;
  activeBusinessId=business.id;currentProfile=business;
  const products=await getAll('products'),materials=await getAll('materials'),recipes=await getAll('recipes');
  for(const product of products){
   const tid=Number(product.templateItemId||0),yieldUnits=PREMIUM_RECIPE_YIELDS[tid];if(!yieldUnits)continue;
   const recipe=recipes.find(r=>Number(r.productId)===Number(product.id));if(!recipe||recipe.premiumBatchMigrationVersion>=1)continue;
   const masterRecipe=(master.recipes||[]).find(r=>Number(r.paket_id)===25&&Number(r.product_template_id)===tid);
   if(String(recipe.templateRecipeId||'').startsWith('v3-')&&masterRecipe){
    const lines=(masterRecipe.lines||[]).map(line=>{const m=materials.find(x=>Number(x.templateItemId)===Number(line.material_template_id))||materials.find(x=>String(x.name||'').trim().toLocaleLowerCase('id')===String((master.items||[]).find(i=>Number(i.id)===Number(line.material_template_id))?.nama_item||'').trim().toLocaleLowerCase('id'));return m?{materialId:Number(m.id),qty:Number(line.qty||0),unit:line.unit||m.unit||'Pcs'}:null}).filter(Boolean);
    if(lines.length)recipe.lines=lines;
   }else if(recipe.recipeBasis!=='finished_kg'){
    // Preserve a user's edited per-piece formula while converting it to a batch basis.
    recipe.lines=(recipe.lines||[]).map(line=>({...line,qty:Number(line.qty||0)*yieldUnits}));
   }
   recipe.recipeBasis='finished_kg';recipe.targetFinishedGrams=1000;recipe.expectedYieldUnits=yieldUnits;recipe.yieldUnit=product.unit||'Pcs';recipe.recipeStatus=masterRecipe?.recipe_status||'formula_awal_perlu_uji_dapur';recipe.formulaVersion=1;recipe.premiumBatchMigrationVersion=1;recipe.updatedAt=dateNow();await put('recipes',recipe);
  }
 }
 activeBusinessId=originalId;currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
 if(currentProfile)await recalculateRecipeCosts();
}
async function migrateRetailCatalog(){
 if(!master||!Array.isArray(businesses)||!businesses.length)return;
 const originalId=activeBusinessId,originalProfile=currentProfile;
 for(const business of businesses){
  if(Number(business.packageId)!==14||Number(business.retailCatalogVersion||0)>=3)continue;
  activeBusinessId=business.id;currentProfile=business;
  const rows=master.items.filter(i=>Number(i.paket_id)===14&&i.kelompok!=='Operasional'&&i.bisa_dijual);
  let products=await getAll('products');
  for(const item of rows){
   let product=products.find(x=>Number(x.templateItemId)===Number(item.id));
   if(!product)product=products.find(x=>x.source==='master'&&x.name===item.nama_item&&x.active!==false);
   const hasStock=!!item.pakai_stok;
   if(!product){
    const id=await add('products',{name:item.nama_item,category:item.kategori||'Barang retail',unit:item.satuan||'Pcs',price:Number(item.harga_jual||0),cost:Number(item.harga_beli||0),costMode:'manual',stock:0,stockEnabled:hasStock,forSale:true,active:true,source:'master',templateItemId:item.id,referencePrice:true,referenceCost:true,referenceVersion:4,createdAt:dateNow()});
    product={id:Number(id),name:item.nama_item,templateItemId:item.id,source:'master',referencePrice:true,referenceCost:true};products.push(product);
   }else{
    let changed=false;
    if(product.source==='master'&&product.referencePrice){if(product.name!==item.nama_item){product.name=item.nama_item;changed=true}if(product.category!==(item.kategori||'Barang retail')){product.category=item.kategori||'Barang retail';changed=true}if(product.unit!==(item.satuan||'Pcs')){product.unit=item.satuan||'Pcs';changed=true}if(Number(product.price||0)!==Number(item.harga_jual||0)){product.price=Number(item.harga_jual||0);changed=true}}
    if(product.source==='master'&&product.referenceCost&&Number(product.cost||0)!==Number(item.harga_beli||0)){product.cost=Number(item.harga_beli||0);changed=true}
    if(product.source==='master'&&!!product.stockEnabled!==hasStock){product.stockEnabled=hasStock;changed=true}
    if(Number(product.templateItemId||0)!==Number(item.id)){product.templateItemId=item.id;changed=true}
    if(changed){product.referenceVersion=4;product.updatedAt=dateNow();await put('products',product)}
   }
  }
  business.retailCatalogVersion=3;business.retailCatalogUpdatedAt=dateNow();
 }
 activeBusinessId=originalId;businesses=businesses.map(b=>({...b}));currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
 await saveBusinessList();
}
// v3.3.63: add/update bakery master catalog on existing bakery businesses without touching stock or sales history.
async function migrateBakeryCatalog(){
 if(!master||!Array.isArray(businesses))return;
 const originalId=activeBusinessId,originalProfile=currentProfile;
 for(const profile of businesses){
  if(Number(profile.packageId)!==12||Number(profile.bakeryCatalogVersion||0)>=1)continue;
  activeBusinessId=profile.id;currentProfile=profile;
  const templateItems=(master.items||[]).filter(i=>Number(i.paket_id)===12);
  let products=await getAll('products'),materials=await getAll('materials'),assets=await getAll('assets');
  const productMap=new Map(),materialMap=new Map();
  // First map/add ingredients so all recipes can resolve to the same material record.
  for(const item of templateItems){
   if(item.kelompok==='Operasional')continue;
   if(item.kelompok==='Bahan Baku'||!item.bisa_dijual){
    let mat=materials.find(x=>Number(x.templateItemId)===Number(item.id));
    if(!mat)mat=materials.find(x=>String(x.name||'').trim().toLocaleLowerCase('id')===String(item.nama_item||'').trim().toLocaleLowerCase('id')&&x.active!==false);
    if(!mat){const id=await add('materials',{name:item.nama_item,category:item.kategori||'Bahan Baku',unit:item.satuan||'Pcs',cost:Math.max(0,Number(item.harga_beli)||0),stock:0,stockEnabled:true,active:true,source:'master',templateItemId:item.id,referenceCost:true,referenceVersion:4,createdAt:dateNow(),updatedAt:dateNow()});mat={id:Number(id),name:item.nama_item,unit:item.satuan||'Pcs',templateItemId:item.id,stock:0,cost:Number(item.harga_beli)||0,active:true};materials.push(mat);}
    materialMap.set(Number(item.id),Number(mat.id));
   }else if(item.bisa_dijual){
    let prod=products.find(x=>Number(x.templateItemId)===Number(item.id));
    if(!prod)prod=products.find(x=>x.source==='master'&&String(x.name||'').trim().toLocaleLowerCase('id')===String(item.nama_item||'').trim().toLocaleLowerCase('id')&&x.active!==false);
    if(!prod){const id=await add('products',{name:item.nama_item,category:item.kategori||item.kelompok||'',unit:item.satuan||'Pcs',price:Math.max(0,Number(item.harga_jual)||0),cost:Math.max(0,Number(item.harga_beli)||0),costMode:'auto',stock:0,stockEnabled:true,forSale:true,active:true,source:'master',templateItemId:item.id,referencePrice:true,referenceCost:true,referenceVersion:4,createdAt:dateNow(),updatedAt:dateNow()});prod={id:Number(id),name:item.nama_item,templateItemId:item.id,stock:0,cost:Math.max(0,Number(item.harga_beli)||0),costMode:'auto',active:true};products.push(prod);}
    productMap.set(Number(item.id),Number(prod.id));
   }
  }
  // Create recipes for missing products only. Existing recipes are refreshed later by the master recipe migration if they are untouched templates.
  const existingRecipes=await getAll('recipes');
  for(const tr of (master.recipes||[]).filter(r=>Number(r.paket_id)===12)){
   const productId=productMap.get(Number(tr.product_template_id));if(!productId)continue;
   if(existingRecipes.some(r=>Number(r.productId)===productId))continue;
   const lines=(tr.lines||[]).map(line=>({materialId:materialMap.get(Number(line.material_template_id))||Number(materials.find(m=>Number(m.templateItemId)===Number(line.material_template_id))?.id),qty:Number(line.qty||0),unit:line.unit||''})).filter(line=>line.materialId&&line.qty>0);
   if(lines.length){await add('recipes',{productId,lines,mode:'auto',templateRecipeId:`v4-${tr.product_template_id}`,recipeBasis:tr.recipe_basis||'unit',targetFinishedGrams:Number(tr.target_finished_grams)||0,expectedYieldUnits:Number(tr.expected_yield_units)||1,yieldUnit:tr.yield_unit||'Pcs',recipeStatus:tr.recipe_status||'formula_awal_perlu_uji_dapur',formulaVersion:Number(tr.formula_version)||3,createdAt:dateNow(),updatedAt:dateNow()});}
  }
  profile.bakeryCatalogVersion=1;profile.packageVersion='3.3.63';profile.bakeryCatalogUpdatedAt=dateNow();
 }
 activeBusinessId=originalId;businesses=businesses.map(b=>({...b}));currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
 await saveBusinessList();if(currentProfile)await recalculateRecipeCosts();
}

// v3.3.64: keep Bakery products, Bahan/Belanja, and detailed recipes connected by template IDs.
// This migration adds missing catalog rows and recipes, refreshes untouched template formulas,
// and preserves stock, purchase history, sales history, and user-edited recipe quantities.
async function migrateBakeryCompositionSync(){
 if(!master||!Array.isArray(businesses))return;
 const originalId=activeBusinessId,originalProfile=currentProfile;
 for(const profile of businesses){
  if(Number(profile.packageId)!==12||Number(profile.bakeryCompositionSyncVersion||0)>=4)continue;
  activeBusinessId=profile.id;currentProfile=profile;
  const templateItems=(master.items||[]).filter(i=>Number(i.paket_id)===12);
  let products=await getAll('products'),materials=await getAll('materials'),recipes=await getAll('recipes');
  const productMap=new Map(),materialMap=new Map();
  // First, make sure every recipe ingredient has a single corresponding Bahan/Belanja record.
  const recipeMaterialIds=new Set();
  for(const tr of (master.recipes||[]).filter(r=>Number(r.paket_id)===12))for(const line of (tr.lines||[]))recipeMaterialIds.add(Number(line.material_template_id));
  for(const item of templateItems){
   const isMaterial=item.kelompok==='Bahan Baku'||!item.bisa_dijual||recipeMaterialIds.has(Number(item.id));
   if(!isMaterial)continue;
   let mat=materials.find(x=>Number(x.templateItemId)===Number(item.id));
   if(!mat)mat=materials.find(x=>String(x.name||'').trim().toLocaleLowerCase('id')===String(item.nama_item||'').trim().toLocaleLowerCase('id')&&x.active!==false);
   if(!mat){
    const id=await add('materials',{name:item.nama_item,category:item.kategori||'Bahan Baku',unit:item.satuan||'Pcs',cost:Math.max(0,Number(item.harga_beli)||0),stock:0,stockEnabled:true,active:true,source:'master',templateItemId:item.id,referenceCost:true,referenceVersion:4,createdAt:dateNow(),updatedAt:dateNow()});
    mat={id:Number(id),name:item.nama_item,category:item.kategori||'Bahan Baku',unit:item.satuan||'Pcs',cost:Math.max(0,Number(item.harga_beli)||0),stock:0,active:true,source:'master',templateItemId:item.id};materials.push(mat);
   }else{
    let changed=false;
    if(!Number(mat.templateItemId)&&mat.source==='master'){mat.templateItemId=Number(item.id);changed=true;}
    // A reference price may be refreshed only when stock is empty and the user has not customized it.
    if(mat.source==='master'&&mat.referenceCost&&Number(mat.stock||0)<=0){
     const cost=Math.max(0,Number(item.harga_beli)||0);
     if(Number(mat.cost||0)!==cost){mat.cost=cost;changed=true;}
     if(!mat.unit){mat.unit=item.satuan||'Pcs';changed=true;}
    }
    if(changed){mat.updatedAt=dateNow();await put('materials',mat)}
   }
   materialMap.set(Number(item.id),Number(mat.id));
  }
  // Ensure every sellable bakery template is visible in Products & Services; never reset stock or price edits.
  for(const item of templateItems.filter(i=>!!i.bisa_dijual)){
   let prod=products.find(x=>Number(x.templateItemId)===Number(item.id));
   if(!prod)prod=products.find(x=>String(x.name||'').trim().toLocaleLowerCase('id')===String(item.nama_item||'').trim().toLocaleLowerCase('id')&&x.active!==false);
   if(!prod){
    const id=await add('products',{name:item.nama_item,category:item.kategori||'Produk',unit:item.satuan||'Pcs',price:Math.max(0,Number(item.harga_jual)||0),cost:Math.max(0,Number(item.harga_beli)||0),costMode:'auto',stock:0,stockEnabled:!!item.pakai_stok,forSale:true,active:true,source:'master',templateItemId:item.id,referencePrice:true,referenceCost:true,referenceVersion:4,createdAt:dateNow(),updatedAt:dateNow()});
    prod={id:Number(id),name:item.nama_item,category:item.kategori||'Produk',unit:item.satuan||'Pcs',price:Number(item.harga_jual)||0,cost:Number(item.harga_beli)||0,costMode:'auto',stock:0,stockEnabled:!!item.pakai_stok,active:true,source:'master',templateItemId:item.id};products.push(prod);
   }else{
    let changed=false;
    if(!Number(prod.templateItemId)&&prod.source==='master'){prod.templateItemId=Number(item.id);changed=true;}
    if(prod.source==='master'&&prod.referencePrice){
     if(prod.name!==item.nama_item){prod.name=item.nama_item;changed=true;}
     if(prod.category!==(item.kategori||'Produk')){prod.category=item.kategori||'Produk';changed=true;}
     if(prod.unit!==(item.satuan||'Pcs')){prod.unit=item.satuan||'Pcs';changed=true;}
     if(Number(prod.price||0)!==Number(item.harga_jual||0)){prod.price=Number(item.harga_jual)||0;changed=true;}
     if(!!prod.stockEnabled!==!!item.pakai_stok){prod.stockEnabled=!!item.pakai_stok;changed=true;}
    }
    if(changed){prod.updatedAt=dateNow();await put('products',prod)}
   }
   productMap.set(Number(item.id),Number(prod.id));
  }
  // Attach all detailed template formulas to their product, using the exact same material records as purchasing.
  for(const tr of (master.recipes||[]).filter(r=>Number(r.paket_id)===12)){
   const templateProductId=Number(tr.product_template_id),productId=productMap.get(templateProductId);
   if(!productId)continue;
   const product=products.find(p=>Number(p.id)===productId);if(!product)continue;
   const lines=(tr.lines||[]).map(line=>{
    const mid=materialMap.get(Number(line.material_template_id));
    const mat=materials.find(m=>Number(m.id)===Number(mid));
    if(!mat||!(Number(line.qty)>0))return null;
    return {materialId:Number(mat.id),qty:Number(line.qty),unit:line.unit||mat.unit||'Pcs'};
   }).filter(Boolean);
   if(!lines.length)continue;
   let recipe=recipes.find(r=>Number(r.productId)===productId);
   if(!recipe){
    const rid=await add('recipes',{productId,lines,mode:'auto',templateRecipeId:`v4-${templateProductId}`,recipeBasis:tr.recipe_basis||'unit',targetFinishedGrams:Number(tr.target_finished_grams)||0,expectedYieldUnits:Number(tr.expected_yield_units)||1,yieldUnit:tr.yield_unit||product.unit||'Pcs',recipeStatus:tr.recipe_status||'formula_awal_perlu_uji_dapur',formulaVersion:Number(tr.formula_version)||4,createdAt:dateNow(),updatedAt:dateNow()});
    recipe={id:Number(rid),productId,lines,templateRecipeId:`v4-${templateProductId}`};recipes.push(recipe);
   }else if(/^v[34]-/.test(String(recipe.templateRecipeId||''))){
    recipe.lines=lines;recipe.templateRecipeId=`v4-${templateProductId}`;recipe.mode='auto';recipe.recipeBasis=tr.recipe_basis||recipe.recipeBasis||'unit';recipe.targetFinishedGrams=Number(tr.target_finished_grams)||recipe.targetFinishedGrams||0;recipe.expectedYieldUnits=Number(tr.expected_yield_units)||recipe.expectedYieldUnits||1;recipe.yieldUnit=tr.yield_unit||product.unit||'Pcs';recipe.recipeStatus=tr.recipe_status||'formula_awal_perlu_uji_dapur';recipe.formulaVersion=Number(tr.formula_version)||4;recipe.updatedAt=dateNow();await put('recipes',recipe);
   }else{
    // For user-edited recipes, preserve existing quantities and append only ingredients that are missing.
    const oldLines=Array.isArray(recipe.lines)?recipe.lines:[];
    const existingIds=new Set(oldLines.map(l=>Number(l.materialId)));
    const existingNames=new Set(oldLines.map(l=>String(materials.find(m=>Number(m.id)===Number(l.materialId))?.name||'').trim().toLocaleLowerCase('id')).filter(Boolean));
    let changed=false;
    for(const line of lines){const mat=materials.find(m=>Number(m.id)===Number(line.materialId));const key=String(mat?.name||'').trim().toLocaleLowerCase('id');if(existingIds.has(Number(line.materialId))||(key&&existingNames.has(key)))continue;oldLines.push({...line});existingIds.add(Number(line.materialId));if(key)existingNames.add(key);changed=true;}
    if(changed){recipe.lines=oldLines;recipe.updatedAt=dateNow();await put('recipes',recipe)}
   }
   // Auto HPP applies to untouched master formulas; respect an explicitly selected manual HPP.
   if(product.source==='master'&&product.costMode!=='manual'){product.costMode='auto';await put('products',product)}
  }
  profile.bakeryCompositionSyncVersion=4;profile.bakeryCompositionSyncUpdatedAt=dateNow();profile.packageVersion='3.3.64';
 }
 activeBusinessId=originalId;businesses=businesses.map(b=>({...b}));currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
 await saveBusinessList();if(currentProfile)await recalculateRecipeCosts();
}

async function migrateWarungMakanPecelLeleCatalog(){
 if(!master||!Array.isArray(businesses))return;
 const originalId=activeBusinessId,originalProfile=currentProfile;
 const pid=20,templateItems=(master.items||[]).filter(i=>Number(i.paket_id)===pid);
 for(const profile of businesses){
  if(Number(profile.packageId)!==pid||Number(profile.warungMakanPecelLeleCatalogVersion||0)>=1)continue;
  activeBusinessId=profile.id;currentProfile=profile;
  let products=await getAll('products'),materials=await getAll('materials'),recipes=await getAll('recipes');
  const productMap=new Map(),materialMap=new Map();
  for(const item of templateItems){
   if(item.kelompok==='Bahan Baku'||!item.bisa_dijual){
    let mat=materials.find(m=>Number(m.templateItemId)===Number(item.id));
    if(!mat)mat=materials.find(m=>m.active!==false&&String(m.name||'').trim().toLocaleLowerCase('id')===String(item.nama_item||'').trim().toLocaleLowerCase('id'));
    if(!mat){const id=await add('materials',{name:item.nama_item,category:item.kategori||'Bahan Baku',unit:item.satuan||'Pcs',cost:Math.max(0,Number(item.harga_beli)||0),stock:0,stockEnabled:true,active:true,source:'master',templateItemId:item.id,referenceCost:false,referenceVersion:4,createdAt:dateNow(),updatedAt:dateNow()});mat={id:Number(id),name:item.nama_item,unit:item.satuan||'Pcs',cost:0,stock:0,active:true,source:'master',templateItemId:item.id};materials.push(mat)}
    materialMap.set(Number(item.id),Number(mat.id));
    continue;
   }
   if(!item.bisa_dijual)continue;
   let product=products.find(p=>Number(p.templateItemId)===Number(item.id));
   if(!product)product=products.find(p=>p.active!==false&&p.forSale!==false&&String(p.name||'').trim().toLocaleLowerCase('id')===String(item.nama_item||'').trim().toLocaleLowerCase('id'));
   if(!product){const hasRecipe=(master.recipes||[]).some(r=>Number(r.paket_id)===pid&&Number(r.product_template_id)===Number(item.id));const id=await add('products',{name:item.nama_item,category:item.kategori||'Produk',unit:item.satuan||'Pcs',price:Math.max(0,Number(item.harga_jual)||0),cost:Math.max(0,Number(item.harga_beli)||0),costMode:hasRecipe?'auto':'manual',stock:0,stockEnabled:!!item.pakai_stok,forSale:true,active:true,source:'master',templateItemId:item.id,referencePrice:false,referenceCost:false,referenceVersion:4,createdAt:dateNow(),updatedAt:dateNow()});product={id:Number(id),name:item.nama_item,unit:item.satuan||'Pcs',costMode:hasRecipe?'auto':'manual',source:'master',templateItemId:item.id};products.push(product)}
   productMap.set(Number(item.id),Number(product.id));
  }
  for(const tr of (master.recipes||[]).filter(r=>Number(r.paket_id)===pid)){
   const templateProductId=Number(tr.product_template_id),productId=productMap.get(templateProductId);
   if(!productId)continue;
   const product=products.find(p=>Number(p.id)===productId);
   if(isSimpleDrinkProductName(product?.name))continue;
   const lines=(tr.lines||[]).map(l=>{const materialId=materialMap.get(Number(l.material_template_id));const material=materials.find(m=>Number(m.id)===Number(materialId));return {materialId,qty:Number(l.qty||0),unit:material?.unit||l.unit||''}}).filter(l=>l.materialId&&l.qty>0);
   if(!lines.length)continue;
   let recipe=recipes.find(r=>Number(r.productId)===productId);
   if(!recipe){const id=await add('recipes',{productId,lines,mode:'auto',templateRecipeId:`v4-${templateProductId}`,recipeBasis:tr.recipe_basis||'unit',targetFinishedGrams:Number(tr.target_finished_grams)||0,expectedYieldUnits:Number(tr.expected_yield_units)||1,yieldUnit:tr.yield_unit||product?.unit||'Pcs',recipeStatus:tr.recipe_status||'referensi',formulaVersion:Number(tr.formula_version)||1,createdAt:dateNow(),updatedAt:dateNow()});recipes.push({id:Number(id),productId,lines,templateRecipeId:`v4-${templateProductId}`,recipeStatus:tr.recipe_status||'referensi'});continue}
   const untouched=String(recipe.templateRecipeId||'').match(/^v[34]-/)&&(!recipe.recipeStatus||recipe.recipeStatus==='referensi');
   if(untouched){recipe.lines=lines;recipe.mode='auto';recipe.templateRecipeId=`v4-${templateProductId}`;recipe.recipeBasis=tr.recipe_basis||recipe.recipeBasis||'unit';recipe.expectedYieldUnits=Number(tr.expected_yield_units)||recipe.expectedYieldUnits||1;recipe.yieldUnit=tr.yield_unit||recipe.yieldUnit||product?.unit||'Pcs';recipe.recipeStatus=tr.recipe_status||'referensi';recipe.formulaVersion=Number(tr.formula_version)||1;recipe.updatedAt=dateNow();await put('recipes',recipe);if(product.costMode!=='manual'){product.costMode='auto';await put('products',product)}}
  }
  profile.warungMakanPecelLeleCatalogVersion=1;profile.warungMakanPecelLeleCatalogUpdatedAt=dateNow();
 }
 activeBusinessId=originalId;businesses=businesses.map(b=>({...b}));currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
 await saveBusinessList();if(currentProfile)await recalculateRecipeCosts();
}

async function migrateWarungKopiCatalog(){
 if(!master||!Array.isArray(businesses))return;
 const originalId=activeBusinessId,originalProfile=currentProfile;
 const pkgItems=master.items.filter(i=>Number(i.paket_id)===18);
 for(const profile of businesses){
  if(Number(profile.packageId)!==18||Number(profile.warungKopiCatalogVersion||0)>=2)continue;
  activeBusinessId=profile.id;currentProfile=profile;
  let products=await getAll('products'),materials=await getAll('materials'),recipes=await getAll('recipes');
  for(const item of pkgItems){
   if(item.kelompok==='Bahan Baku'){
    let m=materials.find(x=>Number(x.templateItemId)===Number(item.id));
    if(m&&m.source==='master'&&m.referenceCost&&Number(m.stock||0)<=0){m.name=item.nama_item;m.unit=item.satuan||m.unit;m.cost=Math.max(0,Number(item.harga_beli)||0);m.category=item.kategori||m.category;m.updatedAt=dateNow();await put('materials',m)}
    continue;
   }
   if(!item.bisa_dijual)continue;
   let prod=products.find(x=>Number(x.templateItemId)===Number(item.id));
   if(!prod)prod=products.find(x=>x.source==='master'&&String(x.name||'').trim().toLocaleLowerCase('id')===String(item.nama_item||'').trim().toLocaleLowerCase('id')&&x.active!==false);
   if(prod&&prod.source==='master'&&prod.referencePrice){prod.name=item.nama_item;prod.category=item.kategori||prod.category;prod.unit=item.satuan||prod.unit;prod.price=Number(item.harga_jual)||0;prod.stockEnabled=!!item.pakai_stok;prod.templateItemId=item.id;if(!master.recipes.some(r=>Number(r.paket_id)===18&&Number(r.product_template_id)===Number(item.id))){prod.costMode='manual';prod.cost=Number(item.harga_beli)||0;}prod.updatedAt=dateNow();await put('products',prod)}
  }
  // Remove the old erroneous Air Mineral recipe from this template only; bottled water is a stocked resale item.
  const water=products.find(p=>Number(p.templateItemId)===537);
  if(water){for(const r of recipes){if(Number(r.productId)===Number(water.id)&&String(r.templateRecipeId||'').startsWith('v3-'))await del('recipes',r.id)}if(water.costMode==='auto'){water.costMode='manual';water.cost=2600;await put('products',water)}}
  profile.warungKopiCatalogVersion=2;profile.warungKopiCatalogUpdatedAt=dateNow();
 }
 activeBusinessId=originalId;businesses=businesses.map(b=>({...b}));currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;await saveBusinessList();
 if(currentProfile)await recalculateRecipeCosts();
}
async function migrateDuplicateSaleInventory(){
 // Satu barang yang dibeli untuk dijual kembali harus memakai record produk yang sama.
 // Pindahkan stok dari duplikat material ke produk jual satu kali, tanpa menghapus riwayat pembelian.
 const originalBusinessId=activeBusinessId;
 for(const business of businesses){
  activeBusinessId=business.id;
  const materials=await getAll('materials'),products=await getAll('products');
  for(const material of materials){
   if(material.active===false||material.linkedProductId)continue;
   const product=products.find(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false&&p.stockEnabled&&normItemName(p.name)===normItemName(material.name));
   if(!product)continue;
   const materialStock=Math.max(0,Number(material.stock)||0),productStock=Math.max(0,Number(product.stock)||0);
   if(materialStock>0){
    const materialCost=Math.max(0,Number(material.cost)||0),productCost=Math.max(0,Number(product.cost)||0),combined=materialStock+productStock;
    product.cost=combined>0?((materialStock*materialCost)+(productStock*productCost))/combined:productCost;
    product.stock=combined;product.stockEnabled=true;product.updatedAt=dateNow();
    await put('products',product);
   }
   // Record material lama tetap disimpan untuk referensi dan relasi riwayat, tetapi tidak lagi menjadi stok aktif.
   material.linkedProductId=Number(product.id);material.stock=0;material.active=false;material.updatedAt=dateNow();
   await put('materials',material);
  }
 }
 activeBusinessId=originalBusinessId;currentProfile=await getCurrentProfile();
}
function materialNameKey(value){return String(value||'').trim().toLocaleLowerCase('id').replace(/\s+/g,' ')}
function productIdsWithRecipes(recipes=[]){return new Set((recipes||[]).filter(r=>Number(r.productId)>0&&Array.isArray(r.lines)&&r.lines.length>0).map(r=>Number(r.productId)))}
function isRecipeMadeProduct(product,recipeProductIds){return !!product&&recipeProductIds.has(Number(product.id))}
function dedupeSameStockRows(rows,kindKey='kind'){
 // Jangan tampilkan dua pilihan stok untuk nama bahan/barang yang sama jika satuannya kompatibel.
 // Urutan masukan menentukan record utama: daftar bahan lebih dulu pada usaha produksi,
 // sedangkan daftar produk lebih dulu pada usaha retail. Record berbeda satuan dimensi
 // (mis. kg vs butir) tidak digabung otomatis karena bisa merupakan barang yang berbeda.
 const out=[];
 for(const row of rows){
  const nameKey=materialNameKey(row.name);
  if(!nameKey)continue;
  const duplicate=out.some(prior=>materialNameKey(prior.name)===nameKey&&convertQty(1,row.unit||'Pcs',prior.unit||'Pcs')!==null);
  if(duplicate)continue;
  out.push(row);
 }
 return out;
}
function collapseRecipeLines(lines){
 const output=[];
 for(const raw of (Array.isArray(lines)?lines:[])){
  const line={...raw,materialId:Number(raw.materialId),qty:Number(raw.qty||0),unit:String(raw.unit||'Pcs').trim()||'Pcs'};
  if(!line.materialId||!(line.qty>0)||!Number.isFinite(line.qty)){output.push(line);continue}
  let merged=false;
  for(const prior of output){
   if(Number(prior.materialId)!==line.materialId)continue;
   const converted=convertQty(line.qty,line.unit,prior.unit||line.unit);
   if(converted===null)continue;
   const aHas=prior.unitPrice!==undefined&&prior.unitPrice!==null&&Number.isFinite(Number(prior.unitPrice));
   const bHas=line.unitPrice!==undefined&&line.unitPrice!==null&&Number.isFinite(Number(line.unitPrice));
   if(aHas!==bHas)continue;
   const priorQty=Number(prior.qty)||0;
   if(aHas&&bHas){const priorCost=priorQty*Number(prior.unitPrice),lineCost=line.qty*Number(line.unitPrice);prior.qty=priorQty+converted;prior.unitPrice=(priorCost+lineCost)/Math.max(0.000000001,prior.qty)}
   else prior.qty=priorQty+converted;
   merged=true;break;
  }
  if(!merged)output.push(line);
 }
 return output;
}
async function migrateDuplicateMaterialsAndRecipeLines(){
 const originalId=activeBusinessId,originalProfile=currentProfile;let mergedMaterials=0,collapsedLines=0;
 for(const business of businesses){
  activeBusinessId=business.id;currentProfile=business;
  const allBusinessMaterials=await getAll('materials');
  // Paket Gorengan & Camilan previously used a broad label that overlapped with the separate Garam item.
  if(Number(business.packageId)===17){for(const material of allBusinessMaterials){if(Number(material.templateItemId)===530&&String(material.name||'').trim()==='Bumbu & Garam'){material.name='Bumbu Racik (opsional)';material.category='Bumbu dan bahan tambahan';material.updatedAt=dateNow();await put('materials',material)}}}
  const materials=allBusinessMaterials.filter(m=>m.active!==false);
  const recipes=await getAll('recipes');
  const usage=new Map();for(const r of recipes)for(const line of r.lines||[])usage.set(Number(line.materialId),(usage.get(Number(line.materialId))||0)+1);
  const groups=new Map();
  for(const m of materials){const key=materialNameKey(m.name);if(!key)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m)}
  const redirects=new Map();
  for(const [key,rows] of groups){
   if(rows.length<2)continue;
   rows.sort((a,b)=>Number(!!(b.source==='master'&&b.templateItemId))-Number(!!(a.source==='master'&&a.templateItemId))||(usage.get(Number(b.id))||0)-(usage.get(Number(a.id))||0)||Number(a.id)-Number(b.id));
   const canonicals=[];
   for(const row of rows){
    let target=canonicals.find(c=>convertQty(1,row.unit||'Pcs',c.unit||'Pcs')!==null);
    if(!target){canonicals.push(row);continue;}
    const convertedStock=convertQty(Number(row.stock||0),row.unit||'Pcs',target.unit||'Pcs');
    if(convertedStock===null)continue;
    const oldStock=Math.max(0,Number(target.stock)||0),newStock=Math.max(0,convertedStock),targetCost=Math.max(0,Number(target.cost)||0);
    const rowToTarget=convertQty(1,target.unit||'Pcs',row.unit||'Pcs');
    const rowCost=rowToTarget===null?0:Math.max(0,Number(row.cost)||0)*rowToTarget;
    if(oldStock+newStock>0){if(newStock>0&&rowCost>0)target.cost=(oldStock*targetCost+newStock*rowCost)/(oldStock+newStock);else if(!(targetCost>0)&&rowCost>0)target.cost=rowCost}
    else if(!(targetCost>0)&&rowCost>0)target.cost=rowCost;
    target.stock=oldStock+newStock;target.updatedAt=dateNow();await put('materials',target);
    row.stock=0;row.active=false;row.mergedIntoMaterialId=Number(target.id);row.updatedAt=dateNow();await put('materials',row);
    redirects.set(Number(row.id),Number(target.id));mergedMaterials++;
   }
  }
  for(const recipe of recipes){
   let touched=false;
   const redirected=(recipe.lines||[]).map(line=>{const next=redirects.get(Number(line.materialId));if(next){touched=true;return {...line,materialId:next}}return line});
   const collapsed=collapseRecipeLines(redirected);if(collapsed.length!==redirected.length){touched=true;collapsedLines+=redirected.length-collapsed.length}
   if(touched){recipe.lines=collapsed;recipe.updatedAt=dateNow();await put('recipes',recipe)}
  }
 }
 activeBusinessId=originalId;currentProfile=businesses.find(b=>String(b.id)===String(originalId))||originalProfile;
 if(mergedMaterials||collapsedLines){console.info(`[3.3.70] Perapian duplikasi: ${mergedMaterials} bahan digabung, ${collapsedLines} baris komposisi dirapikan.`);if(currentProfile)await recalculateRecipeCosts()}
}
async function boot(){try{db=await openDB();master=await loadMaster();await migrateMultiBusiness();await migrateMasterV3();await migrateBakeryCatalog();await migrateBakeryCompositionSync();await migrateWarungKopiCatalog();await migrateWarungMakanPecelLeleCatalog();await migrateRetailCatalog();await migrateDuplicateSaleInventory();await migratePremiumBatchRecipes();await migrateMasterRecipeCompleteness();await migrateResaleProductRecipes();await migrateCateringEquipmentToAssets();await migrateDuplicateMaterialsAndRecipeLines();await ensureTransactionNumbering();renderBusinessCatalog();$('nav').hidden=!currentProfile;if(currentProfile){$('shopTitle').textContent=currentProfile.name;$('headerSubtitle').textContent=currentProfile.business+' • data lokal';showPage(currentProfile.setupWizard&&currentProfile.setupWizard.finishedAt?'home':'wizard')}else{$('shopTitle').textContent='Pilih Jenis Usaha';$('headerSubtitle').textContent='Satu aplikasi untuk beberapa usaha';showPage('home')}}catch(e){console.error(e);alert('Aplikasi belum siap. Buka melalui alamat HTTPS dan muat ulang saat online. Detail: '+e.message)}}
function businessIcon(name){const n=(name||'').toLowerCase();if(n.includes('gorengan')||n.includes('camilan'))return ['🍘','amber'];if(n.includes('kopi')||n.includes('minuman'))return ['☕','amber'];if(n.includes('nasi uduk')||n.includes('sarapan'))return ['🍳','orange'];if(n.includes('pecel lele')||n.includes('warung makan'))return ['🍛','orange'];if(n.includes('bakso')||n.includes('mi ayam')||n.includes('soto'))return ['🍜','orange'];if(n.includes('jajanan jalanan'))return ['🍢','rose'];if(n.includes('martabak')||n.includes('roti bakar'))return ['🥞','amber'];if(n.includes('jus buah')||n.includes('es campur'))return ['🧃','green'];if(n.includes('café')||n.includes('cafe')||n.includes('resto'))return ['☕','amber'];if(n.includes('catering'))return ['🍱','orange'];if(n.includes('depot air'))return ['💧','blue'];if(n.includes('frozen'))return ['❄️','cyan'];if(n.includes('konter hp'))return ['📱','violet'];if(n.includes('laundry'))return ['🧺','blue'];if(n.includes('makanan online'))return ['🍜','orange'];if(n.includes('percetakan')||n.includes('fotokopi'))return ['🖨️','slate'];if(n.includes('pet shop'))return ['🐾','green'];if(n.includes('salon'))return ['✂️','rose'];if(n.includes('kosmetik'))return ['💄','rose'];if(n.includes('kue')||n.includes('bakery'))return ['🧁','amber'];if(n.includes('pakaian'))return ['👕','violet'];if(n.includes('retail'))return ['🛍️','green'];if(n.includes('sembako')||n.includes('grosir'))return ['🛒','green'];if(n.includes('warung makan'))return ['🍛','orange'];return ['🏪','slate']}
function renderBusinessCatalog(){if(!master)return;const term=($('businessSearch')?.value||'').trim().toLowerCase();const packs=master.packages.filter(p=>p.nama_usaha.toLowerCase().includes(term)||p.deskripsi.toLowerCase().includes(term));$('businessCount').textContent=`${packs.length} paket`;const root=$('businessCatalog');root.innerHTML=packs.length?packs.map(p=>{const [ico,tone]=businessIcon(p.nama_usaha);const active=businesses.find(b=>Number(b.packageId)===Number(p.id));const locked=!active&&businesses.length>=licenseSlots;return `<button type="button" class="business-card ${active?'current-package':''}" data-package="${p.id}"><span class="business-icon ${tone}">${ico}</span><span class="business-copy"><strong>${esc(p.nama_usaha)}</strong><small>${esc(shortBusinessDescription(p.nama_usaha))}${active?' • sudah dibuat':locked?' • 🔒 batas paket tercapai':''}</small></span><span class="business-arrow">${active?'✓':locked?'🔒':'›'}</span></button>`}).join(''):'<div class="empty">Jenis usaha tidak ditemukan. Coba kata kunci lain.</div>';root.querySelectorAll('[data-package]').forEach(b=>b.onclick=()=>selectBusinessPackage(Number(b.dataset.package)));renderExistingBusiness(currentProfile)}
function renderExistingBusiness(p){const root=$('existingBusiness');if(!businesses.length){root.hidden=true;return}root.hidden=false;root.innerHTML=`<div class="business-manager"><div class="business-manager-head"><div><small>USAHA TERSIMPAN</small><strong>${businesses.length} dari ${licenseSlots} usaha digunakan</strong></div><label class="license-select">Paket lisensi<select id="licenseSlotsSelect">${Array.from({length:25},(_,i)=>i+1).map(n=>`<option value="${n}" ${licenseSlots===n?'selected':''}>${n} usaha • Rp${priceForBusinessCount(n).toLocaleString('id-ID')}</option>`).join('')}</select></label></div><div class="business-switcher">${businesses.map(b=>`<div class="business-switch-row"><button type="button" class="business-switch ${String(b.id)===String(activeBusinessId)?'active':''}" data-switch-business="${esc(b.id)}"><strong>${esc(b.name)}</strong><small>${esc(b.business)}</small></button><span>${String(b.id)===String(activeBusinessId)?'Aktif':'Tersimpan'}</span></div>`).join('')}</div><button type="button" class="primary" id="enterExisting">Masuk ke usaha aktif</button><p class="muted">Data usaha tersimpan terpisah. Usaha yang dikunci tidak dihapus.</p></div>`;$('enterExisting').onclick=()=>enterBusiness();root.querySelectorAll('[data-switch-business]').forEach(b=>b.onclick=async()=>{activeBusinessId=b.dataset.switchBusiness;currentProfile=await getCurrentProfile();cart=[];renderCart();await saveBusinessList();renderBusinessCatalog();$('shopTitle').textContent=currentProfile.name;$('headerSubtitle').textContent=currentProfile.business+' • data lokal';toast('Usaha aktif diganti.');showPage(currentProfile&&!(currentProfile.setupWizard&&currentProfile.setupWizard.finishedAt)?'wizard':'products')});$('licenseSlotsSelect').onchange=async e=>{const n=Number(e.target.value);if(n<businesses.length){toast(`Paket tidak bisa diturunkan: masih ada ${businesses.length} usaha tersimpan. Kunci atau ekspor usaha terlebih dahulu.`);e.target.value=String(licenseSlots);return}licenseSlots=n;if($('packageCount'))$('packageCount').value=String(n);updatePackagePrice();await saveBusinessList();renderBusinessCatalog();toast('Batas paket diperbarui di perangkat ini. Pembayaran belum diverifikasi.')}}
function selectBusinessPackage(pid){selectedPackageId=pid;const pack=master.packages.find(p=>Number(p.id)===pid);if(!pack)return;const existing=businesses.find(b=>Number(b.packageId)===pid);if(existing){activeBusinessId=existing.id;getCurrentProfile().then(p=>{currentProfile=p;saveBusinessList();renderBusinessCatalog();enterBusiness()});return}if(businesses.length>=licenseSlots){toast(`Paket lisensi Anda mengizinkan ${licenseSlots} usaha. Usaha tambahan terkunci; tingkatkan paket untuk membuka lebih banyak.`);return}document.querySelectorAll('.business-card').forEach(c=>c.classList.toggle('selected',Number(c.dataset.package)===pid));$('setupCard').hidden=false;$('setupTitle').textContent='Siapkan '+pack.nama_usaha;$('setupDescription').textContent=`Paket ${pack.nama_usaha} menyalin katalog lengkap, harga referensi, bahan, peralatan, dan komposisi yang tersedia. Stok awal tetap 0 dan harga dapat Anda edit.`;$('setupShop').value='';$('setupCard').scrollIntoView({behavior:'smooth',block:'start'});$('setupShop').focus()}
async function setupBusiness(){
 const pid=Number(selectedPackageId),name=$('setupShop').value.trim();
 if(!pid||!name){toast('Pilih jenis usaha dan isi nama usaha.');return}
 if(businesses.length>=licenseSlots){toast(`Paket hanya mengizinkan ${licenseSlots} usaha.`);return}
 const pack=master.packages.find(p=>Number(p.id)===pid);
 if(!pack){toast('Template usaha tidak ditemukan di Master.');return}
 if(businesses.some(b=>Number(b.packageId)===pid)){toast('Template usaha ini sudah dibuat. Pilih usaha tersimpan untuk membukanya.');return}
 const templateItems=master.items.filter(i=>Number(i.paket_id)===pid);
 if(!templateItems.length){toast('Template ini belum memiliki item awal. Data usaha tidak dibuat agar tidak kosong tanpa sengaja.');return}
 const id='biz-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 const profile={id,key:'profile-'+id,name,business:pack.nama_usaha,packageId:pid,packageVersion:'3.1.3',masterDataVersion:3,compositionMode:'auto',transactionPrefix:makeTransactionPrefix(name),nextTransactionNumber:1,address:'',phone:'',footer:'Terima kasih atas kunjungan Anda.',createdAt:dateNow()};
 const tx=db.transaction(['settings','products','materials','assets','recipes'],'readwrite');
 const settings=tx.objectStore('settings'),next=[...businesses,profile];
 settings.put({key:'businesses',value:next});settings.put({key:'activeBusinessId',value:id});settings.put({key:'licenseSlots',value:licenseSlots});
 const productStore=tx.objectStore('products'),materialStore=tx.objectStore('materials'),assetStore=tx.objectStore('assets'),recipeStore=tx.objectStore('recipes');
 const productIds=new Map(),materialIds=new Map();let pending=templateItems.length,failed=false;
 const finishItem=()=>{pending--;if(pending!==0||failed)return;try{
   (master.recipes||[]).filter(r=>Number(r.paket_id)===pid&&!isSimpleDrinkProductName(master.items.find(i=>Number(i.id)===Number(r.product_template_id))?.nama_item)).forEach(r=>{
     const productId=productIds.get(Number(r.product_template_id));if(!productId)return;
     const lines=(r.lines||[]).map(line=>({materialId:materialIds.get(Number(line.material_template_id)),qty:Number(line.qty||0),unit:line.unit||''})).filter(line=>line.materialId&&line.qty>0);
     if(lines.length)recipeStore.add({businessId:id,productId,lines,mode:'auto',templateRecipeId:`v${master.schema_version||3}-${r.product_template_id}`,recipeBasis:r.recipe_basis||'unit',targetFinishedGrams:Number(r.target_finished_grams)||0,expectedYieldUnits:Number(r.expected_yield_units)||1,yieldUnit:r.yield_unit||'Pcs',recipeStatus:r.recipe_status||'referensi',formulaVersion:Number(r.formula_version)||1,createdAt:dateNow(),updatedAt:dateNow()});
   });
 }catch(e){failed=true;console.error(e);tx.abort()}};
 templateItems.forEach(i=>{
   const base={businessId:id,name:i.nama_item,category:i.kategori||i.kelompok||'',unit:i.satuan||'Pcs',stock:0,active:true,source:'master',templateItemId:i.id??null,referencePrice:true,referenceVersion:master.schema_version||3,createdAt:dateNow()};
   let req;
   if(i.kelompok==='Operasional'||String(i.tipe_asli||'').toLowerCase().includes('aset_internal')||String(i.tipe_asli||'').toLowerCase().includes('alat (aset')){
     req=assetStore.add({...base,category:i.kategori||'Peralatan',cost:Math.max(0,Number(i.harga_beli)||0),date:'',lifeMonths:0,referenceCost:true});
   }else if(i.kelompok==='Bahan Baku'||!i.bisa_dijual){
     req=materialStore.add({...base,cost:Math.max(0,Number(i.harga_beli)||0),stock:0,stockEnabled:true,active:true,referenceCost:true});
     req.onsuccess=()=>{materialIds.set(Number(i.id),Number(req.result));finishItem()};
     req.onerror=()=>{failed=true;};return;
   }else{
     const hasRecipeTemplate=(master.recipes||[]).some(r=>Number(r.product_template_id)===Number(i.id)&&!isSimpleDrinkProductName(i.nama_item));req=productStore.add({...base,price:Math.max(0,Number(i.harga_jual)||0),cost:Math.max(0,Number(i.harga_beli)||0),costMode:hasRecipeTemplate?'auto':'manual',stock:0,stockEnabled:!!i.pakai_stok,forSale:true,referenceCost:true});
     req.onsuccess=()=>{productIds.set(Number(i.id),Number(req.result));finishItem()};
     req.onerror=()=>{failed=true;};return;
   }
   req.onsuccess=()=>finishItem();req.onerror=()=>{failed=true;};
 });
 tx.oncomplete=async()=>{businesses=next;activeBusinessId=id;currentProfile=profile;$('setupCard').hidden=true;$('nav').hidden=false;$('shopTitle').textContent=profile.name;$('headerSubtitle').textContent=profile.business+' • data lokal';renderExistingBusiness(profile);renderBusinessCatalog();await recalculateRecipeCosts();await renderMaterials();await renderProducts();toast('Usaha dibuat dari master v3. Harga referensi terisi, stok tetap nol, dan data usaha mandiri.');showPage('wizard')};
 tx.onerror=()=>toast('Gagal membuat data: '+(tx.error?.message||'kesalahan database'));tx.onabort=()=>toast('Pemasangan paket dibatalkan agar data tidak dibuat setengah.');
}
async function enterBusiness(){const p=await getCurrentProfile();if(!p){toast('Pilih atau buat jenis usaha terlebih dahulu.');return}currentProfile=p;$('nav').hidden=false;$('shopTitle').textContent=p.name||'Usaha Anda';$('headerSubtitle').textContent=p.business||'Data usaha lokal';updateCompositionVisibility();showPage(p.setupWizard&&p.setupWizard.finishedAt?'products':'wizard')}
async function renderHome(){if($('packageCount'))$('packageCount').value=String(licenseSlots);updatePackagePrice();currentProfile=await getCurrentProfile();renderBusinessCatalog();renderExistingBusiness(currentProfile);if(currentProfile){$('shopTitle').textContent=currentProfile.name;$('headerSubtitle').textContent=currentProfile.business+' • data lokal';$('nav').hidden=false}else{$('shopTitle').textContent='Pilih Jenis Usaha';$('headerSubtitle').textContent='Satu aplikasi untuk beberapa usaha';$('nav').hidden=true}}
function shortBusinessDescription(name){const n=name.toLowerCase();if(n.includes('gorengan')||n.includes('camilan'))return 'Produk, bahan baku, dan HPP per buah';if(n.includes('kopi')||n.includes('minuman'))return 'Minuman, bahan, dan biaya per gelas';if(n.includes('nasi uduk')||n.includes('sarapan'))return 'Menu sarapan dan bahan masak';if(n.includes('pecel lele')||n.includes('warung makan'))return 'Menu, lauk, dan bahan masak';if(n.includes('bakso')||n.includes('mi ayam')||n.includes('soto'))return 'Menu mangkuk dan bahan baku';if(n.includes('jajanan jalanan'))return 'Jajanan, saus, dan bahan';if(n.includes('martabak')||n.includes('roti bakar'))return 'Menu, topping, dan bahan';if(n.includes('jus buah')||n.includes('es campur'))return 'Minuman buah dan bahan';if(n.includes('café')||n.includes('cafe')||n.includes('resto')||n.includes('warung makan'))return 'Menu, bahan, dan penjualan';if(n.includes('catering')||n.includes('makanan'))return 'Pesanan dan produk makanan';if(n.includes('depot air'))return 'Galon, isi ulang, dan antar';if(n.includes('frozen'))return 'Produk beku dan stok';if(n.includes('konter hp'))return 'Aksesori dan layanan HP';if(n.includes('laundry'))return 'Layanan cuci dan perlengkapan';if(n.includes('percetakan'))return 'Jasa cetak, fotokopi, dan ATK';if(n.includes('pet shop'))return 'Produk hewan dan perlengkapan';if(n.includes('salon'))return 'Layanan dan produk perawatan';if(n.includes('kosmetik'))return 'Produk kecantikan dan stok';if(n.includes('kue'))return 'Kue, roti, dan pesanan';if(n.includes('pakaian'))return 'Pakaian, ukuran, dan stok';if(n.includes('retail')||n.includes('sembako'))return 'Barang dagangan dan stok';return 'Produk, jasa, dan transaksi'}
async function openProduct(id){const p=id?await get('products',id):null;const hasRecipe=id?(await getAll('recipes')).some(r=>Number(r.productId)===Number(id)):false;$('productDialogTitle').textContent=p?'Edit produk / jasa':'Tambah produk / jasa';$('editId').value=p?.id||'';$('editName').value=p?.name||'';$('editCategory').value=p?.category||'';$('editUnit').value=p?.unit||'Pcs';$('editPrice').value=p?.price??0;$('editCost').value=p?.cost??0;$('editCostMode').value=p?.costMode||(hasRecipe?'auto':'manual');$('editCost').disabled=$('editCostMode').value==='auto';$('editCostMode').onchange=()=>{$('editCost').disabled=$('editCostMode').value==='auto';if($('editCostMode').value==='auto')toast('HPP akan dihitung dari komposisi saat disimpan.');};$('editStock').value=p?.stock??0;$('editStock').readOnly=true;$('editStockEnabled').checked=!!p?.stockEnabled;$('saveProduct').disabled=false;$('productDialog').showModal()}
async function saveProduct(){
 const btn=$('saveProduct');
 if(btn.disabled)return;
 const name=$('editName').value.trim();
 if(!name){toast('Nama produk wajib diisi.');$('editName').focus();return}
 // Stok adalah data inventaris; form produk hanya boleh mengubah atribut jual, bukan jumlah stok.
 const stockRaw=$('editStock').value.trim(),enteredStock=Number(stockRaw);
 if(stockRaw===''||!Number.isFinite(enteredStock)||enteredStock<0){toast('Data stok tidak valid. Buka Bahan & Belanja untuk mengelola stok.');return}
 btn.disabled=true;
 try{
  const id=$('editId').value?Number($('editId').value):null;
  const old=id?await get('products',id):null;
  if(id&&!old)throw Error('Produk tidak ditemukan pada usaha aktif. Periksa usaha yang sedang dibuka.');
  const stock=Number(old?.stock??0);
  const allRecipes=await getAll('recipes'),hasRecipe=id?allRecipes.some(r=>Number(r.productId)===Number(id)):false,costMode=$('editCostMode').value||'manual';
  if(costMode==='auto'&&!hasRecipe){toast('Produk ini belum memiliki komposisi. Tambahkan komposisi dahulu atau pilih HPP manual.');$('editCostMode').value='manual';$('editCost').disabled=false;return}
  const p={...(old||{}),name,category:$('editCategory').value.trim(),unit:$('editUnit').value.trim()||'Pcs',price:Math.max(0,Number($('editPrice').value)||0),cost:costMode==='auto'&&hasRecipe?Number(old?.cost||0):Math.max(0,Number($('editCost').value)||0),costMode,referencePrice:false,referenceCost:false,stock,stockEnabled:$('editStockEnabled').checked,forSale:true,active:true,updatedAt:dateNow()};
  if(id)p.id=id;
  const key=await put('products',p);
  if(!id)p.id=Number(key);
  const check=await get('products',p.id);
  if(!check||Number(check.stock)!==stock||!!check.stockEnabled!==!!p.stockEnabled)throw Error('Data produk tersimpan belum bisa diverifikasi. Form tetap terbuka; coba simpan sekali lagi.');
  if(costMode==='auto'&&hasRecipe)await recalculateRecipeCosts();
  await renderProducts();
  await renderCashItems();
  $('productDialog').close('saved');
  toast(`Data produk tersimpan: ${p.name}. Perubahan stok hanya melalui Bahan & Belanja.`);
 }catch(err){console.error(err);toast('Gagal menyimpan produk dan stok: '+(err.message||'kesalahan database'));}
 finally{btn.disabled=false}
}
async function deleteProduct(id){const p=await get('products',id);if(!p)return;if((await getAll('recipes')).some(r=>Number(r.productId)===Number(id))){if(!confirm('Produk memiliki komposisi. Hapus produk dan komposisinya?'))return;for(const r of await getAll('recipes'))if(Number(r.productId)===Number(id))await del('recipes',r.id)}else if(!confirm('Hapus produk ini?'))return;p.active=false;await put('products',p);cart=cart.filter(x=>Number(x.id)!==Number(id));await renderProducts();await renderCashItems();renderCart();toast('Produk dinonaktifkan. Riwayat transaksi lama tetap tersimpan.')}
function unitDimension(unit){const u=String(unit||'').trim().toLowerCase();if(['g','gram','ons','hg','kg','kilo','mg'].includes(u))return {dim:'mass',factor:['kg','kilo'].includes(u)?1000:['ons','hg'].includes(u)?100:['mg'].includes(u)?0.001:1};if(['ml','mililiter','l','liter','litre','sendok makan','sdm','sendok teh','sdt'].includes(u))return {dim:'volume',factor:['l','liter','litre'].includes(u)?1000:['sendok makan','sdm'].includes(u)?15:['sendok teh','sdt'].includes(u)?5:1};if(['cm','m','meter'].includes(u))return {dim:'length',factor:['m','meter'].includes(u)?100:1};if(['pcs','pc','butir','buah','biji','unit','piece','pieces'].includes(u))return {dim:'count',factor:1};return {dim:'count:'+u,factor:1}}
function convertQty(qty,from,to){const a=unitDimension(from),b=unitDimension(to);return a.dim===b.dim?Number(qty||0)*a.factor/b.factor:null}
async function migrateInventoryModel(){const originalBusinessId=activeBusinessId;for(const business of businesses){activeBusinessId=business.id;const materials=await getAll('materials'),ps=await getAll('products'),legacy=ps.filter(x=>x.forSale===false),map=new Map();for(const x of legacy){let m=materials.find(y=>Number(y.legacyProductId)===Number(x.id));if(!m){const id=await add('materials',{name:x.name,category:x.category||'Bahan baku',unit:x.unit||'Pcs',cost:Number(x.cost||0),stock:Number(x.stock||0),stockEnabled:x.stockEnabled!==false,active:x.active!==false,legacyProductId:x.id,createdAt:x.createdAt||dateNow()});m={id:Number(id),legacyProductId:x.id};materials.push(m)}map.set(Number(x.id),Number(m.id));}for(const x of legacy){x.active=false;x.legacyMaterial=true;await put('products',x)}const existingRecipes=await getAll('recipes');for(const x of ps.filter(x=>x.forSale!==false&&Array.isArray(x.recipe)&&x.recipe.length)){if(existingRecipes.some(r=>Number(r.productId)===Number(x.id)))continue;const lines=x.recipe.map(r=>({materialId:map.get(Number(r.ingredientId)),qty:Number(r.qty||0),unit:r.unit||''})).filter(r=>r.materialId);if(lines.length)await add('recipes',{productId:x.id,lines,createdAt:dateNow(),updatedAt:dateNow()})}const latestRecipes=await getAll('recipes');for(const r of latestRecipes){const p=ps.find(x=>Number(x.id)===Number(r.productId));if(p&&r.templateRecipeId&&isSimpleDrinkProductName(p.name)){await del('recipes',r.id);if(p.costMode==='auto'){p.costMode='manual';await put('products',p)}}}}activeBusinessId=originalBusinessId;currentProfile=await getCurrentProfile()}
async function renderProducts(){
 if(!db)return;
 const term=$('productSearch').value.trim().toLowerCase();
 const [allProducts,recipes]=await Promise.all([getAll('products'),getAll('recipes')]);
 const products=allProducts.filter(p=>p.active!==false&&!p.legacyMaterial&&p.name.toLowerCase().includes(term));
 const recipeByProduct=new Map(recipes.map(r=>[Number(r.productId),r]));
 const root=$('productsList');
 if(!products.length){root.innerHTML='<div class="empty">Belum ada produk yang cocok.</div>';return}
 root.innerHTML=products.map(p=>{
  const recipe=recipeByProduct.get(Number(p.id));
  const sizes=recipe?.variants?.length?`<div class="muted">${recipe.variants.map(v=>`${esc(v.name)}: jual ${money(Number(v.price)||0)} · HPP bahan ${money((Number(p.cost)||0)*(Number(v.multiplier)||1))}`).join(' | ')}</div>`:'';
  return `<div class="productrow"><div class="info"><strong>${esc(p.name)}</strong><div class="muted">${esc(p.category||'Tanpa kategori')} · Satuan jual: ${esc(p.unit||'Pcs')}</div><div class="muted">${p.referencePrice?'Harga jual referensi ': 'Harga jual '}${money(p.price)} · HPP dasar/satuan ${money(p.cost)}${p.costMode==='auto'?' (otomatis dari komposisi)':' (manual)'} · Stok ${Number(p.stock||0)}${p.stockEnabled?'':' (tidak dikelola)'}</div>${sizes}</div><div class="rowactions"><button data-edit="${p.id}">Edit</button><button data-del="${p.id}">Hapus</button></div></div>`;
 }).join('');
 root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openProduct(Number(b.dataset.edit)));
 root.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteProduct(Number(b.dataset.del)));
}
async function recalculateRecipeCosts(){const [products,recipes,materials]=await Promise.all([getAll('products'),getAll('recipes'),getAll('materials')]);const byId=new Map(materials.map(m=>[Number(m.id),m]));for(const r of recipes){const prod=products.find(p=>Number(p.id)===Number(r.productId));if(!prod||prod.costMode==='manual')continue;let total=0,valid=true;for(const line of r.lines||[]){const m=byId.get(Number(line.materialId));if(!m){valid=false;continue}if(line.unitPrice!==undefined&&line.unitPrice!==null&&Number.isFinite(Number(line.unitPrice))){total+=Number(line.qty||0)*Number(line.unitPrice||0);continue}const qty=convertQty(line.qty,line.unit||m.unit,m.unit);if(qty===null){valid=false;continue}total+=qty*Number(m.cost||0)}if(valid){const unitCost=r.recipeBasis==='finished_kg'?total/Math.max(1,Number(r.expectedYieldUnits)||1):total;prod.cost=Math.round(unitCost*100)/100;prod.costMode='auto';prod.costUpdatedAt=dateNow();await put('products',prod)}}}
function businessMaterialOptions(){
 const name=String(currentProfile?.business||'').toLowerCase();
 if(name.includes('percetakan')||name.includes('fotokopi'))return {categories:['Kertas','Tinta dan toner','Bahan cetak','Bahan finishing','Jilid dan laminasi','ATK','Perlengkapan','Lainnya'],units:['Rim','Lembar','Pack','Pcs','Roll','Botol','Cartridge','Box','Meter','Kg','Liter','Set']};
 if(name.includes('laundry'))return {categories:['Deterjen','Pewangi','Pembersih','Kemasan','Peralatan habis pakai','Lainnya'],units:['Kg','Liter','Ml','Botol','Pcs','Pack','Sachet','Jerigen','Roll']};
 if(name.includes('konter hp'))return {categories:['Aksesori HP','Sparepart','Kabel dan charger','Kemasan','Perlengkapan','Lainnya'],units:['Pcs','Unit','Pack','Box','Meter','Roll','Set']};
 if(name.includes('depot air'))return {categories:['Air baku','Galon dan tutup','Filter','Disinfektan','Perlengkapan','Lainnya'],units:['Galon','Liter','Pcs','Unit','Pack','Set','Kg']};
 if(name.includes('salon')||name.includes('kosmetik'))return {categories:['Produk perawatan','Bahan habis pakai','Kosmetik','Kemasan','Perlengkapan','Lainnya'],units:['Pcs','Botol','Ml','Liter','Pack','Sachet','Kg','Gram','Set']};
 if(name.includes('pet shop'))return {categories:['Pakan','Perawatan hewan','Obat dan vitamin','Aksesori','Kemasan','Lainnya'],units:['Kg','Gram','Pcs','Pack','Sachet','Botol','Liter','Kaleng','Karung']};
 if(name.includes('frozen'))return {categories:['Produk beku','Bahan baku','Kemasan','Bumbu dan pelengkap','Lainnya'],units:['Pcs','Pack','Kg','Gram','Dus','Karung','Botol']};
 if(name.includes('pakaian'))return {categories:['Pakaian','Aksesori','Bahan jahit','Kemasan','Lainnya'],units:['Pcs','Lusin','Pack','Meter','Roll','Set','Kodi']};
 if(name.includes('catering')||name.includes('café')||name.includes('cafe')||name.includes('resto')||name.includes('makanan')||name.includes('gorengan')||name.includes('bakso')||name.includes('mi ayam')||name.includes('soto')||name.includes('martabak')||name.includes('roti bakar')||name.includes('kue')||name.includes('bakery')||name.includes('kopi')||name.includes('minuman')||name.includes('jus buah')||name.includes('es campur')||name.includes('nasi uduk')||name.includes('pecel lele'))return {categories:['Bahan baku','Bumbu dan bahan tambahan','Minuman','Kemasan','Minyak dan bahan masak','Lainnya'],units:['Kg','Gram','Liter','Ml','Pcs','Buah','Ikat','Sachet','Pack','Botol','Dus','Karung']};
 if(name.includes('sembako')||name.includes('grosir')||name.includes('retail')||name.includes('warung'))return {categories:['Sembako','Makanan dan minuman','Kebutuhan rumah tangga','Perlengkapan','Lainnya'],units:['Pcs','Pack','Dus','Kg','Gram','Liter','Ml','Botol','Sachet','Karung','Lusin']};
 return {categories:['Bahan baku','Bahan tambahan','Kemasan','Perlengkapan','Barang dagangan','Lainnya'],units:['Pcs','Kg','Gram','Liter','Ml','Buah','Ikat','Sachet','Pack','Botol','Dus','Karung','Roll','Meter','Set']};
}
function initNewMaterialOptions(){const opts=businessMaterialOptions();$('newMaterialCategory').innerHTML=opts.categories.map((x,i)=>`<option value="${esc(x)}" ${i===0?'selected':''}>${esc(x)}</option>`).join('');$('newMaterialUnit').innerHTML=opts.units.map((x,i)=>`<option value="${esc(x)}" ${i===0?'selected':''}>${esc(x)}</option>`).join('');const name=normItemName($('purchaseMaterialSearch')?.value||'');if(/plastik|gelas|sedotan|cup|tutup|stiker|label|sendok|garpu|kantong|kemasan|kresek|wrap/.test(name)){if(opts.categories.includes('Kemasan'))$('newMaterialCategory').value='Kemasan';if(opts.units.includes('Pcs'))$('newMaterialUnit').value='Pcs'}if($('newMaterialCategory'))$('newMaterialCategory').onchange=()=>{if($('newMaterialCategory').value==='Kemasan'&&opts.units.includes('Pcs'))$('newMaterialUnit').value='Pcs';updatePurchaseTotal()}}
function isJuiceBusiness(){const name=String(currentProfile?.business||'').toLocaleLowerCase('id');return name.includes('jus')||name.includes('es campur')}
function isRetailStockBusiness(){const name=String(currentProfile?.business||'').toLocaleLowerCase('id');return ['pakaian','sembako','retail','grosir','toko kelontong','konter hp','konter handphone','toko hp','aksesoris hp','toko elektronik','toko sepatu','toko tas','toko mainan','kosmetik','pet shop','frozen food'].some(term=>name.includes(term))}
function normItemName(value){return String(value||'').trim().toLocaleLowerCase('id').replace(/\s+/g,' ')}
function isJuiceMenuName(name){const n=normItemName(name);return /^jus\s+/.test(n)||/^es\s+campur(?:\s|$)/.test(n)}
function isJuiceMenuMaterial(material,products=[]){if(!isJuiceBusiness())return false;const name=normItemName(material?.name);if(!name)return false;const category=normItemName(material?.category);if(/produk jadi|produk\s*\/\s*barang dijual|menu minuman|menu jadi/.test(category)||isJuiceMenuName(name))return true;return products.some(p=>p.active!==false&&p.legacyMaterial!==true&&p.forSale!==false&&normItemName(p.name)===name)}
function visibleMaterialsForJuice(materials,products=[]){return materials.filter(m=>m.active!==false&&!isJuiceMenuMaterial(m,products))}
async function getPurchaseChoices(){const [materials,products,recipes]=await Promise.all([getAll('materials'),getAll('products'),getAll('recipes')]);const recipeProductIds=productIdsWithRecipes(recipes);const sellable=products.filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false&&!isRecipeMadeProduct(p,recipeProductIds)&&(isRetailStockBusiness()||p.stockEnabled));const ingredients=isRetailStockBusiness()?[]:visibleMaterialsForJuice(materials,products).map(m=>({id:Number(m.id),kind:'material',name:m.name,unit:m.unit||'Pcs'}));return dedupeSameStockRows([...ingredients,...sellable.map(p=>({id:Number(p.id),kind:'product',name:p.name,unit:p.unit||'Pcs'}))]).sort((a,b)=>String(a.name).localeCompare(String(b.name),'id'))}
function setPurchaseSelection(value){const sel=$('purchaseMaterial');if(![...sel.options].some(o=>o.value===String(value))){const option=document.createElement('option');option.value=String(value);option.textContent=String(value);sel.appendChild(option)}sel.value=String(value)}
function selectPurchaseChoice(choice){setPurchaseSelection(`${choice.kind}:${choice.id}`);$('purchaseMaterialSearch').value=choice.name;$('newMaterialFields').hidden=true;$('purchaseMaterialSuggestions').hidden=true;updatePurchaseTotal();$('purchaseQty').focus()}
async function renderPurchaseMaterialSuggestions(){const input=$('purchaseMaterialSearch'),box=$('purchaseMaterialSuggestions');if(!input||!box)return;const seq=++purchaseSearchSeq,name=input.value.trim(),term=name.toLocaleLowerCase('id');setPurchaseSelection('');if(!name){box.hidden=true;$('newMaterialFields').hidden=true;return}const choices=await getPurchaseChoices();if(seq!==purchaseSearchSeq||input.value.trim()!==name)return;const exact=choices.filter(x=>String(x.name||'').trim().toLocaleLowerCase('id')===term);if(exact.length){const preferred=exact.find(x=>x.kind==='product')||exact.find(x=>x.kind==='material')||exact[0];setPurchaseSelection(`${preferred.kind}:${preferred.id}`);$('newMaterialFields').hidden=true}else{$('newMaterialFields').hidden=false;initNewMaterialOptions();const title=$('newMaterialFields').querySelector('h4'),help=$('newMaterialFields').querySelector('p');if(isRetailStockBusiness()){if(title)title.textContent='Produk dagangan baru';if(help)help.textContent='Produk akan dibuat sekaligus dengan transaksi pembelian. Stok awal diisi dari jumlah pembelian ini, tanpa membuat catatan bahan terpisah.'}else{if(title)title.textContent='Bahan baru';if(help)help.textContent='Bahan baru dan pembeliannya akan disimpan bersamaan. Barang yang sudah terdaftar akan mengikuti satuan stok utamanya.'}}updatePurchaseTotal();const matches=choices.filter(x=>String(x.name||'').toLocaleLowerCase('id').includes(term)).slice(0,8);box.innerHTML=(matches.map(x=>`<button type="button" class="purchase-suggestion" data-purchase-kind="${x.kind}" data-purchase-id="${x.id}"><strong>${esc(x.name)}</strong><small>${esc(x.unit)} · ${x.kind==='product'?'Produk dijual':'Bahan baku'}</small></button>`).join(''))+(exact.length?'':`<div class="purchase-new-hint">${matches.length?'Pilih barang yang sudah terdaftar jika tersedia. ':''}${isRetailStockBusiness()?'Produk baru akan dibuat dan stoknya langsung ditambahkan saat pembelian disimpan.':'Jika nama ini bahan baru, bahan dan stoknya dibuat saat pembelian disimpan.'}</div>`);box.hidden=false;box.querySelectorAll('[data-purchase-kind]').forEach(b=>b.onclick=()=>selectPurchaseChoice({kind:b.dataset.purchaseKind,id:Number(b.dataset.purchaseId),name:choices.find(x=>x.kind===b.dataset.purchaseKind&&Number(x.id)===Number(b.dataset.purchaseId))?.name||name}));}
function toggleNewMaterialFields(){const isNew=$('purchaseMaterial').value==='__new__';$('newMaterialFields').hidden=!isNew;if(isNew)initNewMaterialOptions();updatePurchaseTotal()}
function purchaseStockUnit(){const selected=$('purchaseMaterial')?.value||'';if(selected==='__new__'||!selected){return $('newMaterialUnit')?.value||'Pcs'}const option=$('purchaseMaterial')?.selectedOptions?.[0];if(option?.dataset?.unit)return option.dataset.unit;const match=String(option?.textContent||'').match(/\(([^()]*)\)\s*(?:·|$)/);return match?.[1]||'satuan stok'}
function updatePurchaseUnitContext(){const unit=purchaseStockUnit(),selected=$('purchaseMaterial')?.value||'',typedName=$('purchaseMaterialSearch')?.value?.trim()||'';const isNew=selected==='__new__'||(!selected&&typedName&& !$('newMaterialFields')?.hidden);const unitSummary=$('purchaseStockUnitSummary');if(unitSummary){unitSummary.textContent=isNew?`Satuan stok untuk barang baru: ${unit}. Pastikan satuan ini sesuai dengan cara menghitung stok fisik.`:selected?`Satuan stok utama barang ini: ${unit}. Jumlah pembelian biasa, stok, dan modal per satuan mengikuti satuan ini.`:'Pilih barang untuk melihat satuan stok utamanya.'}const qtyLabel=$('purchaseQtyLabelText'),priceLabel=$('purchaseUnitPriceLabelText'),contentLabel=$('purchaseContentQtyLabel');const pack=!!$('purchasePackageMode')?.checked;if(qtyLabel)qtyLabel.textContent=pack?'Jumlah kemasan dibeli':`Jumlah dibeli (${unit})`;if(priceLabel)priceLabel.textContent=pack?'Harga per kemasan (Rp)':`Harga beli per ${unit} (Rp)`;if(contentLabel)contentLabel.textContent=`Isi per kemasan (${unit})`;if($('purchaseQty'))$('purchaseQty').placeholder=pack?'Contoh: 1':`Contoh: 10 ${unit}`;if($('purchaseUnitPrice'))$('purchaseUnitPrice').placeholder=pack?'Contoh: 30000':`Contoh: 15000 per ${unit}`}
function togglePurchasePackageMode(){const enabled=!!$('purchasePackageMode')?.checked;$('purchasePackageFields').hidden=!enabled;updatePurchaseUnitContext();updatePurchaseTotal()}
function updatePurchaseTotal(){updatePurchaseUnitContext();const qty=Number($('purchaseQty')?.value),price=Number($('purchaseUnitPrice')?.value),packMode=!!$('purchasePackageMode')?.checked,content=packMode?Number($('purchasePackageContentQty')?.value):1;const valid=qty>0&&Number.isFinite(qty)&&price>=0&&$('purchaseUnitPrice')?.value!==''&&Number.isFinite(price)&&content>0&&Number.isFinite(content);const total=valid?Math.round(qty*price):'';$('purchaseTotal').value=total===''?'':String(total);const summary=$('purchaseConversionSummary');if(!summary)return;const unit=purchaseStockUnit();if(!packMode){summary.textContent=valid?`Stok akan bertambah ${qty.toLocaleString('id-ID',{maximumFractionDigits:4})} ${unit}. Total belanja = jumlah × harga per ${unit}.`:`Masukkan jumlah dalam ${unit} dan harga beli untuk setiap ${unit}.`;return}const stockQty=qty*content,stockCost=price/content;summary.textContent=valid?`Konversi stok: ${qty.toLocaleString('id-ID',{maximumFractionDigits:4})} ${$('purchasePackageUnit').value.trim()||'kemasan'} × ${content.toLocaleString('id-ID',{maximumFractionDigits:4})} ${unit} = ${stockQty.toLocaleString('id-ID',{maximumFractionDigits:4})} ${unit}. Modal per ${unit}: ${money(stockCost)}.`:'Isi jumlah kemasan, harga per kemasan, dan isi per kemasan dalam satuan stok untuk menghitung stok serta modal otomatis.'}
function cancelPurchaseForm(){ $('purchaseMaterial').value='';$('purchaseMaterialSearch').value='';$('purchaseMaterialSuggestions').hidden=true;$('purchaseQty').value='';$('purchaseUnitPrice').value='';$('purchaseTotal').value='';$('purchasePackageMode').checked=false;$('purchasePackageUnit').value='Pack';$('purchasePackageContentQty').value='1';$('newMaterialFields').hidden=true;$('purchaseDate').value=localDateValue();$('savePurchase').disabled=false;togglePurchasePackageMode();updatePurchaseTotal(); }
async function editMaterialData(id){
 const item=await get('materials',Number(id));if(!item)return;
 const nameAnswer=prompt('Nama bahan/barang:',String(item.name||''));if(nameAnswer===null)return;const name=nameAnswer.trim();if(!name){toast('Nama bahan tidak boleh kosong.');return}
 const duplicate=(await getAll('materials')).some(x=>Number(x.id)!==Number(item.id)&&x.active!==false&&String(x.name||'').trim().toLocaleLowerCase('id')===name.toLocaleLowerCase('id'));
 if(duplicate){toast('Nama bahan tersebut sudah digunakan. Gunakan nama yang berbeda.');return}
 const categoryAnswer=prompt('Kategori bahan/barang:',String(item.category||'Bahan baku'));if(categoryAnswer===null)return;const category=categoryAnswer.trim()||'Lainnya';
 if(name===item.name&&category===(item.category||'Bahan baku'))return;
 item.name=name;item.category=category;item.updatedAt=dateNow();await put('materials',item);
 await renderMaterials();await renderRecipePage();toast('Nama dan kategori bahan berhasil diperbarui.');
}
async function deleteMaterial(id){
 const item=await get('materials',Number(id));if(!item)return;
 const stock=Number(item.stock||0);const used=(await getAll('recipes')).some(r=>(r.lines||[]).some(line=>Number(line.materialId)===Number(id)));
 const message='Nonaktifkan bahan "'+item.name+'"?\n\nBahan akan disembunyikan dari daftar aktif, tetapi data pembelian dan komposisi lama tetap disimpan. Ini bukan penghapusan permanen.'+(stock>0?'\n\nPerhatian: stok tercatat masih '+stock+' '+(item.unit||'satuan')+'.':'')+(used?'\n\nBahan ini masih dipakai dalam komposisi produk.':'');
 if(!confirm(message))return;
 item.active=false;item.updatedAt=dateNow();await put('materials',item);
 await renderMaterials();await renderProducts();await renderCashItems();await renderRecipePage();toast('Bahan dinonaktifkan. Riwayat dan komposisi lama tetap tersimpan.');
}
async function editMaterialUnit(id){
 const item=await get('materials',Number(id));if(!item)return;
 const oldUnit=String(item.unit||'Pcs');
 const presets=['Kg','Gram','Mg','Liter','Ml','Butir','Buah','Biji','Pcs','Potong','Lembar','Ikat','Sachet','Bungkus','Pack','Botol','Dus','Karung','Sendok makan','Sendok teh','Gelas','Cangkir'];
 const answer=prompt('Ubah satuan stok/belanja untuk '+item.name+'\nSatuan sekarang: '+oldUnit+'\n\nKetik satuan baru, misalnya Kg, Gram, Butir, atau Sendok makan.\nPilihan umum: '+presets.join(', '),oldUnit);
 if(answer===null)return;const newUnit=answer.trim();if(!newUnit){toast('Satuan tidak boleh kosong.');return}if(newUnit.toLocaleLowerCase('id')===oldUnit.toLocaleLowerCase('id'))return;
 const factor=convertQty(1,oldUnit,newUnit),reverse=convertQty(1,newUnit,oldUnit),stock=Number(item.stock||0),cost=Number(item.cost||0);
 if(factor===null||reverse===null){if(stock>0){toast('Satuan '+oldUnit+' tidak dapat dikonversi otomatis ke '+newUnit+'. Habiskan stok atau lakukan penyesuaian stok terlebih dahulu agar nilai stok tidak berubah keliru.');return}if(!confirm('Konversi otomatis tidak tersedia untuk '+oldUnit+' ke '+newUnit+'. Stok saat ini 0. Simpan satuan baru tanpa konversi?'))return;item.unit=newUnit;item.updatedAt=dateNow();await put('materials',item);await renderMaterials();toast('Satuan bahan diubah menjadi '+newUnit+'. Isi biaya resep per satuan pemakaian bila tidak dapat dikonversi otomatis.');return}
 if(!confirm('Ubah satuan '+item.name+' dari '+oldUnit+' menjadi '+newUnit+'?\nStok akan dikonversi '+stock+' '+oldUnit+' menjadi '+(stock*factor).toLocaleString('id-ID',{maximumFractionDigits:4})+' '+newUnit+'. Nilai stok dipertahankan.'))return;
 item.stock=stock*factor;item.cost=cost*reverse;item.unit=newUnit;item.updatedAt=dateNow();await put('materials',item);for(const recipe of await getAll('recipes')){let changed=false;for(const line of recipe.lines||[]){if(Number(line.materialId)!==Number(item.id))continue;const perRecipeUnit=convertQty(1,line.unit||newUnit,newUnit);if(perRecipeUnit!==null){line.unitPrice=perRecipeUnit*Number(item.cost||0);changed=true}}if(changed){recipe.updatedAt=dateNow();await put('recipes',recipe)}}await recalculateRecipeCosts();await renderMaterials();await renderProducts();await renderRecipePage();toast('Satuan diubah. Stok dan modal per satuan telah dikonversi tanpa mengubah nilai stok.');
}
async function renderMaterials(){
 const [materials,products,recipes]=await Promise.all([getAll('materials'),getAll('products'),getAll('recipes')]);
 const recipeProductIds=productIdsWithRecipes(recipes);
 const term=($('materialSearch').value||'').trim().toLowerCase();
 const retailOnly=isRetailStockBusiness();
 // Toko barang jadi hanya menampilkan produk dagangan; usaha produksi tetap menampilkan bahan baku dan produk yang stoknya diaktifkan.
 const materialRows=(retailOnly?[]:visibleMaterialsForJuice(materials,products)).map(m=>({...m,_kind:'material'}));
 // Produk yang memiliki komposisi adalah hasil produksi sendiri, bukan bahan/barang yang dibeli. Tetap tampil di Produk & Jasa dan kasir, tetapi tidak di daftar Bahan & Belanja.
 const stockedProductRows=products.filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false&&!isRecipeMadeProduct(p,recipeProductIds)&&(retailOnly||p.stockEnabled)).map(p=>({...p,_kind:'product'}));
 const rows=dedupeSameStockRows([...materialRows,...stockedProductRows]).filter(m=>`${m.name||''} ${m.category||''}`.toLowerCase().includes(term)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'id'));
 const fmtQty=n=>Number(n||0).toLocaleString('id-ID',{maximumFractionDigits:4});
 $('materialsList').innerHTML=rows.length?`<div class="materials-table-wrap"><table class="materials-table"><thead><tr><th>Bahan / barang</th><th>Jenis</th><th>Satuan</th><th>Stok</th><th>Harga modal rata-rata</th><th>Nilai stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows.map(m=>{const stock=Number(m.stock||0),cost=Number(m.cost||0),status=m.stockEnabled===false?'Stok nonaktif':stock<=0?'Habis':'Tersedia';return `<tr><td data-label="Bahan / barang"><strong>${esc(m.name)}</strong><small>${esc(m.category||'Bahan baku')}</small></td><td data-label="Jenis">${m._kind==='product'?'Barang jual':'Bahan'}</td><td data-label="Satuan">${esc(m.unit||'Pcs')}</td><td data-label="Stok" class="num">${fmtQty(stock)} ${esc(m.unit||'')}</td><td data-label="Harga modal rata-rata" class="num">${money(cost)}<small>/ ${esc(m.unit||'satuan')}</small></td><td data-label="Nilai stok" class="num">${money(stock*cost)}</td><td data-label="Status"><span class="stock-status ${stock<=0&&m.stockEnabled!==false?'empty-stock':m.stockEnabled===false?'disabled-stock':'in-stock'}">${status}</span></td><td data-label="Aksi"><div class="material-actions"><button type="button" data-meditdata="${m._kind}:${m.id}">Edit</button><button type="button" data-medit="${m._kind}:${m.id}" ${m._kind!=='material'?'disabled title="Ubah satuan barang jual dari menu Produk"':''}>Edit Satuan</button><button type="button" data-mbuy="${m._kind}:${m.id}">Tambah Stok</button><button type="button" data-adjust="${m._kind}:${m.id}">Penyesuaian</button><button type="button" data-mdelete="${m._kind}:${m.id}">Hapus</button></div></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Belum ada bahan atau barang stok yang cocok.</div>';
 const previousSelection=$('purchaseMaterial').value;
 const choices=dedupeSameStockRows([...(retailOnly?[]:visibleMaterialsForJuice(materials,products).map(m=>({id:m.id,kind:'material',name:m.name,unit:m.unit}))),...products.filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false&&!isRecipeMadeProduct(p,recipeProductIds)&&(retailOnly||p.stockEnabled)).map(p=>({id:p.id,kind:'product',name:p.name,unit:p.unit}))]).sort((a,b)=>String(a.name).localeCompare(String(b.name),'id'));
 $('purchaseMaterial').innerHTML='<option value="">Pilih produk atau bahan…</option>'+choices.map(x=>`<option value="${x.kind}:${x.id}" data-unit="${esc(x.unit||'Pcs')}">${esc(x.name)} (${esc(x.unit||'Pcs')})${x.kind==='product'?' · produk dijual':' · bahan baku'}</option>`).join('')+'<option value="__new__">＋ Tambah '+(retailOnly?'produk':'bahan')+' baru…</option>';
 if(previousSelection&&[...$('purchaseMaterial').options].some(o=>o.value===previousSelection))$('purchaseMaterial').value=previousSelection;
 const chosen=choices.find(x=>`${x.kind}:${x.id}`===$('purchaseMaterial').value);if(chosen&& !$('purchaseMaterialSearch').value)$('purchaseMaterialSearch').value=chosen.name;
 $('materialsList').querySelectorAll('[data-meditdata]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.meditdata.split(':');if(kind==='material')editMaterialData(Number(id));else openProduct(Number(id));});
 $('materialsList').querySelectorAll('[data-mdelete]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.mdelete.split(':');if(kind==='material')deleteMaterial(Number(id));else deleteProduct(Number(id));});
 $('materialsList').querySelectorAll('[data-medit]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.medit.split(':');if(kind==='material')editMaterialUnit(Number(id));});
 $('materialsList').querySelectorAll('[data-mbuy]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.mbuy.split(':');const choice=choices.find(x=>x.kind===kind&&Number(x.id)===Number(id));if(choice)selectPurchaseChoice(choice);$('purchaseFormCard').scrollIntoView({behavior:'smooth',block:'start'});});
 $('materialsList').querySelectorAll('[data-adjust]').forEach(b=>b.onclick=()=>adjustStock(...b.dataset.adjust.split(':')));
 await renderPurchaseHistory();
}
async function adjustStock(kind,id){
 const storeName=kind==='product'?'products':'materials';const item=await get(storeName,Number(id));if(!item)return;
 const oldStock=Math.max(0,Number(item.stock||0));
 const raw=window.prompt(`PENYESUAIAN STOK\n${item.name}\nStok tercatat: ${oldStock} ${item.unit||'Pcs'}\n\nMasukkan jumlah stok fisik yang benar (stok akhir, bukan selisih):`,String(oldStock));
 if(raw===null)return;const newStock=Number(raw.trim());
 if(raw.trim()===''||!Number.isFinite(newStock)||newStock<0){toast('Stok fisik harus berupa angka nol atau lebih.');return}
 const reason=window.prompt('Alasan penyesuaian (wajib), misalnya hasil hitung fisik, rusak, atau selisih stok:','Hasil hitung stok fisik');
 if(reason===null)return;if(!reason.trim()){toast('Alasan penyesuaian wajib diisi.');return}
 if(Math.abs(newStock-oldStock)<1e-9){toast('Stok tidak berubah; tidak ada penyesuaian yang disimpan.');return}
 const date=localDateValue(),stamp=dateNow(),delta=newStock-oldStock;
 try{
  const tx=db.transaction([storeName,'materialPurchases'],'readwrite');const st=tx.objectStore(storeName),hist=tx.objectStore('materialPurchases');
  const req=st.get(Number(id));req.onsuccess=()=>{const current=req.result;if(!current||String(current.businessId??'legacy')!==String(activeBusinessId??'legacy')){try{tx.abort()}catch{}return}
   const before=Math.max(0,Number(current.stock||0));current.stock=newStock;current.stockEnabled=true;current.updatedAt=stamp;st.put(current);
   hist.add({businessId:activeBusinessId||'legacy',transactionType:'adjustment',date,createdAt:stamp,itemType:kind==='product'?'product':'material',itemId:Number(id),materialName:current.name,itemName:current.name,unit:current.unit||'Pcs',qty:delta,stockBefore:before,stockAfter:newStock,reason:reason.trim(),total:0,unitCost:Number(current.cost||0)});
  };
  await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Transaksi gagal'));tx.onabort=()=>reject(tx.error||new Error('Penyesuaian dibatalkan'))});
  await renderMaterials();await renderProducts();await renderCashItems();toast(`Penyesuaian stok ${item.name} tersimpan: ${newStock} ${item.unit||'Pcs'}.`);
 }catch(err){console.error(err);toast('Penyesuaian stok gagal: '+(err.message||'kesalahan database'));}
}
async function renderPurchaseHistory(){
 const all=(await getAll('materialPurchases')).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
 const selectedDate=$('purchaseHistoryDate')?.value||'';const buys=selectedDate?all.filter(x=>String(x.date||'')===selectedDate):all;
 $('purchaseHistory').innerHTML=buys.length?buys.slice(0,200).map(x=>{const qty=Number(x.qty||0),unit=esc(x.unit||'');const type=x.itemType==='product'?'Barang jual':'Bahan';const packInfo=x.packageMode&&Number(x.purchasedQty)>0?` · Dibeli ${Number(x.purchasedQty).toLocaleString('id-ID',{maximumFractionDigits:4})} ${esc(x.purchaseUnit||'kemasan')} (isi ${Number(x.contentPerPack||1).toLocaleString('id-ID',{maximumFractionDigits:4})} ${unit}/kemasan)` : '';return `<div class="historyrow"><div class="info"><strong>${x.transactionType==='adjustment'?'Penyesuaian stok - ':'Pembelian - '}${esc(x.materialName||x.itemName||'Item pembelian')}</strong><div class="muted">${esc(x.date||'Tanggal tidak tersedia')}${x.transactionType==='adjustment'?` · Stok ${Number(x.stockBefore||0).toLocaleString('id-ID',{maximumFractionDigits:4})} → ${Number(x.stockAfter||0).toLocaleString('id-ID',{maximumFractionDigits:4})} ${unit} · Alasan: ${esc(x.reason||'-')}`:` · Stok masuk ${qty.toLocaleString('id-ID',{maximumFractionDigits:4})} ${unit}${packInfo} · ${money(x.total)}`}${x.itemType?` · ${type}`:''}</div></div><span class="muted">${x.transactionType==='adjustment'?'Koreksi stok':money(x.unitCost)+'/'+(unit||'unit')}</span></div>`}).join(''):'<div class="empty">'+(selectedDate?`Tidak ada pembelian pada ${esc(selectedDate)}.`:'Belum ada riwayat pembelian.')+'</div>';
}
async function savePurchase(){
 const btn=$('savePurchase');if(btn.disabled)return;
 let selection=$('purchaseMaterial').value;const typedName=$('purchaseMaterialSearch').value.trim(),enteredQty=Number($('purchaseQty').value),enteredPrice=Number($('purchaseUnitPrice').value),packageMode=!!$('purchasePackageMode').checked,contentPerPack=packageMode?Number($('purchasePackageContentQty').value):1,purchaseUnit=packageMode?($('purchasePackageUnit').value.trim()||'kemasan'):'',qty=enteredQty*contentPerPack,unitCost=contentPerPack>0?enteredPrice/contentPerPack:NaN,total=enteredQty>0&&Number.isFinite(enteredQty)&&enteredPrice>=0&&$('purchaseUnitPrice').value!==''?Math.round(enteredQty*enteredPrice):NaN,date=$('purchaseDate').value;
 if(!date){toast('Tanggal pembelian wajib diisi.');$('purchaseDate').focus();return}
 if(!typedName||!(enteredQty>0)||!Number.isFinite(enteredQty)||!(enteredPrice>=0)||!Number.isFinite(enteredPrice)||$('purchaseUnitPrice').value===''||!(contentPerPack>0)||!Number.isFinite(contentPerPack)||!(qty>0)||!Number.isFinite(qty)||!(total>=0)||!Number.isFinite(total)){toast('Pilih atau ketik produk/bahan, lalu isi jumlah, harga, dan isi kemasan dengan benar.');if(!typedName)$('purchaseMaterialSearch').focus();else if($('purchaseUnitPrice').value==='')$('purchaseUnitPrice').focus();else if(packageMode)$('purchasePackageContentQty').focus();return}
 if(isJuiceBusiness()){
  const products=await getAll('products');
  const matchingStockProduct=products.some(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false&&normItemName(p.name)===normItemName(typedName));
  if(!matchingStockProduct&&(isJuiceMenuName(typedName)||products.some(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false&&normItemName(p.name)===normItemName(typedName)))){toast('Nama tersebut adalah menu racikan, bukan bahan belanja. Pilih bahan yang dipakai untuk membuat menu, atau daftarkan produk barang jadi terlebih dahulu.');return}
 }
 const retailOnly=isRetailStockBusiness(),available=await getPurchaseChoices(),exact=available.filter(x=>normItemName(x.name)===normItemName(typedName));
 if(!selection||selection==='__new__'||!available.some(x=>`${x.kind}:${x.id}`===selection)){const resolved=exact.find(x=>x.kind==='product')||exact.find(x=>x.kind==='material')||exact[0];selection=resolved?`${resolved.kind}:${resolved.id}`:'__new__'}
 let kind='',itemId=0,isNew=selection==='__new__';
 if(!isNew){const parts=selection.split(':');kind=parts[0];itemId=Number(parts[1]);if(!['material','product'].includes(kind)||!itemId){toast('Pilihan produk/bahan tidak valid.');return}}
 let newName='',newCategory='',newUnit='',newKind=retailOnly?'product':'material';
 if(isNew){newName=typedName;newCategory=$('newMaterialCategory').value||(retailOnly?'Barang dagangan':'Bahan baku');newUnit=$('newMaterialUnit').value||'Pcs';
  if(retailOnly){const legacyDuplicate=(await getAll('materials')).find(m=>m.active!==false&&normItemName(m.name)===normItemName(newName));if(legacyDuplicate){toast('Nama ini masih tercatat sebagai bahan lama. Tambahkan atau aktifkan produk dengan nama tersebut dari menu Produk & Jasa terlebih dahulu agar stok tidak terpisah.');return}}
  else {const duplicate=(await getAll('materials')).find(m=>m.active!==false&&normItemName(m.name)===normItemName(newName));if(duplicate){selection='material:'+duplicate.id;kind='material';itemId=Number(duplicate.id);isNew=false}}
 }
 btn.disabled=true;
 try{
  const stores=[...new Set(['materialPurchases','recipes',...(isNew&&newKind==='material'||kind==='material'?['materials']:[]),...(isNew&&newKind==='product'||kind==='product'?['products']:[])])];
  const tx=db.transaction(stores,'readwrite'),purchaseStore=tx.objectStore('materialPurchases'),stamp=dateNow();let requestFailed=false;
  const savePurchaseRow=(id,itemKind,itemName,unit)=>{const stockUnit=unit||'Pcs';purchaseStore.add({businessId:activeBusinessId,itemType:itemKind,itemId:Number(id),materialId:itemKind==='material'?Number(id):undefined,productId:itemKind==='product'?Number(id):undefined,materialName:itemName,itemName,qty,unit:stockUnit,total,unitCost,date,packageMode,purchasedQty:enteredQty,purchaseUnit:packageMode?purchaseUnit:stockUnit,contentPerPack:packageMode?contentPerPack:1,createdAt:stamp});};
  if(isNew){
   if(newKind==='product'){
    const product={businessId:activeBusinessId,name:newName,category:newCategory,unit:newUnit,price:0,cost:unitCost,costMode:'manual',stock:qty,stockEnabled:true,forSale:true,active:true,source:'user',referencePrice:false,referenceCost:false,createdAt:stamp,updatedAt:stamp};
    const req=tx.objectStore('products').add(product);req.onsuccess=()=>savePurchaseRow(req.result,'product',newName,newUnit);req.onerror=()=>{requestFailed=true};
   }else{
    const material={businessId:activeBusinessId,name:newName,category:newCategory,unit:newUnit,cost:unitCost,stock:qty,stockEnabled:true,active:true,source:'user',referenceCost:false,createdAt:stamp,updatedAt:stamp};const req=tx.objectStore('materials').add(material);req.onsuccess=()=>savePurchaseRow(req.result,'material',newName,newUnit);req.onerror=()=>{requestFailed=true};
   }
  }else{
   const store=tx.objectStore(kind==='product'?'products':'materials'),req=store.get(itemId);req.onsuccess=()=>{const item=req.result;if(!item||String(item.businessId??'legacy')!==String(activeBusinessId??'legacy')){requestFailed=true;try{tx.abort()}catch{}return}const oldQty=Math.max(0,Number(item.stock||0)),oldCost=Math.max(0,Number(item.cost||0)),newStock=oldQty+qty;item.cost=newStock>0?((oldQty*oldCost)+(qty*unitCost))/newStock:unitCost;item.stock=newStock;item.stockEnabled=true;item.active=true;item.updatedAt=stamp;store.put(item);
    if(kind==='material'){const recipeReq=tx.objectStore('recipes').getAll();recipeReq.onsuccess=()=>{for(const recipe of recipeReq.result||[]){if(String(recipe.businessId??'legacy')!==String(activeBusinessId??'legacy'))continue;let changed=false;for(const line of recipe.lines||[]){if(Number(line.materialId)!==itemId)continue;const recipeUnit=line.unit||item.unit||'Pcs';const stockQtyPerRecipeUnit=convertQty(1,recipeUnit,item.unit||recipeUnit);const expectedOldLinePrice=stockQtyPerRecipeUnit===null?NaN:oldCost*stockQtyPerRecipeUnit;const linePrice=Number(line.unitPrice);if(Number.isFinite(expectedOldLinePrice)&&Number.isFinite(linePrice)&&Math.abs(linePrice-expectedOldLinePrice)<Math.max(0.000001,Math.abs(expectedOldLinePrice)*0.000001)){line.unitPrice=Number(item.cost||0)*stockQtyPerRecipeUnit;changed=true}}if(changed){recipe.updatedAt=stamp;tx.objectStore('recipes').put(recipe)}}};recipeReq.onerror=()=>{requestFailed=true}}
    savePurchaseRow(itemId,kind,item.name,item.unit||'Pcs')};req.onerror=()=>{requestFailed=true};
  }
  tx.oncomplete=async()=>{try{await recalculateRecipeCosts();await renderMaterials();await renderProducts();await renderCashItems();await renderRecipePage();$('purchaseQty').value='';$('purchaseUnitPrice').value='';$('purchaseTotal').value='';$('purchaseMaterialSearch').value='';$('purchaseMaterial').value='';$('purchaseMaterialSuggestions').hidden=true;$('newMaterialFields').hidden=true;$('purchasePackageMode').checked=false;$('purchasePackageUnit').value='Pack';$('purchasePackageContentQty').value='1';togglePurchasePackageMode();$('purchaseHistoryDate').value=date;await renderPurchaseHistory();const noun=(isNew?newKind:kind)==='product'?'produk':'bahan';toast(`Pembelian tersimpan. Stok ${noun} bertambah ${qty.toLocaleString('id-ID',{maximumFractionDigits:4})} ${newUnit||'unit'} satu kali.`)}catch(err){console.error(err);toast('Pembelian tersimpan, tetapi tampilan gagal diperbarui. Muat ulang aplikasi untuk memeriksa stok.')}finally{btn.disabled=false}};
  tx.onerror=()=>{btn.disabled=false;toast('Pembelian gagal disimpan: '+(tx.error?.message||'kesalahan database'))};tx.onabort=()=>{btn.disabled=false;if(requestFailed)toast('Produk/bahan tidak ditemukan atau tidak aktif. Stok tidak diubah.');else toast('Pembelian dibatalkan oleh database. Stok tidak diubah.')};
 }catch(err){console.error(err);btn.disabled=false;toast('Pembelian gagal disimpan: '+(err.message||'kesalahan database'))}
}
function recipeDefaultUnit(name, existingUnit=''){
 const n=String(name||'').toLocaleLowerCase('id'),u=String(existingUnit||'').trim();
 if(/telur|egg|butir/.test(n))return 'Butir';
 const dim=unitDimension(u);
 // Resep memakai satuan kecil yang mudah dibaca; stok tetap memakai satuan bahan yang tersimpan.
 if(dim.dim==='mass')return 'Gram';
 if(dim.dim==='volume')return 'Ml';
 if(u)return u;
 if(/kopi|bubuk|tepung|beras|gula|terigu|garam|ayam|daging|ikan|kentang|wortel|bawang|cabai|cabe|keju|cokelat|coklat|mentega|margarin|es batu/.test(n))return 'Gram';
 if(/susu|air|minyak|sirup|kecap|saus|santan|krimer|espresso/.test(n))return 'Ml';
 return 'Pcs';
}
function materialCostInRecipeUnit(material, recipeUnit){
 const stockUnit=material?.unit||recipeUnit;
 const stockQtyPerRecipeUnit=convertQty(1,recipeUnit,stockUnit);
 if(stockQtyPerRecipeUnit===null)return null;
 return Number(material?.cost||0)*stockQtyPerRecipeUnit;
}
function normalizeRecipeLineForDisplay(line, material){
 let qty=Number(line.qty||0),unit=String(line.unit||recipeDefaultUnit(material?.name,material?.unit)||material?.unit||'Pcs'),price=Number(line.unitPrice);
 if(!Number.isFinite(price))price=materialCostInRecipeUnit(material,unit);
 const dim=unitDimension(unit);
 // Takaran resep di bawah 1 kg/liter tampil dalam gram/ml, tanpa mengubah total HPP.
 if(qty>0&&dim.dim==='mass'&&['kg','kilo'].includes(unit.toLocaleLowerCase('id'))&&qty<1){const nextQty=convertQty(qty,unit,'Gram');if(nextQty!==null){price=price*qty/nextQty;qty=nextQty;unit='Gram'}}
 else if(qty>0&&dim.dim==='volume'&&['l','liter','litre'].includes(unit.toLocaleLowerCase('id'))&&qty<1){const nextQty=convertQty(qty,unit,'Ml');if(nextQty!==null){price=price*qty/nextQty;qty=nextQty;unit='Ml'}}
 return {qty,unit,price};
}
function renderRecipeVariantEditor(variants=null){
 const mode=$('recipeSizeMode')?.value||'single',root=$('recipeVariants');if(!root)return;
 const choices=$('recipeSizeChoices');
 if(mode!=='multiple'){root.hidden=true;root.innerHTML='';if(choices){choices.hidden=true;choices.innerHTML=''}renderRecipeSizePreview();return}
 root.hidden=false;if(choices)choices.hidden=false;
 $('recipeSizePreview')?.setAttribute('data-selected-index','0');
 const rows=Array.isArray(variants)&&variants.length?variants:[{name:'Kecil',price:'',multiplier:0.75},{name:'Sedang',price:'',multiplier:1},{name:'Besar',price:'',multiplier:1.25}];
 root.innerHTML='<div class="recipe-variant-head"><span>Nama ukuran</span><span>Harga jual (Rp)</span><span>Pengali takaran</span><span></span></div>'+rows.map((v,i)=>`<div class="recipe-variant-row"><input class="variant-name" maxlength="40" value="${esc(v.name||'')}" placeholder="Mis. Kecil" aria-label="Nama ukuran"><input class="variant-price" type="number" min="0" step="1" value="${v.price==null?'':esc(v.price)}" placeholder="Harga jual" aria-label="Harga jual ukuran"><input class="variant-multiplier" type="number" min="0.01" step="0.01" value="${esc(v.multiplier??1)}" aria-label="Pengali takaran"><button type="button" class="recipe-remove" data-remove-variant="${i}" aria-label="Hapus ukuran">×</button></div>`).join('')+'<button type="button" id="addRecipeVariant">+ Tambah ukuran</button><p class="recipe-help">Contoh pengali: kecil 0,75; sedang 1; besar 1,25. Pengali 1 berarti memakai takaran dasar resep.</p>';
 root.querySelectorAll('.variant-name,.variant-price,.variant-multiplier').forEach(input=>{input.addEventListener('input',()=>{renderRecipeSizeChoices();renderRecipeSizePreview()});input.addEventListener('change',()=>{renderRecipeSizeChoices();renderRecipeSizePreview()})});
 renderRecipeSizeChoices();
 root.querySelectorAll('.variant-name').forEach((input,i)=>{const selectThisSize=()=>{const box=$('recipeSizePreview');if(box){box.dataset.selectedIndex=String(i);renderRecipeSizePreview()}};input.addEventListener('focus',selectThisSize);input.addEventListener('click',selectThisSize)});
 root.querySelectorAll('[data-remove-variant]').forEach(b=>b.onclick=()=>{const data=readRecipeVariants();data.splice(Number(b.dataset.removeVariant),1);renderRecipeVariantEditor(data);renderRecipePreviewLive()});
 $('addRecipeVariant').onclick=()=>{const data=readRecipeVariants();data.push({name:'',price:'',multiplier:1});renderRecipeVariantEditor(data);renderRecipeSizePreview()};
}
function renderRecipeSizeChoices(){
 const choices=$('recipeSizeChoices'),mode=$('recipeSizeMode')?.value||'single';if(!choices)return;
 if(mode!=='multiple'){choices.hidden=true;choices.innerHTML='';return}
 const variants=readRecipeVariants();choices.hidden=false;let selected=Number($('recipeSizePreview')?.dataset.selectedIndex||0);if(selected<0||selected>=variants.length)selected=0;
 choices.innerHTML=variants.map((v,i)=>`<button type="button" class="recipe-size-choice${i===selected?' active':''}" data-size-index="${i}" aria-pressed="${i===selected?'true':'false'}">${esc(v.name||`Ukuran ${i+1}`)}<small>Pengali ${Number(v.multiplier)||1}</small></button>`).join('');
 choices.querySelectorAll('[data-size-index]').forEach(button=>button.addEventListener('click',()=>{const box=$('recipeSizePreview');if(box)box.dataset.selectedIndex=button.dataset.sizeIndex;renderRecipeSizeChoices();renderRecipeSizePreview()}));
}
function readRecipeVariants(){return [...($('recipeVariants')?.querySelectorAll('.recipe-variant-row')||[])].map(row=>({name:row.querySelector('.variant-name').value.trim(),price:row.querySelector('.variant-price').value===''?'':Number(row.querySelector('.variant-price').value),multiplier:Number(row.querySelector('.variant-multiplier').value||0)}))}
function updateRecipeReferenceNote(productName=''){
 const note=$('recipeReferenceNote');if(!note)return;
 const name=String(productName||$('recipeProduct')?.value||'produk makanan').trim()||'produk makanan';
 const basis=$('recipeBasisMode')?.value||'unit';
 const target=basis==='finished_kg'?'target 1 kg produk jadi':'1 satuan dasar produk';
 const yieldUnits=Math.max(1,Number($('recipeExpectedYield')?.value)||1);
 const result=basis==='finished_kg'?` Perkiraan hasil acuan: ${yieldUnits} buah/porsi dari 1 kg; sesuaikan berdasarkan penimbangan hasil aktual.`:'';
 note.innerHTML=`<b>Komposisi acuan — ${esc(name)}</b><p>Komposisi yang kami siapkan adalah resep acuan untuk ${target}.${result} Silakan edit takaran bahan sesuai selera, kualitas bahan, dan kebutuhan pelanggan. Setiap perubahan komposisi akan memperbarui perhitungan HPP.</p><p class="muted">Catatan: resep acuan belum tentu teruji untuk semua cara produksi. Uji hasil aktual dan timbang produk jadi sebelum dijadikan standar produksi.</p>`;
}
function starterInstructionsForProduct(productName='produk',businessType=''){
 const n=String(productName||'').toLocaleLowerCase('id');
 const b=String(businessType||'').toLocaleLowerCase('id');
 if(/roti tawar|roti coklat|roti cokelat|roti keju|roti abon|roti bakso|roti mexican|kaya toast|danish|bun|bluder|floss roll|sandwich|bakery|bread/.test(n)) return [
  'Siapkan alat, loyang, dan semua bahan; timbang sesuai komposisi yang tercatat.',
  'Campur bahan adonan sesuai urutan resep. Masukkan bahan lemak dan bahan tambahan pada tahap yang sesuai dengan formula.',
  'Uleni atau aduk sampai adonan mencapai tekstur yang ditargetkan.',
  'Istirahatkan atau fermentasikan adonan bila jenis roti memerlukannya; waktu mengikuti kondisi adonan dan suhu ruang.',
  'Bentuk adonan dan tambahkan isian atau topping sesuai varian produk.',
  'Panggang pada suhu dan waktu yang sudah diuji untuk oven yang digunakan; pastikan produk matang merata.',
  'Dinginkan sampai aman dikemas, lalu iris dan kemas sesuai jumlah/berat jual. Catat hasil aktual.'
 ].join('\n');
 if(/cake|kue|bolu|brownies|cheesecake|black forest|bika ambon|banana roll|tart|kukis|cookies|pastry|pia/.test(n)) return [
  'Siapkan alat dan loyang; timbang semua bahan sesuai komposisi.',
  'Siapkan bahan dan loyang sesuai jenis produk (misalnya olesi atau alasi loyang bila diperlukan).',
  'Campur atau kocok bahan mengikuti urutan formula sampai tekstur yang diinginkan tercapai; hindari mengubah urutan tanpa uji.',
  'Masukkan adonan ke loyang atau bentuk sesuai ukuran produk.',
  'Panggang atau kukus sesuai suhu dan waktu yang sudah diuji untuk resep dan alat yang digunakan; periksa kematangan.',
  'Dinginkan sebelum diberi isian, topping, dipotong, atau dikemas.',
  'Periksa berat, ukuran, tampilan, dan jumlah hasil; catat hasil aktual untuk mengoreksi HPP.'
 ].join('\n');
 if(/kopi|teh|wedang|jahe|susu|jus|es |sirup|minuman|cokelat panas|coklat panas/.test(n)||/warung kopi|minuman|cafe|café/.test(b)) return [
  'Siapkan alat saji dan semua bahan; periksa kebersihan alat.',
  'Takar setiap bahan sesuai komposisi untuk satu porsi.',
  'Seduh, larutkan, blender, atau panaskan bahan sesuai karakter minuman dan urutan resep.',
  'Aduk hingga tercampur merata; sesuaikan suhu dan es sesuai varian yang dijual.',
  'Tuang ke gelas dengan ukuran yang konsisten, lalu sajikan.',
  'Periksa rasa dan ukuran porsi. Catat perubahan takaran jika resep usaha diperbaiki.'
 ].join('\n');
 if(/nasi|ayam|sapi|ikan|goreng|soto|bakso|sambal|sayur|mie|mi |mie|katering|catering|rendang|opor|sup|soup|lontong|arem|bubur|masakan|makanan/.test(n)||/makanan|katering|catering|restoran|warung makan/.test(b)) return [
  'Siapkan alat dan bahan. Cuci serta potong bahan yang perlu dipersiapkan.',
  'Takar bahan dan bumbu sesuai komposisi untuk jumlah porsi yang dibuat.',
  'Olah bahan mengikuti urutan resep; masukkan bahan yang membutuhkan waktu masak lebih lama terlebih dahulu.',
  'Masak sampai tingkat kematangan yang aman dan sesuai standar produk.',
  'Cicipi atau periksa kualitas dengan alat bersih, lalu sesuaikan hanya berdasarkan standar resep usaha.',
  'Timbang atau bagi menjadi porsi yang konsisten, kemudian sajikan atau kemas.'
 ].join('\n');
 return [
  'Siapkan alat, tempat kerja, dan seluruh bahan sesuai komposisi.',
  'Periksa kondisi dan jumlah setiap bahan sebelum mulai.',
  'Lakukan pencampuran, perakitan, atau pengolahan sesuai urutan proses usaha.',
  'Periksa hasil akhir terhadap ukuran, fungsi, tampilan, dan mutu yang diharapkan.',
  'Rapikan atau kemas produk, lalu catat hasil aktual dan bahan yang terpakai.'
 ].join('\n');
}
function renderRecipeInstructionPreview(){
 const field=$('recipeInstructions'),list=$('recipeInstructionsPreview');if(!field||!list)return;
 const steps=String(field.value||'').split(/\r?\n/).map(line=>line.trim().replace(/^\s*(?:(?:langkah\s*)?\d+\s*[.)、:-]|[-•*])\s*/i,'').trim()).filter(Boolean);
 list.innerHTML=steps.length?steps.map(step=>`<li>${esc(step)}</li>`).join(''):'<li class="recipe-instruction-empty">Belum ada langkah. Ketik langkah pertama pada kotak di bawah.</li>';
}
function updateRecipeInstructionStatusNote(){}
async function ensureRecipeInstructionDefaults(){
 const recipes=await getAll('recipes');if(!recipes.length)return;
 const products=await getAll('products');const productMap=new Map(products.map(p=>[Number(p.id),p]));
 for(const recipe of recipes){
  if(!Array.isArray(recipe.lines)||!recipe.lines.length)continue;
  let changed=false;const product=productMap.get(Number(recipe.productId));
  if(!String(recipe.instructions||'').trim()){
   recipe.instructions=starterInstructionsForProduct(product?.name||'produk',currentProfile?.business||currentProfile?.businessType||currentProfile?.type||'');
   recipe.instructionStatus='panduan_awal';changed=true;
  }
  if(!recipe.instructionStatus){recipe.instructionStatus='panduan_awal';changed=true;}
  if(changed){recipe.instructionsUpdatedAt=recipe.instructionsUpdatedAt||dateNow();recipe.updatedAt=recipe.updatedAt||dateNow();await put('recipes',recipe);}
 }
}
async function renderRecipePage(){
 await ensureRecipeInstructionDefaults();
 const products=(await getAll('products')).filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false).sort((a,b)=>String(a.name).localeCompare(String(b.name),'id'));
 const allMaterials=(await getAll('materials')).filter(m=>m.active!==false);
 const allProducts=await getAll('products');
 const materials=visibleMaterialsForJuice(allMaterials,allProducts);
 const currentName=$('recipeProduct').value.trim();
 $('recipeProductOptions').innerHTML=products.map(p=>`<option value="${esc(p.name)}"></option>`).join('');
 $('recipeProductSelect').innerHTML='<option value="">— Pilih produk / paket —</option>'+products.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
 $('recipeMaterialOptions').innerHTML=materials.map(m=>`<option value="${esc(m.name)}"></option>`).join('');
 if(!currentName&&products.length)$('recipeProduct').value=products[0].name;
 const activeName=$('recipeProduct').value.trim();
 const exact=products.find(p=>String(p.name).trim().toLocaleLowerCase('id')===activeName.toLocaleLowerCase('id'));
 $('recipeProductSelect').value=exact?exact.name:'';
 await renderRecipeForm();
 updateRecipeReferenceNote($('recipeProduct').value.trim());
}
async function renderRecipeForm(){
 const name=$('recipeProduct').value.trim();
 const activeProductLabel=$('recipeActiveProductName');if(activeProductLabel)activeProductLabel.textContent=name||'Pilih produk terlebih dahulu';
 const products=(await getAll('products')).filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false);
 const product=products.find(p=>String(p.name).trim().toLocaleLowerCase('id')===name.toLocaleLowerCase('id'));
 const recipe=product?(await getAll('recipes')).find(r=>Number(r.productId)===Number(product.id)):null;
 const instructionBody=$('recipeInstructionsBody'),instructionToggle=$('toggleRecipeInstructions');if(instructionBody)instructionBody.hidden=true;if(instructionToggle){instructionToggle.setAttribute('aria-expanded','false');const sub=instructionToggle.querySelector('.recipe-process-toggle-copy small');if(sub)sub.textContent='Klik untuk melihat cara pembuatan langkah demi langkah'}const instructionField=$('recipeInstructions');if(instructionField)instructionField.value=recipe?.instructions||starterInstructionsForProduct(name,currentProfile?.business||currentProfile?.businessType||currentProfile?.type||'');renderRecipeInstructionPreview();
 if($('recipeSizeMode'))$('recipeSizeMode').value=recipe?.variants?.length?'multiple':'single';if($('recipeBasisMode'))$('recipeBasisMode').value=recipe?.recipeBasis==='finished_kg'?'finished_kg':'unit';if($('recipeExpectedYield'))$('recipeExpectedYield').value=recipe?.recipeBasis==='finished_kg'?(Number(recipe.expectedYieldUnits)||premiumYieldForProduct(product)||50):1;if($('recipeTargetFinishedGrams'))$('recipeTargetFinishedGrams').value=recipe?.recipeBasis==='finished_kg'?(Number(recipe.targetFinishedGrams)||1000):1000;renderRecipeBasisHelp();renderRecipeVariantEditor(recipe?.variants||null);
 const allMaterials=(await getAll('materials')).filter(m=>m.active!==false);
 const visibleMaterials=visibleMaterialsForJuice(allMaterials,await getAll('products'));
 $('recipeMaterialOptions').innerHTML=visibleMaterials.map(m=>`<option value="${esc(m.name)}"></option>`).join('');
 $('recipeLines').innerHTML='';
 if(recipe?.lines?.length){
  for(const line of recipe.lines){const m=allMaterials.find(x=>Number(x.id)===Number(line.materialId));if(!m)continue;const displayLine=normalizeRecipeLineForDisplay(line,m);appendRecipeLine({name:m.name,qty:displayLine.qty,unit:displayLine.unit,price:displayLine.price,materialId:m.id});}
 }else appendRecipeLine();
 $('recipeLines').dataset.basisMode=$('recipeBasisMode')?.value||'unit';renderRecipeBasisHelp();updateRecipeReferenceNote(name);renderRecipePreviewLive();
}
function renderRecipeBasisHelp(){const mode=$('recipeBasisMode')?.value||'unit',yieldInput=$('recipeExpectedYield'),target=$('recipeTargetFinishedGrams'),help=$('recipeBasisHelp');if(yieldInput)yieldInput.disabled=mode!=='finished_kg';if(target){target.disabled=true;target.value='1000';}if(help)help.textContent=mode==='finished_kg'?'Takaran bahan di bawah adalah untuk target 1 kg produk jadi. Isi perkiraan jumlah buah/porsi yang dihasilkan; HPP per buah dihitung dari total biaya batch dibagi jumlah hasil. Angka hasil perlu dikonfirmasi dengan penimbangan uji dapur.':'Takaran bahan di bawah adalah untuk satu satuan jual. Untuk mengubah ke basis 1 kg, pilih “Target 1 kg produk jadi”; aplikasi akan mengalikan takaran per satuan dengan jumlah hasil.';updateRecipeReferenceNote($('recipeProduct')?.value.trim()||'produk makanan')}
function changeRecipeBasis(){const next=$('recipeBasisMode')?.value||'unit',prev=$('recipeLines')?.dataset.basisMode||'unit';if(next!==prev){let yieldUnits=Number($('recipeExpectedYield')?.value)||1;if(next==='finished_kg'&&yieldUnits<=1){const productName=$('recipeProduct').value.trim();yieldUnits=defaultYieldForProductName(productName);$('recipeExpectedYield').value=String(yieldUnits)}yieldUnits=Math.max(1,yieldUnits);for(const row of $('recipeLines').querySelectorAll('.recipe-line')){const q=row.querySelector('.recipe-qty'),v=Number(q.value||0);if(v>0)q.value=cleanNumberString(next==='finished_kg'?v*yieldUnits:v/yieldUnits,4)}$('recipeLines').dataset.basisMode=next;}renderRecipeBasisHelp();renderRecipePreviewLive()}
function recipeAutoCost(row){
 const purchaseQty=Number(row.querySelector('.recipe-buy-qty')?.value||0),purchaseUnit=row.querySelector('.recipe-buy-unit')?.value.trim()||'',buyPrice=Number(row.querySelector('.recipe-buy-price')?.value||0),recipeUnit=row.querySelector('.recipe-unit')?.value.trim()||'';
 const converted=convertQty(purchaseQty,purchaseUnit,recipeUnit);
 const costInput=row.querySelector('.recipe-price');
 if(!purchaseQty||purchaseQty<=0||!buyPrice||buyPrice<0||converted===null||converted<=0){if(costInput)costInput.value='';const out=row.querySelector('.recipe-auto-help');if(out)out.textContent=converted===null?'Satuan pembelian dan resep berbeda jenis. Pilih satuan yang bisa dikonversi.':'Isi jumlah dan harga beli untuk menghitung biaya otomatis.';return null}
 const cost=buyPrice/converted;if(costInput)costInput.value=String(cost);const out=row.querySelector('.recipe-auto-help');if(out)out.textContent=`Biaya otomatis: ${money(cost)} per ${recipeUnit}.`;return cost;
}
function appendRecipeLine(data={}){
 const root=$('recipeLines');if(!root)return;
 const row=document.createElement('div');row.className='recipe-line recipe-line-easy';
 const name=data.name||'',qty=data.qty==null?'':cleanNumberString(data.qty,4),unit=data.unit||recipeDefaultUnit(name,''),price=data.price??'';
 row.innerHTML=`<div class="recipe-material-cell"><label>Nama bahan<input class="recipe-material-name" list="recipeMaterialOptions" value="${esc(name)}" placeholder="Mis. tepung" autocomplete="off" aria-label="Nama bahan"></label></div><div class="recipe-buy-fields"><label>Harga beli (Rp)<input class="recipe-buy-price" type="number" min="0" step="1" value="${esc(price)}" placeholder="Mis. 10000" aria-label="Harga beli total"></label><label>Jumlah dibeli<input class="recipe-buy-qty" type="number" min="0.0001" step="0.0001" value="1" placeholder="Mis. 1" aria-label="Jumlah pembelian"></label><label>Satuan beli<input class="recipe-buy-unit" type="text" maxlength="24" value="${esc(unit)}" placeholder="Kg / gram / butir" list="recipeUnitOptions" aria-label="Satuan pembelian"></label></div><div class="recipe-use-fields"><label>Takaran resep<input class="recipe-qty" type="number" min="0.0001" step="0.0001" value="${esc(qty)}" placeholder="Mis. 250" aria-label="Takaran resep"></label><label>Satuan resep<input class="recipe-unit" type="text" maxlength="24" value="${esc(unit)}" placeholder="Gram / butir" list="recipeUnitOptions" aria-label="Satuan resep"></label></div><div class="recipe-auto-help" aria-live="polite">Isi harga dan jumlah pembelian. Biaya resep dihitung otomatis.</div><input class="recipe-price" type="hidden" value="${esc(price)}"><button type="button" class="recipe-remove" aria-label="Hapus bahan" title="Hapus bahan">×</button>`;
 root.appendChild(row);
 if(!$('recipeUnitOptions')){const dl=document.createElement('datalist');dl.id='recipeUnitOptions';dl.innerHTML=['Butir','Buah','Pcs','Porsi','Gram','Ons','Kg','Ml','Liter','Sendok makan','Sendok teh','Lembar','Ikat','Sachet','Bungkus','Potong','Botol','Pack','Roll','Meter','Rim'].map(x=>`<option value="${x}"></option>`).join('');$('page-recipes').appendChild(dl)}
 // Existing recipe line cost is preserved as an equivalent purchase amount until user edits it.
 row.querySelector('.recipe-buy-price').value=price===''?'':cleanNumberString(price,0);
 row.querySelector('.recipe-buy-qty').value='1';row.querySelector('.recipe-buy-unit').value=unit;row.querySelector('.recipe-qty').value=qty===''?'':cleanNumberString(qty,4);
 const update=()=>{recipeAutoCost(row);renderRecipePreviewLive()};
 row.querySelector('.recipe-material-name').addEventListener('change',async e=>{
  const n=e.target.value.trim(),m=(await getAll('materials')).find(x=>String(x.name).trim().toLocaleLowerCase('id')===n.toLocaleLowerCase('id'));
  if(m){const buyUnit=m.unit||recipeDefaultUnit(m.name,'');row.querySelector('.recipe-buy-unit').value=buyUnit;row.querySelector('.recipe-unit').value=recipeDefaultUnit(m.name,m.unit);const cost=Number(m.cost||0);if(cost>0){row.querySelector('.recipe-buy-price').value=cleanNumberString(cost,0);row.querySelector('.recipe-buy-qty').value='1';}}
  else {const suggested=recipeDefaultUnit(n,'');if(!row.querySelector('.recipe-unit').value)row.querySelector('.recipe-unit').value=suggested;if(!row.querySelector('.recipe-buy-unit').value)row.querySelector('.recipe-buy-unit').value=suggested;}
  update();
 });
 row.querySelectorAll('.recipe-buy-price,.recipe-buy-qty,.recipe-buy-unit,.recipe-qty,.recipe-unit').forEach(el=>{el.addEventListener('input',update);el.addEventListener('change',update)});
 row.querySelector('.recipe-remove').onclick=()=>{row.remove();if(!$('recipeLines').children.length)appendRecipeLine();renderRecipePreviewLive()};
 if(price!==''&&qty!=='')row.querySelector('.recipe-auto-help').textContent=`Biaya otomatis: ${money(Number(price)||0)} per ${unit}. Periksa harga beli dan satuannya.`;
}

function renderRecipeSizePreview(){
 const mode=$('recipeSizeMode')?.value||'single',label=$('recipeSizePreviewLabel'),box=$('recipeSizePreview');
 if(!label||!box)return;
 if(mode!=='multiple'){label.hidden=true;box.hidden=true;box.innerHTML='';return}
 const variants=readRecipeVariants();
 if(!variants.length){label.hidden=true;box.hidden=true;return}
 label.hidden=true;box.hidden=false;renderRecipeSizeChoices();
 let selected=Number(box.dataset.selectedIndex||0);if(selected<0||selected>=variants.length)selected=0;
 const variant=variants[selected]||variants[0],mult=Number(variant.multiplier)||1;
 const lines=[...$('recipeLines').querySelectorAll('.recipe-line')];let total=0;
 const rows=lines.map(row=>{const name=row.querySelector('.recipe-material-name').value.trim();const qty=Number(row.querySelector('.recipe-qty').value||0);const unit=row.querySelector('.recipe-unit').value.trim();recipeAutoCost(row);const raw=row.querySelector('.recipe-price').value;const price=raw===''?0:Math.max(0,Number(raw)||0);const adjusted=qty*mult;const subtotal=adjusted*price;total+=subtotal;return `<tr><td>${esc(name||'—')}</td><td>${Number(adjusted.toFixed(4)).toLocaleString('id-ID',{maximumFractionDigits:4})} ${esc(unit)}</td><td>${money(price)}</td><td>${money(subtotal)}</td></tr>`}).join('');
 box.dataset.selectedIndex=String(selected);
 box.innerHTML=`<h4>Komposisi ukuran ${esc(variant.name||`Ukuran ${selected+1}`)}</h4><div class="recipe-size-preview-summary"><span>Harga jual: <b>${variant.price===''?'Belum diisi':money(Number(variant.price)||0)}</b></span><span>Pengali takaran: <b>${mult.toLocaleString('id-ID')}</b></span><span>HPP bahan ukuran ini: <b>${money(total)}</b></span></div><div class="recipe-size-preview-table-wrap"><table class="recipe-size-preview-table"><thead><tr><th>Bahan / produk</th><th>Jumlah sesuai ukuran</th><th>Harga per satuan</th><th>Total HPP</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Tambahkan bahan untuk menghitung HPP.</td></tr>'}</tbody></table></div>`;

}
async function renderRecipePreviewLive(){
 const materials=await getAll('materials');let cost=0;
 for(const row of $('recipeLines').querySelectorAll('.recipe-line')){
  const name=row.querySelector('.recipe-material-name').value.trim(),qty=Number(row.querySelector('.recipe-qty').value||0);recipeAutoCost(row);const priceRaw=row.querySelector('.recipe-price').value;
  if(name&&qty>0&&priceRaw!=='')cost+=qty*Math.max(0,Number(priceRaw)||0);
 }
 const basis=$('recipeBasisMode')?.value||'unit',yieldUnits=Math.max(1,Number($('recipeExpectedYield')?.value)||1);$('recipeCostPreview').textContent=basis==='finished_kg'?`HPP batch 1 kg: ${money(cost)} · Perkiraan HPP per ${$('recipeProductSelect')?.value?'buah/porsi':'satuan'}: ${money(cost/yieldUnits)} (${yieldUnits} hasil)`:'Perkiraan HPP bahan per satuan: '+money(cost);
 renderRecipeSizePreview();
}
async function saveRecipePage(){
 const productName=$('recipeProduct').value.trim();if(!productName){toast('Ketik atau pilih nama produk/paket terlebih dahulu.');$('recipeProduct').focus();return}
 const allProducts=(await getAll('products')).filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false);
 let product=allProducts.find(p=>String(p.name).trim().toLocaleLowerCase('id')===productName.toLocaleLowerCase('id'));
 const rows=[...$('recipeLines').querySelectorAll('.recipe-line')];
 const prepared=[];
 for(const row of rows){
  const name=row.querySelector('.recipe-material-name').value.trim();if(!name)continue;
  const qty=Number(row.querySelector('.recipe-qty').value||0),unit=row.querySelector('.recipe-unit').value.trim()||recipeDefaultUnit(name,''),priceRaw=row.querySelector('.recipe-price').value,price=priceRaw===''?0:Number(priceRaw);
  if(!(qty>0)||!Number.isFinite(qty)){toast(`Masukkan jumlah lebih dari nol untuk bahan ${name}.`);row.querySelector('.recipe-qty').focus();return}
  if(priceRaw===''){toast(`Isi biaya untuk 1 ${unit} bahan ${name}. Jika belum tahu, hitung dari harga beli dan takaran yang digunakan.`);row.querySelector('.recipe-price').focus();return}
  if(!Number.isFinite(price)||price<0){toast(`Harga bahan ${name} tidak valid.`);row.querySelector('.recipe-price').focus();return}
  prepared.push({name,qty,unit,price,priceEntered:priceRaw!==''});
 }
 if(!prepared.length){toast('Tambahkan minimal satu bahan dan jumlahnya.');return}
 const recipeBasis=$('recipeBasisMode')?.value||'unit',expectedYieldUnits=Math.max(1,Number($('recipeExpectedYield')?.value)||1),targetFinishedGrams=Math.max(1,Number($('recipeTargetFinishedGrams')?.value)||1000);if(recipeBasis==='finished_kg'&&(!(Number($('recipeExpectedYield').value)>0)||!Number.isFinite(Number($('recipeExpectedYield').value)))){toast('Isi perkiraan jumlah buah/porsi hasil dari target 1 kg.');$('recipeExpectedYield').focus();return}const sizeMode=$('recipeSizeMode')?.value||'single';let variants=sizeMode==='multiple'?readRecipeVariants():[];if(sizeMode==='multiple'){if(variants.length<2){toast('Tambahkan minimal dua ukuran menu.');return}const seen=new Set();for(const v of variants){const key=v.name.toLocaleLowerCase('id');if(!v.name||seen.has(key)){toast('Nama setiap ukuran wajib diisi dan tidak boleh sama.');return}seen.add(key);if(!(Number(v.price)>=0)||v.price===''){toast(`Isi harga jual untuk ukuran ${v.name}.`);return}if(!(Number(v.multiplier)>0)||!Number.isFinite(Number(v.multiplier))){toast(`Pengali takaran ukuran ${v.name} harus lebih dari nol.`);return}}}
 const instructions=String($('recipeInstructions')?.value||'').trim();if(!instructions){toast('Isi cara membuat/proses kerja untuk produk yang memakai komposisi.');$('recipeInstructions')?.focus();return}const instructionStatus='panduan_awal';
 const priorRecipes=await getAll('recipes');const existing=product?priorRecipes.find(r=>Number(r.productId)===Number(product.id)):null;
 try{
  const materials=await getAll('materials');
  for(const item of prepared){const found=materials.find(x=>String(x.name||'').trim().toLocaleLowerCase('id')===item.name.toLocaleLowerCase('id'));if(found&&convertQty(item.qty,item.unit,found.unit||item.unit)===null&&!item.priceEntered){toast(`Satuan ${item.unit} untuk ${item.name} tidak bisa dikonversi otomatis dari satuan stok ${found.unit}. Isi biaya untuk jumlah 1 ${item.unit} pada kolom biaya per satuan agar HPP benar.`);return}}
  if(!product){
   const defaultUnit=/catering|katering|makanan|kue|roti|minuman|bakery|resto|cafe|café/i.test(String(currentProfile?.business||''))?'Porsi':'Pcs';
   const id=await add('products',{name:productName,category:/catering|katering/i.test(String(currentProfile?.business||''))?'Paket Catering':'Produk',unit:defaultUnit,price:0,cost:0,costMode:'auto',stock:0,stockEnabled:false,forSale:true,active:true,source:'user',createdAt:dateNow(),updatedAt:dateNow()});
   product={id:Number(id),name:productName,category:'Produk',unit:defaultUnit,price:0,cost:0,costMode:'auto',active:true,forSale:true};
  }
  const lines=[];
  for(const item of prepared){
   let m=materials.find(x=>String(x.name||'').trim().toLocaleLowerCase('id')===item.name.toLocaleLowerCase('id'));
   if(!m){
    const opts=businessMaterialOptions();const lower=item.name.toLocaleLowerCase('id');
    const category=/telur|tepung|beras|ayam|daging|ikan|sayur|bumbu|gula|garam|minyak|susu|santan|bawang|cabai|cabe/.test(lower)?opts.categories[0]:'Bahan baku';
    const mid=await add('materials',{name:item.name,category,unit:item.unit,cost:item.price,stock:0,stockEnabled:true,active:true,createdAt:dateNow(),updatedAt:dateNow()});
    m={id:Number(mid),name:item.name,unit:item.unit,cost:item.price,stock:0,active:true};materials.push(m);
   }
   const existingUnit=item.unit||m.unit||'Pcs';
   if(convertQty(item.qty,existingUnit,m.unit||existingUnit)===null&&!item.priceEntered){toast(`Satuan ${existingUnit} untuk ${item.name} berbeda dari satuan stok ${m.unit}. Isi biaya untuk 1 ${existingUnit} pada kolom biaya per satuan.`);return}
   lines.push({materialId:Number(m.id),qty:item.qty,unit:existingUnit,unitPrice:item.price});
  }
  if(existing)await del('recipes',existing.id);
  const cleanedLines=collapseRecipeLines(lines);
  await add('recipes',{productId:Number(product.id),lines:cleanedLines,variants,mode:'auto',recipeBasis,targetFinishedGrams:recipeBasis==='finished_kg'?targetFinishedGrams:0,expectedYieldUnits:recipeBasis==='finished_kg'?expectedYieldUnits:1,yieldUnit:product.unit||'Pcs',recipeStatus:recipeBasis==='finished_kg'?'formula_awal_perlu_uji_dapur':'resep_usaha',instructions,instructionStatus,instructionsUpdatedAt:dateNow(),createdAt:existing?.createdAt||dateNow(),updatedAt:dateNow()});
  if(variants.length){const defaultVariant=variants.find(v=>v.name.toLocaleLowerCase('id')==='sedang')||variants[0];product.price=Number(defaultVariant.price)||0;product.defaultRecipeSize=defaultVariant.name;}product.costMode='auto';await put('products',product);
  await recalculateRecipeCosts();await renderProducts();await renderCashItems();await renderRecipePage();$('recipeProduct').value=product.name;await renderRecipeForm();
  toast(`Komposisi ${product.name} tersimpan. ${lines.length-cleanedLines.length>0?`${lines.length-cleanedLines.length} bahan berulang digabung. `:''}HPP bahan dasar ${money(prepared.reduce((a,x)=>a+x.qty*x.price,0))}. HPP ukuran mengikuti pengali takaran.`);
 }catch(err){console.error(err);toast('Gagal menyimpan komposisi: '+(err.message||'kesalahan database'));}
}
async function renderAssets(){const assets=(await getAll('assets')).filter(a=>a.active!==false&&((($('assetSearch').value||'').trim().toLowerCase())===''||a.name.toLowerCase().includes(($('assetSearch').value||'').trim().toLowerCase())));$('assetsList').innerHTML=assets.length?assets.map(a=>`<div class="productrow"><div class="info"><strong>${esc(a.name)}</strong><div class="muted">${esc(a.category||'Peralatan')} · Beli ${money(a.cost)} · ${esc(a.date||'Tanggal belum diisi')}</div>${a.lifeMonths?`<div class="muted">Penyusutan opsional: ${money(Number(a.cost||0)/Number(a.lifeMonths))}/bulan</div>`:''}</div><div class="rowactions"><button data-aedit="${a.id}">Edit</button><button data-adel="${a.id}">Hapus</button></div></div>`).join(''):'<div class="empty">Belum ada investasi/peralatan.</div>';const all=await getAll('assets');$('assetsList').querySelectorAll('[data-aedit]').forEach(b=>b.onclick=()=>{const a=all.find(x=>x.id===Number(b.dataset.aedit));$('assetId').value=a.id;$('assetName').value=a.name;$('assetCategory').value=a.category||'';$('assetCost').value=a.cost||0;$('assetDate').value=a.date||'';$('assetLife').value=a.lifeMonths||'';window.scrollTo({top:0,behavior:'smooth'})});$('assetsList').querySelectorAll('[data-adel]').forEach(b=>b.onclick=async()=>{if(!confirm('Hapus catatan aset ini?'))return;const a=await get('assets',Number(b.dataset.adel));a.active=false;await put('assets',a);renderAssets()})}
async function saveAsset(){const name=$('assetName').value.trim();if(!name){toast('Nama investasi/peralatan wajib diisi.');return}const id=Number($('assetId').value||0),old=id?await get('assets',id):null,a={...(old||{}),name,category:$('assetCategory').value.trim()||'Peralatan',cost:Math.max(0,Number($('assetCost').value)||0),date:$('assetDate').value||'',lifeMonths:Math.max(0,Number($('assetLife').value)||0),active:true,updatedAt:dateNow()};if(id)a.id=id;await put('assets',a);$('assetForm').reset();$('assetId').value='';renderAssets();toast('Catatan investasi/peralatan disimpan. Nilainya tidak otomatis dimasukkan ke HPP produk.')}
async function renderCashItems(){const term=$('cashSearch').value.trim().toLowerCase(),ps=(await getAll('products')).filter(p=>p.active!==false&&!p.legacyMaterial&&p.forSale!==false&&p.name.toLowerCase().includes(term));$('cashItems').innerHTML=ps.length?ps.map(p=>`<button class="cashitem" data-addcart="${p.id}"><strong>${esc(p.name)}</strong><small>${p.price>0?money(p.price):'Harga belum diisi'}${p.stockEnabled?' · Stok '+Number(p.stock||0):''}</small></button>`).join(''):'<div class="empty">Belum ada produk untuk dijual.</div>'; $('cashItems').querySelectorAll('[data-addcart]').forEach(b=>b.onclick=()=>addCart(Number(b.dataset.addcart)))}
async function addCart(id){const p=await get('products',id);if(!p)return;const recipe=(await getAll('recipes')).find(r=>Number(r.productId)===Number(id));let variant=null;if(recipe?.variants?.length){const choices=recipe.variants.map((v,i)=>`${i+1}. ${v.name} — ${money(Number(v.price)||0)}`).join('\n');const answer=window.prompt('Pilih ukuran untuk '+p.name+':\n'+choices+'\n\nKetik nomor atau nama ukuran:',String(Math.max(1,recipe.variants.findIndex(v=>v.name===p.defaultRecipeSize)+1)));if(answer===null)return;const n=Number(answer);variant=Number.isInteger(n)&&n>=1&&n<=recipe.variants.length?recipe.variants[n-1]:recipe.variants.find(v=>v.name.toLocaleLowerCase('id')===answer.trim().toLocaleLowerCase('id'));if(!variant){toast('Ukuran tidak dikenali. Pilih nomor atau nama ukuran yang tersedia.');return}}const price=variant?Number(variant.price)||0:Number(p.price)||0,cost=variant?(Number(p.cost)||0)*(Number(variant.multiplier)||1):Number(p.cost)||0;if(!(price>0)){toast('Isi harga jual produk atau ukuran terlebih dahulu.');return}const row=cart.find(x=>x.id===id&&String(x.variantName||'')===String(variant?.name||''));const qty=(row?.qty||0)+1;if(p.stockEnabled&&qty>Number(p.stock||0)){toast('Stok tidak mencukupi.');return}if(row)row.qty=qty;else cart.push({id,name:p.name,variantName:variant?.name||'',variantMultiplier:variant?.multiplier||1,unit:p.unit||'Pcs',price,cost,qty});renderCart()}
function getCheckoutAmounts(){const subtotal=cart.reduce((a,x)=>a+x.qty*x.price,0);const taxRate=Math.max(0,Math.min(100,Number($('taxRate')?.value||0)));const taxAmount=Math.round(subtotal*taxRate)/100;const otherFee=Math.max(0,Math.round(Number($('otherFee')?.value||0)));const total=Math.round(subtotal+taxAmount+otherFee);const receivedRaw=$('cashReceived')?.value?.trim()||'';const received=receivedRaw===''?0:Math.max(0,Math.round(Number(receivedRaw)||0));return {subtotal,taxRate,taxAmount,otherFee,total,received,change:Math.max(0,received-total),shortage:Math.max(0,total-received),hasReceived:receivedRaw!==''}}
function updateCheckoutSummary(){if(!$('cartTotal'))return;const a=getCheckoutAmounts();$('cartSubtotal').textContent=money(a.subtotal);$('cartTax').textContent=money(a.taxAmount);$('cartOther').textContent=money(a.otherFee);$('cartTotal').textContent=money(a.total);$('changeAmount').textContent=money(a.hasReceived?a.change:0);$('paymentStatus').textContent=a.hasReceived&&a.shortage>0?'Uang masih kurang':'Kembalian';$('paymentStatus').style.color=a.hasReceived&&a.shortage>0?'var(--red)':'';$('checkout').disabled=!cart.length||!a.hasReceived||a.shortage>0}
function renderCart(){const root=$('cartList');if(!cart.length){root.innerHTML='<p>Belum ada barang.</p>'}else root.innerHTML=cart.map((x,i)=>`<div class="cartline"><div class="cart-main"><strong>${esc(x.name)}${x.variantName?' — '+esc(x.variantName):''}</strong><div class="muted">${money(x.price)} / ${esc(x.unit||'Pcs')}</div><div class="cart-subtotal" data-line-subtotal="${i}">${x.qty} × ${money(x.price)} = ${money(x.qty*x.price)}</div></div><div class="qty-control"><button type="button" class="qty-button" data-minus="${i}" aria-label="Kurangi ${esc(x.name)}">−</button><input class="qty-input" data-qty="${i}" type="number" min="1" step="1" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" value="${x.qty}" aria-label="Ketik jumlah ${esc(x.name)}" title="Ketik jumlah barang"><button type="button" class="qty-button" data-plus="${i}" aria-label="Tambah ${esc(x.name)}">+</button><button type="button" class="qty-remove" data-remove="${i}" aria-label="Hapus ${esc(x.name)}">×</button></div></div>`).join('');root.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const i=+b.dataset.minus;if(!cart[i])return;cart[i].qty--;if(cart[i].qty<=0)cart.splice(i,1);renderCart()});root.querySelectorAll('[data-plus]').forEach(b=>b.onclick=async()=>{const i=+b.dataset.plus;if(!cart[i])return;const p=await get('products',cart[i].id);if(p?.stockEnabled&&cart[i].qty+1>Number(p.stock||0)){toast('Stok tidak mencukupi.');return}cart[i].qty++;renderCart()});root.querySelectorAll('[data-qty]').forEach(input=>{input.onchange=async()=>{const i=+input.dataset.qty;if(!cart[i])return;const raw=input.value.trim(),qty=Number(raw);if(raw===''||!Number.isInteger(qty)||qty<1){toast('Jumlah harus bilangan bulat minimal 1.');renderCart();return}const p=await get('products',cart[i].id);if(p?.stockEnabled&&qty>Number(p.stock||0)){toast('Jumlah melebihi stok yang tersedia.');renderCart();return}cart[i].qty=qty;renderCart()};input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();input.blur()}}});root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.remove,1);renderCart()});updateCheckoutSummary()}
let pendingShortageRows=[];
function openStockShortageDialog(rows){
 pendingShortageRows=rows;
 const root=$('stockShortageList');
 root.innerHTML=rows.map((row,i)=>`<div class="shortage-stock-row" data-shortage-row="${i}"><strong>${esc(row.material.name)}</strong><div class="muted">Dibutuhkan ${Number(row.required).toLocaleString('id-ID',{maximumFractionDigits:4})} ${esc(row.material.unit||'unit')} · Tersedia ${Number(row.available).toLocaleString('id-ID',{maximumFractionDigits:4})} ${esc(row.material.unit||'unit')} · Kurang ${Number(row.shortage).toLocaleString('id-ID',{maximumFractionDigits:4})} ${esc(row.material.unit||'unit')}</div><div class="grid two"><label>Jumlah yang ditambah (${esc(row.material.unit||'unit')})<input data-shortage-qty="${i}" type="number" min="0" step="0.0001" value="${String(Math.ceil(row.shortage*10000)/10000)}" inputmode="decimal"></label><label>Harga beli per ${esc(row.material.unit||'unit')} (Rp)<input data-shortage-cost="${i}" type="number" min="0" step="1" value="${Math.max(0,Number(row.material.cost)||0)}" inputmode="numeric"></label></div></div>`).join('');
 const dialog=$('stockShortageDialog');if(!dialog.open)dialog.showModal();
}
async function saveShortageStock(){
 const btn=$('saveShortageStock');if(btn.disabled)return;
 const entries=[];
 for(let i=0;i<pendingShortageRows.length;i++){
  const row=pendingShortageRows[i],qtyRaw=$('stockShortageList').querySelector(`[data-shortage-qty="${i}"]`).value.trim(),costRaw=$('stockShortageList').querySelector(`[data-shortage-cost="${i}"]`).value.trim(),qty=Number(qtyRaw),cost=Number(costRaw);
  if(qtyRaw===''||!Number.isFinite(qty)||qty<0||costRaw===''||!Number.isFinite(cost)||cost<0){toast('Isi jumlah tambahan stok (0 jika tidak jadi membeli) dan harga beli dengan benar.');return}
  if(qty>0)entries.push({row,qty,cost});
 }
 if(!entries.length){$('stockShortageDialog').close();toast('Tidak ada tambahan stok yang disimpan. Transaksi belum disimpan.');return}
 btn.disabled=true;
 try{
  const tx=db.transaction(['materials','materialPurchases'],'readwrite'),materials=tx.objectStore('materials'),history=tx.objectStore('materialPurchases'),stamp=dateNow(),date=localDateValue();
  let failed=false;
  for(const entry of entries){
   const {row,qty,cost}=entry,req=materials.get(Number(row.material.id));
   req.onsuccess=()=>{
    const item=req.result;
    if(!item||String(item.businessId??'legacy')!==String(activeBusinessId??'legacy')){failed=true;try{tx.abort()}catch{}return}
    const before=Math.max(0,Number(item.stock||0)),oldCost=Math.max(0,Number(item.cost||0)),newStock=before+qty,total=Math.round(qty*cost);
    item.stock=newStock;item.cost=newStock>0?((before*oldCost)+(qty*cost))/newStock:cost;item.stockEnabled=true;item.active=true;item.updatedAt=stamp;materials.put(item);
    history.add({businessId:activeBusinessId,itemType:'material',itemId:Number(item.id),materialId:Number(item.id),materialName:item.name,itemName:item.name,qty,unit:item.unit||'Pcs',total,unitCost:cost,date,packageMode:false,purchasedQty:qty,purchaseUnit:item.unit||'Pcs',contentPerPack:1,createdAt:stamp,note:'Pembelian cepat dari peringatan stok kurang saat transaksi'});
   };
   req.onerror=()=>{failed=true;try{tx.abort()}catch{}};
  }
  tx.oncomplete=async()=>{
   btn.disabled=false;$('stockShortageDialog').close();
   try{await recalculateRecipeCosts();await renderMaterials();await renderProducts();await renderCashItems();await renderRecipePage();await renderPurchaseHistory();toast('Tambahan stok tercatat sebagai pembelian. Transaksi akan diperiksa kembali.');await checkout()}
   catch(err){console.error(err);toast('Stok sudah diperbarui. Silakan tekan Simpan transaksi kembali.')}
  };
  tx.onerror=()=>{btn.disabled=false;toast('Gagal menambah stok: '+(tx.error?.message||'kesalahan database'))};
  tx.onabort=()=>{btn.disabled=false;if(failed)toast('Bahan tidak ditemukan atau usaha tidak cocok. Stok tidak diubah.');else toast('Penambahan stok dibatalkan. Stok tidak diubah.')};
 }catch(err){console.error(err);btn.disabled=false;toast('Gagal menambah stok: '+(err.message||'kesalahan database'))}
}
async function checkout(){
 if(!cart.length)return;
 const amounts=getCheckoutAmounts();
 if(!amounts.hasReceived){toast('Masukkan uang yang diterima dari pelanggan.');$('cashReceived').focus();return}
 if(amounts.shortage>0){toast('Uang pelanggan kurang '+money(amounts.shortage)+'.');$('cashReceived').focus();return}
 const [allProducts,allRecipes,allMaterials]=await Promise.all([getAll('products'),getAll('recipes'),getAll('materials')]);
 const productById=new Map(allProducts.map(p=>[Number(p.id),p]));
 const recipeByProduct=new Map(allRecipes.map(r=>[Number(r.productId),r]));
 const materialById=new Map(allMaterials.map(m=>[Number(m.id),m]));
 const materialUsage=new Map();
 const productUsage=new Map();
 for(const x of cart){
  const p=productById.get(Number(x.id));
  if(!p||p.active===false){toast('Ada produk yang sudah tidak aktif.');return}
  const productRow=productUsage.get(Number(x.id))||{product:p,qty:0};
  productRow.qty+=Number(x.qty||0);productUsage.set(Number(x.id),productRow);
  const recipe=recipeByProduct.get(Number(x.id));
  if(!recipe)continue;
  const multiplier=Math.max(0,Number(x.variantMultiplier)||1);
  for(const line of recipe.lines||[]){
   const batchDivisor=recipe.recipeBasis==='finished_kg'?Math.max(1,Number(recipe.expectedYieldUnits)||1):1;const recipeQty=Number(line.qty||0)*Number(x.qty||0)*multiplier/batchDivisor;
   if(!(recipeQty>0))continue;
   const material=materialById.get(Number(line.materialId));
   if(!material){toast('Bahan pada komposisi '+p.name+' tidak ditemukan. Periksa kembali menu Komposisi Produk.');return}
   const required=convertQty(recipeQty,line.unit||material.unit||'Pcs',material.unit||line.unit||'Pcs');
   if(required===null||!Number.isFinite(required)){toast('Satuan bahan '+material.name+' tidak cocok dengan satuan komposisi. Perbaiki satuannya sebelum menjual.');return}
   const current=materialUsage.get(Number(material.id))||{material,qty:0};
   current.qty+=required;materialUsage.set(Number(material.id),current);
  }
 }
 for(const {product,qty} of productUsage.values()){
  if(recipeByProduct.has(Number(product.id)))continue;
  if(product.stockEnabled&&qty>Number(product.stock||0)){toast('Stok '+product.name+' tidak cukup untuk total jumlah yang dipilih.');return}
 }
 const shortages=[];
 for(const {material,qty} of materialUsage.values()){
  const available=Number(material.stock||0);
  if(material.stockEnabled!==false&&qty>available+1e-9){
   shortages.push(`${material.name}: perlu ${qty.toLocaleString('id-ID',{maximumFractionDigits:3})} ${material.unit||'unit'}, tersedia ${available.toLocaleString('id-ID',{maximumFractionDigits:3})} ${material.unit||'unit'}`);
  }
 }
 if(shortages.length){
  await openStockShortageDialog([...materialUsage.values()].filter(({material,qty})=>material.stockEnabled!==false&&qty>Number(material.stock||0)+1e-9).map(({material,qty})=>({material,required:qty,available:Number(material.stock||0),shortage:Math.max(0,qty-Number(material.stock||0))})));
  return;
 }
 const {subtotal,taxRate,taxAmount,otherFee,total,received,change}=amounts,prof=await getCurrentProfile(),internalId='TRX-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,5).toUpperCase();
 let order=null,details=[];
 const tx=db.transaction(['settings','transactions','details','products','materials'],'readwrite');
 tx.oncomplete=async()=>{if(!order){toast('Transaksi gagal disimpan: nomor transaksi tidak terbentuk.');return}lastReceipt={order,details,profile:prof};cart=[];$('customer').value='';$('taxRate').value='0';$('otherFee').value='0';$('cashReceived').value='';renderCart();await renderHome();await renderProducts();await renderReports();await renderCashItems();await renderMaterials();showReceipt(lastReceipt);toast('Transaksi tersimpan. Stok barang jual dan bahan berkomposisi sudah diperbarui.')};
 tx.onerror=()=>toast('Transaksi gagal disimpan: '+(tx.error?.message||'kesalahan database'));
 tx.onabort=()=>{};
 allocateTransactionCode(tx,activeBusinessId,(code)=>{
  order={id:internalId,businessId:activeBusinessId,date:dateNow(),number:code,customer:$('customer').value.trim()||'Pelanggan umum',subtotal,taxRate,taxAmount,otherFee,total,paid:received,change,cost:cart.reduce((a,x)=>a+x.qty*x.cost,0),business:prof?.name||'',paymentMethod:'Tunai',status:'Selesai'};
  details=cart.map(x=>({businessId:activeBusinessId,transactionId:internalId,productId:x.id,name:x.variantName?`${x.name} (${x.variantName})`:x.name,unit:x.unit,qty:x.qty,price:x.price,cost:x.cost,subtotal:x.qty*x.price}));
  tx.objectStore('transactions').add(order);details.forEach(d=>tx.objectStore('details').add(d));
  for(const {product,qty} of productUsage.values()){if(recipeByProduct.has(Number(product.id)))continue;const req=tx.objectStore('products').get(product.id);req.onsuccess=()=>{const p=req.result;if(p&&String(p.businessId??'legacy')===String(activeBusinessId??'legacy')&&p.stockEnabled){p.stock=Math.max(0,Number(p.stock||0)-qty);tx.objectStore('products').put(p)}}}
  for(const {material,qty} of materialUsage.values()){
   if(material.stockEnabled===false)continue;
   const req=tx.objectStore('materials').get(material.id);
   req.onsuccess=()=>{const m=req.result;if(!m||String(m.businessId??'legacy')!==String(activeBusinessId??'legacy')){try{tx.abort()}catch{}return}m.stock=Number(m.stock||0)-qty;m.updatedAt=dateNow();tx.objectStore('materials').put(m)};
  }
 });
}
function showReceipt(data){const {order,details,profile}=data;const subtotal=Number(order.subtotal??details.reduce((a,d)=>a+Number(d.subtotal||0),0));const taxAmount=Number(order.taxAmount||0),otherFee=Number(order.otherFee||0),total=Number(order.total||subtotal+taxAmount+otherFee);const paymentRows=`<tr><td>Subtotal</td><td>${money(subtotal)}</td></tr>${Number(order.taxRate||0)>0||taxAmount>0?`<tr><td>Pajak${Number(order.taxRate||0)>0?` (${Number(order.taxRate)}%)`:''}</td><td>${money(taxAmount)}</td></tr>`:''}${otherFee>0?`<tr><td>Biaya lain-lain</td><td>${money(otherFee)}</td></tr>`:''}<tr><td><b>TOTAL</b></td><td><b>${money(total)}</b></td></tr>${order.paid!==undefined?`<tr><td>Tunai diterima</td><td>${money(order.paid)}</td></tr><tr><td><b>Kembalian</b></td><td><b>${money(order.change||0)}</b></td></tr>`:''}`;$('receiptContent').innerHTML=`<div class="receipt"><h2>${esc(profile?.name||order.business||'Usaha Anda')}</h2><div class="center">${esc(profile?.address||'')}${profile?.phone?'<br>Telp. '+esc(profile.phone):''}</div><hr><div>No: ${esc(order.number)}<br>Tanggal: ${new Date(order.date).toLocaleString('id-ID')}<br>Pelanggan: ${esc(order.customer)}</div><hr><table><thead><tr><th>Item</th><th>Jumlah</th><th>Harga</th><th>Total</th></tr></thead><tbody>${details.map(d=>`<tr><td>${esc(d.name)}</td><td>${d.qty} ${esc(d.unit||'')}</td><td>${money(d.price)}</td><td>${money(d.subtotal)}</td></tr>`).join('')}</tbody></table><hr><table>${paymentRows}</table><hr><div class="center">${esc(profile?.footer||'Terima kasih atas kunjungan Anda.')}</div></div>`;$('receiptDialog').showModal()}
function localDateValue(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
async function saveExpense(){const name=$('expenseName').value.trim(),category=$('expenseCategory').value,amount=Number($('expenseAmount').value),date=$('expenseDate').value,note=$('expenseNote').value.trim();if(!name){toast('Nama biaya wajib diisi.');$('expenseName').focus();return}if(!Number.isFinite(amount)||amount<=0){toast('Jumlah biaya harus lebih dari nol.');$('expenseAmount').focus();return}if(!date){toast('Tanggal biaya wajib diisi.');$('expenseDate').focus();return}try{const tx=db.transaction(['expenses'],'readwrite');let saved=false;tx.oncomplete=async()=>{if(!saved){toast('Biaya gagal disimpan.');return}$('expenseName').value='';$('expenseAmount').value='';$('expenseNote').value='';$('expenseDate').value=localDateValue();await renderReports();toast('Pengeluaran tersimpan.')};tx.onerror=()=>toast('Biaya gagal disimpan: '+(tx.error?.message||'kesalahan database'));const req=tx.objectStore('expenses').add({businessId:activeBusinessId,name,category,amount,date,note,createdAt:dateNow()});req.onsuccess=()=>{saved=true}}catch(err){console.error(err);toast('Biaya gagal disimpan: '+(err.message||'kesalahan database'))}}
async function renderReports(){
 const [orders,details,expenses]=await Promise.all([getAll('transactions'),getAll('details'),getAll('expenses')]);
 const sales=orders.reduce((sum,o)=>sum+Number(o.subtotal||0)+Number(o.otherFee||0),0);
 const cogs=orders.reduce((sum,o)=>sum+Number(o.cost||0),0);
 const grossProfit=sales-cogs;
 const expenseTotal=expenses.reduce((sum,e)=>sum+Number(e.amount||0),0);
 const netProfit=grossProfit-expenseTotal;
 if($('allSales'))$('allSales').textContent=money(sales);
 if($('allCount'))$('allCount').textContent=orders.length;
 if($('totalCogs'))$('totalCogs').textContent=money(cogs);
 if($('grossProfit'))$('grossProfit').textContent=money(grossProfit);
 if($('totalExpenses'))$('totalExpenses').textContent=money(expenseTotal);
 if($('netProfit'))$('netProfit').textContent=money(netProfit);
 // Riwayat transaksi tidak lagi menampilkan tombol Nota pada halaman Laporan.
 const root=$('history');
 if(root){const sorted=[...orders].sort((a,b)=>String(b.date).localeCompare(String(a.date)));root.innerHTML=sorted.length?sorted.map(o=>`<div class="historyrow"><div class="info"><strong>${esc(o.number||'Transaksi')}</strong><div class="muted">${esc(new Date(o.date).toLocaleString('id-ID'))} · ${esc(o.customer||'Pelanggan umum')}</div></div><strong>${money(o.total)}</strong></div>`).join(''):'<div class="empty">Belum ada transaksi.</div>';}
 // Buat satu buku kas: penjualan sebagai pemasukan, biaya operasional sebagai pengeluaran.
 const ledger=[];
 orders.forEach(o=>ledger.push({date:String(o.date||''),sortDate:String(o.date||''),type:'Pemasukan',description:`Penjualan ${o.number||''} · ${o.customer||'Pelanggan umum'}`,income:Number(o.total??o.subtotal??0),expense:0,orderId:o.id}));
 expenses.forEach(e=>ledger.push({date:String(e.date||''),sortDate:String(e.date||e.createdAt||''),type:'Pengeluaran',description:`Pengeluaran - ${e.name||'Biaya'}${e.category?' · '+e.category:''}${e.note?' · '+e.note:''}`,income:0,expense:Number(e.amount||0),expenseId:e.id}));
 ledger.sort((a,b)=>a.sortDate.localeCompare(b.sortDate));
 let balance=0;ledger.forEach(r=>{balance+=r.income-r.expense;r.balance=balance});
 const ledgerRoot=$('financeLedger');
 if(ledgerRoot){ledgerRoot.innerHTML=ledger.length?ledger.map(r=>`<tr><td>${esc(r.date.length>10?r.date.slice(0,10):r.date)}</td><td>${r.type==='Pemasukan'?'<span class="finance-in">Pemasukan</span>':'<span class="finance-out">Pengeluaran</span>'}</td><td>${esc(r.description)}</td><td class="num">${r.income?money(r.income):'—'}</td><td class="num">${r.expense?money(r.expense):'—'}</td><td class="num">${money(r.balance)}</td><td>${r.expenseId!==undefined?`<button type="button" data-delete-expense="${Number(r.expenseId)}">Hapus</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">Belum ada pemasukan atau pengeluaran.</td></tr>';}
 if($('ledgerIncome'))$('ledgerIncome').textContent=money(ledger.reduce((s,r)=>s+r.income,0));
 if($('ledgerExpense'))$('ledgerExpense').textContent=money(ledger.reduce((s,r)=>s+r.expense,0));
 if($('ledgerBalance'))$('ledgerBalance').textContent=money(balance);
 const expenseRoot=$('expenseHistory');
 if(expenseRoot){const sortedExpenses=[...expenses].sort((a,b)=>String(b.date).localeCompare(String(a.date)));expenseRoot.innerHTML=sortedExpenses.length?sortedExpenses.map(e=>`<div class="historyrow"><div class="info"><strong>Pengeluaran - ${esc(e.name||'Biaya')}</strong><div class="muted">${esc(e.date)} · ${esc(e.category||'Lain-lain')}${e.note?' · '+esc(e.note):''}</div></div><strong>${money(e.amount)}</strong><button type="button" data-delete-expense="${Number(e.id)}">Hapus</button></div>`).join(''):'<div class="empty">Belum ada pengeluaran.</div>';}
 document.querySelectorAll('[data-delete-expense]').forEach(b=>b.onclick=async()=>{if(!confirm('Hapus catatan pengeluaran ini?'))return;try{await del('expenses',Number(b.dataset.deleteExpense));await renderReports();toast('Catatan pengeluaran dihapus.')}catch(err){console.error(err);toast('Pengeluaran gagal dihapus.')}});
}
async function loadProfileForm(){const p=await getCurrentProfile();if(!p)return;$('shopName').value=p.name||'';$('shopAddress').value=p.address||'';$('shopPhone').value=p.phone||'';$('receiptFooter').value=p.footer||'';$('compositionMode').value=p.compositionMode||'auto';updateCompositionVisibility()}
async function saveProfile(){const p=await getCurrentProfile();if(!p)return;const name=$('shopName').value.trim();if(!name){toast('Nama usaha wajib diisi.');return}Object.assign(p,{name,address:$('shopAddress').value.trim(),phone:$('shopPhone').value.trim(),footer:$('receiptFooter').value.trim(),compositionMode:$('compositionMode').value||'auto',updatedAt:dateNow()});const idx=businesses.findIndex(b=>String(b.id)===String(activeBusinessId));if(idx>=0)businesses[idx]=p;currentProfile=p;await saveBusinessList();$('shopTitle').textContent=name;updateCompositionVisibility();if(!compositionIsEnabled()&&$('page-recipes').classList.contains('active'))showPage('products');toast('Profil tersimpan. Data produk, pembelian, stok, riwayat, dan komposisi tidak dihapus.');renderHome()}
let automaticBackupTimer=null, automaticBackupBusy=false, automaticBackupAgain=false;
const AUTO_BACKUP_FILE='Universal_UMKM_Backup.json';
function scheduleAutomaticBackup(){
 if(automaticBackupTimer)clearTimeout(automaticBackupTimer);
 automaticBackupTimer=setTimeout(()=>writeAutomaticBackup().catch(err=>{console.warn('Backup otomatis gagal',err);}),900);
}
async function makeBackupData(){
 const stores=['settings','products','transactions','details','materials','materialPurchases','recipes','assets','expenses'];
 const data={app:'Universal UMKM Pro PWA Offline',schemaVersion:5,backupType:'full-local-backup',exportedAt:dateNow(),businessCount:businesses.length,activeBusinessId,settings:[],products:[],transactions:[],details:[],materials:[],materialPurchases:[],recipes:[],assets:[],expenses:[]};
 for(const name of stores)data[name]=await request(name,'readonly',st=>st.getAll());
 data.settings=data.settings.filter(x=>x.key!=='automaticBackupSnapshot');
 return data;
}
async function writeAutomaticBackup(){
 if(automaticBackupBusy){automaticBackupAgain=true;return}
 automaticBackupBusy=true;
 try{
  if(!navigator.storage?.getDirectory)throw new Error('Penyimpanan file otomatis tidak didukung browser ini.');
  const data=await makeBackupData();
  const root=await navigator.storage.getDirectory();
  const handle=await root.getFileHandle(AUTO_BACKUP_FILE,{create:true});
  const writable=await handle.createWritable();
  await writable.write(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  await writable.close();
  const el=$('backupSelectedFile');if(el)el.textContent='Backup otomatis terakhir: '+new Date(data.exportedAt).toLocaleString('id-ID')+' (tersimpan di penyimpanan privat aplikasi).';
 }catch(err){
  // Fallback: preserve an automatic snapshot in the app's own IndexedDB.
  try{
   const data=await makeBackupData();
   await new Promise((resolve,reject)=>{const tx=db.transaction(['settings'],'readwrite');tx.objectStore('settings').put({key:'automaticBackupSnapshot',value:data});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
   const el=$('backupSelectedFile');if(el)el.textContent='Backup otomatis tersimpan di data lokal aplikasi. '+(err.message||'');
  }catch(fallbackErr){console.error('Backup otomatis lokal gagal',fallbackErr)}
 }finally{automaticBackupBusy=false;if(automaticBackupAgain){automaticBackupAgain=false;scheduleAutomaticBackup()}}
}
async function readAutomaticBackup(){
 try{
  if(navigator.storage?.getDirectory){const root=await navigator.storage.getDirectory();const handle=await root.getFileHandle(AUTO_BACKUP_FILE);const file=await handle.getFile();return JSON.parse(await file.text())}
 }catch{}
 try{const row=await request('settings','readonly',st=>st.get('automaticBackupSnapshot'));return row?.value||null}catch{return null}
}
async function exitApplication(){
 if(!confirm('Keluar dari Universal UMKM Pro? Aplikasi akan mencoba menyimpan backup terbaru terlebih dahulu.'))return;
 const btn=$('exitApp');if(btn){btn.disabled=true;btn.textContent='Menyimpan…'}
 try{
  if(automaticBackupTimer){clearTimeout(automaticBackupTimer);automaticBackupTimer=null}
  await writeAutomaticBackup();
  const snapshot=await readAutomaticBackup();
  if(snapshot){alert('Backup terbaru tersedia.\n\nNama file: '+AUTO_BACKUP_FILE+'\nLokasi otomatis: penyimpanan privat browser.\n\nCatatan: browser biasanya tidak mengizinkan PWA menutup tab secara paksa. Anda dapat menutup tab/jendela secara manual.');}
  else{alert('Aplikasi tidak dapat memastikan backup terbaru tersedia. Data lokal tidak dihapus. Anda dapat menutup tab/jendela secara manual.')}
  try{window.close()}catch{}
 }catch(err){alert('Backup saat keluar gagal: '+(err.message||'kesalahan tidak diketahui')+'\nData lokal tetap dipertahankan. Anda dapat menutup tab/jendela secara manual.')}
 finally{if(btn){btn.disabled=false;btn.textContent='Keluar'}}
}
async function restoreAutomaticBackup(data){
 if(!data||data.app!=='Universal UMKM Pro PWA Offline'||!Array.isArray(data.settings)||!Array.isArray(data.products))throw Error('Backup otomatis tidak valid.');
 const fmtDate=data.exportedAt?new Date(data.exportedAt).toLocaleString('id-ID'):'tidak tercatat';
 const summary=`Usaha: ${(data.settings.find(x=>x.key==='businesses')?.value||[]).length}\nProduk: ${(data.products||[]).length}\nPenjualan: ${(data.transactions||[]).length}\nPembelian bahan: ${(data.materialPurchases||[]).length}`;
 if(!confirm(`BACKUP OTOMATIS DITEMUKAN\nTanggal: ${fmtDate}\n\n${summary}\n\nPemulihan akan mengganti data lokal saat ini. Lanjutkan?`))return;
 window.__restoringBackup=true;
 try{
  const names=['settings','products','transactions','details','materials','materialPurchases','recipes','assets','expenses'];
  await new Promise((resolve,reject)=>{const tx=db.transaction(names,'readwrite');for(const name of names){const st=tx.objectStore(name);st.clear();(Array.isArray(data[name])?data[name]:[]).filter(x=>name!=='settings'||x.key!=='automaticBackupSnapshot').forEach(o=>st.put(o))}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Kesalahan database'));tx.onabort=()=>reject(tx.error||new Error('Pemulihan dibatalkan'))});
  const settings=await getAll('settings');const saved=settings.find(x=>x.key==='businesses');const active=settings.find(x=>x.key==='activeBusinessId');const lic=settings.find(x=>x.key==='licenseSlots');businesses=Array.isArray(saved?.value)?saved.value:[];activeBusinessId=active?.value||businesses[0]?.id||null;licenseSlots=Math.max(1,Math.min(25,Number(lic?.value||1)));if(businesses.length&&!businesses.some(b=>String(b.id)===String(activeBusinessId)))activeBusinessId=businesses[0].id;currentProfile=await getCurrentProfile();cart=[];renderCart();$('nav').hidden=!currentProfile;if(currentProfile){$('shopTitle').textContent=currentProfile.name||'Usaha Anda';$('headerSubtitle').textContent=currentProfile.business||'Data usaha lokal'}else $('shopTitle').textContent='Pilih Jenis Usaha';await renderHome();await renderProducts();await renderReports();await renderCashItems();await renderMaterials();await renderAssets();toast('Pemulihan backup otomatis berhasil.');
 }finally{window.__restoringBackup=false}
}
async function openBackupPicker(){
 const input=$('importData');
 const auto=await readAutomaticBackup();
 if(auto){if(confirm(`Backup otomatis dari perangkat ini tersedia.\n\nOK = pulihkan backup otomatis.\nBatal = pilih file backup JSON dari perangkat lain.`)){try{await restoreAutomaticBackup(auto)}catch(err){toast('Pemulihan otomatis gagal: '+(err.message||'kesalahan'))}return}}
 // Chrome/Edge modern: buka pemilih file langsung pada folder Download.
 if(window.showOpenFilePicker){
  try{
   const handles=await window.showOpenFilePicker({
    startIn:'downloads',
    multiple:false,
    types:[{description:'Backup Universal UMKM Pro (JSON)',accept:{'application/json':['.json']}}],
    excludeAcceptAllOption:false
   });
   if(!handles||!handles.length)return;
   const file=await handles[0].getFile();
   const nameEl=$('backupSelectedFile');if(nameEl)nameEl.textContent='File dipilih: '+file.name+' — memeriksa isi backup…';
   await importBackup(file);
   return;
  }catch(err){
   if(err&&err.name==='AbortError')return;
   console.warn('Pemilih file Download tidak tersedia, memakai pemilih standar.',err);
   toast('Pilih file backup dari folder Download/Unduhan.');
  }
 }
 input.click();
}
async function importBackup(e){
 const input=e instanceof File ? null : e?.target;
 const f=e instanceof File ? e : input?.files?.[0];if(!f)return;
 const nameEl=$('backupSelectedFile');if(nameEl)nameEl.textContent='File dipilih: '+f.name+' — memeriksa isi backup…';
 try{
  if(!f.name.toLowerCase().endsWith('.json'))throw Error('Pilih file berakhiran .json.');
  if(f.size>50*1024*1024)throw Error('Ukuran file terlalu besar (maksimal 50 MB).');
  const data=JSON.parse(await f.text());
  if(data.app!=='Universal UMKM Pro PWA Offline'||!Array.isArray(data.settings)||!Array.isArray(data.products)||!Array.isArray(data.transactions)||!Array.isArray(data.details)){
   throw Error('File ini bukan backup lengkap Universal UMKM Pro. Pilih file Universal_UMKM_Backup_TANGGAL.json dari folder Download, bukan master.json.');
  }
  const stores=['settings','products','transactions','details','materials','materialPurchases','recipes','assets','expenses'];
  for(const name of stores){if(data[name]!==undefined&&!Array.isArray(data[name]))throw Error('Isi backup tidak valid pada bagian '+name+'.');}
  const profSetting=data.settings.find(x=>x.key==='businesses');
  if(profSetting&&!Array.isArray(profSetting.value))throw Error('Daftar usaha dalam backup tidak valid.');
  const fmtDate=data.exportedAt?new Date(data.exportedAt).toLocaleString('id-ID'):'tidak tercatat';
  const counts=[['Jenis usaha',Array.isArray(profSetting?.value)?profSetting.value.length:Number(data.businessCount||0)],['Produk',data.products.length],['Penjualan',data.transactions.length],['Pembelian bahan',(data.materialPurchases||[]).length],['Bahan baku',(data.materials||[]).length],['Pengeluaran',(data.expenses||[]).length]];
  const summary=counts.map(([label,n])=>`${label}: ${n}`).join('\n');
  if(!confirm(`FILE BACKUP VALID\nNama file: ${f.name}\nTanggal backup: ${fmtDate}\n\nIsi file:\n${summary}\n\nPERHATIAN: Impor akan mengganti data lokal aplikasi ini dengan data dari file backup. Data saat ini bisa hilang. Backup otomatis perangkat ini akan tetap tersedia jika sudah berhasil tersimpan.\n\nLanjutkan pemulihan?`))return;
  const preImportNumbering=businesses.map(b=>({...b}));
  await new Promise((resolve,reject)=>{
   const names=['settings','products','transactions','details','materials','materialPurchases','recipes','assets','expenses'];
   const tx=db.transaction(names,'readwrite');
   for(const name of names){const st=tx.objectStore(name);st.clear();(Array.isArray(data[name])?data[name]:[]).forEach(o=>st.put(o));}
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Kesalahan database'));tx.onabort=()=>reject(tx.error||new Error('Pemulihan dibatalkan oleh database'));
  });
  const settings=await getAll('settings');const saved=settings.find(x=>x.key==='businesses');const active=settings.find(x=>x.key==='activeBusinessId');const lic=settings.find(x=>x.key==='licenseSlots');
  businesses=Array.isArray(saved?.value)?saved.value:[];activeBusinessId=active?.value||businesses[0]?.id||null;licenseSlots=Math.max(1,Math.min(25,Number(lic?.value||1)));
  if(businesses.length&&!businesses.some(b=>String(b.id)===String(activeBusinessId)))activeBusinessId=businesses[0].id;
  businesses=businesses.map(b=>{const old=preImportNumbering.find(x=>String(x.id)===String(b.id));if(!old)return b;return {...b,transactionPrefix:old.transactionPrefix||b.transactionPrefix||makeTransactionPrefix(b.name),nextTransactionNumber:Math.max(1,Number(b.nextTransactionNumber)||1,Number(old.nextTransactionNumber)||1)}});
  await saveBusinessList();await ensureTransactionNumbering();currentProfile=await getCurrentProfile();cart=[];renderCart();$('nav').hidden=!currentProfile;
  if(currentProfile){$('shopTitle').textContent=currentProfile.name||'Usaha Anda';$('headerSubtitle').textContent=currentProfile.business||'Data usaha lokal';}else $('shopTitle').textContent='Pilih Jenis Usaha';
  await renderHome();await renderProducts();await renderReports();await renderCashItems();await renderMaterials();await renderAssets();if(nameEl)nameEl.textContent='Pemulihan berhasil dari file: '+f.name;toast('Pemulihan selesai. Periksa kembali data usaha Anda.');
 }catch(err){console.error(err);if(nameEl)nameEl.textContent='File tidak berhasil dipulihkan: '+f.name;toast('Impor gagal: '+(err.message||'file tidak dapat dibaca'));}
 finally{if(input)input.value='';}
}async function resetData(){if(!confirm('Yakin menghapus semua profil, produk, dan transaksi dari browser/perangkat ini? Tindakan ini tidak bisa dibatalkan. Ekspor cadangan dahulu.'))return;for(const s of ['settings','products','transactions','details','materials','materialPurchases','recipes','assets','expenses'])await clearStore(s);cart=[];currentProfile=null;businesses=[];activeBusinessId=null;licenseSlots=1;selectedPackageId=null;$('setupCard').hidden=true;$('nav').hidden=true;$('shopTitle').textContent='Pilih Jenis Usaha';$('headerSubtitle').textContent='Satu aplikasi untuk berbagai kebutuhan UMKM';$('existingBusiness').hidden=true;toast('Data lokal dihapus.');showPage('home');renderBusinessCatalog()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('Service worker belum terpasang',e)));
init();boot();

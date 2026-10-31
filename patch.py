from pathlib import Path
p=Path('/mnt/data/auditfix/app.js')
s=p.read_text(encoding='utf-8')
s=s.replace("window.APP_BUILD_VERSION='4.0.0';document.documentElement.dataset.appVersion='4.0.0';", "window.APP_BUILD_VERSION='4.1.1';document.documentElement.dataset.appVersion='4.1.1';")
s=s.replace("let db, master, cart=[], lastReceipt=null, selectedPackageId=null, currentProfile=null, recipeDraft=[], businesses=[], activeBusinessId=null, licenseSlots=1, purchaseSearchSeq=0;", "let db, master, cart=[], lastReceipt=null, selectedPackageId=null, currentProfile=null, recipeDraft=[], businesses=[], activeBusinessId=null, licenseSlots=1, purchaseSearchSeq=0, catalogAuditMode=false;\nfunction licensedBusinessCount(){return businesses.filter(b=>!b.auditMode).length;}")
s=s.replace("const saved=settings.find(x=>x.key==='businesses'); const lic=settings.find(x=>x.key==='licenseSlots'); const active=settings.find(x=>x.key==='activeBusinessId');", "const saved=settings.find(x=>x.key==='businesses'); const lic=settings.find(x=>x.key==='licenseSlots'); const active=settings.find(x=>x.key==='activeBusinessId');")
# Catalog rendering: do not lock in audit mode; mark audit profiles distinctly.
s=s.replace("const active=businesses.find(b=>Number(b.packageId)===Number(p.id));const locked=!active&&businesses.length>=licenseSlots;return `<button type=\"button\" class=\"business-card ${active?'current-package':''}\" data-package=\"${p.id}\"><span class=\"business-icon ${tone}\">${ico}</span><span class=\"business-copy\"><strong>${esc(p.nama_usaha)}</strong><small>${esc(p.subkategori||shortBusinessDescription(p.nama_usaha))}${active?' • sudah dibuat':locked?' • 🔒 batas paket tercapai':''}</small></span><span class=\"business-arrow\">${active?'✓':locked?'🔒':'›'}</span></button>`", "const active=businesses.find(b=>Number(b.packageId)===Number(p.id));const locked=!catalogAuditMode&&!active&&licensedBusinessCount()>=licenseSlots;return `<button type=\"button\" class=\"business-card ${active?'current-package':''}\" data-package=\"${p.id}\"><span class=\"business-icon ${tone}\">${ico}</span><span class=\"business-copy\"><strong>${esc(p.nama_usaha)}</strong><small>${esc(p.subkategori||shortBusinessDescription(p.nama_usaha))}${active?(active.auditMode?' • data audit tersimpan':' • sudah dibuat'):locked?' • 🔒 batas paket tercapai':''}</small></span><span class=\"business-arrow\">${active?'✓':locked?'🔒':'›'}</span></button>`")
# Add audit mode badge on catalog count
s=s.replace("$('businessCount').textContent=`${packs.length} jenis usaha inti`;", "$('businessCount').textContent=`${packs.length} jenis usaha inti${catalogAuditMode?' • MODE AUDIT':''}`;")
# Existing business count should exclude audit-only profiles from license count
s=s.replace("<strong>${businesses.length} dari ${licenseSlots} usaha digunakan</strong>", "<strong>${licensedBusinessCount()} dari ${licenseSlots} usaha berlisensi digunakan${businesses.some(b=>b.auditMode)?` • ${businesses.filter(b=>b.auditMode).length} data audit`:''}</strong>")
s=s.replace("if(n<businesses.length){toast(`Anda sudah memiliki ${businesses.length} usaha tersimpan. Pilih minimal ${businesses.length} usaha.`);", "if(n<licensedBusinessCount()){toast(`Anda sudah memiliki ${licensedBusinessCount()} usaha berlisensi. Pilih minimal ${licensedBusinessCount()} usaha.`);")
s=s.replace("if(n<businesses.length){toast(`Paket tidak bisa diturunkan: masih ada ${businesses.length} usaha tersimpan. Kunci atau ekspor usaha terlebih dahulu.`);", "if(n<licensedBusinessCount()){toast(`Paket tidak bisa diturunkan: masih ada ${licensedBusinessCount()} usaha berlisensi tersimpan.`);")
# lock gate and setup profile flag
s=s.replace("if(businesses.length>=licenseSlots){toast(`Paket lisensi Anda mengizinkan ${licenseSlots} usaha. Usaha tambahan terkunci; tingkatkan paket untuk membuka lebih banyak.`);return}", "if(!catalogAuditMode&&licensedBusinessCount()>=licenseSlots){toast(`Paket lisensi Anda mengizinkan ${licenseSlots} usaha. Usaha tambahan terkunci; aktifkan Mode Audit Katalog untuk memeriksa template tanpa memakai slot lisensi.`);return}")
s=s.replace("if(businesses.length>=licenseSlots){toast(`Paket hanya mengizinkan ${licenseSlots} usaha.`);return}", "if(!catalogAuditMode&&licensedBusinessCount()>=licenseSlots){toast(`Paket hanya mengizinkan ${licenseSlots} usaha. Aktifkan Mode Audit Katalog untuk membuat ruang uji terpisah.`);return}")
s=s.replace("const profile={id,key:'profile-'+id,name,business:pack.nama_usaha,packageId:pid,packageVersion:", "const profile={id,key:'profile-'+id,name,business:pack.nama_usaha,packageId:pid,auditMode:!!catalogAuditMode,packageVersion:")
s=s.replace("toast('Usaha dibuat dari katalog terkelompok. Harga referensi terisi, stok tetap nol, dan data usaha mandiri.');", "toast(catalogAuditMode?'Ruang uji audit dibuat terpisah. Data usaha utama tidak diubah dan slot lisensi tidak terpakai.':'Usaha dibuat dari katalog terkelompok. Harga referensi terisi, stok tetap nol, dan data usaha mandiri.');")
# Setup existing package duplicate behavior remains; allow reuse of audit profile as well.
# Add toggle function before renderBusinessCatalog
needle='function renderBusinessCatalog(){'
insert="function setCatalogAuditMode(enabled){catalogAuditMode=!!enabled;const b=$('toggleCatalogAudit');if(b){b.textContent=catalogAuditMode?'Keluar dari Mode Audit':'Aktifkan Mode Audit Katalog';b.classList.toggle('primary',catalogAuditMode);b.setAttribute('aria-pressed',String(catalogAuditMode));}const note=$('catalogAuditNote');if(note){note.hidden=!catalogAuditMode;}renderBusinessCatalog();toast(catalogAuditMode?'Mode Audit aktif: semua template dapat diuji tanpa mengurangi slot lisensi.':'Mode Audit dimatikan. Data audit yang sudah dibuat tetap tersimpan terpisah.');}\n"
s=s.replace(needle,insert+needle)
# Attach handler in init, safely next to business search
s=s.replace("$('businessSearch').oninput=renderBusinessCatalog;", "$('businessSearch').oninput=renderBusinessCatalog;if($('toggleCatalogAudit'))$('toggleCatalogAudit').onclick=()=>setCatalogAuditMode(!catalogAuditMode);")
p.write_text(s,encoding='utf-8')

p=Path('/mnt/data/auditfix/index.html'); s=p.read_text(encoding='utf-8')
s=s.replace('<div class="pricing-kicker">KATALOG 300 JENIS USAHA</div><h2>Pilih dari 300 jenis usaha</h2>', '<div class="pricing-kicker">KATALOG JENIS USAHA</div><h2>Pilih jenis usaha</h2><button type="button" id="toggleCatalogAudit" aria-pressed="false">Aktifkan Mode Audit Katalog</button><p id="catalogAuditNote" class="audit-note" hidden><strong>MODE AUDIT AKTIF</strong> — Anda dapat membuat ruang uji untuk semua template tanpa memakai slot lisensi. Setiap ruang uji memiliki data terpisah; data usaha utama tidak diubah. Ruang uji tersimpan di perangkat ini.</p>')
s=s.replace('Pilih dari 300 jenis usaha', 'Pilih dari katalog usaha')
s=s.replace('300 pilihan jenis usaha tersedia', 'Katalog jenis usaha tersedia')
s=s.replace('Cari dan pilih dari 300 jenis usaha.', 'Cari dan pilih jenis usaha dari katalog.')
s=s.replace('<script src="app.js?v=4.0.0"></script>', '<script src="app.js?v=4.1.1"></script>')
p.write_text(s,encoding='utf-8')

p=Path('/mnt/data/auditfix/sw.js'); s=p.read_text(encoding='utf-8').replace('universal-umkm-pwa-v4-1-0-katalog-konsolidasi','universal-umkm-pwa-v4-1-1-mode-audit'); p.write_text(s,encoding='utf-8')

p=Path('/mnt/data/auditfix/style.css'); s=p.read_text(encoding='utf-8')
s += '\n/* v4.1.1: Mode Audit Katalog */\n#toggleCatalogAudit{margin:8px 0;padding:10px 14px;border:1px solid #315b7d;border-radius:10px;background:#eef5fb;color:#173451;font-weight:700;cursor:pointer}#toggleCatalogAudit.primary{background:#173451;color:#fff}#catalogAuditNote{padding:12px 14px;margin:8px 0 14px;border:1px solid #9bb8ce;border-radius:10px;background:#f1f7fb;color:#173451;font-size:13px;line-height:1.55}#catalogAuditNote[hidden]{display:none}\n'
p.write_text(s,encoding='utf-8')

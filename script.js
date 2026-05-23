const templates = {
  yetkisiz: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="color:#1a2c3e;">Yetkisiz erişim talebiniz alındı</h2>
  <p>Hesabınıza yetkisiz erişim bildiriminiz tarafımıza ulaşmıştır. Şifre değişikliği, profil ismi güncellemesi ve ilanlarınızdaki değişiklikler incelenmeye alınmıştır.</p>
  <p>Ekibimiz hesabınızı güvenlik altına almak ve en kısa sürede (24 saat içinde) eski haline döndürmek için çalışmaktadır.</p>
  <div style="background:#f0f7ff; border-left:4px solid #2c7be5; padding:15px; margin:20px 0;">
    <p style="margin:0;"><strong> İşlem başarıyla kaydedildi</strong><br>Takip numaranız: <strong>{{TALEP_NO}}</strong></p>
  </div>
  <p style="color:#6c86a3; font-size:12px;">Bu e-posta, PatiBul tarafından otomatik oluşturulmuştur.</p>
</body>
</html>`,
  
  genel: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="color:#1a2c3e;">Destek talebiniz alındı</h2>
  <p>PatiBul Destek ekibi olarak talebinizi inceliyoruz. En kısa sürede (24 saat içinde) size dönüş yapılacaktır.</p>
  <div style="background:#f0f7ff; border-left:4px solid #2c7be5; padding:15px; margin:20px 0;">
    <p style="margin:0;"><strong> İşlem başarıyla kaydedildi</strong><br>Takip numaranız: <strong>{{TALEP_NO}}</strong></p>
  </div>
  <p>Bu e-postaya yanıt vererek ek bilgi iletebilirsiniz.</p>
  <p style="color:#6c86a3; font-size:12px;">PatiBul • Hayvan dostu çözümler</p>
</body>
</html>`,
  
  sifre: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="color:#1a2c3e;">Şifre sıfırlama talebiniz alındı</h2>
  <p>Şifre sıfırlama talebiniz başarıyla kaydedilmiştir. 24 saat içinde yeni şifre oluşturma bağlantısı ayrıca gönderilecektir.</p>
  <div style="background:#f0f7ff; border-left:4px solid #2c7be5; padding:15px; margin:20px 0;">
    <p style="margin:0;"><strong> İşlem başarıyla kaydedildi</strong><br>Referans numaranız: <strong>{{TALEP_NO}}</strong></p>
  </div>
  <p style="color:#6c86a3; font-size:12px;">Bu işlem güvenli kanaldan yapılmıştır.</p>
</body>
</html>`
};

function previewTicket() {
  const now = new Date();
  const tarih = now.getDate().toString().padStart(2,'0') + 
                (now.getMonth()+1).toString().padStart(2,'0') + 
                now.getFullYear().toString().slice(-2);
  const rastgele = Math.floor(Math.random() * 9000 + 1000);
  return `PD-${tarih}-${rastgele}`;
}

function updatePreview() {
  let html = document.getElementById('htmlContent').value;
  const previewTicketNo = previewTicket();
  const aliciAdi = document.getElementById('aliciAdi').value || 'Müşteri';
  
  let previewHtml = html
    .replace(/{{TALEP_NO}}/g, previewTicketNo)
    .replace(/{{REF_NUM}}/g, previewTicketNo)
    .replace(/{{MÜŞTERİ_ADI}}/g, aliciAdi);
  
  document.getElementById('onizleme').innerHTML = previewHtml;
  document.getElementById('onizlemeTicket').innerText = previewTicketNo;
}

function selectTemplate(templateKey) {
  if (templates[templateKey]) {
    document.getElementById('htmlContent').value = templates[templateKey];
    updatePreview();
  }
}

async function sendMail() {
  const aliciEmail = document.getElementById('aliciEmail').value.trim();
  const aliciAdi = document.getElementById('aliciAdi').value.trim();
  const konu = document.getElementById('konu').value.trim();
  let htmlContent = document.getElementById('htmlContent').value;
  
  if (!aliciEmail) {
    showResult('Lütfen alıcı e-posta adresini girin!', 'error');
    return;
  }
  if (!htmlContent) {
    showResult('Lütfen HTML içeriğini yapıştırın veya bir şablon seçin!', 'error');
    return;
  }
  
  const gonderBtn = document.getElementById('gonderBtn');
  gonderBtn.disabled = true;
  gonderBtn.textContent = 'Gönderiliyor...';
  
  try {
    const response = await fetch('/send-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aliciEmail, aliciAdi, konu, htmlContent })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showResult(' Mail başarıyla gönderildi! Ticket No: ' + result.ticketNo, 'success');
      document.getElementById('konu').value = 'PatiBul Destek | Talebiniz alındı (' + result.ticketNo + ')';
    } else {
      showResult(' Hata: ' + (result.error || result.message), 'error');
    }
  } catch (err) {
    showResult(' Bağlantı hatası: ' + err.message, 'error');
  } finally {
    gonderBtn.disabled = false;
    gonderBtn.textContent = ' Mail Gönder';
  }
}

function showResult(msg, type) {
  const el = document.getElementById('sonucMesaji');
  el.textContent = msg;
  el.className = 'result-message ' + type;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

document.getElementById('gonderBtn').addEventListener('click', sendMail);
document.getElementById('aliciAdi').addEventListener('input', updatePreview);
document.getElementById('htmlContent').addEventListener('input', updatePreview);

document.querySelectorAll('.template-btn').forEach(btn => {
  btn.addEventListener('click', () => selectTemplate(btn.dataset.template));
});

window.onload = () => {
  document.getElementById('htmlContent').value = templates.genel;
  updatePreview();
};

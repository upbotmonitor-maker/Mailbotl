const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('.'));

// Ticket numarası üret
function generateTicketNumber() {
  const now = new Date();
  const tarih = now.getDate().toString().padStart(2,'0') + 
                (now.getMonth()+1).toString().padStart(2,'0') + 
                now.getFullYear().toString().slice(-2);
  const rastgele = Math.floor(Math.random() * 9000 + 1000);
  return `PD-${tarih}-${rastgele}`;
}

// Secrets'tan SMTP bilgilerini al
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'PatiBul Resmî Destek';

// SMTP kontrol
if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ HATA: SMTP_USER ve SMTP_PASS Secrets olarak tanımlanmamış!');
  console.log('📌 Replit Secrets bölümüne ekleyin:');
  console.log('   SMTP_USER = patibultrabzon@gmail.com');
  console.log('   SMTP_PASS = uygulama_sifreniz');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// Mail gönderme endpoint
app.post('/send-mail', async (req, res) => {
  const { aliciEmail, aliciAdi, konu, htmlContent } = req.body;
  
  if (!SMTP_USER || !SMTP_PASS) {
    return res.json({ 
      success: false, 
      error: 'SMTP ayarları Secrets olarak tanımlanmamış!',
      message: 'Lütfen Replit Secrets bölümüne SMTP_USER ve SMTP_PASS ekleyin.'
    });
  }
  
  const ticketNo = generateTicketNumber();
  
  let sonHtml = htmlContent
    .replace(/{{TALEP_NO}}/g, ticketNo)
    .replace(/{{REF_NUM}}/g, ticketNo)
    .replace(/{{MÜŞTERİ_ADI}}/g, aliciAdi || 'Değerli Müşteri');
  
  const mailKonu = konu || `PatiBul Destek | Talebiniz alındı (${ticketNo})`;
  
  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to: aliciEmail,
      subject: mailKonu,
      html: sonHtml
    });
    
    res.json({ 
      success: true, 
      ticketNo: ticketNo,
      messageId: info.messageId,
      message: 'Mail başarıyla gönderildi!'
    });
  } catch (error) {
    console.error('SMTP Hata:', error);
    res.json({ 
      success: false, 
      error: error.message,
      message: 'Mail gönderilemedi! SMTP ayarlarını kontrol et.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Panel: http://localhost:${PORT}`);
  console.log(`📧 SMTP: ${SMTP_USER || 'tanımlı değil'}`);
});

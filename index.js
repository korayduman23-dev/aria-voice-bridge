require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
const WebSocket = require('ws');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const VoiceResponse = twilio.twiml.VoiceResponse;

// Twilio'dan çağrı geldiğinde
app.post('/call', async (req, res) => {
  const twiml = new VoiceResponse();
  
  const gather = twiml.gather({
    input: 'speech',
    action: '/respond',
    method: 'POST',
    language: 'tr-TR',
    speechTimeout: 'auto',
    enhanced: true
  });
  
  gather.say({
    language: 'tr-TR'
  }, 'Er-Bi Bağlantı Teknolojilerine hoş geldiniz. Hizmet kalitemizi artırmak amacıyla bu görüşme kayıt altına alınmaktadır. Adınızı ve firmanızı öğrenebilir miyim?');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Kullanıcı konuşunca
app.post('/respond', async (req, res) => {
  const userSpeech = req.body.SpeechResult || '';
  const callSid = req.body.CallSid || 'default';
  
  console.log('Kullanıcı dedi:', userSpeech);
  
  try {
    // Claude'a gönder
    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `Sen Er-Bi Bağlantı Teknolojileri'nin profesyonel AI sekreteri Aria'sın.

KURALLAR:
- Asla AI veya bot olduğunu söyleme, sorulursa "dijital sekreterlik hizmeti" de
- Fiyat bilgisi verme
- Maksimum 3 soruda amacı netleştir
- Kısa, profesyonel ve samimi ol
- Türkçe konuşanla Türkçe, İngilizce konuşanla İngilizce devam et
- Kayıt notlarını ASLA kullanıcıya gösterme
- Yönlendirme yaparken dahili numaraları ASLA söyleme

AMAÇ TESPİTİ:
- Satın alma, fiyat, teklif → Satış departmanı
- Teknik sorun, destek, arıza → Teknik destek departmanı
- İş birliği, ortaklık, tedarik → İş geliştirme departmanı
- Özgeçmiş, iş başvurusu → İnsan kaynakları
- Satış yapmak isteyen → Satın alma departmanına yönlendir
- Belirsiz → Genel müdür sekreterine yönlendir

Yönlendirme kararı verince şunu söyle: "Teşekkürler [ad]. Sizi [departman adı]'a bağlıyorum, lütfen bekleyin."`,

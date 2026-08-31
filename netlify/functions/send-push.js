// netlify/functions/send-push.js
// Riceve { subscription, title, body, url } dal sito e spedisce una vera
// notifica push tramite web-push, usando le chiavi VAPID configurate come
// variabili d'ambiente su Netlify (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).

const webpush = require('web-push');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  const { subscription, title, body, url } = payload;

  if (!subscription || !title) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Campi mancanti: subscription e title sono obbligatori' })
    };
  }

  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('Chiavi VAPID non configurate su Netlify');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Configurazione notifiche mancante sul server' })
    };
  }

  webpush.setVapidDetails('mailto:info@taptech.it', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title,
      body: body || '',
      url: url || '/app/index.html'
    }));

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Errore invio push:', err);
    // 410/404 = iscrizione scaduta/non valida, non è un errore grave
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ error: err.message || 'Errore invio notifica push' })
    };
  }
};

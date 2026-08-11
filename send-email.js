// netlify/functions/send-email.js
// Riceve { to, subject, html } dal sito e chiama Resend in modo sicuro (server-side).
// La chiave API NON è mai visibile nel browser: viene letta da una variabile
// d'ambiente configurata su Netlify (RESEND_API_KEY).

exports.handler = async function (event) {
  // Accettiamo solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  const { to, subject, html } = payload;

  if (!to || !subject || !html) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Campi mancanti: to, subject, html sono obbligatori' })
    };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY non configurata su Netlify');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Configurazione email mancante sul server' })
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Deve essere un mittente verificato sul tuo dominio Resend (es. taptech.it)
        from: 'TAP <notifiche@taptech.it>',
        to: [to],
        subject,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Errore Resend:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.message || 'Errore invio email' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: data.id })
    };
  } catch (err) {
    console.error('Errore chiamata Resend:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore di rete verso Resend' })
    };
  }
};

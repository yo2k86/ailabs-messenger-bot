// FILE LENGKAP BOT AILABS - DOBEL + MESSENGER
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === process.env.VERIFY_TOKEN) {
    return new Response(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req) {
  const body = await req.json();
  console.log("WEBHOOK MASUK:", JSON.stringify(body).slice(0, 1000));

  try {
    for (const entry of body.entry) {

      // === FITUR 1: KOMEN FEED (DOBEL PUBLIC + PRIVATE) ===
      if (entry.changes) {
        const value = entry.changes[0].value;
        if (value.item === 'comment' && value.verb === 'add' && value.message?.toLowerCase().includes('bangpro')) {
          const commentId = value.comment_id;
          const fromName = value.from?.name || "Kak";

          const publicVariasi = [
            `Haii @${fromName}! 👋 Saya Ailabs Bot 🤖 Silahkan di cek yaa ✨`,
            `Halo @${fromName}! Aku Ailabs Bot nih, link nya udah aku kirim di DM yaa 🚀`,
            `Siap @${fromName}! Cek inbox kamu ya, Ailabs Bot udah balas di sana 😉`
          ];
          const randomPublic = publicVariasi[Math.floor(Math.random() * publicVariasi.length)];

          // 1. PUBLIC KOMEN
          await fetch(`https://graph.facebook.com/v26.0/${commentId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: process.env.PAGE_ACCESS_TOKEN, message: randomPublic })
          });

          // 2. PRIVATE DM
          await fetch(`https://graph.facebook.com/v26.0/${commentId}/private_replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: process.env.PAGE_ACCESS_TOKEN,
              message: `Halo @${fromName}! 👋\n\nAku Bot Ailabs 🤖🔥\nKamu komen "bangpro" ya? Ini link PRO nya:\n\n👉 https://meta.ai/prompt/xxxxx\n\nSilahkan di cek DM ini ya! ✨`
            })
          });
        }
      }

      // === FITUR 2: CHAT MESSENGER (BISA NGOBROL) ===
      if (entry.messaging) {
        for (const m of entry.messaging) {
          if (m.message &&!m.message.is_echo) {
            let text = "Halo! Aku Bot Ailabs 🤖 Ketik 'bangpro' buat dapet link PRO!";
            if (m.message.text?.toLowerCase().includes('bangpro')) {
              text = "Siap! Ini link PRO nya 👉 https://meta.ai/prompt/xxxxx \nSilahkan di cek yaa ✨";
            }
            await fetch(`https://graph.facebook.com/v26.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recipient: { id: m.sender.id }, message: { text } })
            });
          }
        }
      }
    }
  } catch (e) { console.log("ERROR:", e); }

  return new Response('EVENT_RECEIVED', { status: 200 });
}

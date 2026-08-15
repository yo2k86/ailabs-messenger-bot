const commentId = entry.changes[0].value.comment_id;
const fromName = entry.changes[0].value.from?.name || "Kak";

const privateMessage = `Halo @${fromName}! 👋

Aku Bot Ailabs 🤖🔥
Kamu tadi komen "bangpro" ya? Link by PRO nya udah aku siapin khusus buat kamu:

👉 https://meta.ai/prompt/xxxxx

Cek DM ini aja ya, jangan share di komen biar aman. Tinggal klik & langsung pakai! ✨
- Ailabs Official Bot`;

const fbRes = await fetch(`https://graph.facebook.com/v26.0/${commentId}/private_replies`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    access_token: process.env.PAGE_ACCESS_TOKEN,
    message: privateMessage
  })
});

const fbData = await fbRes.json();
console.log("FB PRIVATE RESULT:", fbData);

export async function POST(req) {
  const body = await req.json();
  console.log("WEBHOOK:", JSON.stringify(body));
  try {
    for (const entry of body.entry) {
      if (entry.changes) {
        const value = entry.changes[0].value;
        if (value.item === 'comment' && value.message?.toLowerCase().includes('bangpro')) {
          const commentId = value.comment_id;
          const fromName = value.from?.name || "Kak";

          // VERSI YANG TADI BERHASIL (cuma komen public)
          const res = await fetch(`https://graph.facebook.com/v20.0/${commentId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: process.env.PAGE_ACCESS_TOKEN,
              message: `Haii @${fromName}! 👋 Saya Ailabs Bot 🤖 Silahkan di cek yaa ✨ Link PRO nya udah aku siapin: https://meta.ai/prompt/xxxxx`
            })
          });
          console.log("RESULT:", await res.json());
        }
      }
    }
  } catch (e) { console.log(e); }
  return new Response('EVENT_RECEIVED', { status: 200 });
}

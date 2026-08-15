export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "AILABS_TOKEN_RAHASIA";
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log("WEBHOOK MASUK:", JSON.stringify(body, null, 2));

      if (body.object === 'page') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
              if (change.value.from?.id === entry.id) continue;
              
              const komenAsli = change.value.message || "";
              const komen = komenAsli.toLowerCase();
              const commentId = change.value.comment_id;
              const fromName = change.value.from?.name || "Kak";

              console.log(`KOMEN MASUK: ${komenAsli} | ID: ${commentId}`);

              const keywords = ["prompt", "mau", "bangpro", "bang pro", "bg pro", "link", "bagi", "spill"];
              if (keywords.some(k => komen.includes(k))) {
                console.log("🔥 TRIGGER KENA:", komen);

                // ANTI-SPAM RANDOM PUBLIC
                const variasiPublic = [
                  `Haii @${fromName}! 👋 Saya Ailabs Bot 🤖 Silahkan di cek yaa ✨`,
                  `Halo @${fromName}! Aku Ailabs Bot nih, silahkan di cek DM kamu yaa 🚀`,
                  `Siap @${fromName}! Saya Ailabs Bot, cek inbox yaa 😉`
                ];
                const pesanPublic = variasiPublic[Math.floor(Math.random() * variasiPublic.length)];

                // 1. BALAS DI KOLOM KOMENTAR (TANPA LINK - ANTI BANNED)
                const urlPublic = `https://graph.facebook.com/v21.0/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`;
                const fbRes1 = await fetch(urlPublic, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: pesanPublic })
                });
                console.log("PUBLIC RESULT:", await fbRes1.json());

                // 2. BALAS DI DM PRIVATE (ADA LINK)
                try {
                  const urlPrivate = `https://graph.facebook.com/v21.0/${commentId}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;
                  const fbRes2 = await fetch(urlPrivate, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      message: `Halo @${fromName}! 👋\n\nSaya Ailabs Bot 🤖\nKamu komen "${komenAsli}" ya? Link PRO nya udah aku siapin:\n\n👉 https://meta.ai/prompt/xxxxx\n\nSilahkan di cek DM ini ya! ✨` 
                    })
                  });
                  console.log("PRIVATE RESULT:", await fbRes2.json());
                } catch (e) {
                  console.log("PRIVATE GAGAL (butuh permission pages_messaging):", e);
                }
              }
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
      console.error("ERROR:", e);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}

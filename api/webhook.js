export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "AILABS_TOKEN_RAHASIA";
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // PASTIIN INI TOKEN NEVER EXPIRE YANG BARU!

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

                // FIX: Pake v19.0, jangan v21.0!
                const GRAPH_VER = "v19.0";

                const variasiPublic = [
                  `Haii @${fromName}! 👋 Saya Ailabs Bot 🤖 Silahkan di cek DM yaa ✨`,
                  `Halo @${fromName}! Aku Ailabs Bot nih, silahkan di cek DM kamu yaa 🚀`,
                  `Siap @${fromName}! Saya Ailabs Bot, cek inbox yaa 😉`
                ];
                const pesanPublic = variasiPublic[Math.floor(Math.random() * variasiPublic.length)];

                // 1. PUBLIC REPLY
                try {
                  const urlPublic = `https://graph.facebook.com/${GRAPH_VER}/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`;
                  const fbRes1 = await fetch(urlPublic, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: pesanPublic })
                  });
                  const data1 = await fbRes1.json();
                  console.log("PUBLIC RESULT:", data1);
                } catch (e) {
                  console.log("PUBLIC GAGAL:", e.message);
                }

                // KASIH JEDA 2 DETIK BIAR GAK KE-DETECT SPAM
                await new Promise(r => setTimeout(r, 2000));

                // 2. PRIVATE REPLY - FIX ERROR 33
                try {
                  const urlPrivate = `https://graph.facebook.com/${GRAPH_VER}/${commentId}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;
                  const fbRes2 = await fetch(urlPrivate, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      message: `Halo ${fromName}! 👋\n\nKamu komen "${komenAsli}" ya? Link nya udah aku siapin:\n\n👉 https://meta.ai/prompt/xxxxx\n\nCek DM ini ya! ✨` 
                    })
                  });
                  const data2 = await fbRes2.json();
                  console.log("PRIVATE RESULT:", data2);
                  
                  if (data2.error) {
                    console.log("PRIVATE ERROR DETAIL:", data2.error.message, "| CODE:", data2.error.code, "| SUBCODE:", data2.error.error_subcode);
                    if (data2.error.code === 100 && data2.error.error_subcode === 33) {
                      console.log("SOLUSI: App masih Development & pengkomen bukan Tester! Add jadi Tester atau ganti ke Live Mode!");
                    }
                  }
                } catch (e) {
                  console.log("PRIVATE GAGAL:", e.message);
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

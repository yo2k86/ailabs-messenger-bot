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
          for (const m of entry.messaging || []) {
            if (!m.message || m.message.is_echo) continue;
            const senderId = m.sender?.id;
            if (!senderId) continue;
            const now = Date.now();
            const last = lastDmReply.get(senderId) || 0;
            if (now - last < 60000) {
              console.log("DM SKIP (anti-spam, <60s):", senderId);
              continue;
            }
            lastDmReply.set(senderId, now);
            if (!PAGE_ACCESS_TOKEN) {
              console.log("DM GAGAL: PAGE_ACCESS_TOKEN tidak ada");
              continue;
            }
            const GRAPH_VER = "v19.0";
            try {
              const urlDm = `https://graph.facebook.com/${GRAPH_VER}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
              const fbRes = await fetch(urlDm, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: senderId },
                  message: {
                    attachment: {
                      type: "template",
                      payload: {
                        template_type: "button",
                        text: "AI Video Creator Suite: 3-in-1 Gem System + AiLabs Influencer Workflow. Gabung Saluran WhatsApp Ailabs dulu buat lihat-lihat.",
                        buttons: [
                          { type: "web_url", url: "https://bangpro.my.id/channel", title: "Gabung Channel" }
                        ]
                      }
                    }
                  }
                })
              });
              const data = await fbRes.json();
              console.log("DM RESULT:", data);
            } catch (e) {
              console.log("DM GAGAL:", e.message);
            }
          }
          for (const change of entry.changes || []) {
            if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
              if (change.value.from?.id === entry.id) continue;
              const komenAsli = change.value.message || "";
              const komen = komenAsli.toLowerCase();
              const commentId = change.value.comment_id;
              const fromName = change.value.from?.name || "Kak";
              console.log(`KOMEN MASUK: ${komenAsli} | ID: ${commentId}`);
              const keywords = ["mau"];
              if (keywords.some(k => komen.includes(k))) {
                console.log("TRIGGER KENA:", komen);
                const GRAPH_VER = "v19.0";
                const pesanPublic = `Makasih @${fromName}! Cek DM ya — klik Kirim Pesan ke Page ini, link-nya aku kirim di sana 💬`;
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
const lastDmReply = new Map();

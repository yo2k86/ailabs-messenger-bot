export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "AILABS_TOKEN_RAHASIA";
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // 1. VERIFIKASI WEBHOOK
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // 2. TERIMA KOMEN
  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log("WEBHOOK MASUK:", JSON.stringify(body, null, 2));

      if (body.object === 'page') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            
            if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
              
              // Jangan bales komen dari Page sendiri
              if (change.value.from?.id === entry.id) continue;

              const komenAsli = change.value.message || "";
              const komen = komenAsli.toLowerCase();
              const commentId = change.value.comment_id;

              console.log(`KOMEN MASUK: ${komenAsli} | ID: ${commentId}`);

              // ===== KEYWORD BANYAK =====
              const keywords = ["prompt", "mau", "bangpro", "bang pro", "bg pro", "bg", "link", "bagi", "spill", "info"];
              const isTriggered = keywords.some(k => komen.includes(k));

              if (isTriggered) {
                console.log("🔥 TRIGGER KENA:", komen);

                const pesanBalasan = `Halo brow! 🔥 Ini link akses prompt AIlabs nya: https://google.com

Cek ya, tinggal klik & pakai. Jangan lupa follow!`;

                // === KIRIM BALASAN PUBLIC (ANTI GAGAL) ===
                const url = `https://graph.facebook.com/v21.0/${commentId}/comments`;

                const fbRes = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: pesanBalasan,
                    access_token: PAGE_ACCESS_TOKEN
                  })
                });
                
                const hasil = await fbRes.json();
                console.log("FB RESULT:", JSON.stringify(hasil, null, 2));

                if (fbRes.ok) {
                  console.log("✅ BERHASIL BALAS KOMEN");
                } else {
                  console.error("❌ GAGAL BALAS:", hasil);
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

  return res.status(405).send("Method Not Allowed");
}

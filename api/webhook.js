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

              console.log(`KOMEN MASUK: ${komenAsli} | ID: ${commentId}`);

              const keywords = ["prompt", "mau", "bangpro", "bang pro", "bg pro", "link", "bagi", "spill"];
              if (keywords.some(k => komen.includes(k))) {
                console.log("🔥 TRIGGER KENA:", komen);

                const pesanBalasan = `Halo @${change.value.from?.name || 'brow'}! 🔥 Link prompt AIlabs nya udah gua siapin: https://google.com\n\nCek ya, tinggal klik & pakai!`;

                const url = `https://graph.facebook.com/v21.0/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`;

                const fbRes = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: pesanBalasan })
                });
                
                const hasil = await fbRes.json();
                console.log("FB RESULT:", JSON.stringify(hasil, null, 2));
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

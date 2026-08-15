export default async function handler(req, res) {
  // GANTI DI VERCEL ENV, JANGAN DI SINI
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "AILABS_TOKEN_RAHASIA";
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // Buat verifikasi awal dari Facebook
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // Ini yang jalan pas ada komen
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (body.object === 'page') {
        for (const entry of body.entry) {
          for (const change of entry.changes || []) {
            // Cek cuma kalo ini KOMEN BARU
            if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
              
              const komenAsli = change.value.message || "";
              const komen = komenAsli.toLowerCase();
              const commentId = change.value.comment_id;

              console.log(`Ada komen masuk: ${komenAsli}`);

              // Kalo komennya ada kata MAU / PROMPT / LINK
              if (komen.includes('mau') || komen.includes('prompt') || komen.includes('link')) {
                console.log("TRIGGER! Kirim DM ke: " + commentId);

                const url = `https://graph.facebook.com/v21.0/${commentId}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;
                
                const fbRes = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: "Halo brow! Ini link akses prompt AIlabs nya: https://google.com - cek Messenger ya!"
                  })
                });
                
                const hasil = await fbRes.json();
                console.log("Hasil kirim DM:", hasil);
              }
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
      console.error(e);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}

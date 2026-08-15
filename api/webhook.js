module.exports = async function handler(req, res) {
  const VERIFY_TOKEN = "AILABS_TOKEN_RAHASIA"; 
  const PAGE_ACCESS_TOKEN = "EAATjxyIdUfcBSBLfMxUmLlWZAZBZBGkQb6oD0N0coteApgjZBH1rfJST1KKjXvMReMTaC5HiyZA8b8us1KVsjdrXwDEyQK9Bx6HjXF1XsdCUNYNVyKqeeKZAETmo1mzKFJdKY9C9bKuHdzimVcOt6bZAlnsz4W6XqCzxdyR1SLK8zZALIfXvkS5kVEOB6hjwF1jaHkYl1SSUmQZDZD";

  // --- 1. VERIFIKASI WEBHOOK (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED Berhasil!");
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // --- 2. MENANGKAP EVENT WEBHOOK (POST) ---
  if (req.method === 'POST') {
    const body = req.body;

    // Cetak data mentah ke Log Vercel supaya kelihatan kalau ada yang masuk!
    console.log("EVENT MASUK:", JSON.stringify(body, null, 2));

    try {
      if (body.object === 'page') {
        for (const entry of body.entry) {
          // Cek apakah ada perubahan (feed / comment)
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (change.field === 'feed' && change.value && change.value.item === 'comment') {
                const commentText = (change.value.message || "").toLowerCase();
                const commentId = change.value.comment_id;
                const senderName = change.value.from ? change.value.from.name : "Sobat";

                console.log(`Komentar terdeteksi dari ${senderName}: "${commentText}" (ID: ${commentId})`);

                // Kata kunci pemicu bot membalas DM
                if (commentText.includes('prompt') || commentText.includes('link') || commentText.includes('mau')) {
                  const pesanBalasan = "Halo brow! Ini link akses alat dan prompt AIlabs miliknya: https://google.com";
                  await kirimDM(commentId, pesanBalasan, PAGE_ACCESS_TOKEN);
                }
              }
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error("Error processing webhook:", err);
      return res.status(200).send('EVENT_RECEIVED'); // Tetap balas 200 supaya Meta tidak spam retry
    }
  }

  return res.status(404).send('Not Found');
};

async function kirimDM(commentId, message, token) {
  const url = `https://graph.facebook.com/v19.0/${commentId}/private_replies`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        access_token: token
      })
    });
    const data = await response.json();
    console.log("Hasil Kirim DM:", data);
  } catch (error) {
    console.error('Gagal mengirim pesan:', error);
  }
}

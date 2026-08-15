export default async function handler(req, res) {
  const VERIFY_TOKEN = "AILABS_TOKEN_RAHASIA";
  const PAGE_ACCESS_TOKEN = "EAATjxyIdUfcBSBLfMxUmLlWZAZBZBGkQb6oD0N0coteApgjZBH1rfJST1KKjXvMReMTaC5HiyZA8b8us1KVsjdrXwDEyQK9Bx6HjXF1XsdCUNYNVyKqeeKZAETmo1mzKFJdKY9C9bKuHdzimVcOt6bZAlnsz4W6XqCzxdyR1SLK8zZALIfXvkS5kVEOB6hjwF1jaHkYl1SSUmQZDZD";

  // 1. Verifikasi Webhook Meta (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log("--> WEBHOOK BERHASIL TERVERIFIKASI <--");
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // 2. Menerima Komentar & Kirim DM (POST)
  if (req.method === 'POST') {
    const body = req.body;
    console.log("--> EVENT MASUK DARI META:", JSON.stringify(body, null, 2));

    try {
      if (body.object === 'page') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'feed' && change.value && change.value.item === 'comment') {
              const commentText = (change.value.message || "").toLowerCase();
              const commentId = change.value.comment_id;

              console.log(`Komentar masuk: "${commentText}" dari ID: ${commentId}`);

              // Cek kata kunci pemicu
              if (commentText.includes('prompt') || commentText.includes('link') || commentText.includes('mau')) {
                const pesanBalasan = "Halo brow! Ini link akses alat dan prompt AIlabs miliknya: https://google.com";
                await kirimDM(commentId, pesanBalasan, PAGE_ACCESS_TOKEN);
              }
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error("Error memproses komentar:", err);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(405).send('Method Not Allowed');
}

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
    const result = await response.json();
    console.log("Hasil Pengiriman DM:", result);
  } catch (error) {
    console.error("Gagal request kirim DM:", error);
  }
}

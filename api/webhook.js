module.exports = async function handler(req, res) {
  const VERIFY_TOKEN = "AILABS_TOKEN_RAHASIA"; 
  const PAGE_ACCESS_TOKEN = "EAATjxyIdUfcBSBLfMxUmLlWZAZBZBGkQb6oD0N0coteApgjZBH1rfJST1KKjXvMReMTaC5HiyZA8b8us1KVsjdrXwDEyQK9Bx6HjXF1XsdCUNYNVyKqeeKZAETmo1mzKFJdKY9C9bKuHdzimVcOt6bZAlnsz4W6XqCzxdyR1SLK8zZALIfXvkS5kVEOB6hjwF1jaHkYl1SSUmQZDZD";[cite: 1]

  // --- VERIFIKASI WEBHOOK ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // --- MENANGKAP KOMENTAR & KIRIM DM ---
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page' || body.object === 'user') {
      for (const entry of body.entry) {
        if (!entry.changes) continue;
        const changes = entry.changes[0];
        
        if (changes.field === 'feed' && changes.value.item === 'comment' && changes.value.verb === 'add') {
          const commentText = changes.value.message.toLowerCase();
          const commentId = changes.value.comment_id;

          // Kata kunci pemicu bot membalas
          if (commentText.includes('prompt') || commentText.includes('link') || commentText.includes('mau')) {
            const pesanBalasan = "Halo brow! Ini link akses alat dan prompt AIlabs miliknya: https://google.com";
            await kirimDM(commentId, pesanBalasan, PAGE_ACCESS_TOKEN);
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not Found');
  }
};

async function kirimDM(commentId, message, token) {
  const url = `https://graph.facebook.com/v19.0/${commentId}/private_replies`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        access_token: token
      })
    });
  } catch (error) {
    console.error('Gagal mengirim pesan:', error);
  }
}

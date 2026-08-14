Siap brow, tokennya sudah saya masukkan langsung ke dalam kodenya.

Silakan langsung *copy* semua kode di bawah ini, *paste* ke GitHub, lalu klik **Commit changes...**:

```javascript
export default async function handler(req, res) {
  // Kata sandi buatan kita sendiri untuk verifikasi Meta nanti
  const VERIFY_TOKEN = "AILABS_TOKEN_RAHASIA"; 
  
  // Token akses Meta yang sudah dimasukkan
  const PAGE_ACCESS_TOKEN = "EAATjxyIdUfcBSBLfMxUmLlWZAZBZBGkQb6oD0N0coteApgjZBH1rfJST1KKjXvMReMTaC5HiyZA8b8us1KVsjdrXwDEyQK9Bx6HjXF1XsdCUNYNVyKqeeKZAETmo1mzKFJdKY9C9bKuHdzimVcOt6bZAlnsz4W6XqCzxdyR1SLK8zZALIfXvkS5kVEOB6hjwF1jaHkYl1SSUmQZDZD"; 

  // --- BAGIAN 1: VERIFIKASI WEBHOOK DARI META ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook berhasil diverifikasi!');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // --- BAGIAN 2: MENERIMA KOMENTAR DAN MENGIRIM DM ---
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      for (const entry of body.entry) {
        const changes = entry.changes[0];
        
        // Deteksi jika ada komentar baru yang masuk
        if (changes.field === 'feed' && changes.value.item === 'comment' && changes.value.verb === 'add') {
          const commentText = changes.value.message.toLowerCase();
          const commentId = changes.value.comment_id;

          // LOGIKA KATA KUNCI: bot merespon jika ada kata "prompt", "link", atau "mau"
          if (commentText.includes('prompt') || commentText.includes('link') || commentText.includes('mau')) {
            
            // Ini pesan balasannya. Link saya isi sementara dulu untuk tes.
            const pesanBalasan = "Halo brow! Ini link sementara untuk ngetes bot Ailabs: https://google.com";
            
            await kirimDM(commentId, pesanBalasan, PAGE_ACCESS_TOKEN);
          }
        }
      }
      // Wajib merespon 200 OK ke Meta
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not Found');
  }
}

// FUNGSI EKSEKUSI PENGIRIMAN PESAN VIA API META
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
    console.log(`Sukses kirim link ke komentar ID: ${commentId}`);
  } catch (error) {
    console.error('Gagal mengirim pesan:', error);
  }
}

```

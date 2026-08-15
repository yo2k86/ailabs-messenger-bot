export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // 1. VERIFIKASI WEBHOOK
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // 2. TERIMA WEBHOOK
  if (req.method === "POST") {
    const body = req.body;
    console.log("WEBHOOK MASUK:", JSON.stringify(body, null, 2));

    try {
      if (body?.object === "page") {
        for (const entry of body?.entry || []) {
          for (const change of entry?.changes || []) {
            const value = change?.value;

            // Hanya proses komen baru, bukan komen dari Page sendiri
            if (change?.field === "feed" && value?.item === "comment" && value?.verb === "add") {
              
              // Jangan bales komen dari admin page sendiri
              if (value?.from?.id === entry?.id) continue;

              const commentText = String(value?.message || "").toLowerCase();
              const commentId = value?.comment_id;

              console.log("KOMEN:", commentText, "| ID:", commentId);

              // ========== KEYWORD BANYAK ==========
              const keywords = [
                "prompt",
                "mau",
                "bangpro",
                "bang pro",
                "bg pro",
                "bg",
                "link",
                "bagi",
                "spill",
                "info"
              ];

              const isTriggered = keywords.some(k => commentText.includes(k));

              if (isTriggered) {
                console.log("🔥 KEYWORD KENA:", commentText);

                const pesan = `Halo brow! 🔥

Ini link akses alat dan prompt AIlabs miliknya:
https://google.com

Tinggal klik & pakai. Jangan lupa follow biar gak ketinggalan prompt baru!`;

                await kirimDM(commentId, pesan, PAGE_ACCESS_TOKEN);
              }
            }
          }
        }
      }
      return res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("ERROR:", error);
      return res.status(200).send("EVENT_RECEIVED");
    }
  }

  return res.status(405).send("Method Not Allowed");
}

async function kirimDM(commentId, message, token) {
  if (!commentId || !token) return;

  // Pakai v21.0 jangan v26.0 (v26 belum ada)
  const url = `https://graph.facebook.com/v21.0/${commentId}/private_replies`;

  console.log("KIRIM PRIVATE REPLY KE:", commentId);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        access_token: token,
      }),
    });

    const result = await response.json();
    console.log("FB RESULT:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("✅ BERHASIL");
    } else {
      console.error("❌ GAGAL:", result);
    }
  } catch (error) {
    console.error("❌ ERROR FETCH:", error);
  }
}

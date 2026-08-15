export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // ==========================================
  // 1. VERIFIKASI WEBHOOK META
  // ==========================================
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("WEBHOOK VERIFICATION:", {
      mode,
      tokenMatch: token === VERIFY_TOKEN,
    });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK BERHASIL TERVERIFIKASI");
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Forbidden");
  }

  // ==========================================
  // 2. MENERIMA SEMUA POST DARI META
  // ==========================================
  if (req.method === "POST") {
    const body = req.body;

    console.log("====================================");
    console.log("META WEBHOOK POST MASUK");
    console.log("====================================");

    console.log("OBJECT:", body?.object);

    for (const entry of body?.entry || []) {
      console.log("ENTRY ID:", entry?.id);

      for (const change of entry?.changes || []) {
        console.log("FIELD:", change?.field);
        console.log("VALUE:", JSON.stringify(change?.value, null, 2));

        const value = change?.value;

        console.log("ITEM:", value?.item);
        console.log("VERB:", value?.verb);
        console.log("MESSAGE:", value?.message);
        console.log("COMMENT ID:", value?.comment_id);
        console.log("POST ID:", value?.post_id);
        console.log("FROM:", JSON.stringify(value?.from));
      }
    }

    console.log("====================================");

    // ==========================================
    // 3. DETEKSI KOMENTAR
    // ==========================================
    try {
      if (body?.object === "page") {
        for (const entry of body?.entry || []) {
          for (const change of entry?.changes || []) {
            const value = change?.value;

            if (
              change?.field === "feed" &&
              value?.item === "comment"
            ) {
              console.log("🔥 KOMENTAR TERDETEKSI!");

              const commentText = String(
                value?.message || ""
              ).toLowerCase();

              const commentId = value?.comment_id;

              console.log("COMMENT TEXT:", commentText);
              console.log("COMMENT ID:", commentId);

              if (
                commentText.includes("prompt") ||
                commentText.includes("link") ||
                commentText.includes("mau")
              ) {
                console.log("🔥 KEYWORD TERDETEKSI!");

                const pesan =
                  "Halo brow! Ini link akses alat dan prompt AIlabs miliknya: https://google.com";

                await kirimDM(
                  commentId,
                  pesan,
                  PAGE_ACCESS_TOKEN
                );
              } else {
                console.log(
                  "Komentar masuk, tetapi tidak mengandung keyword."
                );
              }
            }
          }
        }
      }

      return res.status(200).send("EVENT_RECEIVED");

    } catch (error) {
      console.error("ERROR MEMPROSES WEBHOOK:", error);

      // Tetap 200 supaya Meta tidak terus mengirim ulang event
      return res.status(200).send("EVENT_RECEIVED");
    }
  }

  return res.status(405).send("Method Not Allowed");
}


// ==========================================
// 4. KIRIM PRIVATE REPLY
// ==========================================
async function kirimDM(commentId, message, token) {
  if (!commentId) {
    console.error("❌ COMMENT ID KOSONG");
    return;
  }

  if (!token) {
    console.error("❌ PAGE_ACCESS_TOKEN BELUM DISET");
    return;
  }

  const url =
    `https://graph.facebook.com/v26.0/${commentId}/private_replies`;

  console.log("MENGIRIM PRIVATE REPLY KE:", commentId);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        access_token: token,
      }),
    });

    const result = await response.json();

    console.log("FACEBOOK PRIVATE REPLY STATUS:", response.status);
    console.log(
      "FACEBOOK PRIVATE REPLY RESULT:",
      JSON.stringify(result, null, 2)
    );

    if (!response.ok) {
      console.error("❌ FACEBOOK MENOLAK PRIVATE REPLY");
    } else {
      console.log("✅ PRIVATE REPLY BERHASIL DIKIRIM");
    }

  } catch (error) {
    console.error("❌ ERROR REQUEST FACEBOOK:", error);
  }
}

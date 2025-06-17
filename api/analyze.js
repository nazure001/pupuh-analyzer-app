export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { contents, generationConfig } = request.body;

  // Ambil teks prompt dari struktur Gemini
  const prompt = contents?.[0]?.parts?.[0]?.text;

  if (!prompt) {
    return response.status(400).json({ message: 'Prompt tidak ditemukan dalam body request.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      ...generationConfig,
      responseMimeType: "application/json"
    }
  };

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Tidak ada hasil dari Gemini.");
    }

    response.status(200).json({ result: JSON.parse(text) });

  } catch (error) {
    console.error("Backend error:", error);
    response.status(500).json({ message: "Gagal mendapatkan analisis dari Gemini.", error: error.message });
  }
}

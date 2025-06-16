export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { lyrics, pupuhType } = request.body;

  if (!lyrics || !pupuhType) {
    return response.status(400).json({ message: 'Lyrics and Pupuh Type are required.' });
  }

  // Ambil Kunci API yang tersimpan aman di Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `Sebagai seorang ahli karawitan Sunda, analisis lirik berikut yang dinyanyikan sebagai Pupuh ${pupuhType}.
Lirik: "${lyrics}"

Tugas Anda:
1.  **Analisis Aturan**: Periksa kesesuaian lirik dengan aturan Guru Lagu dan Guru Wilangan untuk Pupuh ${pupuhType}. Tampilkan hasil analisis dalam format tabel Markdown yang jelas.
2.  **Saran Penjiwaan**: Berikan saran singkat (2-3 kalimat) mengenai karakter atau rasa (watek) yang seharusnya disampaikan saat menyanyikan Pupuh ${pupuhType}.

Berikan output dalam format JSON dengan kunci "ruleAnalysis" (berisi string dengan tabel Markdown) dan "performanceTip" (berisi string saran).`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          ruleAnalysis: { type: "STRING" },
          performanceTip: { type: "STRING" }
        },
        required: ["ruleAnalysis", "performanceTip"]
      }
    }
  };

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Kirim kembali hasil dari Gemini ke frontend
    response.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Backend error:", error);
    response.status(500).json({ message: "Failed to get analysis from AI." });
  }
}
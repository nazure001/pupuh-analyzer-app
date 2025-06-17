export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { lyrics, pupuhType, pitchContourData } = request.body;

  if (!lyrics || !pupuhType) {
    return response.status(400).json({ message: 'Lirik dan Jenis Pupuh wajib diisi.' });
  }

  // Ambil Kunci API yang tersimpan aman di Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  let pitchAnalysisPrompt = '';
  if (pitchContourData && pitchContourData.length > 0) {
      const simplifiedPitchData = pitchContourData.slice(0, 150).join(', ');
      pitchAnalysisPrompt = `
2.  **Analisis Melodi (Cengkok & Laras)**: Berdasarkan data kontur melodi (pitch dalam Hz) berikut: [${simplifiedPitchData}], berikan evaluasi. Apakah cengkoknya sesuai untuk pupuh ini? Apakah nadanya terlalu tinggi, rendah, atau stabil?`;
  }

  const prompt = `Sebagai seorang ahli karawitan Sunda, berikan analisis komprehensif untuk penampilan Pupuh berikut.

DATA YANG DISEDIAKAN:
- **Jenis Pupuh**: ${pupuhType}
- **Lirik yang Dinyanyikan**: "${lyrics}"
${pitchContourData ? `- **Data Kontur Melodi (Pitch)**: Tersedia` : ''}

TUGAS ANALISIS:
1.  **Analisis Lirik (Guru Lagu & Wilangan)**: Periksa kesesuaian lirik dengan aturan. Sajikan dalam tabel Markdown.
${pitchAnalysisPrompt}
3.  **Saran Penjiwaan (Watek)**: Berikan saran singkat mengenai karakter yang harus disampaikan.

Berikan output dalam format JSON dengan kunci "ruleAnalysis", "melodyAnalysis" (jika data pitch ada, jika tidak, isi dengan "Analisis melodi tidak tersedia."), dan "performanceTip".`;


  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    }
  };

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.json();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    
    // Membersihkan respons sebelum parsing JSON
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    // Kirim kembali hasil dari Gemini ke frontend
    response.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Backend error:", error);
    response.status(500).json({ message: "Gagal mendapatkan analisis dari AI." });
  }
}

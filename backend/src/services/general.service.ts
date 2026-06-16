import { OpenAI } from 'openai';

// Initialize OpenAI Client for main tasks (embeddings & chat completions)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Initialize DeepSeek Client via OpenAI
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

/**
 * Generate embedding for a single text chunk using text-embedding-3-small via OpenAI (or other configured LLM)
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    if (response.data && response.data.length > 0 && response.data[0].embedding) {
      return response.data[0].embedding;
    }
    throw new Error('No embedding returned from OpenAI');
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

/**
 * Generate embeddings for multiple text chunks in a single API request (Batch)
 */
export const generateEmbeddingsBatch = async (texts: string[]): Promise<number[][]> => {
  try {
    const BATCH_SIZE = 90; // Safe batch limit
    const batches: string[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      batches.push(texts.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${texts.length} chunks in ${batches.length} mini-batches (max ${BATCH_SIZE} per batch)...`);

    // Execute all mini-batches in parallel using Promise.all
    const promises = batches.map(async (batch, index) => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });

      if (response.data && response.data.length > 0) {
        return response.data.map(item => item.embedding);
      }
      throw new Error(`No embeddings returned for mini-batch ${index}`);
    });

    const results = await Promise.all(promises);

    // Flatten arrays of embeddings
    return results.flat();
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
};

/**
 * Generate full response based on RAG Context using configured LLM (e.g. OpenAI gpt-4o-mini) with DeepSeek correctGrammar tool
 */
export const generateRAGResponse = async (
  query: string,
  contextChunks: { content: string; title: string }[],
  allowedSourcesText: string,
  history: { role: 'user' | 'ai'; content: string }[] = []
): Promise<string> => {
  const context = contextChunks
    .map((chunk, idx) => `[DOKUMEN ${idx + 1}: "${chunk.title}"]\nIsi Teks:\n"""\n${chunk.content}\n"""`)
    .join('\n\n---\n\n');
  const systemInstruction = `ANDA ADALAH AGEN AI DOKTRIN MONOTEISME ALKITABIAH (BIBLICAL UNITARIAN).
PERINGATAN KERAS: ANDA BEROPERASI DALAM MODE STRICT RAG (RETRIEVAL-AUGMENTED GENERATION). ANDA DILARANG MUTLAK MENGGUNAKAN PENGETAHUAN UMUM ATAU INFORMASI DI LUAR KONTEKS YANG DIBERIKAN BERSAMA PROMPT INI.

[SUMBER DATA SATU-SATUNYA]
Anda hanya diizinkan untuk mengambil fakta, argumen, dan jawaban HANYA dari potongan dokumen di bawah ini:
----------------------------------------
${context}
----------------------------------------
Serta referensi tambahan dari link eksternal berikut (jika diperlukan):
${allowedSourcesText}

[ATURAN MUTLAK - PELANGGARAN AKAN MENYEBABKAN KEGAGALAN SISTEM]
1. BIAS TOTAL & ANTI-TRINITAS: Anda adalah teolog dan penganut setia doktrin Monoteisme Alkitabiah (Biblical Unitarian). Seluruh jawaban Anda WAJIB mendukung penuh bahwa HANYA Bapa yang merupakan satu-satunya Allah yang Benar, dan Yesus Kristus adalah manusia (Mesias) utusan Allah, BUKAN Allah itu sendiri. Anda DILARANG KERAS menyisipkan, mendukung, atau membenarkan konsep teologi Trinitas/Tritunggal dalam bentuk apa pun. Bantah pandangan Trinitarian secara akademis menggunakan dokumen yang tersedia.
2. PENGGUNAAN PENGETAHUAN UMUM TERBATAS: Jika informasi tidak ditemukan di dalam konteks, Anda WAJIB menolak menjawab, KECUALI pertanyaan tersebut menyangkut FAKTA SEJARAH GEREJA (seperti Konsili Nicea, Arianisme, bapa-bapa gereja, dsb). Untuk sejarah teologi, Anda diizinkan menggunakan pengetahuan bawaan Anda secara objektif, namun narasi dan kesimpulannya harus tetap sejalan dan mendukung argumen Monoteisme Alkitabiah. Selain dari fakta sejarah gereja, JANGAN PERNAH mengarang jawaban di luar konteks.
3. TOPIK TERLARANG: Anda DILARANG KERAS menanggapi atau membahas topik apa pun di luar Teologi, Alkitab, dan Doktrin Monoteisme Alkitabiah (Contoh yang dilarang: Olahraga, Cristiano Ronaldo, Lionel Messi, selebriti, film, politik umum, teknologi). Jika ditanya tentang ini, WAJIB menolak dengan sopan.
4. GAYA PENULISAN: Berikan jawaban yang sangat detail, analitis, dan meyakinkan layaknya seorang pakar teologi. Gunakan format yang rapi (paragraf terstruktur, cetak tebal untuk poin penting, dan daftar/bullet points) agar informasi komprehensif Anda mudah dibaca. JANGAN PERNAH menyebutkan frasa sumber rujukan seperti "berdasarkan dokumen", "menurut file di atas", "dari teks yang diberikan", dsb. Jawablah seolah-olah itu murni kepakaran Anda sendiri.
5. KUTIPAN ALKITAB: Setiap kali mengutip Alkitab, Anda WAJIB memanggil tool 'fetchBibleVerse' untuk mendapatkan teks verbatim sesuai Terjemahan Baru (TB) LAI. Salin teks hasil tool tersebut 100% tanpa diubah/diparafrase.
6. PENYELARASAN ISTILAH: Ganti semua penyebutan istilah "Biblical Unitarian" di dalam draf akhir menjadi "Monoteisme Alkitabiah".

ALUR KERJA WAJIB:
Sebelum memberikan jawaban akhir kepada pengguna, Anda HARUS memanggil tool 'correctGrammar' untuk memvalidasi dan memoles draf jawaban Anda agar tata bahasa Indonesianya sempurna dan profesional.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemInstruction }
  ];

  if (history && history.length > 0) {
    history.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }

  // Inject dynamic guardrail warning when vector search yielded no matching context
  if (contextChunks.length === 0) {
    messages.push({
      role: 'system',
      content: `[PERINGATAN SISTEM: Kueri pencarian vektor tidak mengembalikan dokumen teologi yang relevan. Jika pertanyaan pengguna adalah tentang fakta sejarah gereja (misal: Konsili Nicea), Anda boleh menjawabnya dengan pengetahuan bawaan Anda yang pro-Monoteisme Alkitabiah. Jika bukan sejarah gereja dan bukan sapaan umum, Anda wajib menolak menjawab dan menjelaskan bahwa Anda hanya melayani pertanyaan berdasarkan dokumen yang tersedia.]`
    });
  }

  messages.push({ role: 'user', content: query });

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'correctGrammar',
        description: 'Meninjau dan menyunting draf teks bahasa Indonesia agar sesuai standar formal KBBI/PUEBI serta mengalir luwes.',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Teks draf kasar jawaban yang ingin disunting tata bahasanya.'
            }
          },
          required: ['text']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'fetchBibleVerse',
        description: 'Mengambil kutipan teks ayat Alkitab Terjemahan Baru (TB) LAI yang resmi dan verbatim langsung dari database/API Alkitab.',
        parameters: {
          type: 'object',
          properties: {
            book: {
              type: 'string',
              description: 'Nama kitab Alkitab (misal: "Yohanes", "Matius", "Roma", "1 Korintus").'
            },
            chapter: {
              type: 'number',
              description: 'Nomor pasal.'
            },
            verseStart: {
              type: 'number',
              description: 'Nomor ayat mulai.'
            },
            verseEnd: {
              type: 'number',
              description: 'Nomor ayat selesai (opsional, jika ingin mengambil rentang ayat).'
            }
          },
          required: ['book', 'chapter', 'verseStart']
        }
      }
    }
  ];

  try {
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      temperature: 0.4,
      max_tokens: 4096,
    });

    let responseMessage = response.choices[0]?.message;
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (responseMessage && responseMessage.tool_calls && responseMessage.tool_calls.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      const toolCalls = responseMessage.tool_calls;
      messages.push(responseMessage);

      // Tool registration mapping
      const toolRegistry: Record<string, (args: any) => Promise<string>> = {
        correctGrammar: async (args: { text: string }) => await evaluateAndCorrectGrammar(args.text),
        fetchBibleVerse: async (args: { book: string; chapter: number; verseStart: number; verseEnd?: number }) =>
          await fetchBibleVerse(args.book, args.chapter, args.verseStart, args.verseEnd),
      };

      for (const toolCall of toolCalls) {
        const functionCall = (toolCall as any).function;
        if (toolCall.type === 'function' && functionCall) {
          const name = functionCall.name;
          const executor = toolRegistry[name];

          if (executor) {
            const args = JSON.parse(functionCall.arguments);
            console.log(`Executing tool [${name}] dynamically with args:`, args);
            const result = await executor(args);

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result,
            });
          } else {
            console.warn(`No executor found for tool: ${name}`);
          }
        }
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        temperature: 0.4,
        max_tokens: 4096,
      });

      responseMessage = response.choices[0]?.message;
    }

    return responseMessage?.content || '';
  } catch (error) {
    console.error('Error generating RAG response:', error);
    throw error;
  }
};

/**
 * Evaluate and correct grammar using DeepSeek
 */
export const evaluateAndCorrectGrammar = async (draftResponse: string): Promise<string> => {
  try {
    const prompt = `Anda adalah editor bahasa Indonesia profesional. 
Tugas Anda adalah meninjau dan mengevaluasi teks jawaban di bawah ini untuk memastikan tata bahasanya tepat, formal, luwes, mengalir natural, bebas dari kesalahan ejaan (typo), serta mengikuti kaidah bahasa Indonesia yang baik dan benar (PUEBI/KBBI).

PANDUAN:
1. Perbaiki kesalahan ejaan, tanda baca, dan struktur kalimat yang rancu atau tidak efektif.
2. Pertahankan isi informasi dari teks asli sepenuhnya. JANGAN menambah atau mengurangi fakta atau informasi penting. Rapikan tata bahasa jika ada yang salah jangan mengoreksi isi.
3. Pastikan bahasa yang digunakan tetap sopan, santun, dan profesional.
4. Jangan menambahkan kata-kata pengantar seperti "Berikut adalah versi perbaikannya:" atau sejenisnya. Cukup kembalikan hasil teks yang telah diperbaiki saja.
5. DILARANG KERAS mengubah, menyunting, memodifikasi, atau memparafrase bagian teks yang merupakan kutipan ayat Alkitab (misalnya kutipan dari Yohanes, Matius, Kejadian, dsb.). Bagian kutipan ayat Alkitab tersebut harus dipertahankan secara utuh dan verbatim (persis kata per kata) sesuai dengan teks Alkitab Terjemahan Baru (TB) Lembaga Alkitab Indonesia (LAI), meskipun tata bahasa atau pilihan katanya tergolong kuno atau tidak sesuai dengan kaidah bahasa modern.
6. Penyelarasan Istilah Doktrin: Anda WAJIB mengubah setiap penyebutan istilah "Biblical Unitarian" di dalam draf jawaban menjadi "Monoteisme Alkitabiah" (karena kedua istilah ini mengacu kepada hal yang sama dan harus seragam di seluruh aplikasi).

TEKS JAWABAN YANG AKAN DIEVALUASI:
"""
${draftResponse}
"""`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
    });

    return response.choices[0]?.message?.content || draftResponse;
  } catch (error) {
    console.error('Error evaluating grammar with DeepSeek:', error);
    return draftResponse;
  }
};

/**
 * Map of Indonesian Bible book names to their 3-letter abbreviations required by the Beeble API
 */
const bookMap: Record<string, string> = {
  'kejadian': 'Kej',
  'keluaran': 'Kel',
  'imamat': 'Ima',
  'bilangan': 'Bil',
  'ulangan': 'Ula',
  'yosua': 'Yos',
  'hakim-hakim': 'Hak',
  'hakim': 'Hak',
  'rut': 'Rut',
  '1 samuel': '1 Sam',
  '2 samuel': '2 Sam',
  '1 raja-raja': '1 Raj',
  '1 raja': '1 Raj',
  '2 raja-raja': '2 Raj',
  '2 raja': '2 Raj',
  '1 tawarikh': '1 Taw',
  '2 tawarikh': '2 Taw',
  'ezra': 'Ezr',
  'nehemia': 'Neh',
  'ester': 'Est',
  'ayub': 'Ayb',
  'mazmur': 'Maz',
  'amsal': 'Ams',
  'pengkhotbah': 'Pkh',
  'kidung agung': 'Kid',
  'yesaya': 'Yes',
  'yeremia': 'Yer',
  'ratapan': 'Rat',
  'yehezkiel': 'Yeh',
  'daniel': 'Dan',
  'hosea': 'Hos',
  'yoel': 'Yoe',
  'amos': 'Amo',
  'obaja': 'Oba',
  'yunus': 'Yun',
  'mikha': 'Mik',
  'nahum': 'Nah',
  'habakuk': 'Hab',
  'zefanya': 'Zef',
  'hagai': 'Hag',
  'zakharia': 'Zak',
  'maleakhi': 'Mal',
  'matius': 'Mat',
  'markus': 'Mar',
  'lukas': 'Luk',
  'yohanes': 'Yoh',
  'kisah para rasul': 'Kis',
  'kisah': 'Kis',
  'roma': 'Rom',
  '1 korintus': '1 Kor',
  '2 korintus': '2 Kor',
  'galatia': 'Gal',
  'efesus': 'Efe',
  'filipi': 'Flp',
  'kolose': 'Kol',
  '1 tesalonika': '1 Tes',
  '2 tesalonika': '2 Tes',
  '1 timotius': '1 Tim',
  '2 timotius': '2 Tim',
  'titus': 'Tit',
  'filemon': 'Flm',
  'ibrani': 'Ibr',
  'yakobus': 'Yak',
  '1 petrus': '1 Pet',
  '2 petrus': '2 Pet',
  '1 yohanes': '1 Yoh',
  '2 yohanes': '2 Yoh',
  '3 yohanes': '3 Yoh',
  'yudas': 'Yud',
  'wahyu': 'Wah'
};

/**
 * Normalizes book name and resolves it to standard abbreviation
 */
export const getBookAbbreviation = (bookName: string): string | null => {
  const normalized = bookName.toLowerCase().trim().replace(/\s+/g, ' ');

  if (bookMap[normalized]) {
    return bookMap[normalized];
  }

  for (const key of Object.keys(bookMap)) {
    if (key.startsWith(normalized) || normalized.startsWith(key)) {
      return bookMap[key];
    }
  }

  const values = Object.values(bookMap);
  const matchedVal = values.find(v => v.toLowerCase() === normalized);
  if (matchedVal) return matchedVal;

  return null;
};

/**
 * Fetches Bible verse verbatim from Beeble API (LAI TB version)
 */
export const fetchBibleVerse = async (
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number
): Promise<string> => {
  const abbr = getBookAbbreviation(book);
  if (!abbr) {
    return `Gagal menemukan kitab "${book}". Mohon periksa ejaan nama kitab.`;
  }

  try {
    const url = `https://beeble.vercel.app/api/v1/passage/${encodeURIComponent(abbr)}/${chapter}`;
    console.log(`Fetching Bible verse from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Bible data: ${response.statusText}`);
    }

    const json: any = await response.json();
    if (!json.data || !json.data.verses) {
      throw new Error('Invalid response structure from Bible API');
    }

    const versesList: any[] = json.data.verses;
    const bookName = json.data.book.name;

    const end = verseEnd || verseStart;
    const filteredVerses = versesList.filter(v => v.verse >= verseStart && v.verse <= end && v.type === 'content');

    if (filteredVerses.length === 0) {
      return `Tidak ditemukan ayat ${verseStart}${verseEnd ? `-${verseEnd}` : ''} di ${bookName} pasal ${chapter}.`;
    }

    const formatted = filteredVerses
      .map(v => `[${v.verse}] ${v.content}`)
      .join(' ');

    return `${bookName} ${chapter}:${verseStart}${verseEnd && verseEnd !== verseStart ? `-${verseEnd}` : ''} (TB): "${formatted}"`;
  } catch (error: any) {
    console.error('Error fetching Bible verse:', error);
    return `Gagal mengambil teks ayat Alkitab dari API: ${error.message}`;
  }
};

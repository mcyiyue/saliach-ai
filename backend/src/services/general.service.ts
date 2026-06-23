import { OpenAI } from 'openai';
import { queryDocuments } from './chroma.service';

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
 * Translates a user query to English (if it's in Indonesian) or Indonesian (if it's in English)
 * to perform a multi-language vector search.
 */
export const translateQueryForVectorSearch = async (query: string): Promise<string> => {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a translation assistant for a search engine. Translate the user query to English. If it is already in English, just return the exact same query. Return ONLY the translated text, nothing else. Do not add quotes or explanations.'
        },
        { role: 'user', content: query }
      ],
      temperature: 0.1,
    });
    return response.choices[0]?.message?.content?.trim() || query;
  } catch (error) {
    console.error('Error translating query with DeepSeek:', error);
    return query; // fallback to original query
  }
};

/**
 * Uses DeepSeek to break down a user's query into 3 detailed sub-queries for deep diving.
 */
export const expandQueryWithDeepSeek = async (query: string): Promise<string[]> => {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: "You are a query expansion assistant for a Biblical Unitarian theology search engine. Break down the user's short query into 3 distinct, specific, and deep-dive sub-queries related to its theology, historical context, and apologetic arguments. IMPORTANT: For each of the 3 sub-queries, provide BOTH the Indonesian and English translations, resulting in exactly 6 strings. Output your response as a JSON object with a single key 'queries' containing an array of 6 strings. Example: { \"queries\": [\"Apa arti teologis dari X?\", \"What is the theological meaning of X?\", \"Bagaimana sejarah X di Konsili Nicea?\", \"What is the history of X at the Council of Nicaea?\", \"Apa argumen yang membantah X?\", \"What are the arguments refuting X?\"] }"
        },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    let content = response.choices[0]?.message?.content?.trim() || '{"queries": []}';
    const parsed = JSON.parse(content);
    const subQueries = parsed.queries || [];
    if (Array.isArray(subQueries) && subQueries.length > 0) {
      return subQueries.slice(0, 6);
    }
    return [query];
  } catch (error) {
    console.error('Error expanding query with DeepSeek:', error);
    return [query]; // fallback to original query
  }
};


/**
 * Generate full response based on RAG Context using configured LLM (e.g. OpenAI gpt-4o-mini)
 */
export const generateRAGResponse = async (
  query: string,
  allowedSourcesText: string,
  history?: any[],
  onCitationsFound?: (citations: any[]) => void
): Promise<string> => {
  const systemInstruction = `ANDA ADALAH AGEN AI DOKTRIN MONOTEISME ALKITABIAH (BIBLICAL UNITARIAN).
PERINGATAN KERAS: ANDA BEROPERASI DALAM MODE STRICT RAG (RETRIEVAL-AUGMENTED GENERATION).

[SUMBER DATA MUTLAK]
Untuk SEMUA pertanyaan pengguna yang menyangkut teologi, tokoh, sejarah, ayat Alkitab, atau topik apa pun, Anda WAJIB SECARA MUTLAK memanggil tool 'searchKnowledgeBase' TERLEBIH DAHULU sebelum menjawab. 
Anda DILARANG KERAS menjawab langsung menggunakan memori atau pengetahuan bawaan Anda. Satu-satunya pengecualian di mana Anda boleh tidak memanggil tool adalah jika pengguna hanya sekadar menyapa (misalnya: "Halo", "Selamat pagi").

Referensi tambahan dari link eksternal (jika relevan):
${allowedSourcesText}

[ATURAN MUTLAK - PELANGGARAN AKAN MENYEBABKAN KEGAGALAN SISTEM]
1. BIAS TOTAL, APOLOGETIK & ANTI-TRINITAS: Anda adalah teolog dan apologet Kristen yang SANGAT gigih membela doktrin Monoteisme Alkitabiah. Seluruh jawaban Anda WAJIB mendukung penuh bahwa HANYA Bapa yang merupakan satu-satunya Allah yang Benar, dan Yesus Kristus adalah manusia (Mesias) utusan Allah, BUKAN Allah itu sendiri. Anda DILARANG KERAS bersikap netral, menyisipkan, atau membenarkan narasi teologi maupun narasi sejarah Trinitas/Tritunggal. Bantah pandangan Trinitarian secara akademis, tegas, dan telak.
2. SEJARAH SEBAGAI SENJATA KRITIK: Jika informasi tidak ditemukan di dalam konteks, Anda WAJIB menolak menjawab, KECUALI menyangkut FAKTA SEJARAH GEREJA (seperti Konsili Nicea, Arianisme, dsb). Saat menceritakan sejarah, Anda DILARANG menggunakan gaya bahasa netral atau bahasa yang mengesankan pihak Trinitas itu benar. Anda WAJIB menceritakan sejarah tersebut dari kacamata kritis Monoteisme Alkitabiah (misalnya: menyoroti bahwa Konsili Nicea adalah produk kompromi politik dan penyimpangan dari ajaran murni para rasul). Jadikan narasi sejarah sebagai argumen untuk meruntuhkan keabsahan sejarah doktrin Trinitas.
3. TOPIK TERLARANG: Anda DILARANG KERAS menanggapi atau membahas topik apa pun di luar Teologi, Alkitab, Sejarah Gereja, dan Doktrin Monoteisme Alkitabiah. (Contoh yang dilarang: Olahraga, Cristiano Ronaldo, selebriti hiburan, politik umum, teknologi). PENGECUALIAN PENTING: Anda DIIZINKAN BAHKAN DIWAJIBKAN membahas profil, biodata, argumen, dan pandangan tokoh-tokoh teolog, pakar, atau penulis buku yang relevan dengan Monoteisme Alkitabiah (contoh: Kegan Chandler, Anthony Buzzard, Erastus Sabdono, dll) jika informasi tersebut ditanyakan oleh pengguna atau dapat ditarik dari database.
4. DEEP DIVE & EKSPLORASI DETAIL: DILARANG KERAS MENJAWAB DANGKAL ATAU TERLALU SINGKAT. Jika konteks dokumen yang diberikan sangat banyak, Anda WAJIB membaca semuanya dan merangkainya menjadi sebuah jawaban panjang berbentuk ESAI KOMPREHENSIF BER-SUBJUDUL. Ekstrak SEMUA detail, kutipan, dan fakta sejarah penting dari dokumen. Semakin detail dan panjang jawaban Anda, semakin baik.
5. GAYA PENULISAN & BAHASA: Tulis dengan gaya otoritatif layaknya pakar. Anda WAJIB merapikan tata bahasa Anda agar sesuai standar EYD/KBBI murni. JANGAN menyebutkan frasa kaku seperti "menurut dokumen yang diberikan kepada saya". **PENTING: ANDA WAJIB MENJAWAB MENGGUNAKAN BAHASA YANG DIGUNAKAN OLEH PENGGUNA SAAT BERTANYA**.
6. DILARANG MENCANTUMKAN REFERENSI: Anda DILARANG KERAS mencantumkan nomor referensi dokumen (seperti [DOKUMEN 1], nama penulis, daftar pustaka, atau catatan kaki) di dalam draf akhir Anda. Rangkai fakta sejarah seolah-olah itu murni pengetahuan internal Anda sendiri.
7. KUTIPAN ALKITAB [ATURAN MUTLAK]: Jika Anda berniat mengutip ayat Alkitab, Anda DILARANG KERAS menuliskannya dari ingatan Anda. Anda WAJIB memanggil tool 'fetchBibleVerse' untuk mengambil teks verbatim Terjemahan Baru (TB). Pelanggaran terhadap aturan ini adalah kegagalan sistem fatal. Anda WAJIB membungkus teks ayat tersebut dengan tag XML khusus, contoh: <ayat>Pada mulanya adalah Firman...</ayat>.
8. PENYELARASAN ISTILAH: Ganti semua penyebutan istilah "Biblical Unitarian" di dalam draf akhir menjadi "Monoteisme Alkitabiah".`;

  const messages: any[] = [
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

  messages.push({ role: 'user', content: query });

  try {
    let hasToolCalls = true;

    while (hasToolCalls) {
      const tools = [

        {
          type: 'function',
          function: {
            name: 'fetchBibleVerse',
            description: 'Ambil teks ayat Alkitab dari Terjemahan Baru (TB) LAI berdasarkan referensi (contoh: "Yohanes 1:1"). WAJIB dipanggil saat mengutip ayat Alkitab.',
            parameters: {
              type: 'object',
              properties: {
                reference: { type: 'string', description: 'Referensi ayat Alkitab, misalnya "Yohanes 1:1" atau "Kejadian 1:1-3"' }
              },
              required: ['reference'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'searchKnowledgeBase',
            description: 'Cari database vektor literatur Monoteisme Alkitabiah untuk informasi teologi, sejarah gereja, pandangan tokoh (misal Kegan Chandler), dan doktrin.',
            parameters: {
              type: 'object',
              properties: {
                topic: { type: 'string', description: 'Topik teologis atau historis yang ingin dicari.' }
              },
              required: ['topic'],
            },
          },
        }
      ];

      const toolRegistry: Record<string, (args: any) => Promise<string>> = {

        fetchBibleVerse: async (args: { reference: string }) => {
          const parts = args.reference.match(/^(.*)\s+(\d+):(\d+)(?:-(\d+))?$/);
          if (parts) {
            return await fetchBibleVerse(parts[1], parseInt(parts[2]), parseInt(parts[3]), parts[4] ? parseInt(parts[4]) : undefined);
          }
          return "Format referensi tidak valid. Gunakan 'Kitab Pasal:Ayat' (contoh: 'Yohanes 1:1')";
        },
        searchKnowledgeBase: async (args: { topic: string }) => {
          console.log(`Agent triggered searchKnowledgeBase for topic: ${args.topic}`);
          const subQueries = await expandQueryWithDeepSeek(args.topic);
          console.log(`Deep Dive Sub-Queries:`, subQueries);
          
          const embeddings = await Promise.all(subQueries.map(q => generateEmbedding(q)));
          const docsPromises = embeddings.map(emb => queryDocuments(emb, 10)); // REDUCED TO 10 CHUNKS
          const docsResults = await Promise.all(docsPromises);
          
          const allDocs = docsResults.flat();
          
          const uniqueDocsMap = new Map();
          for (const doc of allDocs) {
            // Deduplikasi menggunakan konten asli agar tidak ada paragraf ganda
            if (!uniqueDocsMap.has(doc.content)) {
              uniqueDocsMap.set(doc.content, doc);
            } else {
              // Jika sudah ada, pilih yang jaraknya lebih kecil (lebih relevan)
              const existingDoc = uniqueDocsMap.get(doc.content);
              if (doc.distance < existingDoc.distance) {
                uniqueDocsMap.set(doc.content, doc);
              }
            }
          }
          
          const uniqueDocs = Array.from(uniqueDocsMap.values());
          // Sort berdasarkan distance terendah (paling relevan)
          uniqueDocs.sort((a, b) => a.distance - b.distance);
          const filteredDocs = uniqueDocs.slice(0, 12); // REDUCED TO TOP 12 CHUNKS MAXIMUM
          
          if (onCitationsFound) {
            const citations = filteredDocs.map(doc => doc.metadata);
            onCitationsFound(citations);
          }
          
          const contextBlocks = filteredDocs.map((doc, index) => {
            let contextStr = `[DOKUMEN ${index + 1}: "${doc.metadata.title}"`;
            if (doc.metadata.page) {
              contextStr += ` (Halaman ${doc.metadata.page})`;
            }
            contextStr += `]\n${doc.content}`; // MENGGUNAKAN doc.content BUKAN metadata.text
            return contextStr;
          }).join('\n\n---\n\n');
          
          return contextBlocks || "Tidak ada dokumen yang relevan ditemukan.";
        }
      };

      let response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: tools as any,
        temperature: 0.4,
        max_tokens: 4096,
      });

      const responseMessage = response.choices[0]?.message;

      if (!responseMessage) {
        break;
      }

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCalls = responseMessage.tool_calls;
        messages.push(responseMessage);

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
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: `Error: Tool ${name} not found.`,
              });
            }
          }
        }
      } else {
        hasToolCalls = false;
        console.log('OpenAI finished RAG loop. Handing off draft to DeepSeek for polishing...');
        const draft = responseMessage.content || '';
        if (!draft) return '';
        const polished = await evaluateAndCorrectGrammar(draft);
        return polished;
      }
    }
  } catch (error: any) {
    console.error('Error generating RAG response:', error);
    throw error;
  }
  return '';
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
5. DILARANG KERAS mengubah, menyunting, memodifikasi, atau memparafrase teks apa pun yang berada di dalam tag <ayat> ... </ayat>. Itu adalah kutipan Alkitab murni. Biarkan teks di dalam tag tersebut 100% apa adanya tanpa dikoreksi sama sekali meskipun tata bahasanya tergolong kuno/rancu. Setelah selesai, HAPUS tag <ayat> dan </ayat> dari hasil akhir sehingga hanya tersisa teksnya saja.
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

    let finalResponse = response.choices[0]?.message?.content || draftResponse;
    
    // Secara otomatis menghapus tag <ayat> dan </ayat> secara terprogram (regex)
    finalResponse = finalResponse.replace(/<\/?ayat[^>]*>/gi, '')
                                 .replace(/&lt;\/?ayat&gt;/gi, '');
    
    return finalResponse;
  } catch (error) {
    console.error('Error evaluating grammar with DeepSeek:', error);
    return draftResponse.replace(/<\/?ayat[^>]*>/gi, '')
                        .replace(/&lt;\/?ayat&gt;/gi, '');
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

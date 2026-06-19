import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/rbac.middleware';
import { generateEmbedding, generateEmbeddingsBatch } from '../services/general.service';
import { storeDocuments, getAllDocuments, deleteDocumentsByTitle } from '../services/chroma.service';
import crypto from 'crypto';

/**
 * Markdown-Aware Semantic Chunking
 * Memotong teks berdasarkan paragraf, tapi melacak hierarki Header (#, ##, dsb)
 * dan menyuntikkan jejak rekam (breadcrumbs) ke setiap chunk.
 */
const chunkMarkdownText = (text: string, maxChunkLength: number = 2500): string[] => {
  const lines = text.split(/\n+/);
  const chunks: string[] = [];
  
  let currentHeaders: string[] = [];
  let currentChunkLines: string[] = [];
  let currentLength = 0;
  
  const pushChunk = () => {
    if (currentChunkLines.length === 0) return;
    
    let prefix = '';
    const activeHeaders = currentHeaders.filter(h => h).join(' > ');
    if (activeHeaders) {
      prefix = `[Konteks Hierarki: ${activeHeaders}]\n\n`;
    }
    
    chunks.push(prefix + currentChunkLines.join('\n\n'));
    currentChunkLines = [];
    currentLength = 0;
  };
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    // Check if it's a header
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      
      // Update headers: replace the current level, clear deeper levels
      currentHeaders[level - 1] = title;
      currentHeaders.length = level; // Truncate deeper levels
      
      // If we encounter a new header (H1/H2) and the current chunk has some content, force a clean split
      if (level <= 2 && currentLength > 500) {
        pushChunk();
      }
      
      currentChunkLines.push(line);
      currentLength += line.length + 2;
      continue;
    }
    
    // Normal paragraph: if adding this line exceeds max length, split!
    if (currentLength + line.length > maxChunkLength && currentLength > 0) {
      pushChunk();
    }
    
    currentChunkLines.push(line);
    currentLength += line.length + 2;
  }
  
  pushChunk();
  
  return chunks;
};

/**
 * Ingest / Simpan Dokumen baru ke ChromaDB.
 */
export const ingestDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ message: 'Title and content are required' });
      return;
    }

    // 1. Chunk the document using Semantic Chunking
    const chunks = chunkMarkdownText(content);
    console.log(`Document split into ${chunks.length} chunks.`);

    // 2. Generate embeddings in a single batch request
    const embeddings = await generateEmbeddingsBatch(chunks);

    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: any[] = [];

    // 3. Map chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = crypto.randomUUID();
      
      ids.push(chunkId);
      documents.push(chunk);
      metadatas.push({
        title,
        uploadedBy: req.user?.email || 'Unknown',
        chunkIndex: i,
        source: 'Upload Dokumen',
      });
    }

    // 4. Store in Vector DB (ChromaDB)
    await storeDocuments(ids, embeddings, documents, metadatas);

    res.status(200).json({ 
      message: 'Document successfully ingested into Knowledge Base',
      chunksProcessed: chunks.length 
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ message: 'Failed to ingest document' });
  }
};

/**
 * Mengambil daftar seluruh dokumen yang tersimpan di ChromaDB.
 */
export const listDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const results = await getAllDocuments();
    
    const documentMap = new Map<string, { title: string, uploadedBy: string, chunks: string[], count: number }>();
    
    const ids = results.ids || [];
    const metadatas = results.metadatas || [];
    const documents = results.documents || [];
    
    for (let i = 0; i < ids.length; i++) {
      const meta = metadatas[i] as any;
      const doc = documents[i] || '';
      if (!meta || !meta.title) continue;
      
      if (!documentMap.has(meta.title)) {
        documentMap.set(meta.title, {
          title: meta.title,
          uploadedBy: meta.uploadedBy || 'Unknown',
          chunks: [],
          count: 0
        });
      }
      
      const entry = documentMap.get(meta.title)!;
      const chunkIdx = typeof meta.chunkIndex === 'number' ? meta.chunkIndex : entry.count;
      entry.chunks[chunkIdx] = doc;
      entry.count++;
    }
    
    const documentsList = Array.from(documentMap.values()).map(doc => ({
      title: doc.title,
      uploadedBy: doc.uploadedBy,
      chunksCount: doc.count,
      content: doc.chunks.filter(c => c !== undefined).join('\n\n')
    }));
    
    res.status(200).json(documentsList);
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ message: 'Failed to retrieve documents list' });
  }
};

/**
 * Menghapus dokumen dari ChromaDB berdasarkan judul.
 */
export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    if (!title) {
      res.status(400).json({ message: 'Title is required for deletion' });
      return;
    }
    
    await deleteDocumentsByTitle(title);
    res.status(200).json({ message: 'Document successfully deleted from Knowledge Base' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
};

/**
 * Memperbarui dokumen (menghapus lalu mengunggah kembali konten yang baru).
 */
export const updateDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldTitle, newTitle, content } = req.body;
    
    if (!oldTitle || !newTitle || !content) {
      res.status(400).json({ message: 'oldTitle, newTitle, and content are required' });
      return;
    }
    
    // 1. Hapus dokumen lama
    await deleteDocumentsByTitle(oldTitle);
    
    // 2. Ingest dokumen baru menggunakan Semantic Chunking
    const chunks = chunkMarkdownText(content);
    console.log(`Updating document. Split into ${chunks.length} chunks.`);
    
    // 3. Generate embeddings in a single batch request
    const embeddings = await generateEmbeddingsBatch(chunks);

    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: any[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = crypto.randomUUID();
      
      ids.push(chunkId);
      documents.push(chunk);
      metadatas.push({
        title: newTitle,
        uploadedBy: req.user?.email || 'Unknown',
        chunkIndex: i,
        source: 'Upload Dokumen',
      });
    }
    
    await storeDocuments(ids, embeddings, documents, metadatas);
    
    res.status(200).json({
      message: 'Document successfully updated in Knowledge Base',
      chunksProcessed: chunks.length
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Failed to update document' });
  }
};

/**
 * Helper to extract text from file based on its extension.
 * STRICTLY ONLY ACCEPTS .md AND .txt
 */
const extractTextFromFile = async (file: any): Promise<string> => {
  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

  switch (fileExtension) {
    case 'txt':
    case 'md':
      return file.buffer.toString('utf-8');

    default:
      throw new Error(`Format file .${fileExtension} ditolak. Sistem kini secara eksklusif hanya menerima file .md atau .txt untuk memfasilitasi Semantic Chunking tingkat tinggi.`);
  }
};

/**
 * Ingest / Simpan Dokumen baru dari File Upload (PDF, DOCX, TXT) ke ChromaDB.
 */
export const ingestUnifiedFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reqAny = req as any;
    if (!reqAny.file) {
      res.status(400).json({ message: 'File wajib diunggah.' });
      return;
    }

    const originalName = reqAny.file.originalname as string;
    const title = originalName.replace(/\.[^/.]+$/, "");
    
    // 1. Ekstrak teks dari file secara dinamis
    let content: string;
    try {
      content = await extractTextFromFile(reqAny.file);
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Gagal mengekstrak teks dari file.' });
      return;
    }

    if (!content.trim()) {
      res.status(400).json({ message: 'Dokumen kosong atau tidak memiliki teks yang bisa dibaca.' });
      return;
    }

    // 3. Chunk the document using Semantic Chunking
    const chunks = chunkMarkdownText(content);
    console.log(`Document [${title}] split into ${chunks.length} chunks.`);

    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: any[] = [];

    // 3. Generate embeddings in a single batch request
    const embeddings = await generateEmbeddingsBatch(chunks);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = crypto.randomUUID();
      
      ids.push(chunkId);
      documents.push(chunk);
      metadatas.push({
        title,
        uploadedBy: req.user?.email || 'Unknown',
        chunkIndex: i,
        source: 'Upload File',
      });
    }

    // 4. Store in Vector DB (ChromaDB)
    await storeDocuments(ids, embeddings, documents, metadatas);

    res.status(200).json({ 
      message: 'File successfully ingested into Knowledge Base',
      chunksProcessed: chunks.length 
    });
  } catch (error) {
    console.error('File ingestion error:', error);
    res.status(500).json({ message: 'Failed to ingest file' });
  }
};

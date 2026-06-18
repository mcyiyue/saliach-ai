import { Response } from 'express';
import { AuthRequest } from '../middleware/rbac.middleware';
import { generateEmbedding, generateRAGResponse, translateQueryForVectorSearch } from '../services/general.service';
import { queryDocuments } from '../services/chroma.service';
import { prisma } from '../utils/prisma';

export const chatStream = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query, history } = req.body;

    if (!query) {
      res.status(400).json({ message: 'Query is required' });
      return;
    }

    // 1. Translate query for Multi-lingual Vector Search
    const translatedQuery = await translateQueryForVectorSearch(query);

    // 2. Embed both original query and translated query
    const [queryEmbedding, translatedEmbedding] = await Promise.all([
      generateEmbedding(query),
      generateEmbedding(translatedQuery)
    ]);

    // 3. Search Vector DB for most relevant chunks for BOTH queries
    const [originalDocs, translatedDocs] = await Promise.all([
      queryDocuments(queryEmbedding, 15),
      queryDocuments(translatedEmbedding, 15)
    ]);
    
    // Merge, deduplicate by chunk title + index (to avoid duplicate context), and sort
    const allDocs = [...originalDocs, ...translatedDocs];
    const uniqueDocsMap = new Map<string, any>();
    
    allDocs.forEach(doc => {
      // Filter out chunks that are not semantically close (cosine distance >= 0.75)
      if (doc.distance !== null && doc.distance < 0.75) {
        const meta = doc.metadata as any;
        const uniqueKey = `${meta?.title || 'Unknown'}-${meta?.chunkIndex || '0'}`;
        
        if (!uniqueDocsMap.has(uniqueKey) || doc.distance < uniqueDocsMap.get(uniqueKey)!.distance) {
          uniqueDocsMap.set(uniqueKey, doc);
        }
      }
    });

    const filteredDocs = Array.from(uniqueDocsMap.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 15); // Take top 15 overall closest docs

    const contextChunks = filteredDocs.map(doc => ({
      content: doc.content as string,
      title: (doc.metadata as any)?.title || 'Dokumen'
    }));

    // 3. Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 4. Send the citations/metadata first as an event
    const citations = filteredDocs.map(doc => doc.metadata);
    res.write(`event: citations\ndata: ${JSON.stringify(citations)}\n\n`);

    // 5. Fetch external links from the database to inject dynamically
    const externalLinks = await prisma.externalLink.findMany();
    const allowedSourcesText = externalLinks
      .map(link => `- ${link.url} (${link.title}${link.description ? `: ${link.description}` : ''})`)
      .join('\n');

    // 6. Generate Polished Response from LLM (which automatically calls DeepSeek grammar tool agentically)
    const polishedResponse = await generateRAGResponse(query, contextChunks, allowedSourcesText, history);

    // 7. Stream the polished response back to the client to preserve SSE typing animation effect
    const chunkSize = 12; // 12 characters per chunk for smooth typing effect
    for (let i = 0; i < polishedResponse.length; i += chunkSize) {
      const chunk = polishedResponse.substring(i, i + chunkSize);
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      // Jeda waktu 35ms per chunk agar terasa alami
      await new Promise(resolve => setTimeout(resolve, 35));
    }

    // Signal end of stream
    res.write('event: done\ndata: {}\n\n');
    res.end();

  } catch (error) {
    console.error('Chat stream error:', error);
    // If headers are already sent, we can't send a 500 status code
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to process chat request' });
    } else {
      let errorMessage = 'Terjadi kesalahan saat memproses jawaban.';
      const errString = String(error);
      if (errString.includes('429') || JSON.stringify(error).includes('429')) {
        errorMessage = 'Kuota atau batas permintaan (Rate Limit) API OpenAI sedang penuh. Silakan tunggu sekitar 1 menit sebelum mengirim kembali pertanyaan Anda.';
      }

      res.write(`data: ${JSON.stringify({ text: `\n\n*(Sistem mengalami kendala: ${errorMessage})*` })}\n\n`);
      res.write('event: done\ndata: {}\n\n');
      res.end();
    }
  }
};

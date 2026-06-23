import { Response } from 'express';
import { AuthRequest } from '../middleware/rbac.middleware';
import { generateEmbedding, generateRAGResponse, translateQueryForVectorSearch, expandQueryWithDeepSeek } from '../services/general.service';
import { queryDocuments } from '../services/chroma.service';
import { prisma } from '../utils/prisma';

export const chatStream = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query, history } = req.body;

    if (!query) {
      res.status(400).json({ message: 'Query is required' });
      return;
    }

    // 1. Fetch external links from the database to inject dynamically
    const externalLinks = await prisma.externalLink.findMany();
    const allowedSourcesText = externalLinks
      .map(link => `- ${link.url} (${link.title}${link.description ? `: ${link.description}` : ''})`)
      .join('\n');

    // 2. Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 3. Generate Polished Response from LLM 
    // AI is now Agentic: It will call `searchKnowledgeBase` if needed.
    const polishedResponse = await generateRAGResponse(
      query, 
      allowedSourcesText, 
      history, 
      (citations) => {
        // This callback is triggered when the AI calls the search tool
        res.write(`event: citations\ndata: ${JSON.stringify(citations)}\n\n`);
      }
    );

    // 3.5 Cleanup any leftover XML tags
    const finalCleanedResponse = polishedResponse.replace(/<\/?ayat[^>]*>/gi, '').replace(/&lt;\/?ayat&gt;/gi, '');

    // 7. Stream the polished response back to the client to preserve SSE typing animation effect
    const chunkSize = 12; // 12 characters per chunk for smooth typing effect
    for (let i = 0; i < finalCleanedResponse.length; i += chunkSize) {
      const chunk = finalCleanedResponse.substring(i, i + chunkSize);
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

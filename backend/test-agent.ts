import { generateRAGResponse } from './src/services/general.service';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
  try {
    console.log('Testing Agentic RAG...');
    const res = await generateRAGResponse('Apa itu homoousios?', 'Tidak ada link', [], (citations) => {
      console.log('Received citations:', citations.length);
    });
    console.log('Response:', res);
  } catch (e) {
    console.error('Error in agentic RAG:', e);
  }
}

test().catch(console.error);

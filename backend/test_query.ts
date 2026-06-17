import { generateEmbedding } from './src/services/general.service';
import { queryDocuments } from './src/services/chroma.service';
import { config } from 'dotenv';
config();

async function testQuery() {
  const query = "Pra Eksistensi Kristus";
  console.log(`Mencari query: "${query}"`);
  
  const queryEmbedding = await generateEmbedding(query);
  const relevantDocs = await queryDocuments(queryEmbedding, 15);
  
  console.log(`\nDitemukan ${relevantDocs.length} hasil mentah.`);
  
  const filteredDocs = relevantDocs.filter(doc => doc.distance !== null && doc.distance < 0.75);
  
  console.log(`Setelah difilter (distance < 0.75), tersisa: ${filteredDocs.length} hasil.\n`);
  
  relevantDocs.forEach((doc, idx) => {
    console.log(`[Hasil ${idx + 1}] Distance: ${doc.distance}`);
    console.log(`Judul: ${(doc.metadata as any)?.title || 'Tidak ada judul'}`);
    console.log(`Snippet: ${(doc.content as string).substring(0, 150)}...\n`);
  });
}

testQuery().catch(console.error);

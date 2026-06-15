const { ChromaClient } = require('chromadb');
const client = new ChromaClient({ path: 'http://localhost:8000' });
async function main() {
  const collection = await client.getOrCreateCollection({ name: 'doctrine_knowledge_base' });
  const all = await collection.get();
  
  const docs = all.documents.filter(doc => 
    doc.toLowerCase().includes('salia') || 
    doc.toLowerCase().includes('shalia') || 
    doc.toLowerCase().includes('syalia') || 
    doc.toLowerCase().includes('sylia')
  );
  console.log(docs.length, 'docs found with variations of Saliach');
  if (docs.length > 0) {
    console.log("Samples:", docs.map(d => d.substring(0, 100)));
  }
}
main().catch(console.error);

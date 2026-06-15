const { ChromaClient } = require('chromadb');
const client = new ChromaClient({ path: 'http://localhost:8000' });
async function main() {
  const collection = await client.getOrCreateCollection({ name: 'doctrine_knowledge_base' });
  const results1 = await collection.get({ whereDocument: { "$contains": "saliach" } });
  console.log(results1.documents.length, 'docs found with saliach');
  if(results1.documents.length > 0) console.log(results1.documents[0].substring(0, 200));

  const results2 = await collection.get({ whereDocument: { "$contains": "shaliach" } });
  console.log(results2.documents.length, 'docs found with shaliach');
  if(results2.documents.length > 0) console.log(results2.documents[0].substring(0, 200));
}
main().catch(console.error);

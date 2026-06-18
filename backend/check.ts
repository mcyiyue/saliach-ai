import { getAllDocuments } from './src/services/chroma.service';
getAllDocuments().then(data => {
  const metadatas = data.metadatas || [];
  const titles = new Set(metadatas.map((m: any) => m.title));
  console.log(Array.from(titles));
}).catch(console.error);

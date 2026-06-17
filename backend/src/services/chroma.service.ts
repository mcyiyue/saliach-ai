import { ChromaClient, Collection } from 'chromadb';

const client = new ChromaClient({
  path: 'http://127.0.0.1:8000'
});

const COLLECTION_NAME = 'doctrine_knowledge_base';

const dummyEmbeddingFunction = {
  generate: async (texts: string[]): Promise<number[][]> => {
    return Array(texts.length).fill([]);
  }
};

/**
 * Mendapatkan collection ChromaDB atau membuatnya jika belum ada.
 */
export const getCollection = async (): Promise<Collection> => {
  try {
    return await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { "hnsw:space": "cosine" }, // Use cosine similarity for embeddings
      embeddingFunction: dummyEmbeddingFunction as any
    });
  } catch (error) {
    console.error('Failed to get/create ChromaDB collection:', error);
    throw error;
  }
};

/**
 * Menyimpan chunks teks beserta vektor embeddingnya ke ChromaDB.
 */
export const storeDocuments = async (
  ids: string[],
  embeddings: number[][],
  documents: string[],
  metadatas: any[]
) => {
  const collection = await getCollection();
  
  await collection.add({
    ids,
    embeddings,
    documents,
    metadatas,
  });
};

/**
 * Mencari dokumen relevan berdasarkan embedding query.
 */
export const queryDocuments = async (queryEmbedding: number[], nResults: number = 3) => {
  const collection = await getCollection();
  
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
  });
  
  // Flattening documents, metadatas, and distances for easy use
  const docs = results.documents[0] || [];
  const meta = results.metadatas[0] || [];
  const dists = results.distances ? (results.distances[0] || []) : [];
  
  return docs.map((doc, idx) => ({
    content: doc,
    metadata: meta[idx],
    distance: (dists[idx] !== undefined && dists[idx] !== null) ? dists[idx] : 1.0,
  }));
};

/**
 * Mengambil seluruh dokumen dari ChromaDB collection.
 */
export const getAllDocuments = async () => {
  const collection = await getCollection();
  return await collection.get();
};

/**
 * Menghapus dokumen berdasarkan judul metadata.
 */
export const deleteDocumentsByTitle = async (title: string) => {
  const collection = await getCollection();
  return await collection.delete({
    where: { title: title }
  });
};


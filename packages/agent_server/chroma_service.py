import chromadb
import json
import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
from embedding_service import EmbeddingService

class ChromaService:
    def __init__(self):
        # Ensure the directory for the ChromaDB repository exists
        os.makedirs('kabbo_repo', exist_ok=True)
        self.client = chromadb.PersistentClient(path='kabbo_repo')
        self.collection = self.client.get_or_create_collection(name="legacy-code")
        self.embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        self.embedding_service = EmbeddingService()
        
        # Populate on startup if empty
        if self.collection.count() == 0:
            self.populate_chroma()

    def populate_chroma(self, force_refresh=False):
        """Populate ChromaDB with embeddings"""
        embeddings_file = Path("output_local.json")
        
        if force_refresh or not embeddings_file.exists():
            print("🔄 Generating new embeddings...")
            self.embedding_service.generate_embeddings()
        
        try:
            with open(embeddings_file, "r") as f:
                data = json.load(f)
            
            for i, chunk in enumerate(data):
                self.collection.add(
                    ids=[f"chunk-{i}"],
                    documents=[chunk["text"]],
                    metadatas=[chunk["metadata"]],
                    embeddings=[chunk["embedding"]]
                )
            print(f"✅ ChromaDB populated with {len(data)} chunks")
            
        except Exception as e:
            print(f"❌ Error populating ChromaDB: {str(e)}")
            raise

    def query_collection(self, query_text, n_results=5):
        """Query ChromaDB collection with text"""
        try:
            # Generate embedding for the query
            query_embedding = self.embedding_model.encode(query_text).tolist()
            
            # Query the collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            return {
                "documents": results["documents"][0],
                "metadatas": results["metadatas"][0],
                "distances": results["distances"][0]
            }
            
        except Exception as e:
            print(f"❌ Error querying ChromaDB: {str(e)}")
            raise


# import chromadb
# import json
# import os
# from pathlib import Path
# from embedding_service import EmbeddingService

# class ChromaService:
#     def __init__(self):
#         self.client = chromadb.PersistentClient()
#         self.collection = self.client.get_or_create_collection(name="legacy-code")
#         self.embedding_service = EmbeddingService()
        
#         # Populate on startup if empty
#         if self.collection.count() == 0:
#             self.populate_chroma()

#     def populate_chroma(self, force_refresh=False):
#         """Populate ChromaDB with embeddings"""
#         embeddings_file = Path("output_local.json")
        
#         # Regenerate embeddings if forced or file doesn't exist
#         if force_refresh or not embeddings_file.exists():
#             print("🔄 Generating new embeddings...")
#             self.embedding_service.generate_embeddings()
        
#         try:
#             with open(embeddings_file, "r") as f:
#                 data = json.load(f)
            
#             # Verify the file has content
#             if not data:
#                 raise ValueError("Embeddings file is empty")
                
#             for i, chunk in enumerate(data):
#                 self.collection.add(
#                     ids=[f"chunk-{i}"],
#                     documents=[chunk["text"]],
#                     metadatas=[chunk["metadata"]],
#                     embeddings=[chunk["embedding"]]
#                 )
#             print(f"✅ ChromaDB populated with {len(data)} chunks")
            
#         except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
#             print(f"❌ Error loading embeddings: {str(e)}")
#             if not Path("chunks.json").exists():
#                 raise RuntimeError("Missing required chunks.json file")
            
#             print("🔄 Attempting to regenerate embeddings...")
#             self.embedding_service.generate_embeddings()
#             self.populate_chroma()  # Retry after generation

#     # ... rest of your methods


# # import chromadb
# # import json
# # from embedding_service import EmbeddingService

# # class ChromaService:
# #     def __init__(self):
# #         self.client = chromadb.PersistentClient()
# #         self.collection = self.client.get_or_create_collection(name="legacy-code")
# #         self.embedding_service = EmbeddingService()
        
# #         # Populate on startup if empty
# #         if self.collection.count() == 0:
# #             self.populate_chroma()

# #     def populate_chroma(self, force_refresh=False):
# #         """Populate ChromaDB with embeddings"""
# #         if force_refresh:
# #             # Regenerate embeddings if forced
# #             self.embedding_service.generate_embeddings()
        
# #         with open("output_local.json") as f:
# #             data = json.load(f)
        
# #         for i, chunk in enumerate(data):
# #             self.collection.add(
# #                 ids=[f"chunk-{i}"],
# #                 documents=[chunk["text"]],
# #                 metadatas=[chunk["metadata"]],
# #                 embeddings=[chunk["embedding"]]
# #             )
# #         print(f"✅ ChromaDB populated with {len(data)} chunks")

# #     def query_collection(self, query_text, n_results=10):
# #         embedding = self.embedding_service.model.encode(query_text).tolist()
# #         results = self.collection.query(
# #             query_embeddings=[embedding],
# #             n_results=n_results
# #         )
# #         return results
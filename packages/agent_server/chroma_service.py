import chromadb
import json
import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
from embedding_service import EmbeddingService

class ChromaService:
    def __init__(self):
        self.client = chromadb.PersistentClient()
        self.collection = self.client.get_or_create_collection(name="codebase")
        self.embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        self.embedding_service = EmbeddingService()
        

    def populate_chroma(self, user, repo, force_refresh=False):

        print('in populate_chroma', user, repo)

        repo_name = user + "_" + repo
        """Populate ChromaDB with embeddings"""
        embeddings_file = Path("output_local.json")

        if not embeddings_file.exists():
            print('File does not exist creating')
        else :
            print('Yay!! file exists')

        print('abcd')
        # force_refresh = true # look into it

        # if force_refresh or not embeddings_file.exists():
        print("🔄 Generating new embeddings for {repo_name}...")
        self.embedding_service.generate_embeddings("/"+user+"/"+repo)  # Writes to output_local.json
        # else:
        #     print(force_refresh)
        #     print(not embeddings_file.exists())
        #     print(force_refresh or not embeddings_file.exists())

        try:
            with open(embeddings_file, "r") as f:
                data = json.load(f)

            # Print only the first 250 characters of data for brevity
            print('data (trimmed):', str(data)[:250])

            collection = self.client.get_or_create_collection(name=repo_name)

            for i, chunk in enumerate(data):
                collection.add(
                    ids=[f"{repo_name}-chunk-{i}"],
                    documents=[chunk["text"]],
                    metadatas=[chunk["metadata"]],
                    embeddings=[chunk["embedding"]]
                )

            print(f"✅ ChromaDB collection '{repo_name}' populated with {len(data)} chunks")
            # print(  "✅ ChromaDB collection '{repo_name}' populated with {len(data)} chunks")

        except Exception as e:
            print(f"❌ Error populating collection '{repo_name}': {str(e)}")
            raise

    def query_collection(self, query_text, repo_name, n_results=50):
        """Query ChromaDB collection with text"""
        try:
            query_embedding = self.embedding_model.encode(query_text).tolist()
            collection = self.client.get_or_create_collection(name=repo_name)

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
            )

            return {
                "documents": results["documents"][0],
                "metadatas": results["metadatas"][0],
                "distances": results["distances"][0]
            }

        except Exception as e:
            print(f"❌ Error querying collection '{repo_name}': {str(e)}")
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
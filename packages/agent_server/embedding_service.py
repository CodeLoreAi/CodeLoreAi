import json
from sentence_transformers import SentenceTransformer
from pathlib import Path

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        
    def generate_embeddings(self, directory):
        """Generate embeddings from chunks with validation"""
        try:
            print('generating embeddings')
            input_path="../feeder/codebases"+directory + "/chunks.json"
            output_path="output_local.json"
            print("input path", input_path)
            input_file = Path(input_path)
            if not input_file.exists():
                raise FileNotFoundError(f"Input file {input_path} not found")
            
            with open(input_file, "r", encoding="utf-8") as f:
                chunks = json.load(f)
                
            if not chunks:
                raise ValueError("No chunks found in input file")
            
            results = []
            for chunk in chunks:
                if not all(k in chunk for k in ["text", "type", "startLine", "endLine"]):
                    continue


                embedding = self.model.encode(chunk["text"]).tolist()
                # If chunk["fileContext"]["imports"] is an array of objects, concatenate them into a single string
                imports = chunk["fileContext"]["imports"]
                if isinstance(imports, list):
                    # Concatenate string representations of each import object
                    imports_concat = " ".join([str(imp) for imp in imports])
                else:
                    imports_concat = str(imports)

                exports = chunk["fileContext"]["exports"]
                if isinstance(exports, list):
                    # Concatenate string representations of each import object
                    exports_concat = " ".join([str(imp) for imp in exports])
                else:
                    exports_concat = str(exports)

                to_append = {
                    "metadata": {
                        "type": chunk["type"],
                        "startLine": chunk["startLine"],
                        "endLine": chunk["endLine"],
                        "imports": imports_concat,
                        "exports": exports_concat,
                    },
                    "filePath": chunk["filePath"],
                    "startLine": chunk["startLine"],
                    "endLine": chunk["endLine"],
                    "text": chunk["text"],
                    "embedding": embedding
                }
                results.append(to_append)
                print(f"✅ Embedded {chunk['type']} ({chunk['startLine']}–{chunk['endLine']})")

            # print('======>', result)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Saved {len(results)} embeddings to {output_path}")

            # print('results is: ', results)

            return results
            
        except Exception as e:
            print(f"❌ Error generating embeddings: {str(e)}")
            raise

# import json
# from sentence_transformers import SentenceTransformer
# from pathlib import Path

# class EmbeddingService:
#     def __init__(self):
#         self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        
#     def generate_embeddings(self, input_path="chunks.json", output_path="output_local.json"):
#         """Generate embeddings from chunks and save to file"""
#         with open(input_path, "r", encoding="utf-8") as f:
#             chunks = json.load(f)

#         results = []
#         for chunk in chunks:
#             snippet = chunk["text"][:1000]  # Truncate long code
#             embedding = self.model.encode(snippet).tolist()
#             results.append({
#                 "metadata": {
#                     "type": chunk["type"],
#                     "startLine": chunk["startLine"],
#                     "endLine": chunk["endLine"]
#                 },
#                 "text": chunk["text"],
#                 "embedding": embedding
#             })
#             print(f"✅ Embedded {chunk['type']} ({chunk['startLine']}–{chunk['endLine']})")

#         with open(output_path, "w", encoding="utf-8") as f:
#             json.dump(results, f, indent=2)
        
#         print(f"✅ Embeddings saved to {output_path}")
#         return results
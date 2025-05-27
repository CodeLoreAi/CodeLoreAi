from flask import Flask, request, jsonify
from chroma_service import ChromaService
from gemini_service import GeminiService
import os

app = Flask(__name__)

# Initialize services
chroma_service = ChromaService()
gemini_service = GeminiService()

@app.route('/embed-and-populate', methods=['POST'])
def embed_and_populate():
    try:
        force = request.args.get('force', 'false').lower() == 'true'
        chroma_service.populate_chroma(force_refresh=force)
        return jsonify({
            "status": "success",
            "count": chroma_service.collection.count()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    



# @app.route('/query', methods=['POST'])
# def handle_query():
#     try:
#         data = request.get_json()
#         query_text = data.get('query')
        
#         if not query_text:
#             return jsonify({"error": "No query provided"}), 400
        
#         # Query ChromaDB
#         chroma_results = chroma_service.query_collection(query_text)
        
#         # Prepare response
#         response = {
#             "results": [
#                 {
#                     "text": doc,
#                     "metadata": meta,
#                     "score": float(score)  # Convert numpy float32 to native float
#                 }
#                 for doc, meta, score in zip(
#                     chroma_results["documents"],
#                     chroma_results["metadatas"],
#                     chroma_results["distances"]
#                 )
#             ]
#         }
        
#         return jsonify(response)
        
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route('/query', methods=['POST'])
def handle_query():
    try:
        # Get query from request
        data = request.get_json()
        query_text = data.get('query')
        
        if not query_text:
            return jsonify({"error": "No query provided"}), 400
        
        # Step 1: Query ChromaDB for relevant code snippets
        chroma_results = chroma_service.query_collection(query_text)

        return jsonify({
            "documents": chroma_results["documents"],
            "metadatas": chroma_results["metadatas"],
            "distances": chroma_results["distances"]
        })

        # print(f"ChromaDB query results: {chroma_results['documents']}")
        
        # Step 2: Generate response using Gemini
        context = "\n\n".join(chroma_results["documents"])
        gemini_response = gemini_service.generate_response(context, query_text)
        
        # Prepare response
        response = {
            "answer": gemini_response,
            "relevant_snippets": [
                {
                    "text": doc[:500] + "..." if len(doc) > 500 else doc,
                    "metadata": meta
                }
                for doc, meta in zip(chroma_results["documents"], chroma_results["metadatas"])
            ]
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
from flask import Flask, request, jsonify
from chroma_service import ChromaService
import os

app = Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok"}), 200



# Initialize services
chroma_service = ChromaService()

@app.route('/embed-and-populate/<user>/<repo>', methods=['GET'])
def embed_and_populate(user, repo):
    try:
        # user = request.view_args.get('user')
        # repo = request.view_args.get('repo')

        print(user, repo)

        if not user or not repo:
            return jsonify({"error": "Missing user or repo parameter"}), 400

        directory = user + "_" + repo
        print('directory: ', directory)

        # force = request.args.get('force', 'false').lower() == 'true'
        chroma_service.populate_chroma(user, repo)
        return jsonify({
            "status": "success",
            "count": chroma_service.collection.count()
        })
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route('/query/<user>/<repo>', methods=['POST'])
def handle_query(user, repo):
    try:
        print(user, repo)

        directory = user + "_" + repo

        # Get query from request
        data = request.get_json()
        query_text = data.get('query')
        
        if not query_text:
            return jsonify({"error": "No query provided"}), 400
        
        # Step 1: Query ChromaDB for relevant code snippets
        chroma_results = chroma_service.query_collection(query_text, directory)

        return jsonify({
            "documents": chroma_results["documents"],
            "metadatas": chroma_results["metadatas"],
            "distances": chroma_results["distances"]
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
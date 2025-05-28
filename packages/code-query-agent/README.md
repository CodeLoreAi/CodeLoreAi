# Code Query Agent API

A powerful code analysis agent built with LangGraph that provides intelligent code search and analysis capabilities across GitHub repositories using vector similarity search.

## Features

- 🔍 **Smart Code Search**: Vector-based similarity search across repositories
- 🤖 **AI-Powered Analysis**: Uses Claude Sonnet 4 for intelligent code understanding
- 💬 **Conversational Memory**: Maintains context across queries in threads
- 📊 **Multi-Repository Search**: Search across multiple repositories simultaneously
- 🔬 **Code Analysis**: Detailed pattern and implementation analysis
- 🚀 **RESTful API**: Easy integration with frontend applications

## Project Structure

```
code-query-agent/
├── api/
│   └── server.js              # Express API server
├── agent/
│   └── codeAgent.js           # LangGraph agent implementation
├── tools/
│   ├── index.js               # Tool exports
│   ├── codeQueryTool.js       # Single repository search
│   ├── multiRepoQueryTool.js  # Multi-repository search
│   └── analyzeCodeTool.js     # Code analysis tool
├── demo.js                    # Demo script
├── package.json
├── .env.example
└── README.md
```

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd code-query-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `OPENROUTER_API_BASE`: OpenRouter API base URL
- `PORT`: Server port (default: 3000)
- `VECTOR_DB_URL`: Vector database URL

## API Endpoints

### 1. Query Specific Repository
```http
POST /:owner/:repo
Content-Type: application/json

{
  "threadId": "unique-thread-id",
  "message": "How does authentication work in this codebase?"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/facebook/react \
  -H "Content-Type: application/json" \
  -d '{
    "threadId": "user-123-session",
    "message": "Show me how hooks are implemented"
  }'
```

### 2. General Code Query
```http
POST /query
Content-Type: application/json

{
  "threadId": "unique-thread-id",
  "message": "Explain React useEffect patterns"
}
```

### 3. Multi-Repository Search
```http
POST /multi-search
Content-Type: application/json

{
  "threadId": "unique-thread-id",
  "message": "Compare authentication approaches",
  "repositories": ["user1/app1", "user2/app2"]
}
```

### 4. Get Thread History
```http
GET /thread/:threadId
```

### 5. Health Check
```http
GET /health
```

## Usage Examples

### Frontend Integration (JavaScript)

```javascript
class CodeQueryClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  async queryRepository(owner, repo, message, threadId) {
    const response = await fetch(`${this.baseURL}/${owner}/${repo}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        message
      })
    });

    return await response.json();
  }

  async generalQuery(message, threadId) {
    const response = await fetch(`${this.baseURL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        message
      })
    });

    return await response.json();
  }

  async multiRepoSearch(repositories, message, threadId) {
    const response = await fetch(`${this.baseURL}/multi-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        message,
        repositories
      })
    });

    return await response.json();
  }

  async getThreadHistory(threadId) {
    const response = await fetch(`${this.baseURL}/thread/${threadId}`);
    return await response.json();
  }
}

// Usage
const client = new CodeQueryClient();

// Query specific repository
const result = await client.queryRepository(
  'facebook', 
  'react', 
  'How does the useState hook work?',
  'user-session-123'
);

console.log(result.response);
```

### React Component Example

```jsx
import React, { useState } from 'react';

function CodeQueryInterface() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId] = useState(() => `thread-${Date.now()}`);

  const handleQuery = async (owner, repo) => {
    setLoading(true);
    try {
      const result = await fetch(`http://localhost:3000/${owner}/${repo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          message: query
        })
      });

      const data = await result.json();
      setResponse(data.response);
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about the code..."
        rows={4}
        cols={50}
      />
      <br />
      <button 
        onClick={() => handleQuery('facebook', 'react')}
        disabled={loading}
      >
        Query React Repository
      </button>
      
      {loading && <p>Analyzing code...</p>}
      {response && (
        <div>
          <h3>Response:</h3>
          <pre>{response}</pre>
        </div>
      )}
    </div>
  );
}
```

## Response Format

All endpoints return JSON responses with the following structure:

```json
{
  "success": true,
  "response": "AI-generated response about the code",
  "repository": "owner/repo",
  "threadId": "unique-thread-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "threadId": "unique-thread-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Available Tools

The agent has access to three main tools:

1. **Code Query Tool**: Search for code snippets in a specific repository
2. **Multi-Repository Tool**: Search across multiple repositories
3. **Code Analysis Tool**: Perform detailed analysis on code patterns

## Thread Management

- Each conversation is managed by a unique `threadId`
- The agent maintains conversation context within threads
- Use the same `threadId` for related queries to maintain context
- Retrieve conversation history using the `/thread/:threadId` endpoint

## Demo

Run the included demo to see the agent in action:

```bash
npm run demo
```

## Development

1. Start the development server with auto-reload:
```bash
npm run dev
```

2. The server will start on `http://localhost:3000`

3. Test the API endpoints using curl, Postman, or your frontend application

## Dependencies

- **@langchain/langgraph**: Agent workflow management
- **@langchain/core**: Core LangChain functionality
- **@langchain/openai**: OpenAI/OpenRouter integration
- **express**: Web server framework
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **zod**: Schema validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
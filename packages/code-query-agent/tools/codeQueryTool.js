import { tool } from "@langchain/core/tools";
import { z } from "zod";
export const codeQueryTool = tool(
  async ({ owner, repo, query }) => {
    console.log(
      `🔍 [CODE QUERY TOOL] Searching in ${owner}/${repo} for: ${query}`
    );

    try {
      const apiUrl = `http://localhost:5000/query/${owner}/${repo}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.documents && data.documents.length > 0) {
        const result = {
          query: query,
          repository: `${owner}/${repo}`,
          results: data.documents.map((doc, index) => ({
            code: doc,
            relevanceScore: data.distances
              ? (2 - data.distances[index]).toFixed(3)
              : "N/A",
            metadata: data.metadatas ? data.metadatas[index] : null,
            lines:
              data.metadatas && data.metadatas[index]
                ? `${data.metadatas[index].startLine}-${data.metadatas[index].endLine}`
                : "N/A",
            type:
              data.metadatas && data.metadatas[index]
                ? data.metadatas[index].type
                : "N/A",
          })),
          totalMatches: data.documents.length,
          timestamp: new Date().toISOString(),
        };

        console.log(
          `✅ [CODE QUERY TOOL] Found ${data.documents.length} matches in ${owner}/${repo}`
        );
        return JSON.stringify(result);
      } else {
        console.log(`❌ [CODE QUERY TOOL] No code found for query: ${query}`);
        return JSON.stringify({
          error: `No code matches found for "${query}" in ${owner}/${repo}`,
          query: query,
          repository: `${owner}/${repo}`,
        });
      }
    } catch (error) {
      console.log(`🚨 [CODE QUERY TOOL] Error: ${error.message}`);
      return JSON.stringify({
        error: `Failed to query ${owner}/${repo}: ${error.message}`,
        query: query,
        repository: `${owner}/${repo}`,
      });
    }
  },
  {
    name: "query_code",
    description:
      "Search for code snippets in a GitHub repository using vector similarity",
    schema: z.object({
      owner: z.string().describe("GitHub repository owner/organization name"),
      repo: z.string().describe("GitHub repository name"),
      query: z.string().describe("Search query to find relevant code"),
    }),
  }
);

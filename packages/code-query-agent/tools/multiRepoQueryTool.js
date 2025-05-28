import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 📊 Multi-Repository Code Search Tool
export const multiRepoQueryTool = tool(async ({ repositories, query }) => {
    console.log(`🔍 [MULTI-REPO TOOL] Searching in ${repositories.length} repositories for: ${query}`);

    const results = [];

    for (const repo of repositories) {
        const [owner, repoName] = repo.split('/');
        try {
            const apiUrl = `http://10.255.184.53:5000/query/${owner}/${repoName}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.documents && data.documents.length > 0) {
                    results.push({
                        repository: repo,
                        matches: data.documents.length,
                        bestMatch: {
                            code: data.documents[0],
                            relevanceScore: data.distances ? (2 - data.distances[0]).toFixed(3) : 'N/A',
                            metadata: data.metadatas ? data.metadatas[0] : null
                        }
                    });
                } else {
                    results.push({
                        repository: repo,
                        matches: 0,
                        error: 'No matches found'
                    });
                }
            }
        } catch (error) {
            results.push({
                repository: repo,
                matches: 0,
                error: `Failed to query: ${error.message}`
            });
        }
    }

    console.log(`✅ [MULTI-REPO TOOL] Searched ${repositories.length} repositories`);
    return JSON.stringify({
        query: query,
        repositories: results,
        totalRepositories: repositories.length,
        timestamp: new Date().toISOString()
    });
}, {
    name: 'multi_repo_search',
    description: 'Search for code across multiple GitHub repositories',
    schema: z.object({
        repositories: z.array(z.string()).describe('Array of repository names in format "owner/repo"'),
        query: z.string().describe('Search query to find relevant code'),
    })
});
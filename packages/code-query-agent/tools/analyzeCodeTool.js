
import { z } from "zod";
import { tool } from "@langchain/core/tools";

// 🔬 Code Analysis Tool
export const analyzeCodeTool = tool(async ({ owner, repo, query, analysisType }) => {
    console.log(`🔬 [ANALYSIS TOOL] Analyzing code in ${owner}/${repo} for: ${query} (${analysisType})`);

    try {
        const apiUrl = `http://localhost:5001/query/${owner}/${repo}`;
        console.log(apiUrl);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.documents && data.documents.length > 0) {
            const analysis = {
                query: query,
                repository: `${owner}/${repo}`,
                analysisType: analysisType,
                codeSnippets: data.documents.slice(0, 3), // Top 3 matches
                insights: {
                    totalMatches: data.documents.length,
                    averageRelevance: data.distances ?
                        (data.distances.reduce((a, b) => a + (2 - b), 0) / data.distances.length).toFixed(3) : 'N/A',
                    functionTypes: data.metadatas ?
                        [...new Set(data.metadatas.map(m => m.type))].join(', ') : 'N/A',
                    lineRanges: data.metadatas ?
                        data.metadatas.map(m => `${m.startLine}-${m.endLine}`).slice(0, 3) : []
                },
                timestamp: new Date().toISOString()
            };

            console.log(`✅ [ANALYSIS TOOL] Analysis complete for ${owner}/${repo}`);
            return JSON.stringify(analysis);
        } else {
            return JSON.stringify({
                error: `No code found for analysis: ${query}`,
                repository: `${owner}/${repo}`,
                analysisType: analysisType
            });
        }
    } catch (error) {
        console.log(`❌ [ANALYSIS TOOL] Error: ${error.message}`);
        return JSON.stringify({
            error: `Failed to analyze code in ${owner}/${repo}: ${error.message}`,
            query: query,
            analysisType: analysisType
        });
    }
}, {
    name: 'analyze_code',
    description: 'Perform detailed analysis on code search results',
    schema: z.object({
        owner: z.string().describe('GitHub repository owner/organization name'),
        repo: z.string().describe('GitHub repository name'),
        query: z.string().describe('Search query for code analysis'),
        analysisType: z.enum(['pattern', 'function', 'implementation', 'usage'])
            .describe('Type of analysis to perform on the code'),
    })
});

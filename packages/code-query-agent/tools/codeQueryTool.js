import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const codeQueryTool = tool(async ({ owner, repo, query, limit = 10, minRelevanceScore = 0.5 }) => {
    console.log(`🔍 [CODE QUERY TOOL] Searching in ${owner}/${repo} for: "${query}" (limit: ${limit})`);
    
    try {
        const apiUrl = `http://localhost:5001/query/${owner}/${repo}`;
        const requestBody = { 
            query, 
            limit: Math.min(limit, 50), // Cap at 50 for performance
            include_metadata: true 
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            timeout: 30000 // 30 second timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data || !Array.isArray(data.documents)) {
            throw new Error("Invalid API response structure");
        }

        if (data.documents.length === 0) {
            console.log(`❌ [CODE QUERY TOOL] No matches found for: "${query}"`);
            return JSON.stringify({
                success: false,
                message: `No code matches found for "${query}" in ${owner}/${repo}`,
                query,
                repository: `${owner}/${repo}`,
                results: [],
                totalMatches: 0,
                timestamp: new Date().toISOString()
            });
        }

        // Process and filter results
        const processedResults = data.documents
            .map((doc, index) => {
                const distance = data.distances?.[index] ?? 1;
                const relevanceScore = Math.max(0, 2 - distance); // Convert distance to relevance (0-2 scale)
                const metadata = data.metadatas?.[index] || {};
                
                return {
                    code: doc.trim(),
                    relevanceScore: parseFloat(relevanceScore.toFixed(3)),
                    distance: parseFloat(distance.toFixed(3)),
                    metadata: {
                        startLine: metadata.startLine || null,
                        endLine: metadata.endLine || null,
                        type: metadata.type || 'unknown',
                        imports: metadata.imports || null,
                        exports: metadata.exports || null,
                        filePath: metadata.filePath || null,
                        functionName: metadata.functionName || null
                    },
                    lineRange: metadata.startLine && metadata.endLine 
                        ? `${metadata.startLine}-${metadata.endLine}` 
                        : 'N/A',
                    codeType: metadata.type || 'unknown',
                    codeLength: doc.length,
                    hasImports: Boolean(metadata.imports),
                    hasExports: Boolean(metadata.exports)
                };
            })
            // Filter by minimum relevance score
            .filter(result => result.relevanceScore >= minRelevanceScore)
            // Sort by relevance score (highest first)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            // Remove duplicates based on code content
            .filter((result, index, arr) => 
                arr.findIndex(r => r.code === result.code) === index
            );

        // Generate summary statistics
        const stats = {
            totalMatches: processedResults.length,
            averageRelevance: processedResults.length > 0 
                ? parseFloat((processedResults.reduce((sum, r) => sum + r.relevanceScore, 0) / processedResults.length).toFixed(3))
                : 0,
            codeTypes: [...new Set(processedResults.map(r => r.codeType))],
            hasHighRelevance: processedResults.some(r => r.relevanceScore > 1.5),
            maxRelevance: processedResults.length > 0 
                ? Math.max(...processedResults.map(r => r.relevanceScore)) 
                : 0
        };

        const result = {
            success: true,
            query,
            repository: `${owner}/${repo}`,
            results: processedResults,
            statistics: stats,
            searchParams: {
                limit,
                minRelevanceScore,
                appliedFilters: processedResults.length < data.documents.length
            },
            timestamp: new Date().toISOString()
        };

        console.log(`✅ [CODE QUERY TOOL] Found ${processedResults.length}/${data.documents.length} relevant matches in ${owner}/${repo}`);
        console.log(`📊 [CODE QUERY TOOL] Average relevance: ${stats.averageRelevance}, Max: ${stats.maxRelevance}`);
        
        return JSON.stringify(result, null, 2);

    } catch (error) {
        console.error(`🚨 [CODE QUERY TOOL] Error querying ${owner}/${repo}:`, error);
        
        return JSON.stringify({
            success: false,
            error: error.message,
            query,
            repository: `${owner}/${repo}`,
            timestamp: new Date().toISOString(),
            troubleshooting: {
                suggestion: "Check if the API server is running on localhost:5001",
                commonCauses: [
                    "API server not running",
                    "Network connectivity issues", 
                    "Invalid repository name",
                    "Repository not indexed"
                ]
            }
        }, null, 2);
    }
}, {
    name: 'query_code',
    description: 'Search for code snippets in a GitHub repository using vector similarity with advanced filtering and ranking',
    schema: z.object({
        owner: z.string().describe('GitHub repository owner/organization name'),
        repo: z.string().describe('GitHub repository name'),
        query: z.string().describe('Search query to find relevant code snippets'),
        limit: z.number().optional().default(10).describe('Maximum number of results to return (1-50)'),
        minRelevanceScore: z.number().optional().default(0.5).describe('Minimum relevance score to include results (0-2)')
    })
});

// Helper function for batch queries
export const batchCodeQuery = tool(async ({ owner, repo, queries }) => {
    console.log(`🔍 [BATCH CODE QUERY] Running ${queries.length} queries on ${owner}/${repo}`);
    
    const results = [];
    
    for (const query of queries) {
        try {
            const result = await codeQueryTool.invoke({ owner, repo, query: query.query, limit: query.limit || 5 });
            const parsedResult = JSON.parse(result);
            results.push({
                query: query.query,
                success: parsedResult.success,
                matches: parsedResult.results?.length || 0,
                topMatch: parsedResult.results?.[0] || null
            });
        } catch (error) {
            results.push({
                query: query.query,
                success: false,
                error: error.message,
                matches: 0
            });
        }
    }
    
    return JSON.stringify({
        repository: `${owner}/${repo}`,
        batchResults: results,
        summary: {
            totalQueries: queries.length,
            successfulQueries: results.filter(r => r.success).length,
            totalMatches: results.reduce((sum, r) => sum + r.matches, 0)
        },
        timestamp: new Date().toISOString()
    }, null, 2);
}, {
    name: 'batch_query_code',
    description: 'Run multiple code queries in batch for comprehensive code analysis',
    schema: z.object({
        owner: z.string().describe('GitHub repository owner/organization name'),
        repo: z.string().describe('GitHub repository name'),
        queries: z.array(z.object({
            query: z.string(),
            limit: z.number().optional()
        })).describe('Array of queries to execute')
    })
});
import { CodeAgent } from './agent/codeAgent.js';

// 🎭 Visual Separator Function
function printSeparator(title) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`💻  ${title.toUpperCase()}`);
    console.log(`${'='.repeat(60)}\n`);
}

// 🚀 Demo Function
async function runCodeQueryDemo() {
    const codeAgent = new CodeAgent();
    const threadId = "code-query-demo";

    console.log(`🎬 Starting Code Query Agent Demo`);
    console.log(`📋 Available Commands:`);
    console.log(`   • Search specific repository code`);
    console.log(`   • Compare code across repositories`);
    console.log(`   • Analyze code patterns and implementations`);
    console.log(`   • Conversational code exploration`);

    try {
        // Demo 1: Simple Code Query
        printSeparator("Demo 1: Single Repository Code Search");
        const result1 = await codeAgent.processQuery(
            threadId, 
            "what are the database uses in this opencrvs/opencrvs-farajaland repository?"
        );
        console.log(`💻 RESPONSE: ${result1.response}`);

        // // Demo 2: Multi-Repository Search
        // printSeparator("Demo 2: Multi-Repository Search");
        // const result2 = await codeAgent.processQuery(
        //     threadId,
        //     "Search for authentication patterns in user1/app1 and user2/app2 repositories"
        // );
        // console.log(`🔍 RESPONSE: ${result2.response}`);

        // // Demo 3: Code Analysis
        // printSeparator("Demo 3: Detailed Code Analysis");
        // const result3 = await codeAgent.processQuery(
        //     threadId,
        //     "Analyze the shopping cart implementation patterns in kabbo25/cine-dine"
        // );
        // console.log(`🔬 RESPONSE: ${result3.response}`);

        // // Demo 4: Memory Test
        // printSeparator("Demo 4: Conversational Memory");
        // const result4 = await codeAgent.processQuery(
        //     threadId,
        //     "What are the databases that is usage in the dashboard?"
        // );
        // console.log(`🧠 RESPONSE: ${result4.response}`);

    } catch (error) {
        console.error('🚨 Demo Error:', error);
    }
}

// 🏃‍♂️ Main Execution
async function main() {
    console.log(`🚀 Code Query Agent with LangGraph`);
    console.log(`🔍 Vector Database Integration for GitHub Repositories`);
    console.log(`📡 Connected to: http://10.255.184.53:5000`);

    // Run the demo
    await runCodeQueryDemo();
}

// Run the application
main().catch(console.error);
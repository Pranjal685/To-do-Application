#!/usr/bin/env node

/**
 * AI Assistant Testing Script
 * 
 * This script helps test the AI assistant's capabilities programmatically.
 * Run with: node scripts/test_ai_assistant.js
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:4000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Basic Task Creation',
    message: 'Create a task to review PR tomorrow 4pm',
    expectedFields: ['title', 'due_date', 'priority']
  },
  {
    name: 'Complex Task with Pomodoro',
    message: 'Create urgent task to study for exam, 25/5 x4 pomodoro style, due next Monday',
    expectedFields: ['title', 'priority', 'due_date', 'duration_minutes', 'break_interval_minutes', 'break_count']
  },
  {
    name: 'Task with Tags',
    message: 'Add task: write documentation #work #urgent with tags: frontend, bugfix',
    expectedFields: ['title', 'tags']
  },
  {
    name: 'Manual Mode Request',
    message: 'How do I create a task manually?',
    expectedMode: 'manual'
  },
  {
    name: 'Skip Functionality',
    message: 'skip duration',
    expectedBehavior: 'should mark duration as skipped'
  },
  {
    name: 'Date Parsing',
    message: 'Create task due next Friday 3:30pm',
    expectedFields: ['title', 'due_date']
  },
  {
    name: 'Priority Detection',
    message: 'Create ASAP task to fix critical bug',
    expectedFields: ['title', 'priority'],
    expectedPriority: 'urgent'
  },
  {
    name: 'Duration Parsing',
    message: 'Create 1h 30m focus task',
    expectedFields: ['title', 'duration_minutes'],
    expectedDuration: 90
  }
];

class AITester {
  constructor() {
    this.token = null;
    this.testResults = [];
  }

  async login() {
    try {
      console.log('🔐 Logging in...');
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token;
      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  async testChatEndpoint(message) {
    try {
      const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Chat test failed:', error.message);
      throw error;
    }
  }

  async testTaskFlowEndpoint(message, state = {}) {
    try {
      const response = await fetch(`${BASE_URL}/ai/task-flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ message, state })
      });

      if (!response.ok) {
        throw new Error(`Task flow request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Task flow test failed:', error.message);
      throw error;
    }
  }

  async runScenario(scenario) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`📝 Message: "${scenario.message}"`);

    try {
      let result;
      
      // Test both endpoints
      if (scenario.message.toLowerCase().includes('task')) {
        result = await this.testTaskFlowEndpoint(scenario.message);
        console.log('🔧 Using task-flow endpoint');
      } else {
        result = await this.testChatEndpoint(scenario.message);
        console.log('💬 Using chat endpoint');
      }

      // Analyze results
      const analysis = this.analyzeResult(result, scenario);
      
      console.log('📊 Result Analysis:');
      console.log(`   Mode: ${result.mode || 'chat'}`);
      console.log(`   Assistant Text: ${result.assistantText || result.text || 'N/A'}`);
      
      if (result.values) {
        console.log('   Extracted Values:');
        Object.entries(result.values).forEach(([key, value]) => {
          if (key !== '_skipped' && key !== '_asked') {
            console.log(`     ${key}: ${JSON.stringify(value)}`);
          }
        });
      }

      if (result.confirmationReady !== undefined) {
        console.log(`   Confirmation Ready: ${result.confirmationReady}`);
      }

      if (analysis.success) {
        console.log('✅ Test PASSED');
      } else {
        console.log('❌ Test FAILED');
        console.log(`   Issues: ${analysis.issues.join(', ')}`);
      }

      this.testResults.push({
        scenario: scenario.name,
        success: analysis.success,
        issues: analysis.issues,
        result: result
      });

    } catch (error) {
      console.log('❌ Test FAILED');
      console.log(`   Error: ${error.message}`);
      
      this.testResults.push({
        scenario: scenario.name,
        success: false,
        issues: [error.message],
        result: null
      });
    }
  }

  analyzeResult(result, scenario) {
    const issues = [];
    let success = true;

    // Check if we got a response
    if (!result) {
      issues.push('No response received');
      success = false;
      return { success, issues };
    }

    // Check for expected mode
    if (scenario.expectedMode && result.mode !== scenario.expectedMode) {
      issues.push(`Expected mode ${scenario.expectedMode}, got ${result.mode}`);
      success = false;
    }

    // Check for expected fields in task flow
    if (scenario.expectedFields && result.values) {
      scenario.expectedFields.forEach(field => {
        if (!result.values[field] && !(result.values._skipped && result.values._skipped[field])) {
          issues.push(`Missing expected field: ${field}`);
          success = false;
        }
      });
    }

    // Check specific field values
    if (scenario.expectedPriority && result.values?.priority !== scenario.expectedPriority) {
      issues.push(`Expected priority ${scenario.expectedPriority}, got ${result.values?.priority}`);
      success = false;
    }

    if (scenario.expectedDuration && result.values?.duration_minutes !== scenario.expectedDuration) {
      issues.push(`Expected duration ${scenario.expectedDuration}, got ${result.values?.duration_minutes}`);
      success = false;
    }

    // Check for assistant response
    if (!result.assistantText && !result.text) {
      issues.push('No assistant response text');
      success = false;
    }

    return { success, issues };
  }

  async runAllTests() {
    console.log('🚀 Starting AI Assistant Tests\n');
    
    try {
      await this.login();
      
      for (const scenario of TEST_SCENARIOS) {
        await this.runScenario(scenario);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
  }

  printSummary() {
    console.log('\n📋 Test Summary');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   ${r.scenario}: ${r.issues.join(', ')}`);
        });
    }

    console.log('\n🎯 Recommendations:');
    if (failed === 0) {
      console.log('   All tests passed! Your AI assistant is working well.');
    } else {
      console.log('   Review failed tests and check the AI model configuration.');
      console.log('   Verify that OPENROUTER_API_KEY is set correctly.');
      console.log('   Check backend logs for detailed error information.');
    }
  }
}

// Interactive testing function
async function interactiveTest() {
  console.log('🎮 Interactive AI Assistant Testing');
  console.log('Type "quit" to exit, "help" for commands\n');

  const tester = new AITester();
  await tester.login();

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  while (true) {
    const input = await askQuestion('🤖 Enter message to test: ');
    
    if (input.toLowerCase() === 'quit') {
      break;
    }
    
    if (input.toLowerCase() === 'help') {
      console.log('\n📚 Available Commands:');
      console.log('  quit - Exit the testing session');
      console.log('  help - Show this help message');
      console.log('  task - Test task creation flow');
      console.log('  chat - Test general chat');
      console.log('  manual - Test manual mode');
      console.log('\n💡 Example messages:');
      console.log('  "Create a task to review code tomorrow"');
      console.log('  "How do I create a task manually?"');
      console.log('  "What can you help me with?"');
      continue;
    }

    if (!input.trim()) {
      continue;
    }

    try {
      console.log('\n🧪 Testing message...');
      
      let result;
      if (input.toLowerCase().includes('task')) {
        result = await tester.testTaskFlowEndpoint(input);
        console.log('🔧 Using task-flow endpoint');
      } else {
        result = await tester.testChatEndpoint(input);
        console.log('💬 Using chat endpoint');
      }

      console.log('\n📊 Response:');
      console.log(`Mode: ${result.mode || 'chat'}`);
      console.log(`Text: ${result.assistantText || result.text || 'N/A'}`);
      
      if (result.values) {
        console.log('Extracted Values:');
        Object.entries(result.values).forEach(([key, value]) => {
          if (key !== '_skipped' && key !== '_asked') {
            console.log(`  ${key}: ${JSON.stringify(value)}`);
          }
        });
      }

      if (result.confirmationReady !== undefined) {
        console.log(`Confirmation Ready: ${result.confirmationReady}`);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    console.log('\n' + '-'.repeat(50));
  }

  rl.close();
  console.log('👋 Testing session ended');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    await interactiveTest();
  } else {
    const tester = new AITester();
    await tester.runAllTests();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AITester, TEST_SCENARIOS };

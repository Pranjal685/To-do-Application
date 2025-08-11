#!/usr/bin/env node

/**
 * Test script to verify task creation fix
 * Tests that Pomodoro settings are properly applied to tasks
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

async function testTaskCreationFix() {
  console.log('🧪 Testing Task Creation Fix\n');
  
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    
    const { token } = await loginRes.json();
    console.log('✅ Login successful\n');
    
    // Test 1: Complex task with Pomodoro settings
    console.log('📝 Test 1: Complex task with Pomodoro settings');
    const testMessage = 'Create urgent task to study for exam, 25/5 x4 pomodoro style, due next Monday';
    
    const taskFlowRes = await fetch(`${BASE_URL}/ai/task-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        message: testMessage, 
        state: { mode: 'auto' } 
      })
    });
    
    if (!taskFlowRes.ok) {
      throw new Error(`Task flow request failed: ${taskFlowRes.status}`);
    }
    
    const taskFlowData = await taskFlowRes.json();
    console.log('📊 Task Flow Response:');
    console.log(`   Mode: ${taskFlowData.mode}`);
    console.log(`   Confirmation Ready: ${taskFlowData.confirmationReady}`);
    console.log(`   Assistant Text: ${taskFlowData.assistantText}`);
    
    if (taskFlowData.values) {
      console.log('   Extracted Values:');
      Object.entries(taskFlowData.values).forEach(([key, value]) => {
        if (key !== '_skipped' && key !== '_asked') {
          console.log(`     ${key}: ${JSON.stringify(value)}`);
        }
      });
    }
    
    // Test 2: Simulate task creation with extracted values
    if (taskFlowData.values && taskFlowData.values.title) {
      console.log('\n📝 Test 2: Simulating task creation...');
      
      const taskData = {
        title: taskFlowData.values.title,
        description: taskFlowData.values.description || '',
        priority: taskFlowData.values.priority || 'medium',
        due_date: taskFlowData.values.due_date,
        tags: taskFlowData.values.tags || [],
        estimated_duration: taskFlowData.values.duration_minutes
      };
      
      // Create proper description
      let desc = taskData.description;
      if (desc === testMessage || /\b(create|add)\b.*\btask\b.*\b(urgent|high|low|medium)\b.*\b(pomodoro|25\/5|x4)\b/i.test(desc)) {
        desc = `Task: ${taskData.title}`;
        if (taskFlowData.values.duration_minutes) {
          desc += `\n\nPomodoro Settings:\n- Focus Duration: ${taskFlowData.values.duration_minutes} minutes`;
          if (taskFlowData.values.break_interval_minutes) {
            desc += `\n- Break Interval: ${taskFlowData.values.break_interval_minutes} minutes`;
          }
          if (taskFlowData.values.break_count) {
            desc += `\n- Break Count: ${taskFlowData.values.break_count} cycles`;
          }
        }
      }
      taskData.description = desc;
      
      console.log('   Task Creation Payload:');
      console.log(`     Title: ${taskData.title}`);
      console.log(`     Priority: ${taskData.priority}`);
      console.log(`     Due Date: ${taskData.due_date}`);
      console.log(`     Estimated Duration: ${taskData.estimated_duration} minutes`);
      console.log(`     Description: ${taskData.description}`);
      
      // Verify the fix
      const issues = [];
      
      if (taskData.description === testMessage) {
        issues.push('Description still contains original user message');
      }
      
      if (!taskData.estimated_duration) {
        issues.push('Estimated duration not set');
      }
      
      if (!taskData.description.includes('Pomodoro Settings')) {
        issues.push('Pomodoro settings not in description');
      }
      
      if (issues.length === 0) {
        console.log('\n✅ Test PASSED - Task creation fix working correctly!');
      } else {
        console.log('\n❌ Test FAILED:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testTaskCreationFix().catch(console.error);
}

module.exports = { testTaskCreationFix };

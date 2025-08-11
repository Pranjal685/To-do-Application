# AI Assistant Testing Guide

## Overview
Your AI assistant is a sophisticated task management copilot with multiple capabilities. This guide will help you systematically test all features and understand the assistant's capabilities.

## Core Capabilities

### 1. **Natural Language Task Creation**
The assistant can understand natural language and create tasks automatically.

#### Test Scenarios:
```
✅ Basic Task Creation:
- "Create a task to review PR tomorrow 4pm"
- "Add a high priority task for client meeting next Monday"
- "Create urgent task to fix bug in production"

✅ Complex Task Creation:
- "Create a task to prepare presentation for Q4 review, due Friday 3pm, high priority"
- "Add task: research new AI tools for productivity, due next week, low priority"
- "Create urgent task to update documentation before release tomorrow"

✅ Task with Pomodoro Settings:
- "Create a 25-minute focus task to write blog post"
- "Add task with 45min focus and 5min breaks x4"
- "Create task: study for exam, 25/5 x6 pomodoro style"
```

### 2. **Interactive Task Flow**
The assistant guides users through task creation with intelligent field extraction.

#### Test Scenarios:
```
✅ Field-by-Field Guidance:
- Start with: "I want to create a task"
- Assistant should ask: "What is the task title?"
- Respond: "Review quarterly reports"
- Assistant should ask: "When is it due?"
- Continue through priority, duration, etc.

✅ Smart Field Detection:
- "Create task: Write documentation, due tomorrow 2pm, high priority, 30min focus"
- Assistant should extract: title, due_date, priority, duration_minutes

✅ Skip Functionality:
- "skip duration" - should mark duration as skipped
- "skip breaks" - should mark break settings as skipped
- "skip" - should skip all optional fields
```

### 3. **Manual Mode Guidance**
When users want step-by-step instructions instead of automatic creation.

#### Test Scenarios:
```
✅ Manual Mode Triggers:
- "How do I create a task manually?"
- "Show me the steps to create a task"
- "Walk me through task creation"
- "Give me instructions for creating tasks"

✅ Manual Mode Response:
- Should provide detailed step-by-step instructions
- Should reference the actual UI elements
- Should include validation rules
- Should offer to switch back to auto mode
```

### 4. **Natural Language Processing**
Advanced parsing of dates, times, priorities, and durations.

#### Test Scenarios:
```
✅ Date/Time Parsing:
- "tomorrow 4pm" → should parse correctly
- "next Monday 2:30pm" → should parse correctly
- "2024-12-31 23:59" → should parse correctly
- "in 2 hours" → should parse correctly

✅ Priority Detection:
- "urgent task" → priority: urgent
- "high priority" → priority: high
- "low priority" → priority: low
- "ASAP" → priority: urgent
- "P0" → priority: urgent

✅ Duration Parsing:
- "25 min" → 25 minutes
- "1h 30m" → 90 minutes
- "2 hours" → 120 minutes
- "25/5 x4" → 25min focus, 5min breaks, 4 cycles
- "1:30" → 90 minutes

✅ Tag Extraction:
- "Create task #work #urgent" → tags: ["work", "urgent"]
- "Add task with tags: frontend, bugfix" → tags: ["frontend", "bugfix"]
```

### 5. **Conversation Management**
Thread-based chat with persistence and management.

#### Test Scenarios:
```
✅ Thread Management:
- Create new chat thread
- Switch between threads
- Rename threads
- Delete threads
- Messages persist across sessions

✅ Chat Commands:
- "clear chat" → should clear current thread
- "reset conversation" → should clear current thread
- "start fresh" → should clear current thread
```

### 6. **Error Handling & Edge Cases**
Robust handling of invalid inputs and edge cases.

#### Test Scenarios:
```
✅ Invalid Inputs:
- Empty messages
- Very long messages (>2000 chars)
- Invalid dates ("next never")
- Invalid priorities ("super urgent")
- Invalid durations ("forever")

✅ Network Issues:
- Disconnect internet during request
- Slow network conditions
- Server errors

✅ State Management:
- Browser refresh during task creation
- Multiple tabs with different threads
- Local storage corruption
```

## Testing Checklist

### Phase 1: Basic Functionality
- [ ] Assistant loads without errors
- [ ] Can send and receive messages
- [ ] Messages display correctly
- [ ] Auto-scroll works
- [ ] Input validation works

### Phase 2: Task Creation
- [ ] Simple task creation works
- [ ] Complex task creation works
- [ ] Field extraction works correctly
- [ ] Date/time parsing works
- [ ] Priority detection works
- [ ] Duration parsing works
- [ ] Tag extraction works

### Phase 3: Interactive Flow
- [ ] Field-by-field guidance works
- [ ] Skip functionality works
- [ ] Confirmation flow works
- [ ] Task actually gets created in database
- [ ] Error messages are helpful

### Phase 4: Manual Mode
- [ ] Manual mode triggers correctly
- [ ] Instructions are clear and accurate
- [ ] Can switch back to auto mode
- [ ] Suggested values are correct

### Phase 5: Thread Management
- [ ] Can create new threads
- [ ] Can switch between threads
- [ ] Can rename threads
- [ ] Can delete threads
- [ ] Messages persist correctly

### Phase 6: Edge Cases
- [ ] Handles invalid inputs gracefully
- [ ] Handles network errors
- [ ] Handles server errors
- [ ] State management works correctly

## Performance Testing

### Response Time
- [ ] Messages send within 2 seconds
- [ ] AI responses within 5 seconds
- [ ] Task creation completes within 3 seconds

### Memory Usage
- [ ] No memory leaks with long conversations
- [ ] Large message history doesn't slow down UI
- [ ] Thread switching is smooth

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## Security Testing

### Authentication
- [ ] Requires valid JWT token
- [ ] Handles expired tokens
- [ ] Handles invalid tokens

### Input Sanitization
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] Malicious input handling

## Analytics Testing

### Usage Tracking
- [ ] Message events are logged
- [ ] Task creation events are logged
- [ ] Error events are logged
- [ ] Performance metrics are captured

### Cost Tracking
- [ ] AI model usage is tracked
- [ ] Cost calculations are accurate
- [ ] Usage limits are respected

## Advanced Testing Scenarios

### 1. **Multi-turn Task Creation**
```
User: "I want to create a task"
Assistant: "What is the task title?"
User: "Prepare quarterly presentation"
Assistant: "When is it due?"
User: "Next Friday 3pm"
Assistant: "What is the priority?"
User: "High"
Assistant: "Set a focus duration? (e.g., 25 min, 45 min). You can say skip."
User: "45 minutes"
Assistant: "Break interval between focus blocks? (e.g., 5 min). Say skip if not needed."
User: "10 minutes"
Assistant: "How many breaks/cycles would you like? (e.g., 4). You can say skip."
User: "3"
Assistant: "Any subtasks? Provide comma-separated list, or say skip."
User: "research data, create slides, practice presentation"
Assistant: "Any tags to add? Provide comma-separated tags, or say skip."
User: "presentation, quarterly, high-priority"
Assistant: "Any description or constraints to add? You can say skip."
User: "Focus on Q4 metrics and projections"
Assistant: "Any custom preferences? (e.g., notifications: off). You can say skip."
User: "skip"
Assistant: [Shows preview] "Shall I create this task? (yes/no)"
User: "yes"
```

### 2. **Complex Natural Language**
```
User: "Create an urgent task to fix the critical bug in production that's causing user login failures, due ASAP, with 25/5 x4 pomodoro settings, tags: #bugfix #production #urgent"
```

### 3. **Context Switching**
```
User: "Create a task to review code"
Assistant: [Asks for details]
User: "Actually, let me switch to manual mode"
Assistant: [Provides manual instructions]
User: "Switch back to auto"
Assistant: [Continues with auto mode]
```

### 4. **Error Recovery**
```
User: "Create task due next never"
Assistant: "That date didn't parse. Could you rephrase? (e.g., 2025-01-31 16:00)"
User: "tomorrow 4pm"
Assistant: [Continues normally]
```

## Monitoring & Debugging

### Console Logs
Check browser console for:
- Network requests
- Error messages
- Performance metrics

### Network Tab
Monitor:
- API calls to `/ai/chat`
- API calls to `/ai/task-flow`
- Response times
- Error responses

### Local Storage
Check:
- Thread data persistence
- Message history
- Flow state

### Backend Logs
Monitor:
- AI model requests
- Error handling
- Usage analytics

## Success Criteria

### Functional
- [ ] All test scenarios pass
- [ ] No critical errors
- [ ] Tasks are created correctly
- [ ] UI is responsive

### Performance
- [ ] Response times under 5 seconds
- [ ] No memory leaks
- [ ] Smooth user experience

### User Experience
- [ ] Intuitive interaction
- [ ] Helpful error messages
- [ ] Clear instructions
- [ ] Logical flow

### Reliability
- [ ] Handles edge cases gracefully
- [ ] Recovers from errors
- [ ] Data persistence works
- [ ] State management is robust

## Reporting Issues

When reporting issues, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/OS information**
5. **Console errors**
6. **Network request details**
7. **Screenshots/videos**

## Continuous Testing

### Automated Tests
- Unit tests for parsing functions
- Integration tests for API endpoints
- E2E tests for user flows

### Manual Testing
- Regular smoke tests
- User acceptance testing
- Performance monitoring

### Monitoring
- Error rate tracking
- Response time monitoring
- Usage analytics
- Cost tracking

This testing guide ensures your AI assistant is robust, reliable, and provides an excellent user experience across all scenarios.

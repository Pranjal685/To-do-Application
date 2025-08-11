# Quick AI Assistant Testing Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
1. **Backend running**: `cd backend && npm start`
2. **Frontend running**: `npm run dev`
3. **Database**: PostgreSQL running with migrations applied
4. **AI API Key**: `OPENROUTER_API_KEY` set in backend `.env`

### Step 1: Basic Functionality Test

1. **Open the Assistant page** in your browser
2. **Send a simple message**: "Hello, what can you help me with?"
3. **Expected**: You should get a helpful response about task creation

### Step 2: Task Creation Test

1. **Try basic task creation**:
   ```
   Create a task to review code tomorrow 4pm
   ```

2. **Expected behavior**:
   - Assistant should extract: title, due_date
   - Should ask for priority if not specified
   - Should guide you through completion

### Step 3: Advanced Features Test

1. **Test Pomodoro settings**:
   ```
   Create urgent task to study for exam, 25/5 x4 pomodoro style
   ```

2. **Test manual mode**:
   ```
   How do I create a task manually?
   ```

3. **Test skip functionality**:
   ```
   skip duration
   ```

## 🧪 Automated Testing

### Run the Test Script
```bash
# Install dependencies if needed
cd backend && npm install node-fetch

# Run automated tests
node scripts/test_ai_assistant.js

# Run interactive testing
node scripts/test_ai_assistant.js --interactive
```

### What the Tests Cover
- ✅ Basic task creation
- ✅ Complex task with Pomodoro settings
- ✅ Tag extraction
- ✅ Manual mode requests
- ✅ Skip functionality
- ✅ Date/time parsing
- ✅ Priority detection
- ✅ Duration parsing

## 🔍 Manual Testing Checklist

### Core Features
- [ ] **Chat Interface**: Messages send and receive correctly
- [ ] **Thread Management**: Can create, switch, rename, delete threads
- [ ] **Message Persistence**: Messages save across browser sessions
- [ ] **Auto-scroll**: Chat scrolls to bottom on new messages

### Task Creation
- [ ] **Simple Tasks**: "Create task to review PR"
- [ ] **Complex Tasks**: "Create urgent task due tomorrow 4pm with 25min focus"
- [ ] **Field Extraction**: Title, due date, priority, duration, tags
- [ ] **Confirmation Flow**: Shows preview and asks for confirmation
- [ ] **Task Creation**: Actually creates task in database

### Natural Language Processing
- [ ] **Date Parsing**: "tomorrow 4pm", "next Monday", "2024-12-31"
- [ ] **Time Parsing**: "25 min", "1h 30m", "2 hours"
- [ ] **Priority Detection**: "urgent", "high", "low", "ASAP"
- [ ] **Tag Extraction**: "#work", "tags: frontend, bugfix"
- [ ] **Pomodoro Parsing**: "25/5 x4", "45min focus"

### Error Handling
- [ ] **Invalid Inputs**: Empty messages, invalid dates
- [ ] **Network Errors**: Disconnect internet, test error messages
- [ ] **Server Errors**: Check graceful error handling
- [ ] **State Recovery**: Browser refresh during task creation

## 🎯 Key Test Scenarios

### Scenario 1: Complete Task Creation Flow
```
User: "I want to create a task"
Assistant: "What is the task title?"
User: "Review quarterly reports"
Assistant: "When is it due?"
User: "Next Friday 3pm"
Assistant: "What is the priority?"
User: "High"
Assistant: "Set a focus duration? (e.g., 25 min, 45 min). You can say skip."
User: "45 minutes"
Assistant: [Shows preview] "Shall I create this task? (yes/no)"
User: "yes"
```

### Scenario 2: Complex Natural Language
```
User: "Create urgent task to fix critical bug in production, due ASAP, 25/5 x4 pomodoro, tags: #bugfix #production"
```

### Scenario 3: Manual Mode
```
User: "How do I create a task manually?"
Assistant: [Provides step-by-step instructions]
User: "Switch back to auto"
Assistant: [Continues with auto mode]
```

## 🐛 Common Issues & Solutions

### Issue: "OPENROUTER_API_KEY not configured"
**Solution**: Add your OpenRouter API key to backend `.env` file

### Issue: "Chat processing failed"
**Solution**: Check backend logs, verify API key is valid

### Issue: "Task creation failed"
**Solution**: Check database connection, verify migrations are applied

### Issue: "No response from assistant"
**Solution**: Check network tab, verify backend is running

## 📊 Performance Benchmarks

### Response Times
- **Message send**: < 2 seconds
- **AI response**: < 5 seconds
- **Task creation**: < 3 seconds

### Success Criteria
- **Field extraction accuracy**: > 90%
- **Date parsing accuracy**: > 95%
- **Task creation success rate**: > 98%

## 🔧 Debugging Tools

### Browser Console
- Check for JavaScript errors
- Monitor network requests
- View localStorage data

### Network Tab
- Monitor API calls to `/ai/chat` and `/ai/task-flow`
- Check response times and status codes
- Verify request/response payloads

### Backend Logs
- Check for AI model errors
- Monitor usage analytics
- Verify authentication

### Local Storage
- Check thread persistence: `ai_threads_index`
- Check message history: `ai_thread_messages_*`
- Check flow state: `ai_thread_flow_*`

## 📈 Success Metrics

### Functional Success
- [ ] All test scenarios pass
- [ ] No critical errors in console
- [ ] Tasks created successfully in database
- [ ] UI responsive and intuitive

### Performance Success
- [ ] Response times under benchmarks
- [ ] No memory leaks
- [ ] Smooth user experience
- [ ] Fast thread switching

### User Experience Success
- [ ] Intuitive interaction flow
- [ ] Helpful error messages
- [ ] Clear instructions
- [ ] Logical conversation flow

## 🎉 Next Steps

After successful testing:

1. **Monitor Usage**: Check AI Analytics page for usage patterns
2. **Optimize Performance**: Review response times and optimize if needed
3. **Add Features**: Consider additional capabilities based on user feedback
4. **Scale**: Plan for increased usage and cost management

## 📞 Getting Help

If you encounter issues:

1. **Check the comprehensive testing guide**: `docs/AI_ASSISTANT_TESTING_GUIDE.md`
2. **Review backend logs** for detailed error information
3. **Test with the automated script** to isolate issues
4. **Check the architecture documentation**: `docs/ARCHITECTURE.md`

Your AI assistant is now ready for comprehensive testing! 🚀

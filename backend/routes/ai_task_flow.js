import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import * as chrono from 'chrono-node';
// Using fetch to call OpenRouter directly

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Core task schema with extended optional planning parameters
const TaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().max(2000).optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional(),
  project_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Extended planning fields (all optional)
  duration_minutes: z.number().int().positive().max(24 * 60).optional(),
  break_interval_minutes: z.number().int().positive().max(6 * 60).optional(),
  break_count: z.number().int().min(0).max(50).optional(),
  subtasks: z.array(z.string()).default([]).optional(),
  preferences: z.record(z.string()).optional(),
});

function parseDueDate(input) {
  if (!input) return undefined;
  const parsed = chrono.parseDate(input, new Date(), { forwardDate: true });
  if (!parsed) return undefined;
  return new Date(parsed).toISOString();
}

// Parse textual duration like "25 min", "1h 30m", "2 hours", "90m" into minutes
function parseDurationMinutes(text) {
  if (!text) return undefined;
  const lower = String(text).toLowerCase();

  // hh:mm pattern (e.g., 1:30 => 90m)
  const hhmm = lower.match(/\b(\d{1,2})\s*:\s*(\d{1,2})\b/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }

  // 1h 30m or 1hr 30min
  const hAndM = lower.match(/\b(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?\s*(\d+)?\s*m?(?:in(?:ute)?s?)?\b/);
  if (hAndM) {
    const h = parseFloat(hAndM[1]);
    const m = hAndM[2] ? parseInt(hAndM[2], 10) : 0;
    if (!isNaN(h) && !isNaN(m)) return Math.round(h * 60) + m;
  }

  // 90m, 90 min, 90 minutes
  const onlyM = lower.match(/\b(\d+)\s*m(?:in(?:ute)?s?)?\b/);
  if (onlyM) {
    const m = parseInt(onlyM[1], 10);
    if (!isNaN(m)) return m;
  }

  // 2h, 2 hr, 2 hours
  const onlyH = lower.match(/\b(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?\b/);
  if (onlyH) {
    const h = parseFloat(onlyH[1]);
    if (!isNaN(h)) return Math.round(h * 60);
  }

  // phrases like "for 25 minutes"
  const forM = lower.match(/for\s+(\d+)\s+min(?:ute)?s?/);
  if (forM) {
    const m = parseInt(forM[1], 10);
    if (!isNaN(m)) return m;
  }
  return undefined;
}

// Parse break interval minutes similar to duration
function parseBreakIntervalMinutes(text) {
  return parseDurationMinutes(text);
}

// Parse break count like "5 breaks", "x5", "5 pomodoros"
function parseBreakCount(text) {
  if (!text) return undefined;
  const lower = String(text).toLowerCase();
  const m1 = lower.match(/\b(\d+)\s*(breaks?|pomodoros?|cycles?)\b/);
  if (m1) {
    const n = parseInt(m1[1], 10);
    if (!isNaN(n)) return n;
  }
  const m2 = lower.match(/x\s*(\d+)\b/);
  if (m2) {
    const n = parseInt(m2[1], 10);
    if (!isNaN(n)) return n;
  }
  return undefined;
}

// Parse a compact pomodoro triple like "25/5 x4", "25-5-4", or "25m/5m x 4"
function parsePomodoroTriple(text) {
  if (!text) return {};
  const lower = String(text).toLowerCase();

  // 25/5 x4
  let m = lower.match(/\b(\d{1,3})\s*(?:m|min)?\s*[\/:\-]\s*(\d{1,3})\s*(?:m|min)?\s*(?:x|×)\s*(\d{1,2})\b/);
  if (m) {
    return {
      duration_minutes: parseInt(m[1], 10),
      break_interval_minutes: parseInt(m[2], 10),
      break_count: parseInt(m[3], 10),
    };
  }
  // 25-5-4 or 25:5:4
  m = lower.match(/\b(\d{1,3})\s*[\-:\/]\s*(\d{1,3})\s*[\-:\/]\s*(\d{1,2})\b/);
  if (m) {
    return {
      duration_minutes: parseInt(m[1], 10),
      break_interval_minutes: parseInt(m[2], 10),
      break_count: parseInt(m[3], 10),
    };
  }
  return {};
}

function parsePriorityFromText(text) {
  if (!text) return undefined;
  const lower = String(text).toLowerCase();
  if (/\b(urgent|asap|immediately|critical|p0)\b/.test(lower)) return 'urgent';
  if (/\b(high|important|p1|top)\b/.test(lower)) return 'high';
  if (/\b(medium|normal|default|p2)\b/.test(lower)) return 'medium';
  if (/\b(low|later|someday|p3)\b/.test(lower)) return 'low';
  return undefined;
}

function extractHashtags(text) {
  if (!text) return [];
  const tags = [];
  const re = /#([\w-]{2,40})/g;
  let m;
  while ((m = re.exec(text))) {
    tags.push(m[1]);
  }
  return tags;
}

function extractListAfterKeyword(text, keywordRegex) {
  const lower = String(text);
  const m = lower.match(keywordRegex);
  if (!m) return [];
  const tail = lower.slice(m.index + m[0].length).trim();
  if (!tail) return [];
  return tail
    .split(/[;,\n]|\band\b|\bthen\b/gi)
    .map((s) => s.trim())
    .filter((s) => s && s.length > 1);
}

function extractSubtasksFromText(text) {
  // Patterns like: "subtasks: read, notes, revise" or "steps: 1) read 2) notes 3) revise"
  const list = extractListAfterKeyword(text, /(subtasks?|steps?|checklist)\s*[:\-]\s*/i);
  if (list.length) return list;

  // Enumerated: 1) read 2) notes 3) revise
  const items = [];
  const re = /(\d+)[\).]\s*([^\d\n]+)(?=\s*(\d+[\).]|$))/g;
  let m;
  while ((m = re.exec(text))) {
    const item = m[2].trim().replace(/[.,;]+$/, '');
    if (item) items.push(item);
  }
  return items;
}

function detectPreferences(text) {
  const prefs = {};
  const lower = String(text).toLowerCase();
  if (/(notifications?|notify)\s*(off|disable|muted|silent)/.test(lower)) prefs.notifications = 'off';
  if (/(notifications?|notify)\s*(on|enable|loud)/.test(lower)) prefs.notifications = 'on';
  return Object.keys(prefs).length ? prefs : undefined;
}

function looksLikeTitle(text) {
  const t = String(text).trim();
  if (t.length > 120) return false;
  if (/(due|by|tomorrow|today|next|\b\d{1,2}(:\d{2})?\s*(am|pm)\b|\b\d+\s*(m|min|h|hours?)\b|priority|urgent|high|low|tags?|#|breaks?|x\s*\d+)/i.test(t)) return false;
  return true;
}

function chooseNextQuestion(values, issues) {
  const skipped = values?._skipped || {};
  if (!values.title) return { field: 'title', question: 'What is the task title?' };
  if (issues?.title) return { field: 'title', question: `Title error: ${issues.title}. Please provide a valid title.` };

  if (!values.due_date && !skipped.due_date)
    return { field: 'due_date', question: 'When is it due? (e.g., tomorrow 4pm, next Monday)' };
  if (issues?.due_date)
    return { field: 'due_date', question: 'That date didn\'t parse. Could you rephrase? (e.g., 2025-01-31 16:00)' };

  if (!values.priority && !skipped.priority)
    return { field: 'priority', question: 'What is the priority? (low, medium, high, urgent)' };
  if (issues?.priority)
    return { field: 'priority', question: 'Priority must be one of: low, medium, high, urgent' };

  if (values.duration_minutes == null && !skipped.duration_minutes)
    return { field: 'duration_minutes', question: 'Set a focus duration? (e.g., 25 min, 45 min, 1h). You can say skip.' };

  if (values.break_interval_minutes == null && !skipped.break_interval_minutes)
    return { field: 'break_interval_minutes', question: 'Break interval between focus blocks? (e.g., 5 min). Say skip if not needed.' };

  if (values.break_count == null && !skipped.break_count)
    return { field: 'break_count', question: 'How many breaks/cycles would you like? (e.g., 4). You can say skip.' };

  if ((!values.subtasks || values.subtasks.length === 0) && !skipped.subtasks)
    return { field: 'subtasks', question: 'Any subtasks? Provide comma-separated list, or say skip.' };

  if ((!values.tags || values.tags.length === 0) && !skipped.tags)
    return { field: 'tags', question: 'Any tags to add? Provide comma-separated tags, or say skip.' };

  if ((values.description == null || values.description === '') && !skipped.description)
    return { field: 'description', question: 'Any description or constraints to add? You can say skip.' };

  if (!values.preferences && !skipped.preferences)
    return { field: 'preferences', question: 'Any custom preferences? (e.g., notifications: off). You can say skip.' };

  return { field: null, question: null };
}

function buildPreview(values) {
  const lines = [];
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };
  if (values.title) lines.push(`• Title: ${values.title}`);
  if (values.priority) lines.push(`• Priority: ${values.priority}`);
  if (values.due_date) lines.push(`• Due: ${fmtDate(values.due_date)}`);
  if (values.duration_minutes != null) lines.push(`• Duration: ${values.duration_minutes} min`);
  if (values.break_interval_minutes != null) lines.push(`• Break interval: ${values.break_interval_minutes} min`);
  if (values.break_count != null) lines.push(`• Break count: ${values.break_count}`);
  if (Array.isArray(values.subtasks) && values.subtasks.length) lines.push(`• Subtasks: ${values.subtasks.join(', ')}`);
  if (Array.isArray(values.tags) && values.tags.length) lines.push(`• Tags: ${values.tags.join(', ')}`);
  if (values.description) lines.push(`• Description: ${values.description}`);
  if (values.preferences && typeof values.preferences === 'object') {
    const prefs = Object.entries(values.preferences).map(([k, v]) => `${k}: ${v}`).join(', ');
    if (prefs) lines.push(`• Preferences: ${prefs}`);
  }
  return lines.join('\n');
}

router.post('/task-flow', auth, async (req, res) => {
  const { message, state } = req.body || {};
  const values = { ...(state?.values || {}) };
  const currentMode = state?.mode || 'auto'; // 'auto' | 'manual'

  try {
    if (!process.env.OPENROUTER_API_KEY && !process.env.AI_OFFLINE) return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' });

    const rawText = String(message || '').trim();
    const lower = rawText.toLowerCase();

    // Ask model to extract candidate fields from the user message
    let extracted = {};
    if (!process.env.AI_OFFLINE) {
      const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      const modelName = process.env.AI_MODEL || 'qwen/qwen3-coder:free';
      const system = `Extract task fields from the user input. Return STRICT JSON only with keys:
{"title":string?, "description":string?, "priority":"low"|"medium"|"high"|"urgent"?, "due_date_text":string?, "tags":string[]?, "duration_text":string?, "break_interval_text":string?, "break_count":number?, "subtasks":string[]?, "preferences":Record<string,string>?}
If nothing relevant, return {}.`;
      const resp = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
          'X-Title': process.env.APP_NAME || 'AI Todo',
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: String(message || '') },
          ],
        }),
      });
      const json = await resp.json();
      const rawJson = json?.choices?.[0]?.message?.content ?? '{}';
      try { extracted = JSON.parse(rawJson); } catch { extracted = {}; }
    }

    // Merge extracted fields
    const merged = { ...values };
    if (typeof extracted.title === 'string' && !merged.title) merged.title = extracted.title.trim();
    if (typeof extracted.description === 'string') merged.description = extracted.description.trim();
    if (typeof extracted.priority === 'string') merged.priority = extracted.priority.toLowerCase();
    if (Array.isArray(extracted.tags)) merged.tags = extracted.tags.filter((t) => !!t && typeof t === 'string');
    if (typeof extracted.due_date_text === 'string') {
      const iso = parseDueDate(extracted.due_date_text);
      if (iso) merged.due_date = iso;
    }
    // Extract compact pomodoro triplets from message itself (e.g., "25/5 x4")
    const trio = parsePomodoroTriple(rawText);
    if (trio.duration_minutes && merged.duration_minutes == null) merged.duration_minutes = trio.duration_minutes;
    if (trio.break_interval_minutes && merged.break_interval_minutes == null) merged.break_interval_minutes = trio.break_interval_minutes;
    if (trio.break_count != null && merged.break_count == null) merged.break_count = trio.break_count;

    if (typeof extracted.duration_text === 'string' && merged.duration_minutes == null) {
      const mins = parseDurationMinutes(extracted.duration_text);
      if (mins) merged.duration_minutes = mins;
    }
    if (typeof extracted.break_interval_text === 'string' && merged.break_interval_minutes == null) {
      const mins = parseBreakIntervalMinutes(extracted.break_interval_text);
      if (mins) merged.break_interval_minutes = mins;
    }
    if (typeof extracted.break_count === 'number' && merged.break_count == null) {
      const n = Math.max(0, Math.min(50, Math.round(extracted.break_count)));
      merged.break_count = n;
    }
    if (Array.isArray(extracted.subtasks)) {
      const items = extracted.subtasks
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s) => !!s);
      if (items.length) merged.subtasks = items;
    }
    if (extracted && typeof extracted.preferences === 'object' && !Array.isArray(extracted.preferences)) {
      merged.preferences = {};
      for (const [k, v] of Object.entries(extracted.preferences)) {
        if (typeof k === 'string' && typeof v === 'string') merged.preferences[k] = v;
      }
    }

    // Heuristic fallback: if the model did not extract, assume the user is answering the next missing field
    // lower and rawText already defined above

    // Handle targeted skip commands like "skip duration", "skip breaks", etc.
    merged._skipped = merged._skipped || {};
    const skipMatch = lower.match(/^\s*(skip|no|none)\s*(.*)$/);
    if (skipMatch) {
      const tail = skipMatch[2]?.trim() || '';
      const markSkip = (key) => { merged._skipped[key] = true; };
      if (!tail) {
        // Generic skip: mark common optional fields
        ['description','tags','duration_minutes','break_interval_minutes','break_count','subtasks','preferences','due_date','priority']
          .forEach(markSkip);
      } else {
        if (/duration|time|focus/.test(tail)) markSkip('duration_minutes');
        if (/break interval|interval|between breaks|breaks?\s*interval/.test(tail)) markSkip('break_interval_minutes');
        if (/breaks?|cycles?|pomodoros?/.test(tail)) markSkip('break_count');
        if (/subtasks?|steps|checklist/.test(tail)) markSkip('subtasks');
        if (/tags?/.test(tail)) markSkip('tags');
        if (/desc(ription)?/.test(tail)) markSkip('description');
        if (/pref(erences)?|settings?/.test(tail)) markSkip('preferences');
        if (/due|deadline|date/.test(tail)) markSkip('due_date');
        if (/priority/.test(tail)) markSkip('priority');
      }
    }

    if (lower !== 'skip' && lower !== 'yes' && lower !== 'no' && !skipMatch) {
      // Title detection: if title missing and raw text looks like a standalone title
      if (!merged.title && looksLikeTitle(rawText)) {
        merged.title = rawText;
      }

      // Due date
      if (!merged.due_date) {
        const iso = parseDueDate(rawText);
        if (iso) merged.due_date = iso;
      }

      // Priority
      if (!merged.priority) {
        const pri = lower.replace(/[^a-z]/g, '');
        if (['low','medium','high','urgent'].includes(pri)) merged.priority = pri;
        if (!merged.priority) {
          const p2 = parsePriorityFromText(rawText);
          if (p2) merged.priority = p2;
        }
      }

      // Duration / interval / counts
      if (merged.duration_minutes == null) {
        const mins = parseDurationMinutes(rawText);
        if (mins) merged.duration_minutes = mins;
      }
      if (merged.break_interval_minutes == null) {
        const mins = parseBreakIntervalMinutes(rawText);
        if (mins) merged.break_interval_minutes = mins;
      }
      if (merged.break_count == null) {
        const cnt = parseBreakCount(rawText);
        if (cnt != null) merged.break_count = cnt;
      }

      // Subtasks from text
      if ((!merged.subtasks || merged.subtasks.length === 0)) {
        const sts = extractSubtasksFromText(rawText);
        if (sts.length) merged.subtasks = sts;
      }

      // Tags via hashtags or 'tags:'
      if (!merged.tags || merged.tags.length === 0) {
        const tagList = [
          ...extractHashtags(rawText),
          ...extractListAfterKeyword(rawText, /tags?\s*[:\-]\s*/i)
        ];
        const uniq = Array.from(new Set(tagList.map((t) => t.trim().replace(/^#/, '')))).filter(Boolean);
        if (uniq.length) merged.tags = uniq;
      }

      // Preferences (e.g., notifications on/off)
      if (!merged.preferences) {
        const prefs = detectPreferences(rawText);
        if (prefs) merged.preferences = prefs;
      }

      // Description fallback - only use raw text if it's not a task creation command
      if (!merged.description && rawText.length > 1 && !looksLikeTitle(rawText)) {
        // Don't use the original command as description for task creation
        if (!/\b(create|add)\b.*\btask\b/i.test(rawText)) {
          merged.description = rawText;
        }
      }
    }

    // Detect intent for manual guidance vs auto creation
    const wantsManual = (
      /\bmanual(ly)?\b/.test(lower) ||
      /\b(step[- ]?by[- ]?step|instructions?|guide|roadmap)\b/.test(lower) ||
      /\bhow (do|to) (i )?create\b/.test(lower) ||
      /\bwhat (are you|will you) (do|doing)\b/.test(lower) ||
      /\bexplain\b/.test(lower) ||
      /\bwalk me through\b/.test(lower) ||
      /\bshow (me )?steps\b/.test(lower) ||
      /\bpreview how you will do\b/.test(lower) ||
      currentMode === 'manual'
    ) && !/\b(create|add)\b.*\b(task)\b.*\bfor me\b/.test(lower);

    const wantsAuto = /\b(create|add)\b.*\b(task)\b/.test(lower) || /\bauto\b/.test(lower) || /\bdo it\b/.test(lower);

    const mode = wantsManual && !wantsAuto ? 'manual' : 'auto';

    // Lightweight validation
    const issues = {};
    // Validate core and extended fields; title required for any confirmation
    let confirmationReady = false;
    try {
      const partial = TaskSchema.partial({
        description: true,
        due_date: true,
        project_id: true,
        tags: true,
        priority: true,
        duration_minutes: true,
        break_interval_minutes: true,
        break_count: true,
        subtasks: true,
        preferences: true,
      }).parse(merged);
      if (!partial.priority) partial.priority = 'medium';
      merged.priority = partial.priority;

      // Determine readiness: title present AND all optional planning fields either provided or explicitly skipped
      const skipped = merged._skipped || {};
      const allConsidered = [
        'due_date',
        'priority',
        'duration_minutes',
        'break_interval_minutes',
        'break_count',
        'subtasks',
        'tags',
        'description',
        'preferences',
      ].every((k) => (partial[k] != null && (Array.isArray(partial[k]) ? partial[k].length >= 0 : true)) || skipped[k]);

      confirmationReady = Boolean(partial.title) && allConsidered;
    } catch (e) {
      if (e?.issues) {
        for (const it of e.issues) {
          if (it.path?.[0]) issues[it.path[0]] = it.message;
        }
      }
    }

    // If user asked to skip everything generically
    if (String(message || '').trim().toLowerCase() === 'skip') {
      // Mark optional fields as skipped and move on
      merged._skipped = merged._skipped || {};
      ['description','tags','duration_minutes','break_interval_minutes','break_count','subtasks','preferences','due_date','priority']
        .forEach((k) => (merged._skipped[k] = true));
      if (!merged.description) merged.description = '';
      if (!merged.tags) merged.tags = [];
    }

    if (mode === 'manual') {
      // Build manual guidance steps aligned to the app UI
      const steps = [
        'Open the Kanban Board or Projects page (left sidebar).',
        'Click the “New Task” or “+” button (top-right).',
        'Fill Title (required). Keep it short and action-oriented.',
        'Set Priority from the dropdown: low, medium, high, or urgent.',
        'Optionally set Due date/time using the date picker (must be a valid date).',
        'Optionally set Focus duration (e.g., 25 min, 45 min).',
        'Optional: Set Break interval (e.g., 5 min) and Break count (e.g., 4).',
        'Add Description with any constraints (e.g., focus 120 minutes, 2×5 min breaks).',
        'Add Tags (comma separated) such as pomodoro, focus, breaks-5x2.',
        'If available, add Subtasks (comma separated).',
        'If available, set Estimated duration to 120 minutes.',
        'Choose Project if applicable; otherwise leave unassigned.',
        'Click Create to save the task.'
      ];

      const suggested = {
        title: merged.title,
        description: merged.description,
        priority: merged.priority,
        due_date: merged.due_date,
        tags: merged.tags,
        project_id: merged.project_id,
        duration_minutes: merged.duration_minutes,
        break_interval_minutes: merged.break_interval_minutes,
        break_count: merged.break_count,
        subtasks: merged.subtasks,
        preferences: merged.preferences,
      };

      return res.json({
        mode: 'manual',
        manualGuide: {
          heading: 'Manual task creation — step-by-step',
          steps,
          suggestedValues: suggested,
          validation: {
            title: 'required, min 3 chars',
            priority: 'one of low | medium | high | urgent (defaults to medium if unset)',
            due_date: 'valid date/time; optional',
          },
          note: 'You can say “switch to auto” or “create it for me” to let me create it directly.',
        },
        values: merged,
      });
    }

    const nextInfo = confirmationReady ? { field: null, question: null } : chooseNextQuestion(merged, issues);
    // Mark that we have asked this field (to avoid re-asking if client persists state)
    if (nextInfo?.field) {
      merged._asked = merged._asked || {};
      merged._asked[nextInfo.field] = true;
    }

    const assistantText = confirmationReady
      ? `Here\'s the full setup:\n${buildPreview(merged)}\n\nShall I create this task? (yes/no)`
      : nextInfo.question;

    res.json({
      mode: 'auto',
      values: merged,
      confirmationReady,
      nextQuestion: nextInfo.question,
      nextField: nextInfo.field,
      pendingFields: [
        'due_date','priority','duration_minutes','break_interval_minutes','break_count','subtasks','tags','description','preferences'
      ].filter((k) => (merged[k] == null || (Array.isArray(merged[k]) && merged[k].length === 0)) && !(merged._skipped || {})[k]),
      errors: issues,
      assistantText,
    });
  } catch (err) {
    console.error('task-flow error', err);
    res.status(500).json({ error: 'Task flow processing failed' });
  }
});

export default router;



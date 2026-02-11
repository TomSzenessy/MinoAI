/* ============================================================
   MINO — Prototype Interactivity
   ============================================================ */

// === SAMPLE DATA ===
const sampleNotes = [
  {
    id: 1,
    title: 'System Architecture',
    folder: 'projects',
    tags: ['architecture', 'core'],
    date: 'Today',
    pinned: true,
    content: `<h2>Core Objectives</h2>
<ul>
  <li>Establish robust sync using <code>CRDTs</code> (Yjs)</li>
  <li>Implement end-to-end encryption for sensitive notes</li>
  <li>Build <code>agent-native</code> API layer with MCP tools</li>
  <li>Design modular plugin architecture</li>
</ul>

<h2>Technology Stack</h2>
<pre><code>Server:   Bun + Hono (TypeScript)
Frontend: Next.js 15 + React + Tailwind
Mobile:   React Native + Expo
Database: SQLite (index) + Files (source of truth)
Search:   FTS5 + Vector embeddings
Sync:     Yjs CRDTs over WebSocket</code></pre>

<blockquote>The agent is a first-class user. Every API decision is made with AI agents in mind.</blockquote>

<h2>Architecture Layers</h2>
<p>The system follows a three-layer model: <strong>Interfaces</strong> (web, mobile, CLI, MCP), <strong>Server</strong> (Hono API, WebSocket, agent runtime), and <strong>Storage</strong> (markdown files + SQLite index).</p>`,
    preview: 'Core objectives, technology stack, and architecture layers for the Mino platform...'
  },
  {
    id: 2,
    title: 'Meeting Notes — Q1 Planning',
    folder: 'daily',
    tags: ['meeting'],
    date: 'Yesterday',
    pinned: true,
    content: `<h2>Attendees</h2>
<p>Tom, Sarah, Alex, Dev Team</p>

<h2>Key Decisions</h2>
<div class="task-item"><div class="task-checkbox checked"></div><span>Use Bun as the server runtime</span></div>
<div class="task-item"><div class="task-checkbox checked"></div><span>SQLite for indexing, files for storage</span></div>
<div class="task-item"><div class="task-checkbox"></div><span>Evaluate CodeMirror 6 vs TipTap for editor</span></div>
<div class="task-item"><div class="task-checkbox"></div><span>Design the MCP tool schema</span></div>

<h2>Action Items</h2>
<p>Tom to finalize the design system. Sarah to prototype the API endpoints. Alex to set up the monorepo structure.</p>`,
    preview: 'Q1 planning meeting with key decisions on tech stack, editor choice, and action items...'
  },
  {
    id: 3,
    title: 'Design System Tokens',
    folder: 'projects',
    tags: ['design', 'architecture'],
    date: 'Today',
    pinned: false,
    content: `<h2>Brand Colors</h2>
<p>Primary purple derived from <code>logo.svg</code>: <strong>#BB86FC</strong></p>
<p>Background surfaces from logo circle: <strong>#1E1E1E</strong></p>

<h2>Typography</h2>
<ul>
  <li><strong>Headings:</strong> Space Grotesk (600-700)</li>
  <li><strong>Body:</strong> Inter (400-500)</li>
  <li><strong>Code:</strong> JetBrains Mono (400)</li>
</ul>

<h2>Principles</h2>
<p>Glassmorphism, all-rounded geometry, dark-first, micro-animations, purple as the only accent color.</p>`,
    preview: 'Brand colors (#BB86FC purple, #1E1E1E surfaces), typography rules, and design principles...'
  },
  {
    id: 4,
    title: 'API Endpoint Design',
    folder: 'projects',
    tags: ['architecture', 'api'],
    date: '2 days ago',
    pinned: false,
    content: `<h2>REST API v1</h2>
<pre><code>GET    /api/v1/notes          — List notes
POST   /api/v1/notes          — Create note
GET    /api/v1/notes/:path    — Read note
PUT    /api/v1/notes/:path    — Update note
DELETE /api/v1/notes/:path    — Delete note

GET    /api/v1/search?q=...   — Full-text search
POST   /api/v1/search/semantic — Embedding search

GET    /api/v1/tree           — Folder structure
POST   /api/v1/agent/chat     — AI agent</code></pre>

<h2>Authentication</h2>
<p>JWT tokens for sessions, API keys for agents. All routes under <code>/api/v1/</code> with cursor-based pagination.</p>`,
    preview: 'REST API v1 endpoints for notes, search, folders, and agent. JWT + API key auth...'
  },
  {
    id: 5,
    title: 'Plugin Ideas Brainstorm',
    folder: 'ideas',
    tags: ['idea', 'plugins'],
    date: '3 days ago',
    pinned: false,
    content: `<h2>Priority Plugins</h2>
<ul>
  <li><strong>Web Search</strong> — Search via Perplexity, save as notes</li>
  <li><strong>YouTube Transcripts</strong> — Import video content</li>
  <li><strong>Voice Notes</strong> — Whisper STT integration</li>
  <li><strong>Obsidian Import</strong> — Migrate existing vaults</li>
</ul>

<h2>Future Ideas</h2>
<ul>
  <li>Email digest → daily note</li>
  <li>RSS feed clipper</li>
  <li>Calendar → daily notes</li>
  <li>Twitter/X thread saver</li>
  <li>Readwise integration</li>
</ul>

<blockquote>Each plugin is an npm package using <code>definePlugin()</code> from the SDK.</blockquote>`,
    preview: 'Priority plugins: web search, YouTube, voice notes, Obsidian import. Future: email, RSS...'
  },
  {
    id: 6,
    title: 'Offline Sync Strategy',
    folder: 'research',
    tags: ['architecture', 'sync'],
    date: '4 days ago',
    pinned: false,
    content: `<h2>CRDT Approach</h2>
<p>Using <strong>Yjs</strong> for conflict-free sync. All edits are CRDT operations that merge automatically regardless of order.</p>

<h2>Sync Flow</h2>
<ol>
  <li>Client connects via WebSocket</li>
  <li>Exchange state vectors (handshake)</li>
  <li>Server sends deltas since last sync</li>
  <li>Client applies + sends its local deltas</li>
  <li>WebSocket stays open for real-time</li>
</ol>

<h2>Conflict Policy</h2>
<p>Edit always wins over delete (soft-delete). CRDTs guarantee all devices converge to the same state.</p>`,
    preview: 'Yjs CRDTs for offline sync. WebSocket flow, state vectors, edit-wins-over-delete policy...'
  },
  {
    id: 7,
    title: 'Security Hardening Checklist',
    folder: 'projects',
    tags: ['security'],
    date: '5 days ago',
    pinned: false,
    content: `<h2>Authentication</h2>
<div class="task-item"><div class="task-checkbox checked"></div><span>JWT with 15min expiry + refresh tokens</span></div>
<div class="task-item"><div class="task-checkbox checked"></div><span>API keys hashed with bcrypt</span></div>
<div class="task-item"><div class="task-checkbox"></div><span>OAuth 2.0 (Google) integration</span></div>

<h2>Input & Output</h2>
<div class="task-item"><div class="task-checkbox checked"></div><span>Zod validation on all inputs</span></div>
<div class="task-item"><div class="task-checkbox"></div><span>CSP headers on web app</span></div>
<div class="task-item"><div class="task-checkbox"></div><span>Strict CORS allowlist</span></div>

<h2>Data</h2>
<div class="task-item"><div class="task-checkbox"></div><span>Path traversal protection</span></div>
<div class="task-item"><div class="task-checkbox"></div><span>Optional E2E encryption</span></div>`,
    preview: 'Security checklist: JWT auth, API key hashing, Zod validation, CSP, CORS, E2E encryption...'
  },
  {
    id: 8,
    title: 'Daily — Feb 11, 2026',
    folder: 'daily',
    tags: ['daily'],
    date: 'Today',
    pinned: false,
    content: `<h2>Today</h2>
<div class="task-item"><div class="task-checkbox checked"></div><span>Finalize design system with logo colors</span></div>
<div class="task-item"><div class="task-checkbox checked"></div><span>Write README and Master Plan</span></div>
<div class="task-item"><div class="task-checkbox"></div><span>Build clickable prototype</span></div>
<div class="task-item"><div class="task-checkbox"></div><span>Split docs into modular files</span></div>

<h2>Notes</h2>
<p>Logo uses <code>#BB86FC</code> — recalibrated entire design system around this. Three-pill motif is the visual identity.</p>`,
    preview: 'Feb 11 daily — finalize design system, build prototype, split docs...'
  },
  {
    id: 9,
    title: 'AI Agent Context Strategy',
    folder: 'research',
    tags: ['ai', 'architecture'],
    date: 'Last week',
    pinned: false,
    content: `<h2>Token Efficiency</h2>
<p>The agent must be aggressive about minimizing token usage.</p>

<h2>Strategies</h2>
<ul>
  <li><strong>Compact file tree</strong> — folder names + counts, not every file</li>
  <li><strong>Snippet search</strong> — 200-char snippets, never full files</li>
  <li><strong>Search-and-replace</strong> — <code>mino.edit(path, old, new)</code></li>
  <li><strong>Embeddings pre-filter</strong> — find 5 right notes from 10,000</li>
  <li><strong>Session memory</strong> — compact summary of known vault info</li>
</ul>

<h2>4-Phase Search</h2>
<ol>
  <li>Title + tag match (0 tokens)</li>
  <li>Full-text FTS5 (snippets, ~500 tokens)</li>
  <li>Semantic embedding search (~200 tokens)</li>
  <li>Full file read (only when confident)</li>
</ol>`,
    preview: 'Token efficiency strategies: compact tree, snippets, search-and-replace, 4-phase search...'
  },
  {
    id: 10,
    title: 'Graph View Concept',
    folder: 'ideas',
    tags: ['idea', 'design'],
    date: 'Last week',
    pinned: false,
    content: `<h2>Visual Knowledge Graph</h2>
<p>Like Obsidian's graph view but auto-generated. The AI agent creates links between related notes.</p>

<h2>Implementation</h2>
<ul>
  <li>Use <code>react-force-graph</code> or D3.js</li>
  <li>Nodes = notes, edges = links/backlinks</li>
  <li>Color by folder, size by connections</li>
  <li>Click node to open note</li>
  <li>Cluster detection for topic groups</li>
</ul>

<blockquote>Phase 3+ feature. Needs the link tracking system in place first.</blockquote>`,
    preview: 'Visual knowledge graph like Obsidian. react-force-graph, auto-linked, colored by folder...'
  },
  {
    id: 11,
    title: 'Monorepo Setup Guide',
    folder: 'projects',
    tags: ['setup'],
    date: '2 weeks ago',
    pinned: false,
    content: `<h2>Structure</h2>
<pre><code>mino/
├── packages/
│   ├── shared/     (types, utils, API client)
│   ├── ui/         (React components)
│   └── tokens/     (design tokens)
├── apps/
│   ├── server/     (Bun + Hono)
│   ├── web/        (Next.js)
│   └── mobile/     (Expo)
└── tools/
    ├── mcp-server/ (MCP tools)
    └── cli/        (CLI)</code></pre>

<h2>Setup</h2>
<p>pnpm workspaces + Turborepo. Run <code>turbo dev</code> to start all services.</p>`,
    preview: 'Monorepo with pnpm workspaces + Turborepo. packages/, apps/, tools/ structure...'
  },
  {
    id: 12,
    title: 'Daily — Feb 10, 2026',
    folder: 'daily',
    tags: ['daily'],
    date: 'Yesterday',
    pinned: false,
    content: `<h2>Today</h2>
<div class="task-item"><div class="task-checkbox checked"></div><span>Research OpenClaw agent architecture</span></div>
<div class="task-item"><div class="task-checkbox checked"></div><span>Analyze existing workspace prototypes</span></div>
<div class="task-item"><div class="task-checkbox checked"></div><span>Visit mino.ink for design inspiration</span></div>

<h2>Insights</h2>
<p>OpenClaw has 52 skills (including Obsidian, Notion, Apple Notes integrations) and a robust plugin architecture. Good reference for Mino's agent system.</p>`,
    preview: 'Feb 10 daily — researched OpenClaw, analyzed prototypes, visited mino.ink...'
  }
];

// === STATE ===
let currentView = 'landing'; // 'landing' | 'app'
let currentNoteView = 'grid'; // 'grid' | 'editor'
let currentNote = null;
let aiPanelOpen = false;

// === PAGE NAVIGATION ===
function enterApp() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('navbar').style.display = 'none';
  const app = document.getElementById('app');
  app.classList.add('active');
  app.classList.add('page-transition');
  currentView = 'app';
  renderNotes(sampleNotes);
}

function goToLanding() {
  document.getElementById('landing').style.display = '';
  document.getElementById('navbar').style.display = '';
  document.getElementById('app').classList.remove('active');
  currentView = 'landing';
}

// === NOTE RENDERING ===
function renderNotes(notes) {
  const grid = document.getElementById('notesGrid');
  grid.innerHTML = '';

  // Sort: pinned first, then by date
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  sorted.forEach(note => {
    const card = document.createElement('div');
    card.className = `note-card${note.pinned ? ' pinned' : ''}`;
    card.onclick = () => openNote(note);

    card.innerHTML = `
      <div class="note-card-title">${note.title}</div>
      <div class="note-card-preview">${note.preview}</div>
      <div class="note-card-footer">
        <span class="note-card-date">${note.date}</span>
        <div class="note-card-tags">
          ${note.tags.slice(0, 2).map(t => `<span class="note-tag">${t}</span>`).join('')}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  document.getElementById('breadcrumbCurrent').textContent = `${notes.length} notes`;
  document.getElementById('statusWords').textContent = `${notes.length} notes`;
}

// === NOTE EDITOR ===
function openNote(note) {
  currentNote = note;
  currentNoteView = 'editor';

  document.getElementById('notesArea').style.display = 'none';
  const editorView = document.getElementById('editorView');
  editorView.classList.add('active');
  editorView.classList.add('page-transition');

  document.getElementById('editorTitle').value = note.title;
  document.getElementById('editorRendered').innerHTML = note.content;

  // Update breadcrumb
  const breadcrumb = document.querySelector('.breadcrumb');
  breadcrumb.innerHTML = `
    <span class="breadcrumb-item" onclick="showNotesList()">All Notes</span>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-item" onclick="showNotesList()">${note.folder}</span>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-item current">${note.title}</span>
  `;

  // Update status bar
  const wordCount = note.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w).length;
  document.getElementById('statusWords').textContent = `${wordCount} words`;
  document.getElementById('statusDate').textContent = note.date;

  // Hide FAB in editor
  document.getElementById('fab').style.display = 'none';
}

function showNotesList() {
  currentNoteView = 'grid';
  currentNote = null;

  document.getElementById('notesArea').style.display = '';
  document.getElementById('editorView').classList.remove('active');

  // Reset breadcrumb
  document.querySelector('.breadcrumb').innerHTML = `
    <span class="breadcrumb-item" onclick="showNotesList()">All Notes</span>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-item current">${sampleNotes.length} notes</span>
  `;

  document.getElementById('statusWords').textContent = `${sampleNotes.length} notes`;
  document.getElementById('statusDate').textContent = 'Today';
  document.getElementById('fab').style.display = '';
}

// === SIDEBAR ===
function selectFolder(element, folder) {
  // Update active state
  document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');

  // Filter notes
  let filtered;
  if (folder === 'all') {
    filtered = sampleNotes;
  } else if (folder.startsWith('tag-')) {
    const tag = folder.replace('tag-', '');
    filtered = sampleNotes.filter(n => n.tags.includes(tag));
  } else {
    filtered = sampleNotes.filter(n => n.folder === folder);
  }

  // Show notes list if in editor
  if (currentNoteView === 'editor') {
    showNotesList();
  }

  renderNotes(filtered);
}

// === VIEW TOGGLE ===
function setView(mode) {
  const grid = document.getElementById('notesGrid');
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');

  if (mode === 'grid') {
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  } else {
    grid.style.gridTemplateColumns = '1fr';
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
  }
}

function toggleSort() {
  // Visual feedback only for prototype
  const sortedReverse = [...sampleNotes].reverse();
  renderNotes(sortedReverse);
}

// === COMMAND PALETTE ===
function openCmdPalette() {
  document.getElementById('cmdOverlay').classList.add('active');
  setTimeout(() => document.getElementById('cmdInput').focus(), 100);
}

function closeCmdPalette(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('cmdOverlay').classList.remove('active');
  document.getElementById('cmdInput').value = '';
}

function filterCommands() {
  const query = document.getElementById('cmdInput').value.toLowerCase();
  const items = document.querySelectorAll('.cmd-result-item');

  if (!query) {
    items.forEach(item => item.style.display = '');
    return;
  }

  // If typing, show matching notes as results
  const results = document.getElementById('cmdResults');
  const matchingNotes = sampleNotes.filter(n =>
    n.title.toLowerCase().includes(query) ||
    n.tags.some(t => t.includes(query)) ||
    n.preview.toLowerCase().includes(query)
  );

  // Clear and show matching notes + default items
  results.innerHTML = '';

  matchingNotes.forEach(note => {
    const item = document.createElement('div');
    item.className = 'cmd-result-item';
    item.onclick = () => { closeCmdPalette({ target: { currentTarget: null } }); document.getElementById('cmdOverlay').classList.remove('active'); if (currentView === 'landing') enterApp(); openNote(note); };
    item.innerHTML = `
      <span class="icon">📄</span>
      <span class="text">${note.title}</span>
      <span class="shortcut" style="color: var(--text-muted); font-size: 0.7rem;">${note.folder}</span>
    `;
    results.appendChild(item);
  });

  if (matchingNotes.length === 0) {
    results.innerHTML = `<div class="cmd-result-item"><span class="icon">🔍</span><span class="text" style="color: var(--text-tertiary);">No results for "${query}"</span></div>`;
  }
}

function cmdAction(action) {
  document.getElementById('cmdOverlay').classList.remove('active');
  switch (action) {
    case 'new': createNewNote(); break;
    case 'ai': toggleAIPanel(); break;
    default: break;
  }
}

// === AI PANEL ===
function toggleAIPanel() {
  const panel = document.getElementById('aiPanel');
  aiPanelOpen = !aiPanelOpen;
  panel.classList.toggle('open', aiPanelOpen);
}

function handleAIInput(event) {
  if (event.key === 'Enter') sendAIMessage();
}

function sendAIMessage() {
  const input = document.getElementById('aiInput');
  const text = input.value.trim();
  if (!text) return;

  const messages = document.getElementById('aiMessages');

  // User message
  messages.innerHTML += `
    <div class="ai-message">
      <div class="ai-message-avatar user">T</div>
      <div class="ai-message-content">${text}</div>
    </div>
  `;

  input.value = '';

  // Simulate AI thinking
  setTimeout(() => {
    let response;

    if (text.toLowerCase().includes('organiz')) {
      response = `I've scanned your vault and found some suggestions:<br><br>
        • <strong>3 notes</strong> about "architecture" could be linked together<br>
        • <strong>Daily notes</strong> could use consistent tagging<br>
        • <strong>"Plugin Ideas"</strong> and <strong>"Graph View Concept"</strong> could be moved to a "Future" folder<br><br>
        Want me to apply these changes?`;
    } else if (text.toLowerCase().includes('search') || text.toLowerCase().includes('find')) {
      response = `I found <strong>4 notes</strong> related to your query across your vault. The most relevant is <strong>"System Architecture"</strong> which covers the core objectives and tech stack. Would you like me to open it?`;
    } else {
      response = `Based on your notes, here's what I found:<br><br>
        Your vault has <strong>12 notes</strong> across 5 folders. The most active area is <strong>Projects</strong> with 5 notes. I'd suggest creating a <strong>map of content (MOC)</strong> note to link your architecture-related notes together. Want me to create one?`;
    }

    messages.innerHTML += `
      <div class="ai-message">
        <div class="ai-message-avatar ai">✦</div>
        <div class="ai-message-content">${response}</div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;
  }, 800);
}

// === NEW NOTE ===
function createNewNote() {
  if (currentView === 'landing') enterApp();

  const newNote = {
    id: Date.now(),
    title: 'Untitled Note',
    folder: 'all',
    tags: [],
    date: 'Just now',
    pinned: false,
    content: '<p>Start writing...</p>',
    preview: 'A new blank note...'
  };

  openNote(newNote);
  document.getElementById('editorTitle').value = '';
  document.getElementById('editorTitle').focus();
}

// === KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', (e) => {
  // Cmd+K — Command palette
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (document.getElementById('cmdOverlay').classList.contains('active')) {
      document.getElementById('cmdOverlay').classList.remove('active');
    } else {
      openCmdPalette();
    }
  }

  // Escape — Close overlays
  if (e.key === 'Escape') {
    document.getElementById('cmdOverlay').classList.remove('active');
    if (aiPanelOpen) toggleAIPanel();
  }

  // Cmd+N — New note
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
    e.preventDefault();
    createNewNote();
  }

  // Cmd+J — AI panel
  if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
    e.preventDefault();
    if (currentView === 'landing') enterApp();
    toggleAIPanel();
  }
});

// === SEARCH ===
document.getElementById('sidebarSearch').addEventListener('focus', () => {
  openCmdPalette();
});

// === TASK CHECKBOXES ===
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('task-checkbox')) {
    e.target.classList.toggle('checked');
  }
});

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  // Nothing to init on landing — notes render on enterApp()
});

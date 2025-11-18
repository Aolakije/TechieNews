
# Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [API Integration](#api-integration)
4. [Data Flow](#data-flow)
5. [Caching Strategy](#caching-strategy)
6. [Error Handling](#error-handling)
7. [Performance Optimization](#performance-optimization)
8. [Code Examples](#code-examples)

---

## Architecture Overview

### Design Pattern
The application follows a **Module Pattern** with event-driven architecture:
- **Separation of Concerns**: Display logic separated from data fetching
- **Event-Driven**: User interactions trigger async operations
- **Stateful**: Tracks loaded items, visibility, and cache

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with custom properties
- **API**: HackerNews Firebase API (RESTful)
- **No Dependencies**: Zero external libraries

### File Organization
```
├── index.html              # Entry point, DOM structure
├── style.css               # Visual presentation layer
├── main.js                 # Application orchestrator
├── display/                # UI logic modules
│   ├── default-news.js     # Live updates component
│   ├── event-click-*.js    # Section-specific handlers
└── utils/                  # Helper functions
    ├── cache.js            # In-memory post storage
    └── fetch-*.js          # API abstraction layer
```

---

## Core Components

### 1. Main Application (`main.js`)

**Purpose**: Initialize and coordinate all components

```javascript
async function displayNews() {
  // Base configuration
  let globalUrl = `https://hacker-news.firebaseio.com/v0/item/`;
  let storyUrl = `https://hacker-news.firebaseio.com/v0/topstories.json`;
  let jobUrl = `https://hacker-news.firebaseio.com/v0/jobstories.json`;

  // Initialize sections
  ClickStories(".h1stories", ".stories", globalUrl, storyUrl);
  ClickJobs(".h1jobs", ".jobs", globalUrl, jobUrl);
  ClickPolls(".h1polls", ".polls", globalUrl);
  
  // Start live updates
  News(".last-news", globalUrl);
  setInterval(() => News(".last-news", globalUrl), 5000);
}
```

**Key Responsibilities**:
- Configure API endpoints
- Initialize all section handlers
- Start live update polling
- Coordinate application lifecycle

---

### 2. Stories Component (`event-click-stories.js`)

**Purpose**: Handle story display and interactions

#### State Management
```javascript
let storiesVisible = false;  // Section visibility toggle
let itemsLoaded = 0;         // Pagination tracker
```

#### Core Functions

##### `loadMoreStories()`
Fetches and displays 5 additional stories

**Algorithm**:
1. Fetch next batch from API
2. Sort by timestamp (newest first)
3. Slice to get only new items
4. Create DOM elements
5. Attach event listeners
6. Append to container

**Code Flow**:
```javascript
async function loadMoreStories() {
  // Fetch stories
  const newStories = await FetchFullItemsOfCat(
    globalUrl, 
    catUrl, 
    itemsLoaded + 5
  );
  
  // Sort by time
  newStories.sort((a, b) => b.time - a.time);
  
  // Display only new items
  const toDisplay = newStories.slice(itemsLoaded);
  itemsLoaded += 5;
  
  // Render each story
  toDisplay.forEach(item => {
    const article = createStoryElement(item);
    containerStories.appendChild(article);
  });
}
```

##### `loadComments(itemId, container, globalUrl)`
Recursive function for loading threaded comments

**Parameters**:
- `itemId`: Parent item/comment ID
- `container`: DOM element to append comments
- `globalUrl`: Base API URL

**Features**:
- Loads first 10 comments
- Sorts by timestamp
- Filters deleted/dead comments
- Supports nested replies (recursive)

**Recursion Example**:
```javascript
// Initial call
await loadComments(storyId, commentsContainer, globalUrl);

// Nested call (when user clicks "Load replies")
await loadComments(commentId, repliesContainer, globalUrl);
```

---

### 3. Jobs Component (`event-click-jobs.js`)

**Purpose**: Display job listings with descriptions

**Differences from Stories**:
- No score/comment count emphasis
- Focus on job descriptions (`text` field)
- Simpler metadata display

**Structure**:
```javascript
article.innerHTML = `
  <h2><a href="${item.url}">${item.title}</a></h2>
  <div class="meta">
    <span>👤 By: ${item.by}</span>
    <span>🕐 ${date}</span>
  </div>
  <button class="toggle-text">Show description</button>
  <div class="message" hidden>${item.text}</div>
`;
```

---

### 4. Polls Component (`event-click-polls.js`)

**Purpose**: Fetch and display polls with voting data

#### Unique Features

##### Poll Discovery Algorithm
Since HackerNews has no dedicated polls endpoint:

```javascript
async function fetchPollIdsFromAPI() {
  // 1. Fetch from askstories
  const ids = await fetch('/v0/askstories.json');
  
  // 2. Check each item's type
  const pollIds = [];
  for (const id of ids.slice(0, 50)) {
    const item = await fetch(`/v0/item/${id}.json`);
    if (item.type === 'poll') {
      pollIds.push(id);
    }
  }
  
  // 3. Fallback to hardcoded if none found
  if (pollIds.length === 0) {
    pollIds = fallbackPollIds;
  }
  
  return pollIds;
}
```

##### Poll Options Fetching
Polls have a `parts` array containing option IDs:

```javascript
for (const partId of item.parts) {
  const part = await fetch(`${globalUrl}${partId}.json`);
  // part.text = option text
  // part.score = vote count
}
```

#### Throttling Implementation
```javascript
const THROTTLE_DELAY = 5000;
let lastLoadTime = 0;

async function loadMorePolls() {
  const now = Date.now();
  
  // Block if called within 5 seconds
  if (now - lastLoadTime < THROTTLE_DELAY) {
    console.log("Please wait 5s");
    return;
  }
  
  lastLoadTime = now;
  // ... proceed with loading
}
```

---

### 5. Live Updates (`default-news.js`)

**Purpose**: Display and track newest items

#### Change Detection
```javascript
let previousIds = new Set();

export async function News(stockElement, globalUrl) {
  const fullItems = await FetchFullItems(globalUrl, 5);
  const currentIds = new Set(fullItems.map(item => item.id));
  
  // Detect new items
  let hasNewItems = false;
  for (const id of currentIds) {
    if (!previousIds.has(id)) {
      hasNewItems = true;
      break;
    }
  }
  
  // Update tracking
  previousIds = currentIds;
  
  // Show notification if new
  if (hasNewItems) {
    showNotification("🔄 New items available!");
  }
}
```

#### Auto-Refresh Mechanism
```javascript
// Initial load
News(".last-news", globalUrl);

// Continuous updates
setInterval(() => {
  News(".last-news", globalUrl);
}, 5000);
```

---

## API Integration

### HackerNews API Structure

#### Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/v0/topstories.json` | Get story IDs | `[id1, id2, ...]` |
| `/v0/jobstories.json` | Get job IDs | `[id1, id2, ...]` |
| `/v0/askstories.json` | Get Ask HN IDs | `[id1, id2, ...]` |
| `/v0/item/{id}.json` | Get item details | `{id, type, ...}` |
| `/v0/maxitem.json` | Get latest ID | `12345678` |

#### Item Types
```javascript
{
  "story":   { title, url, text, score, descendants, kids },
  "job":     { title, url, text },
  "poll":    { title, text, parts, descendants, kids },
  "pollopt": { text, score },
  "comment": { text, by, time, kids }
}
```

### Fetch Utilities

#### `FetchFullItemsOfCat(globalUrl, catUrl, count)`
Fetches items by category (stories/jobs)

**Process**:
1. Fetch ID list from category endpoint
2. Fetch first N items in parallel
3. Return array of complete items

```javascript
export async function FetchFullItemsOfCat(globalUrl, catUrl, nbr) {
  // Get all IDs
  const ids = await fetch(catUrl).then(r => r.json());
  
  // Fetch first nbr items in parallel
  const promises = ids.slice(0, nbr).map(id => 
    fetch(`${globalUrl}${id}.json`).then(r => r.json())
  );
  
  return await Promise.all(promises);
}
```

#### `FetchFullItems(globalUrl, count)`
Fetches latest items by ID

**Process**:
1. Get max item ID
2. Iterate backwards from max
3. Collect items until count reached
4. Limit to 500 iterations (safety)

```javascript
export async function FetchFullItems(globalUrl, nbr) {
  const maxItem = await fetch('/v0/maxitem.json').then(r => r.json());
  
  let liste = [];
  for (let i = maxItem; i > maxItem - 500 && liste.length < nbr; i--) {
    const item = await fetch(`${globalUrl}${i}.json`).then(r => r.json());
    if (item) liste.push(item);
  }
  
  return liste;
}
```

---

## Data Flow

### User Clicks "Stories"

```
User Click
    ↓
h1stories.addEventListener('click')
    ↓
if (!visible) → loadMoreStories()
    ↓
FetchFullItemsOfCat(globalUrl, storyUrl, 5)
    ↓
fetch(storyUrl) → [id1, id2, id3, ...]
    ↓
Promise.all([
  fetch(item/id1.json),
  fetch(item/id2.json),
  ...
])
    ↓
Sort by time (newest first)
    ↓
Create DOM elements
    ↓
Append to .stories container
    ↓
Show "Load More" button
```

### User Clicks "Load Comments"

```
User Click
    ↓
button.addEventListener('click')
    ↓
loadComments(itemId, container, globalUrl)
    ↓
fetch(`item/${itemId}.json`)
    ↓
Extract kids array [commentId1, commentId2, ...]
    ↓
Promise.all([
  fetch(item/commentId1.json),
  fetch(item/commentId2.json),
  ...
]) → Limit to 10
    ↓
Filter: !deleted && !dead
    ↓
Sort by time (newest first)
    ↓
Create comment DOM elements
    ↓
Attach "Load replies" listeners (recursive)
    ↓
Append to comments container
```

### Live Updates Cycle

```
setInterval(5000)
    ↓
News(container, globalUrl)
    ↓
FetchFullItems(globalUrl, 5)
    ↓
fetch('/v0/maxitem.json') → maxId
    ↓
for (i = maxId; i > maxId - 500; i--)
    ↓
fetch(`item/${i}.json`) → collect 5 items
    ↓
Compare with previousIds Set
    ↓
if (new items found)
    ↓
Show notification "🔄 New items!"
    ↓
Update previousIds Set
    ↓
Clear and re-render container
    ↓
Wait 5 seconds → Repeat
```

---

## Caching Strategy

### Post Cache (`cache.js`)

**Purpose**: Prevent duplicate displays and reduce API calls

```javascript
export const postCache = {
  posts: new Set(),
  
  has(id) {
    return this.posts.has(id);
  },
  
  add(item) {
    this.posts.add(item.id);
  },
  
  clear() {
    this.posts.clear();
  }
};
```

**Usage in Polls**:
```javascript
for (const id of pollsToLoad) {
  // Skip if already displayed
  if (postCache.has(id)) {
    console.log(`Poll ${id} already displayed, skipping...`);
    continue;
  }
  
  // Fetch and display
  const item = await fetch(`${globalUrl}${id}.json`);
  postCache.add(item);
  displayPoll(item);
}
```

**Benefits**:
- ✅ Prevents duplicate posts
- ✅ Reduces unnecessary API calls
- ✅ Improves performance
- ✅ Better user experience

**Limitations**:
- ⚠️ In-memory only (lost on refresh)
- ⚠️ Not persistent across sessions
- ⚠️ No size limit (could grow large)

---

## Error Handling

### Levels of Error Handling

#### 1. Network Errors
```javascript
try {
  const response = await fetch(url);
  const data = await response.json();
} catch (error) {
  console.error("Network error:", error);
  // Fallback to cached data or show error message
}
```

#### 2. Invalid Data
```javascript
if (!item || item.deleted || item.dead) {
  console.log("Invalid item, skipping");
  continue;
}
```

#### 3. Missing Elements
```javascript
const container = document.querySelector('.stories');
if (!container) {
  console.error("Container not found!");
  return;
}
```

#### 4. API Timeout
```javascript
const TIMEOUT_MS = 5000;

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS);
});

const result = await Promise.race([fetchPromise, timeoutPromise]);
```

### Error Recovery Strategies

**Fallback Data**:
```javascript
if (pollIds.length === 0) {
  console.log("API returned no polls, using fallback");
  pollIds = fallbackPollIds;
}
```

**Graceful Degradation**:
```javascript
if (!item.kids) {
  container.innerHTML = "<p>No comments yet</p>";
  return;
}
```

**User Feedback**:
```javascript
buttonComments.textContent = "Loading...";
try {
  await loadComments();
  buttonComments.textContent = "Hide Comments";
} catch (error) {
  buttonComments.textContent = "Error loading comments";
}
```

---

## Performance Optimization

### 1. Parallel Requests
Use `Promise.all()` instead of sequential awaits:

```javascript
// ❌ Slow (sequential)
for (const id of ids) {
  const item = await fetch(`${url}${id}.json`);
  items.push(item);
}

// ✅ Fast (parallel)
const promises = ids.map(id => fetch(`${url}${id}.json`));
const items = await Promise.all(promises);
```

### 2. Lazy Loading
Only load visible content:

```javascript
// Load 5 at a time, not all at once
const itemsToLoad = allIds.slice(itemsLoaded, itemsLoaded + 5);
```

### 3. Event Delegation
Attach listeners efficiently:

```javascript
// ❌ Multiple listeners
articles.forEach(article => {
  article.querySelector('.button').addEventListener('click', handler);
});

// ✅ Single delegated listener
container.addEventListener('click', (e) => {
  if (e.target.matches('.button')) {
    handler(e);
  }
});
```

### 4. Throttling
Prevent request spam:

```javascript
let lastCallTime = 0;
const DELAY = 5000;

function throttledFunction() {
  const now = Date.now();
  if (now - lastCallTime < DELAY) return;
  
  lastCallTime = now;
  // Execute function
}
```

### 5. DOM Manipulation
Minimize reflows:

```javascript
// ❌ Multiple reflows
for (const item of items) {
  container.appendChild(createArticle(item));
}

// ✅ Single reflow
const fragment = document.createDocumentFragment();
for (const item of items) {
  fragment.appendChild(createArticle(item));
}
container.appendChild(fragment);
```

---

## Code Examples

### Adding a New Section

**1. Create display file** (`display/event-click-custom.js`):
```javascript
export async function ClickCustom(clickElement, stockElement, globalUrl, catUrl) {
  let h1custom = document.querySelector(clickElement);
  let containerCustom = document.querySelector(stockElement);
  let itemsLoaded = 0;
  let visible = false;

  async function loadMore() {
    const items = await FetchFullItemsOfCat(globalUrl, catUrl, itemsLoaded + 5);
    items.sort((a, b) => b.time - a.time);
    
    const toDisplay = items.slice(itemsLoaded);
    itemsLoaded += 5;
    
    toDisplay.forEach(item => {
      const article = createArticle(item);
      containerCustom.appendChild(article);
    });
  }

  h1custom.addEventListener('click', async () => {
    if (visible) {
      containerCustom.innerHTML = "";
      visible = false;
    } else {
      await loadMore();
      visible = true;
    }
  });
}
```

**2. Add to HTML**:
```html
<section class="content-section">
  <h1 class="h1custom section-title">Custom Section</h1>
  <div class="custom"></div>
  <button class="btn-see-more-custom" hidden>Load More</button>
</section>
```

**3. Initialize in `main.js`**:
```javascript
import {ClickCustom} from "./display/event-click-custom.js";

ClickCustom(".h1custom", ".custom", globalUrl, customUrl);
```

### Adding Throttling to Existing Section

```javascript
// Add to component state
let isLoading = false;
let lastLoadTime = 0;
const THROTTLE_DELAY = 5000;

// Add to load function
async function loadMoreStories() {
  const now = Date.now();
  
  // Check throttle
  if (isLoading || (now - lastLoadTime < THROTTLE_DELAY && itemsLoaded > 0)) {
    console.log("Please wait 5s before loading more");
    return;
  }
  
  isLoading = true;
  lastLoadTime = now;
  
  // ... loading logic ...
  
  isLoading = false;
}
```

### Implementing Local Storage Cache

```javascript
// Save to localStorage
function saveToCach(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save to cache:", error);
  }
}

// Load from localStorage
function loadFromCache(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load from cache:", error);
    return null;
  }
}

// Usage
const cachedStories = loadFromCache('stories');
if (cachedStories) {
  displayStories(cachedStories);
} else {
  const stories = await fetchStories();
  saveToCache('stories', stories);
  displayStories(stories);
}
```

---

## Testing Guidelines

### Manual Testing Checklist

**Stories Section**:
- [ ] Clicks title to show/hide
- [ ] Loads 5 stories initially
- [ ] "Load More" loads 5 additional stories
- [ ] Stories sorted newest first
- [ ] Comments load correctly
- [ ] Nested replies work

**Jobs Section**:
- [ ] Same as stories
- [ ] Job descriptions toggle correctly

**Polls Section**:
- [ ] Fetches from API or uses fallback
- [ ] Poll options display with vote counts
- [ ] Throttling works (5s delay)
- [ ] Comments load correctly

**Live Updates**:
- [ ] Updates every 5 seconds
- [ ] Shows notification for new items
- [ ] "NEW" badge appears
- [ ] Timestamp updates

**General**:
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] Smooth animations
- [ ] Links work correctly

### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

---

## Deployment

### Production Checklist

- [ ] Remove all `console.log()` statements
- [ ] Minify CSS and JavaScript
- [ ] Add analytics tracking
- [ ] Set up error monitoring
- [ ] Configure caching headers
- [ ] Test on production domain
- [ ] Set up HTTPS
- [ ] Add robots.txt
- [ ] Create sitemap

### Hosting Options

**Static Hosting** (Recommended):
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

**Configuration**:
No build step needed - just upload files!

---

**Documentation Version**: 1.0.0  
**Last Updated**: November 2025 

**Maintained By**: Adeola Olakijena(Aolakije)
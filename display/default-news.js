import {FetchFullItems} from "../utils/fetch-full-items.js";

let previousIds = new Set(); // Track previous item IDs to detect new ones

export async function News(stockElement, globalUrl) {
  const container = document.querySelector(stockElement);
  
  // Show loading state
  const loadingIndicator = container.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  try {
    // Fetch latest 5 items
    const fullItems = await FetchFullItems(globalUrl, 5);
    
    // Sort by time (newest first)
    fullItems.sort((a, b) => b.time - a.time);
    
    // Check for new items
    const currentIds = new Set(fullItems.map(item => item.id));
    let hasNewItems = false;
    
    for (const id of currentIds) {
      if (!previousIds.has(id)) {
        hasNewItems = true;
        break;
      }
    }
    
    // Update previous IDs
    previousIds = currentIds;
    
    // Clear container
    container.innerHTML = "";
    
    // Show update notification if there are new items
    if (hasNewItems) {
      const notification = document.createElement("div");
      notification.className = "update-notification";
      notification.textContent = "new post available!";
      container.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    }
    
    // Add last updated timestamp
    const timestamp = document.createElement("div");
    timestamp.className = "last-updated";
    timestamp.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    container.appendChild(timestamp);
    
    // Display each item
    fullItems.forEach((item) => {
      const article = document.createElement("article");
      const date = new Date(item.time * 1000).toLocaleString();
      const isNew = !previousIds.has(item.id);
      
      article.innerHTML = `
        ${isNew ? '<span class="new-badge">NEW</span>' : ''}
        <h3>${item.title || `${item.type} by ${item.by}`}</h3>
        <div class="meta">
          <span>📌 Type: ${item.type}</span>
          <span>👤 By: ${item.by}</span>
          <span>🕐 ${date}</span>
          ${item.score ? `<span>⭐ ${item.score}</span>` : ''}
        </div>
        ${item.url ? `<a href="${item.url}" target="_blank">🔗 View original</a>` : ''}
      `;
      
      container.appendChild(article);
    });
    
  } catch (error) {
    console.error("Error fetching news:", error);
    container.innerHTML = "<p>Error loading latest news. Will retry in 5 seconds...</p>";
  }
}
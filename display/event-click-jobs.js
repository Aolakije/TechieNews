import {FetchFullItemsOfCat} from "../utils/fetch-full-items-of-cat.js";
import {postCache} from "../utils/cache.js";

export async function ClickJobs(clickElement, stockElement, globalUrl, catUrl) {
  let h1job = document.querySelector(clickElement);
  let containerJobs = document.querySelector(stockElement);
  const buttonSeeMore = document.querySelector(".btn-see-more-jobs");

  let jobsVisible = false;
  let itemsLoaded = 0;
  
  let isLoading = false;
  let lastLoadTime = 0;
  const THROTTLE_DELAY = 5000;

  // Set initial button text
  buttonSeeMore.textContent = "Load Jobs";
  buttonSeeMore.style.display = "block";

  async function loadMoreJobs() {

    const now = Date.now();
    if (isLoading || (now - lastLoadTime < THROTTLE_DELAY && itemsLoaded > 0)) {
      console.log("Please wait 5s before loading more jobs");
      return;
    }

    isLoading = true;
    lastLoadTime = now;
    buttonSeeMore.disabled = true;
    buttonSeeMore.textContent = "Loading...";

    const newJobs = await FetchFullItemsOfCat(
      globalUrl,
      catUrl,
      itemsLoaded + 5
    );

    // Sort by time (newest first)
    newJobs.sort((a, b) => b.time - a.time);

    const toDisplay = newJobs.slice(itemsLoaded);
    itemsLoaded += 5;

    toDisplay.forEach((item) => {
      postCache.add(item);

      const article = document.createElement("article");
      article.setAttribute("data-post-id", item.id);
      const date = new Date(item.time * 1000).toLocaleString();
      
      article.innerHTML = `
        <h2><a href="${item.url || '#'}" target="_blank">${item.title || 'No title'}</a></h2>
        <div class="meta">
          <span>👤 By: ${item.by}</span>
          <span>🕐 ${date}</span>
          <span>📍 Type: ${item.type}</span>
        </div>
        <button class="toggle-text">Show description</button>
        <div class="message" hidden>${item.text || "No description available"}</div>
        ${item.kids ? `<button class="load-comments" data-id="${item.id}">Load Comments (${item.kids.length})</button>` : ''}
        <div class="comments-container" data-id="${item.id}"></div>
      `;

      const buttonText = article.querySelector(".toggle-text");
      const message = article.querySelector(".message");

      buttonText.addEventListener("click", () => {
        message.hidden = !message.hidden;
        buttonText.textContent = message.hidden ? "Show text" : "Hide text";
      });

      const buttonComments = article.querySelector(".load-comments");
      if (buttonComments) {
        const commentsContainer = article.querySelector(".comments-container");
        
        buttonComments.addEventListener("click", async () => {
          if (commentsContainer.innerHTML === "") {
            buttonComments.textContent = "Loading...";
            await loadComments(item.id, commentsContainer, globalUrl);
            buttonComments.textContent = "Hide Comments";
          } else {
            commentsContainer.innerHTML = "";
            buttonComments.textContent = `Load Comments (${item.kids.length})`;
          }
        });
      }

      containerJobs.appendChild(article);
    });

    isLoading = false;
    buttonSeeMore.disabled = false;
    buttonSeeMore.textContent = "Load More Jobs";
  }
   // H1 click to toggle visibility
  h1job.addEventListener("click", async () => {
    if (jobsVisible) {
      // Hide jobs
      containerJobs.innerHTML = "";
      jobsVisible = false;
      itemsLoaded = 0;
      lastLoadTime = 0;
      postCache.clear(); // Clear cache so jobs can reload fresh
    } else {
      // Show jobs - load first batch
      await loadMoreJobs();
      jobsVisible = true;
    }
  });

  // Button click to load more (only works when jobs are visible)
  buttonSeeMore.addEventListener("click", async () => {
      await loadMoreJobs();
  });
}

// Function to load comments
async function loadComments(itemId, container, globalUrl) {
  try {
    const response = await fetch(`${globalUrl}${itemId}.json`);
    const item = await response.json();
    
    if (!item.kids || item.kids.length === 0) {
      container.innerHTML = "<p>No comments yet</p>";
      return;
    }

    const commentPromises = item.kids.slice(0, 10).map(async (kidId) => {
      try {
        const res = await fetch(`${globalUrl}${kidId}.json`);
        return await res.json();
      } catch (error) {
        console.error(`Error fetching comment ${kidId}:`, error);
        return null;
      }
    });

    const comments = (await Promise.all(commentPromises)).filter(c => c !== null);
    comments.sort((a, b) => b.time - a.time);

    comments.forEach(comment => {
      if (comment && !comment.deleted && !comment.dead) {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        const commentDate = new Date(comment.time * 1000).toLocaleString();
        
        commentDiv.innerHTML = `
          <div class="comment-meta">
            <strong>${comment.by}</strong> - ${commentDate}
          </div>
          <div class="comment-text">${comment.text || "[deleted]"}</div>
          ${comment.kids ? `<button class="load-replies" data-id="${comment.id}">Load ${comment.kids.length} replies</button>` : ''}
          <div class="replies" data-id="${comment.id}"></div>
        `;

        const loadRepliesBtn = commentDiv.querySelector(".load-replies");
        if (loadRepliesBtn) {
          loadRepliesBtn.addEventListener("click", async () => {
            const repliesContainer = commentDiv.querySelector(".replies");
            if (repliesContainer.innerHTML === "") {
              loadRepliesBtn.textContent = "Loading...";
              await loadComments(comment.id, repliesContainer, globalUrl);
              loadRepliesBtn.textContent = "Hide replies";
            } else {
              repliesContainer.innerHTML = "";
              loadRepliesBtn.textContent = `Load ${comment.kids.length} replies`;
            }
          });
        }

        container.appendChild(commentDiv);
      }
    });

  } catch (error) {
    console.error("Error loading comments:", error);
    container.innerHTML = "<p>Error loading comments</p>";
  }
}
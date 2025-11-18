import {postCache} from "../utils/cache.js";
import {loadComments} from "../utils/loadComments.js";

export async function ClickPolls(clickElement, stockElement, globalUrl) {
  let h1polls = document.querySelector(clickElement);
  let containerPolls = document.querySelector(stockElement);
  const buttonSeeMore = document.querySelector(".btn-see-more-polls");

  let pollsVisible = false;
  let itemsLoaded = 0;

  let isLoading = false;
  let lastLoadTime = 0;
  const THROTTLE_DELAY = 5000;

  const pollIds = [
    45786777, 45388341, 44639573, 44571809, 44559942, 44525309, 44495538,
    44436795, 44406518, 44295902,
  ];

   // Set initial button text
  buttonSeeMore.textContent = "Load polls";
  buttonSeeMore.style.display = "block";

  async function loadMorePolls() {
    const now = Date.now();
    if (isLoading || (now - lastLoadTime < THROTTLE_DELAY && itemsLoaded > 0)) {
      console.log("Please wait 5s before loading more polls");
      return;
    }

    isLoading = true;
    lastLoadTime = now;
    buttonSeeMore.disabled = true;
    buttonSeeMore.textContent = "Loading...";

    const pollsToLoad = pollIds.slice(itemsLoaded, itemsLoaded + 5);

    for (const id of pollsToLoad) {
      if (postCache.has(id)) {
        console.log(`Poll ${id} already displayed, skipping...`);
        continue;
      }

      try {
        const response = await fetch(`${globalUrl}${id}.json`);
        const item = await response.json();

        if (!item) continue;

        postCache.add(item);

        const article = document.createElement("article");
        article.setAttribute("data-post-id", item.id);
        const date = new Date(item.time * 1000).toLocaleString();

        let pollOptionsHtml = "";
        if (item.parts && item.parts.length > 0) {
          pollOptionsHtml = '<div class="poll-options"><h4>Poll Options:</h4>';

          for (const partId of item.parts) {
            try {
              const partResponse = await fetch(`${globalUrl}${partId}.json`);
              const part = await partResponse.json();
              pollOptionsHtml += `
                <div class="poll-option">
                  <span>${part.text}</span>
                  <span class="poll-score">(${part.score || 0} votes)</span>
                </div>
              `;
            } catch (error) {
              console.error(`Error fetching poll part ${partId}:`, error);
            }
          }
          pollOptionsHtml += "</div>";
        }

        article.innerHTML = `
          <h2>${item.title || "Poll"}</h2>
          <div class="meta">
            <span>👤 By: ${item.by}</span>
            <span>⭐ Score: ${item.score || 0}</span>
            <span>💬 Comments: ${item.descendants || 0}</span>
            <span>🕐 ${date}</span>
          </div>
          <button class="toggle-text">Show description</button>
          <div class="message" hidden>${
            item.text || "No description available"
          }</div>
          ${pollOptionsHtml}
          <button class="load-comments" data-id="${item.id}">Load Comments (${
          item.descendants || 0
        })</button>
          <div class="comments-container" data-id="${item.id}"></div>
        `;

        const buttonText = article.querySelector(".toggle-text");
        const message = article.querySelector(".message");
        
        buttonText.addEventListener("click", () => {
          message.hidden = !message.hidden;
          buttonText.textContent = message.hidden
            ? "Show description"
            : "Hide description";
        });

        const buttonComments = article.querySelector(".load-comments");
        const commentsContainer = article.querySelector(".comments-container");
        buttonComments.addEventListener("click", async () => {
          if (commentsContainer.innerHTML === "") {
            buttonComments.textContent = "Loading...";
            await loadComments(item.id, commentsContainer, globalUrl);
            buttonComments.textContent = "Hide Comments";
          } else {
            commentsContainer.innerHTML = "";
            buttonComments.textContent = `Load Comments (${
              item.descendants || 0
            })`;
          }
        });

        containerPolls.appendChild(article);
      } catch (error) {
        console.error(`Error loading poll ${id}:`, error);
      }
    }

    itemsLoaded += 5;

    isLoading = false;
    buttonSeeMore.disabled = false;
    buttonSeeMore.textContent = "Load More Polls";
  }

  h1polls.addEventListener("click", async () => {
    if (pollsVisible) {
      containerPolls.innerHTML = "";
      pollsVisible = false;
      itemsLoaded = 0;
      lastLoadTime = 0;
    } else {
      await loadMorePolls();
      pollsVisible = true;
    }
  });

  buttonSeeMore.addEventListener("click", async () => {
    await loadMorePolls();
  });
}

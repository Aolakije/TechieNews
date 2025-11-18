import {postCache} from "../utils/cache.js";
import {FetchFullItemsOfCat} from "../utils/fetch-full-items-of-cat.js";
import {loadComments} from "../utils/loadComments.js";

export async function ClickStories(
  clickElement,
  stockElement,
  globalUrl,
  catUrl
) {
  let h1Stories = document.querySelector(clickElement);
  let containerStories = document.querySelector(stockElement);
  const buttonSeeMore = document.querySelector(".btn-see-more-stories");
  let storiesVisible = false;
  let itemsLoaded = 0;

  let isLoading = false;
  let lastLoadTime = 0;
  const THROTTLE_DELAY = 5000;


   // Set initial button text
  buttonSeeMore.textContent = "Load Stories";
  buttonSeeMore.style.display = "block";

  async function loadMoreStories() {
    const now = Date.now();
    if (isLoading || (now - lastLoadTime < THROTTLE_DELAY && itemsLoaded > 0)) {
      console.log("Please wait 5s before loading more stories.");
      return;
    }

    isLoading = true;
    lastLoadTime = now;
    buttonSeeMore.disabled = true;
    buttonSeeMore.textContent = "loading...";

    const newStories = await FetchFullItemsOfCat(
      globalUrl,
      catUrl,
      itemsLoaded + 5
    );

    const toDisplay = newStories.slice(itemsLoaded);
    itemsLoaded += 5;

    toDisplay.forEach((item) => {
      postCache.add(item);

      const article = document.createElement("article");
      article.setAttribute("data-post-id", item.id);
      const date = new Date(item.time * 1000).toLocaleString();

      article.innerHTML = `
        <h2><a href="${item.url || "#"}" target="_blank">${
        item.title || "No title"
      }</a></h2>
        <div class="meta">
          <span>👤 By: ${item.by}</span>
          <span>⭐ Score: ${item.score || 0}</span>
          <span>💬 Comments: ${item.descendants || 0}</span>
          <span>🕐 ${date}</span>
        </div>
        <button class="toggle-text">Show text</button>
        <div class="message" hidden>${
          item.text || "No description available"
        }</div>
        <button class="load-comments" data-id="${item.id}">Load Comments (${
        item.descendants || 0
      })</button>
        <div class="comments-container" data-id="${item.id}"></div>
      `;

      // Toggle text button
      const buttonText = article.querySelector(".toggle-text");
      const message = article.querySelector(".message");

      buttonText.addEventListener("click", () => {
        message.hidden = !message.hidden;
        buttonText.textContent = message.hidden ? "Show text" : "Hide text";
      });

      // Load comments button (we'll implement this next)
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

      containerStories.appendChild(article);
    });

    isLoading = false;
    buttonSeeMore.disabled = false;
    buttonSeeMore.textContent = "Load more stories";
  }

  h1Stories.addEventListener("click", async () => {
    if (storiesVisible) {
      containerStories.innerHTML = "";
      storiesVisible = false;
      itemsLoaded = 0;
      lastLoadTime = 0;
    } else {
      await loadMoreStories();
      storiesVisible = true;
    }
  });

  buttonSeeMore.addEventListener("click", async () => {
    await loadMoreStories();
  });
}

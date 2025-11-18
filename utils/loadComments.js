// Load comments function
export async function loadComments(itemId, container, globalUrl) {
  try {
    const response = await fetch(`${globalUrl}${itemId}.json`);
    const item = await response.json();

    if (!item.kids || item.kids.length === 0) {
      container.innerHTML = "<p>No comments yet</p>";
      return;
    }
    // on applique a chaque kidId(commentaire) un fetch pour les recuperer
    const commentPromises = item.kids.slice(0, 10).map(async (kidId) => {
      try {
        const res = await fetch(`${globalUrl}${kidId}.json`);
        return await res.json();
      } catch (error) {
        console.error(`Error fetching comment ${kidId}:`, error);
        return null;
      }
    });
    // on attend tout les retours de commentPromise et on retire les "null"
    const comments = (await Promise.all(commentPromises)).filter(
      (comment) => comment !== null
    );
    comments.sort((a, b) => b.time - a.time);

    comments.forEach((comment) => {
      if (comment && !comment.deleted && !comment.dead) {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        const commentDate = new Date(comment.time * 1000).toLocaleString();

        commentDiv.innerHTML = `
          <div class="comment-meta">
            <strong>${comment.by}</strong> - ${commentDate}
          </div>
          <div class="comment-text">${comment.text || "[deleted]"}</div>
          ${
            comment.kids
              ? `<button class="load-replies" data-id="${comment.id}">Load ${comment.kids.length} replies</button>`
              : ""
          }
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

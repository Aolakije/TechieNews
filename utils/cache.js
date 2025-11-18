// Simple cache system to avoid duplicate posts
class PostCache {
  constructor() {
    this.cache = new Map();
  }

  // Add a post to cache
  add(post) {
    if (post && post.id) {
      this.cache.set(post.id, post);
    }
  }

  // Check if post exists in cache
  has(postId) {
    return this.cache.has(postId);
  }

  // Get post from cache
  get(postId) {
    return this.cache.get(postId);
  }

  // Clear cache
  clear() {
    this.cache.clear();
  }

  // Get all cached IDs
  getCachedIds() {
    return Array.from(this.cache.keys());
  }
}

export const postCache = new PostCache();
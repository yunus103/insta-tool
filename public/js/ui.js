// public/js/ui.js

/**
 * Render search results (locations)
 * @param {Array} locations - Array of location objects from API
 * @param {Function} onLocationClick - callback(locationId) when user clicks a location
 */
export function renderLocationResults(locations, onLocationClick) {
  const container = document.getElementById('location-results');
  container.innerHTML = '';

  if (!locations || locations.length === 0) {
    container.textContent = 'No locations found.';
    return;
  }

  locations.forEach(loc => {
    const div = document.createElement('div');
    div.className = 'location-item';
    div.innerHTML = `
      <strong>${loc.name}</strong><br>
      <small>${loc.address || loc.city || 'No address available'}</small>
    `;
    div.addEventListener('click', () => onLocationClick(loc.id));
    container.appendChild(div);
  });
}

/**
 * Render posts for a given location
 * @param {Array} posts - Array of post objects from API
 */
export function renderPosts(posts) {
  const container = document.getElementById('posts-container');
  container.innerHTML = '';

  if (!posts || posts.length === 0) {
    container.textContent = 'No posts found for this location.';
    return;
  }

  posts.forEach(post => {
    const captionText = post.caption?.text || 'No caption';

    // Pick username/fullName from owner first, then user, fallback to 'Unknown'
    const username = post.owner?.username || post.user?.username || 'Unknown';
    const fullName = post.owner?.full_name || post.user?.full_name || '';
    const isVerified = (post.owner?.is_verified ?? post.user?.is_verified) ? ' ✔️' : '';

    const createdAtUnix = post.caption?.created_at || post.taken_at;
    const createdAt = createdAtUnix
      ? new Date(createdAtUnix * 1000).toLocaleString()
      : 'Unknown date';

    const likeCount = post.like_count ?? 0;
    const commentCount = post.comment_count ?? 0;
    const taggedUsers = post.caption?.mentions?.join(', ') || 'None';

    // Post URL
    const postUrl = post.code ? `https://www.instagram.com/p/${post.code}/` : "#";

    const div = document.createElement('div');
    div.className = 'post-item';
    div.innerHTML = `
      <p><strong>@${username}${isVerified}</strong> (${fullName}) — ${createdAt}</p>
      <p>${captionText}</p>
      <p>❤️ ${likeCount} | 💬 ${commentCount}</p>
      <p><em>Tagged: ${taggedUsers}</em></p>
      <a href="${postUrl}" target="_blank" rel="noopener noreferrer">Link</a>
    `;
    container.appendChild(div);
  });
}




/**
 * Render metrics (totals/averages)
 * @param {Object} metrics - { totalLikes, avgLikes, totalComments, avgComments }
 */
export function renderMetrics(metrics) {
  const container = document.getElementById('metrics-container');
  container.innerHTML = `
    <p>Total Likes: ${metrics.totalLikes}</p>
    <p>Average Likes: ${metrics.avgLikes.toFixed(2)}</p>
    <p>Total Comments: ${metrics.totalComments}</p>
    <p>Average Comments: ${metrics.avgComments.toFixed(2)}</p>
  `;
}

/**
 * Show a toast message (temporary popup)
 * @param {string} message
 * @param {string} type - 'error' | 'success' | 'info'
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  container.textContent = message;
  container.className = `toast ${type} show`;

  // Auto-hide after 3s
  setTimeout(() => {
    container.classList.remove('show');
  }, 3000);
}

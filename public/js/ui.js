// public/js/ui.js

/**
 * Renders the list of found locations.
 * @param {Array} locations - Array of location objects.
 * @param {Function} onLocationClick - Callback for when a location is clicked.
 */
export function renderLocationResults(locations, onLocationClick) {
  const container = document.getElementById('location-results');
  container.innerHTML = ''; // Clear previous results

  if (!locations || locations.length === 0) {
    // A toast is better than text in the container for "not found"
    // The app.js logic already handles showing this toast
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
 * Renders posts into the container.
 * @param {Array} posts - Array of post objects from the API.
 * @param {boolean} append - If true, appends posts; otherwise, overwrites.
 */
export function renderPosts(posts, append = false) {
  const container = document.getElementById('posts-container');
  if (!append) {
    container.innerHTML = '';
  }

  posts.forEach(post => {
    const captionText = post.caption?.text || 'No caption available.';
    
    // Fallback logic for user data
    const user = post.owner || post.user || {};
    const username = user.username || 'Unknown';
    const fullName = user.full_name || '';
    const isVerified = user.is_verified ? '✔️' : '';

    const createdAtUnix = post.caption?.created_at || post.taken_at;
    const createdAt = createdAtUnix
      ? new Date(createdAtUnix * 1000).toLocaleString()
      : 'Unknown date';

    const likeCount = post.like_count ?? 0;
    const commentCount = post.comment_count ?? 0;
    const taggedUsers = post.caption?.mentions?.length > 0
      ? post.caption.mentions.join(', ')
      : 'None';
    
    const postUrl = post.code
      ? `https://www.instagram.com/p/${post.code}/`
      : "#";

    const div = document.createElement('div');
    div.className = 'post-item';
    div.innerHTML = `
      <p>
        <strong>@${username}</strong>${isVerified}
        ${fullName ? `(${fullName})` : ''} — <small>${createdAt}</small>
      </p>
      <p>${captionText}</p>
      <p>❤️ ${likeCount} | 💬 ${commentCount}</p>
      <p><em>Tagged: ${taggedUsers}</em></p>
      <a href="${postUrl}" target="_blank" rel="noopener noreferrer">View on Instagram</a>
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
/**
 * Creates and displays a toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - 'error' or 'success'.
 */
export function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Trigger the animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 100); // Small delay to allow element to be added to DOM

  // Hide and remove the toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    // Remove the element after the fade-out animation completes
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}


/** Shows the loading spinner overlay. */
export function showLoader() {
  document.getElementById('loader').classList.add('show');
}

/** Hides the loading spinner overlay. */
export function hideLoader() {
  document.getElementById('loader').classList.remove('show');
}
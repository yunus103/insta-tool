// public/js/app.js
import { searchLocations, getPostsByLocation } from './api.js';
import {
  renderLocationResults,
  renderPosts,
  renderMetrics,
  showToast,
} from './ui.js';

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationResults = document.getElementById('location-results');
const postsContainer = document.getElementById('posts-container');
//const metricsContainer = document.getElementById('metrics-container');

// --- Search handler ---
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showToast('Please enter a search term.', 'error');
    return;
  }

  try {
  const result = await searchLocations(query);

  // Extract items from the response
  const locations = result?.data?.items || [];

  if (locations.length === 0) {
    renderLocationResults([], () => {});
    showToast('No locations found.', 'error');
    return;
  }

  renderLocationResults(locations, handleLocationClick);

  //Hide posts after searching again
  postsContainer.innerHTML = '';

} catch (err) {
  console.error('Error searching locations:', err);
  showToast('Failed to fetch locations. Try again.', 'error');
}

}

// --- Location click handler ---
async function handleLocationClick(locationId) {
  try {
    const result = await getPostsByLocation(locationId);

    // Extract posts array
    const posts = result?.data?.items || [];

    if (posts.length === 0) {
      renderPosts([]);
      renderMetrics({});
      showToast('No posts found for this location.', 'error');
      return;
    }

    renderPosts(posts);

    // hide locations after showing posts
    locationResults.innerHTML = '';

    // Calculate simple metrics
    const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);

    //Metrics disabled for now
    //const avgLikes = (totalLikes / posts.length).toFixed(1);
    //const avgComments = (totalComments / posts.length).toFixed(1);

    //renderMetrics({ totalLikes, avgLikes, totalComments, avgComments });
  } catch (err) {
    console.error('Error fetching posts:', err);
    showToast('Failed to fetch posts. Try again.', 'error');
  }
}


// --- Wire up events ---
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});

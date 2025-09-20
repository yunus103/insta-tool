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
const loadMoreBtn = document.getElementById('load-more-btn');
//const metricsContainer = document.getElementById('metrics-container');

let currentLocationId = null;
let nextPageToken = null;

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
async function handleLocationClick(locationId, loadMore = false) {
  if (!loadMore) {
    currentLocationId = locationId;
    nextPageToken = null;
    postsContainer.innerHTML = ''; // clear previous posts
    locationResults.innerHTML = ''; // hide locations
    loadMoreBtn.style.display = 'none'; // hide initially
  }

  try {
    const result = await getPostsByLocation(currentLocationId, nextPageToken);
    const posts = result.items;
    nextPageToken = result.paginationToken; // <-- now correctly updated

    if (posts.length === 0) {
      renderPosts([], loadMore);
      showToast('No posts found for this location.', 'error');
      return;
    }

    renderPosts(posts, loadMore);

    // Show/hide load more button
    console.log(nextPageToken);
    loadMoreBtn.style.display = nextPageToken ? 'block' : 'none';
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
loadMoreBtn.addEventListener('click', () => handleLocationClick(currentLocationId, true));

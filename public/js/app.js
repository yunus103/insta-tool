// public/js/app.js
import { searchLocations, getPostsByLocation, findPlace, getReviews } from './api.js';
import {
  renderLocationResults,
  renderPosts,
  renderMetrics,
  showToast,
  showLoader,
  hideLoader,
  renderReviews 
} from './ui.js';


const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationResults = document.getElementById('location-results');
const postsContainer = document.getElementById('posts-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

const tabContainer = document.getElementById('tab-container');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
//const metricsContainer = document.getElementById('metrics-container');

const analyzeBtn = document.getElementById('analyze-reviews-btn'); 
const reviewsContainer = document.getElementById('reviews-container');

let currentLocationId = null;
let nextPageToken = null;
let allPostsForLocation = [];
let currentInstaLocation = null;

let fullReviewsData = null; // Will store the complete API response
let activeReviewFilter = 'all'; // 'all', '5', '4', '3', '2', '1'


// --- Search handler ---
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showToast('Please enter a search term.', 'error');
    return;
  }

  showLoader(); // <-- SHOW loader before API call
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
  loadMoreBtn.style.display = 'none';
  tabContainer.style.display = 'none';
  reviewsContainer.innerHTML = '';
  document.getElementById('business-summary').innerHTML = '';
} catch (err) {
  console.error('Error searching locations:', err);
  showToast('Failed to fetch locations. Try again.', 'error');
} finally {
    hideLoader();
}

}

// --- Location click handler ---
async function handleLocationClick(locationObject, loadMore = false) {
  if (!loadMore) {
    currentLocationId = locationObject.id;
    nextPageToken = null;
    postsContainer.innerHTML = ''; // clear previous posts
    locationResults.innerHTML = ''; // hide locations
    loadMoreBtn.style.display = 'none'; // hide initially
    tabContainer.style.display = 'block';
    allPostsForLocation = [];   // Reset the list of all posts when a new location is chosen

    currentInstaLocation = locationObject;
    
  }

  showLoader(); // <-- SHOW loader before API call
  try {
    const result = await getPostsByLocation(currentLocationId, nextPageToken);
    const posts = result.items;
    nextPageToken = result.paginationToken; // <-- now correctly updated

    // Add newly fetched posts to our master list
    allPostsForLocation.push(...posts);

    if (allPostsForLocation.length === 0) {
      showToast('No posts found for this location.', 'error');
    }

    if (posts.length === 0) {
      renderPosts([], loadMore);
      showToast('No posts found for this location.', 'error');
      return;
    }

    renderPosts(posts, loadMore);

    // Show/hide load more button
    loadMoreBtn.style.display = nextPageToken ? 'block' : 'none';
  } catch (err) {
    console.error('Error fetching posts:', err);
    showToast('Failed to fetch posts. Try again.', 'error');
  }
  finally {
    hideLoader();
  }
}

// This function will be triggered on scroll
const handleScroll = () => {
  // Show button if page is scrolled more than 200px
  if (window.scrollY > 200) {
    scrollToTopBtn.classList.add('show');
  } else {
    scrollToTopBtn.classList.remove('show');
  }
};

// This function will be triggered on click
const handleTopClick = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // For a smooth scrolling animation
  });
};

// Function to apply the selected theme
const applyTheme = (theme) => {
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    themeToggleBtn.textContent = '☀️'; // Sun icon for dark mode
  } else {
    body.classList.remove('dark-theme');
    themeToggleBtn.textContent = '🌙'; // Moon icon for light mode
  }
};

// Function to handle the theme toggle click
const handleThemeToggle = () => {
  const currentThemeIsDark = body.classList.contains('dark-theme');
  const newTheme = currentThemeIsDark ? 'light' : 'dark';
  localStorage.setItem('theme', newTheme); // Save preference
  applyTheme(newTheme);
};

const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light
applyTheme(savedTheme);


const handleTabClick = (e) => {
  const targetTab = e.target.dataset.tab;

  // Remove active class from all buttons and panels
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabPanels.forEach(panel => panel.classList.remove('active'));

  // Add active class to the clicked button
  e.target.classList.add('active');

  // Add active class to the corresponding panel
  document.getElementById(targetTab).classList.add('active');
};

async function analyzeLocationReviews() {
  const reviewsContainer = document.getElementById('reviews-container');
  const summaryContainer = document.getElementById('business-summary');

  if (!currentInstaLocation) {
    showToast('Please select a location first.', 'error');
    return;
  }
  // Clear previous results
  summaryContainer.innerHTML = '';
  reviewsContainer.innerHTML = '<div class="loader-inline"></div>'; // Show a loading indicator

  showLoader();
  try {
    // Step 1: Find the Google Place ID
    const businessData  = await findPlace(
      currentInstaLocation.name,
      currentInstaLocation.latitude,
      currentInstaLocation.longitude
    );

    // --- NEW: Immediately display the summary info ---
    if (businessData) {
      summaryContainer.innerHTML = `
        <div class="summary-card">
          <div class="summary-item">
            <span class="summary-value">${businessData.rating} ★</span>
            <span class="summary-label">Overall Rating</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">${businessData.reviewCount}</span>
            <span class="summary-label">Total Reviews</span>
          </div>
        </div>
      `;
    }

    // Step 2: Use the Place ID to get reviews
        const reviewsData = await getReviews(businessData.businessId, businessData.reviewCount);
    
    // Store the full, unmodified data
    fullReviewsData = reviewsData;
    // Reset the filter to 'all' for the new data
    activeReviewFilter = 'all';

    // Step 3: Render the reviews
    renderReviews(fullReviewsData, activeReviewFilter);

  } catch (error) {
    summaryContainer.innerHTML = '';
    reviewsContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}


// --- Wire up events ---
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});
loadMoreBtn.addEventListener('click', () => handleLocationClick(currentLocationId, true));
window.addEventListener('scroll', handleScroll);
scrollToTopBtn.addEventListener('click', handleTopClick);
themeToggleBtn.addEventListener('click', handleThemeToggle);
tabButtons.forEach(button => button.addEventListener('click', handleTabClick));
analyzeBtn.addEventListener('click', analyzeLocationReviews);

reviewsContainer.addEventListener('click', (e) => {
  // Check if a filter button was clicked
  if (e.target.classList.contains('filter-btn')) {
    const newFilter = e.target.dataset.rating;
    
    // If the filter is already active, do nothing
    if (newFilter === activeReviewFilter) return;

    // Update the active filter state
    activeReviewFilter = newFilter;

    // Re-render the reviews with the new filter
    renderReviews(fullReviewsData, activeReviewFilter);
  }
});
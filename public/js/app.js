// public/js/app.js
import { searchLocations, getPostsByLocation } from './api.js';
import {
  renderLocationResults,
  renderPosts,
  renderMetrics,
  showToast,
  showLoader,
  hideLoader
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

let currentLocationId = null;
let nextPageToken = null;
let allPostsForLocation = [];



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
} catch (err) {
  console.error('Error searching locations:', err);
  showToast('Failed to fetch locations. Try again.', 'error');
} finally {
    hideLoader();
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
    tabContainer.style.display = 'block';
    allPostsForLocation = [];   // Reset the list of all posts when a new location is chosen

    
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

// =================================================================================
// --- 1. IMPORTS ---
// =================================================================================

import { searchLocations, getPostsByLocation, findPlace, getReviews,
         getUserPosts, getTaggedPosts, getPostLikers
 } from './api.js';
import {
  renderLocationResults,
  renderPosts,
  renderMetrics,
  showToast,
  showLoader,
  hideLoader,
  renderReviews,
  renderOwnPostLikers,
  renderTaggedPostLikers,
  renderAnalysis
} from './ui.js';

// =================================================================================
// --- 2. UI ELEMENT SELECTORS ---
// =================================================================================

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// Sekme Elementleri
const tabContainer = document.getElementById('tab-container');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const postsTabBtn = document.querySelector('[data-tab="posts"]');
const analyticsTabBtn = document.querySelector('[data-tab="analytics"]');
const customersTabBtn = document.querySelector('[data-tab="potential-customers"]');
const ownLikersTabBtn = document.querySelector('[data-tab="own-post-likers"]');
const taggedLikersTabBtn = document.querySelector('[data-tab="tagged-post-likers"]');

// Butonlar
const loadMoreBtn = document.getElementById('load-more-btn');
const analyzeBtn = document.getElementById('analyze-reviews-btn'); 
const analyzeDataBtn = document.getElementById('analyze-data-btn');
const loadMoreOwnLikersBtn = document.getElementById('load-more-own-likers-btn');
const loadMoreTaggedLikersBtn = document.getElementById('load-more-tagged-likers-btn');
const exportAnalysisBtn = document.getElementById('export-analysis-btn');

const locationResults = document.getElementById('location-results');
const postsContainer = document.getElementById('posts-container');

const analysisLimitInput = document.getElementById('analysis-limit-input');
const analysisControls = document.getElementById('analysis-controls');

const reviewsContainer = document.getElementById('reviews-container');
const summaryContainer = document.getElementById('business-summary');


// =================================================================================
// --- 3. STATE MANAGEMENT ---
// =================================================================================

// For Location Search
let currentLocationId = null;
let nextPageToken = null;
let allPostsForLocation = [];
let currentInstaLocation = null;


//Variables for maps reviews
let fullReviewsData = null; // Will store the complete API response
let activeReviewFilter = 'all'; // 'all', '5', '4', '3', '2', '1'


//Variables for likers
let userPostLikers = [];
let taggedPostLikers = [];
let isAudienceDataFetched = false;
let nextUserPostsCursor = null;
let nextTaggedPostsCursor = null;
let currentUserSearch = '';
const LIKERS_PER_PAGE = 100; // Her seferinde kaç beğenen gösterilecek
let visibleOwnLikersCount = LIKERS_PER_PAGE;
let visibleTaggedLikersCount = LIKERS_PER_PAGE;

let analysisLimit = 50; // Başlangıç değeri

// =================================================================================
// --- 4. MAIN APPLICATION FLOW ---
// =================================================================================

// --- Search handler ---
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showToast('Please enter a search term.', 'error');
    return;
  }

  // Yeni bir arama başladığında tüm arayüzü temizle
    clearAllResults();


  if (query.startsWith('@')) {
    const username = query.substring(1);
    initializeUserSearch(username);
    await fetchAudienceData(username);
  } else {
    initializeLocationSearch(query);
  }
}

function clearAllResults() {
    document.getElementById('location-results').innerHTML = '';
    document.getElementById('posts-container').innerHTML = '';
    document.getElementById('business-summary').innerHTML = '';
    document.getElementById('reviews-container').innerHTML = '';
    document.getElementById('own-posts-likers-list').innerHTML = '';
    document.getElementById('tagged-posts-likers-list').innerHTML = '';
    document.getElementById('top-likers-list').innerHTML = '';
    document.getElementById('warm-audience-list').innerHTML = '';
    tabContainer.style.display = 'none';
}

// =================================================================================
// --- 5. WORKFLOW: KULLANICI ANALİZİ ---
// =================================================================================
// This function SETS UP the UI for a user analysis.
function initializeUserSearch(username) {
  currentUserSearch = username;
  isAudienceDataFetched = false;
  
  // Reset data arrays
  userPostLikers = [];
  taggedPostLikers = [];

  // Doğru sekmeleri göster, yanlışları gizle
    tabContainer.style.display = 'block';
    postsTabBtn.style.display = 'none';
    analyticsTabBtn.style.display = 'none';
    ownLikersTabBtn.style.display = 'inline-flex';
    taggedLikersTabBtn.style.display = 'inline-flex';
    customersTabBtn.style.display = 'inline-flex';

  ownLikersTabBtn.click();

  visibleOwnLikersCount = LIKERS_PER_PAGE;
  visibleTaggedLikersCount = LIKERS_PER_PAGE;


  
  // Durum metinlerini güncelle
  document.getElementById('own-likers-status').textContent = `@${username} için veriler çekiliyor...`;
  document.getElementById('tagged-likers-status').textContent = `Veriler çekildikten sonra burada görünecek.`;
  
  // Hide export buttons until data is fetched
  document.getElementById('export-analysis-btn').style.display = 'none';
}

/**
 * Kullanıcının kendi post'larını ve etiketlendiği post'ları bulur, ardından
 * bu post'ların her biri için beğenenleri paralel olarak çeker.
 * @param {string} username - Analiz edilecek kullanıcı adı.
 */
async function fetchAudienceData(username) {
    showLoader();
    try {
        // Aşama 1: Post'ları ve etiketlenen post'ları paralel olarak çek
        const [userPostsResult, taggedPostsResult] = await Promise.all([
            getUserPosts(username),
            getTaggedPosts(username)
        ]);

        const userPosts = userPostsResult.posts;
        const taggedPosts = taggedPostsResult.posts;
        
        // Aşama 2: Tüm post'ların ID'lerini topla ve beğenenleri paralel olarak çek
        const allPosts = [...userPosts, ...taggedPosts];
        const likerPromises = allPosts.map(post => getPostLikers(post.code || post.pk));
        const likerResults = await Promise.all(likerPromises);
        
        // Aşama 3: Veriyi işle ve sakla
        userPostLikers = likerResults.slice(0, userPosts.length).flat();
        taggedPostLikers = likerResults.slice(userPosts.length).flat();
        isAudienceDataFetched = true;

        // Aşama 4: Sonuçları ekrana bas
        renderOwnPostLikers(userPostLikers, visibleOwnLikersCount);
        renderTaggedPostLikers(taggedPostLikers, visibleTaggedLikersCount);

        // Aşama 5: Durum metinlerini güncelle
        document.getElementById('own-likers-status').textContent = `${userPostLikers.length} beğeni bulundu.`;
        document.getElementById('tagged-likers-status').textContent = `${taggedPostLikers.length} beğeni bulundu.`;

    } catch (error) {
        showToast(error.message, 'error');
        document.getElementById('own-likers-status').textContent = `Bir hata oluştu: ${error.message}`;
    } finally {
        hideLoader();
    }
}

/**
 * Saklanan beğeni verilerini kullanarak "En Sadık Takipçiler" ve "İlgili Kitle"
 * analizini yapar ve sonuçları ekrana basar.
 */
function analyzeAudienceData() {
    if (!isAudienceDataFetched) {
        showToast('Lütfen önce kitle verilerini çekin.', 'error');
        return;
    }
    const topLikers = rankTopLikers(userPostLikers);
    const warmAudience = getUniqueAudience(taggedPostLikers);

    renderAnalysis(topLikers, warmAudience, analysisLimit);
    analysisControls.style.display = 'block';

    hideLoader();
}

// =================================================================================
// --- 6. WORKFLOW: LOKASYON ARAMA ---
// =================================================================================

/**
 * Bir lokasyon araması başlatıldığında arayüzü hazırlar ve API'den lokasyonları çeker.
 * @param {string} query - Aranan lokasyon adı.
 */
async function initializeLocationSearch(query) {
  // Show the location-related tabs and hide the user tabs
  postsTabBtn.style.display = 'inline-flex';
  analyticsTabBtn.style.display = 'inline-flex';
  ownLikersTabBtn.style.display = 'none';
  taggedLikersTabBtn.style.display = 'none';
  customersTabBtn.style.display = 'none';
  postsTabBtn.click(); // Set the first tab active

  showLoader();
  try {
    const result = await searchLocations(query);
    const locations = result?.data?.items || [];

    if (locations.length === 0) {
      showToast('No locations found.', 'error');
    } else {
      // Pass the handleLocationClick function as the callback
      renderLocationResults(locations, handleLocationClick);
    }
  } catch (err) {
    console.error('Error searching locations:', err);
    showToast('Failed to fetch locations. Try again.', 'error');
  } finally {
    hideLoader();
  }
}

/**
 * Kullanıcı bir lokasyona tıkladığında tetiklenir. O lokasyona ait post'ları çeker.
 * @param {object} locationObject - Tıklanan lokasyonun tüm verilerini içeren nesne.
 * @param {boolean} loadMore - Daha fazla post yüklenip yüklenmediğini belirtir.
 */
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

/**
 * "Analiz" sekmesinde, seçilen lokasyonun review'lerini getirmek için
 * API çağrı zincirini başlatır.
 */
async function analyzeLocationReviews() {
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

// =================================================================================
// --- 7. DATA PROCESSING HELPERS ---
// =================================================================================

/**
 * Beğenenler dizisini alır ve her kullanıcının kaç kez beğeni yaptığını sayarak
 * en çok beğeni yapandan en aza doğru sıralar.
 * @param {Array} likersArray - Kullanıcı nesnelerinden oluşan dizi.
 * @returns {Array} - Sıralanmış ve 'likeCount' eklenmiş kullanıcı nesneleri dizisi.
 */
function rankTopLikers(likersArray) {
  if (!likersArray || likersArray.length === 0) return [];

  const likerCounts = new Map();
  // Count how many times each user appears
  likersArray.forEach(user => {
    if (user && user.username) {
      const count = (likerCounts.get(user.username)?.count || 0) + 1;
      likerCounts.set(user.username, { user, count });
    }
  });

  // Convert map to an array, sort by count, and return the user object
  return Array.from(likerCounts.values())
    .sort((a, b) => b.count - a.count)
    .map(item => ({ ...item.user, likeCount: item.count })); // Add the like count to the user object
}

/**
 * Beğenenler dizisindeki tekrar eden kullanıcıları kaldırarak benzersiz bir liste oluşturur.
 * @param {Array} likersArray - Kullanıcı nesnelerinden oluşan dizi.
 * @returns {Array} - Benzersiz kullanıcı nesnelerinden oluşan dizi.
 */
function getUniqueAudience(likersArray) {
  if (!likersArray || likersArray.length === 0) return [];
  
  const uniqueUsers = new Map();
  likersArray.forEach(user => {
    if (user && user.username && !uniqueUsers.has(user.username)) {
      uniqueUsers.set(user.username, user);
    }
  });

  return Array.from(uniqueUsers.values());
}


// =================================================================================
// --- 8. UI HELPERS ---
// =================================================================================

/**
 * Sayfa scroll edildiğinde "Yukarı Çık" butonunu gösterir/gizler.
 */
const handleScroll = () => {
  // Show button if page is scrolled more than 200px
  if (window.scrollY > 200) {
    scrollToTopBtn.classList.add('show');
  } else {
    scrollToTopBtn.classList.remove('show');
  }
};

/**
 * "Yukarı Çık" butonuna tıklandığında sayfayı en üste kaydırır.
 */
const handleTopClick = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // For a smooth scrolling animation
  });
};

/**
 * Sayfaya açık veya koyu temayı uygular.
 */
const applyTheme = (theme) => {
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    themeToggleBtn.textContent = '☀️'; // Sun icon for dark mode
  } else {
    body.classList.remove('dark-theme');
    themeToggleBtn.textContent = '🌙'; // Moon icon for light mode
  }
};

/**
 * Tema değiştirme butonuna tıklandığında temayı değiştirir ve tercihi kaydeder.
 */
const handleThemeToggle = () => {
  const currentThemeIsDark = body.classList.contains('dark-theme');
  const newTheme = currentThemeIsDark ? 'light' : 'dark';
  localStorage.setItem('theme', newTheme); // Save preference
  applyTheme(newTheme);
};

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


// =================================================================================
// --- 9. INITIALIZATION & EVENT LISTENERS ---
// =================================================================================

// Sayfa yüklendiğinde kaydedilmiş temayı uygula
const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light
applyTheme(savedTheme);

// Ana Arama
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// Lokasyon Arama Butonları
loadMoreBtn.addEventListener('click', () => handleLocationClick(currentInstaLocation, true));
analyzeBtn.addEventListener('click', analyzeLocationReviews);

// Review Filtreleme (Event Delegation)
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

// Kullanıcı Analiz Butonları
analyzeDataBtn.addEventListener('click', analyzeAudienceData);
loadMoreOwnLikersBtn.addEventListener('click', () => {
    visibleOwnLikersCount += LIKERS_PER_PAGE;
    renderOwnPostLikers(userPostLikers, visibleOwnLikersCount);
});
loadMoreTaggedLikersBtn.addEventListener('click', () => {
    visibleTaggedLikersCount += LIKERS_PER_PAGE;
    renderTaggedPostLikers(taggedPostLikers, visibleTaggedLikersCount);
});

// Analiz Limiti Input'u
analysisLimitInput.addEventListener('change', () => {
  const newLimit = parseInt(analysisLimitInput.value, 10);
  if (newLimit > 0) {
    analysisLimit = newLimit;
    // Limiti değiştirdikten sonra listeyi yeniden render et
    // (analyzeAudienceData'yı tekrar çağırmak en kolay yol)
    analyzeAudienceData(); 
  }
});

// Genel UI Olayları
window.addEventListener('scroll', handleScroll);
scrollToTopBtn.addEventListener('click', handleTopClick);
themeToggleBtn.addEventListener('click', handleThemeToggle);
tabButtons.forEach(button => button.addEventListener('click', handleTabClick));

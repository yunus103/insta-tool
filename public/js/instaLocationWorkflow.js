/**
 * @file "Konum Gönderileri" sayfasının tüm mantığını yönetir.
 */

// Gerekli API ve UI fonksiyonlarını içe aktar
import { searchLocations, getPostsByLocation } from './api.js';
import { renderLocationResults, renderPosts, showToast, showLoader, hideLoader, updatePageTitle, renderSubheader } from './ui.js';

// --- UI Elementleri ---
const page = document.getElementById('insta-location-page');
const resultsContainer = page.querySelector('#location-results-container');
const postsGridContainer = page.querySelector('#posts-grid-container');
const loadMoreBtn = page.querySelector('#load-more-posts-btn');

// --- Durum (State) Yönetimi ---
let currentLocationId = null;
let nextPageToken = null;
let allPostsForLocation = [];
let currentInstaLocation = null;

/**
 * Kullanıcı bir lokasyona tıkladığında tetiklenir. O lokasyona ait post'ları çeker.
 * @param {object} locationObject - Tıklanan lokasyonun tüm verilerini içeren nesne.
 * @param {boolean} loadMore - Daha fazla post yüklenip yüklenmediğini belirtir.
 */
async function handleLocationClick(locationObject, loadMore = false) {
    if (!loadMore) {
        currentLocationId = locationObject.id;
        currentInstaLocation = locationObject;
        nextPageToken = null;
        allPostsForLocation = [];
        postsGridContainer.innerHTML = '';
        resultsContainer.innerHTML = ''; // Arama sonuçlarını temizle
        loadMoreBtn.style.display = 'none';
        updatePageTitle(`Gönderiler: ${locationObject.name}`);
    }

    showLoader();
    try {
        const result = await getPostsByLocation(currentLocationId, nextPageToken);
        const posts = result.items;
        nextPageToken = result.paginationToken;
        allPostsForLocation.push(...posts);

        if (posts.length === 0 && !loadMore) {
            showToast('Bu lokasyonda gönderi bulunamadı.', 'error');
        }
        renderPosts(postsGridContainer, posts, loadMore);
        loadMoreBtn.style.display = nextPageToken ? 'block' : 'none';
    } catch (err) {
        showToast('Gönderiler getirilirken hata oluştu.', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Sayfanın ana giriş noktası. Lokasyon aramasını başlatır.
 * @param {string} query - Arama kutusuna girilen metin.
 */
export async function initializeLocationSearch(query) {
    renderSubheader(page, `"${query}" için sonuçlar...`);
    showLoader();
    try {
        const result = await searchLocations(query);
        const locations = result?.data?.items || [];
        if (locations.length === 0) {
            showToast('Lokasyon bulunamadı.', 'error');
            resultsContainer.innerHTML = '<p>Sonuç bulunamadı.</p>';
        } else {
            // handleLocationClick fonksiyonunu bir callback olarak gönder
            renderLocationResults(resultsContainer, locations, handleLocationClick);
        }
    } catch (err) {
        showToast('Lokasyonlar getirilirken hata oluştu.', 'error');
    } finally {
        hideLoader();
    }
}

// "Daha Fazla Yükle" butonu için olay dinleyicisi
loadMoreBtn.addEventListener('click', () => {
    if (currentInstaLocation) {
        handleLocationClick(currentInstaLocation, true);
    }
});


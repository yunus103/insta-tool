/**
 * @file "Kullanıcı Analizi" sayfasının tüm mantığını yönetir.
 */

// Gerekli API, UI ve Yardımcı fonksiyonları içe aktar
import { getUserPosts, getTaggedPosts, getPostLikers } from './api.js';
import { renderOwnPostLikers, renderTaggedPostLikers, renderAnalysis, showToast, showLoader, hideLoader, updatePageTitle, renderSubheader } from './ui.js';
import { rankTopLikers, getUniqueAudience, exportToExcel } from './utils.js';

// --- UI Elementleri ---
const page = document.getElementById('user-analysis-page');
const tabButtons = page.querySelectorAll('.tab-btn');
const tabPanels = page.querySelectorAll('.tab-panel');
const analyzeDataBtn = page.querySelector('#analyze-data-btn');
const loadMoreOwnLikersBtn = page.querySelector('#load-more-own-likers-btn');
const loadMoreTaggedLikersBtn = page.querySelector('#load-more-tagged-likers-btn');
const exportAnalysisBtn = page.querySelector('#export-analysis-btn');
const analysisLimitInput = page.querySelector('#analysis-limit-input');
const analysisControls = page.querySelector('#analysis-controls');
const ownLikersStatus = page.querySelector('#own-likers-status');
const taggedLikersStatus = page.querySelector('#tagged-likers-status');

// --- Durum (State) Yönetimi ---
let userPostLikers = [];
let taggedPostLikers = [];
let isAudienceDataFetched = false;
let currentUserSearch = '';
const LIKERS_PER_PAGE = 100;
let visibleOwnLikersCount = LIKERS_PER_PAGE;
let visibleTaggedLikersCount = LIKERS_PER_PAGE;
let analysisLimit = 50;

/**
 * Sayfa içindeki sekmeler arasında geçişi yönetir.
 * @param {Event} e - Tıklama olayı.
 */
function handleTabSwitch(e) {
    const targetTabPanelId = e.target.getAttribute('data-tab');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    e.target.classList.add('active');
    page.querySelector(`#${targetTabPanelId}`).classList.add('active');
}

/**
 * Beğeni verilerini kullanarak analiz yapar ve sonuçları ekrana basar.
 */
function analyzeAudienceData() {
    if (!isAudienceDataFetched) {
        showToast('Lütfen önce kitle verilerini çekin.', 'error');
        return;
    }
    showLoader();
    const topLikers = rankTopLikers(userPostLikers);
    const warmAudience = getUniqueAudience(taggedPostLikers);
    renderAnalysis(topLikers, warmAudience, analysisLimit);
    analysisControls.style.display = 'flex';
    hideLoader();
}

/**
 * Kullanıcının kendi post'larını ve etiketlendiği post'ları bulur, ardından
 * bu post'ların her biri için beğenenleri paralel olarak çeker.
 * @param {string} username - Analiz edilecek kullanıcı adı.
 */
async function fetchAudienceData(username) {
    showLoader();
    try {
        const [userPostsResult, taggedPostsResult] = await Promise.all([
            getUserPosts(username),
            getTaggedPosts(username)
        ]);

        const userPosts = userPostsResult.posts;
        const taggedPosts = taggedPostsResult.posts;

        const allPosts = [...userPosts, ...taggedPosts];
        const likerPromises = allPosts.map(post => getPostLikers(post.code || post.pk));
        const likerResults = await Promise.all(likerPromises);

        userPostLikers = likerResults.slice(0, userPosts.length).flat();
        taggedPostLikers = likerResults.slice(userPosts.length).flat();
        isAudienceDataFetched = true;

        renderOwnPostLikers(userPostLikers, visibleOwnLikersCount);
        renderTaggedPostLikers(taggedPostLikers, visibleTaggedLikersCount);

        ownLikersStatus.textContent = `${userPostLikers.length} beğeni bulundu.`;
        taggedLikersStatus.textContent = `${taggedPostLikers.length} beğeni bulundu.`;
    } catch (error) {
        showToast(error.message, 'error');
        ownLikersStatus.textContent = `Bir hata oluştu: ${error.message}`;
    } finally {
        hideLoader();
    }
}

/**
 * Sayfanın ana giriş noktası. Arayüzü hazırlar ve veri çekme işlemini başlatır.
 * @param {string} query - Arama kutusuna girilen '@' ile başlayan metin.
 */
export function initializeUserSearch(query) {
    const username = query.substring(1);
    renderSubheader(page, `"${query}" için sonuçlar...`);
    
    currentUserSearch = username;
    isAudienceDataFetched = false;
    userPostLikers = [];
    taggedPostLikers = [];
    visibleOwnLikersCount = LIKERS_PER_PAGE;
    visibleTaggedLikersCount = LIKERS_PER_PAGE;

    // Arayüzü sıfırla
    page.querySelector('#own-posts-likers-list').innerHTML = '';
    page.querySelector('#tagged-posts-likers-list').innerHTML = '';
    page.querySelector('#top-likers-list').innerHTML = '';
    page.querySelector('#warm-audience-list').innerHTML = '';
    analysisControls.style.display = 'none';
    
    // İlk sekmeyi aktif yap
    tabButtons.forEach((btn, index) => {
        btn.classList.toggle('active', index === 0);
    });
    tabPanels.forEach((panel, index) => {
        panel.classList.toggle('active', index === 0);
    });

    ownLikersStatus.textContent = `@${username} için veriler çekiliyor...`;
    taggedLikersStatus.textContent = `Veriler çekildikten sonra burada görünecek.`;
    
    // Veri çekme işlemini otomatik başlat
    fetchAudienceData(username);
}

// --- Olay Dinleyicileri (Event Listeners) ---
tabButtons.forEach(button => button.addEventListener('click', handleTabSwitch));
analyzeDataBtn.addEventListener('click', analyzeAudienceData);

loadMoreOwnLikersBtn.addEventListener('click', () => {
    visibleOwnLikersCount += LIKERS_PER_PAGE;
    renderOwnPostLikers(userPostLikers, visibleOwnLikersCount);
});

loadMoreTaggedLikersBtn.addEventListener('click', () => {
    visibleTaggedLikersCount += LIKERS_PER_PAGE;
    renderTaggedPostLikers(taggedPostLikers, visibleTaggedLikersCount);
});

analysisLimitInput.addEventListener('change', () => {
    const newLimit = parseInt(analysisLimitInput.value, 10);
    if (newLimit > 0) {
        analysisLimit = newLimit;
        analyzeAudienceData(); 
    }
});

exportAnalysisBtn.addEventListener('click', () => {
    const topLikers = rankTopLikers(userPostLikers);
    const warmAudience = getUniqueAudience(taggedPostLikers);
    const limitedTopLikers = topLikers.slice(0, analysisLimit);
    const limitedWarmAudience = warmAudience.slice(0, analysisLimit);
    const analysisData = [
        ...limitedTopLikers.map(u => ({ username: u.username, full_name: u.full_name, like_count: u.likeCount, category: 'Top Liker' })),
        ...limitedWarmAudience.map(u => ({ username: u.username, full_name: u.full_name, category: 'Warm Audience' }))
    ];
    exportToExcel(analysisData, `${currentUserSearch}_potential_customers`);
});


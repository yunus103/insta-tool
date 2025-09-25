/**
 * @file "Harita Yorumları" sayfasının tüm mantığını yönetir.
 * HTML yapısıyla tam uyumlu, düzeltilmiş versiyon.
 */

import { findPlace, getReviews } from './api.js';
import { renderBusinessResults, renderReviews, showToast, showLoader, hideLoader, renderSubheader } from './ui.js';

let fullReviewsData = null;
let activeReviewFilter = 'all';

/**
 * Kullanıcı bir işletmeye tıkladığında tetiklenir. Yorumları ve özeti getirir.
 * @param {object} businessObject - Tıklanan işletmenin verileri.
 */
async function handleBusinessClick(businessObject) {
    const page = document.getElementById('maps-reviews-page');
    const resultsContainer = page.querySelector('#business-search-results');
    // DÜZELTME: HTML'deki doğru ana konteyneri seçiyoruz.
    const displayArea = page.querySelector('#reviews-display-area');

    if (resultsContainer) resultsContainer.innerHTML = '';
    renderSubheader(page, `"${businessObject.name}" için yorumlar gösteriliyor:`);
    
    if (displayArea) displayArea.innerHTML = '';
    showLoader();
    try {
        let summaryHtml = '';
        // Özet kartını bir string olarak oluşturuyoruz.
        if (businessObject.rating && businessObject.review_count) {
            summaryHtml = `
                <div id="business-summary">
                    <div class="summary-card">
                        <div class="summary-item">
                            <span class="summary-value">${businessObject.rating} ★</span>
                            <span class="summary-label">Genel Puan</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${businessObject.review_count}</span>
                            <span class="summary-label">Toplam Yorum</span>
                        </div>
                    </div>
                </div>`;
        }
        
        const reviewsData = await getReviews(businessObject.business_id, businessObject.review_count);
        
        const cleanData = {
            reviews: reviewsData.reviews || (reviewsData.data && reviewsData.data.reviews) || [],
            name: reviewsData.name || (reviewsData.data && reviewsData.data.name) || businessObject.name,
            rating: reviewsData.rating || (reviewsData.data && reviewsData.data.rating) || businessObject.rating,
        };
        
        fullReviewsData = cleanData;
        activeReviewFilter = 'all';
        
        if (displayArea) {
            // DÜZELTME: Önce özet HTML'ini ana konteynere ekliyoruz.
            displayArea.innerHTML = summaryHtml;
            
            // Sonra yorumların içine yazılacağı yeni bir div oluşturup onu da ekliyoruz.
            const reviewsContainer = document.createElement('div');
            reviewsContainer.id = 'reviews-container';
            displayArea.appendChild(reviewsContainer);
            
            // Şimdi renderReviews fonksiyonunu, GARANTİLİ olarak var olan bu yeni konteyner ile çağırıyoruz.
            renderReviews(reviewsContainer, fullReviewsData, activeReviewFilter);
        }

    } catch (error) {
        if (displayArea) displayArea.innerHTML = `<p class="error-message">${error.message}</p>`;
        showToast(error.message, 'error');
    } finally {
        hideLoader();
    }
}

/**
 * "Harita Yorumları" sayfasında arama yapıldığında tetiklenir.
 * @param {string} query - Aranan işletme adı.
 */
export async function initializeMapsSearch(query) {
    const page = document.getElementById('maps-reviews-page');
    const resultsContainer = page.querySelector('#business-search-results');
    // DÜZELTME: Doğru ana konteyneri seçip temizliyoruz.
    const displayArea = page.querySelector('#reviews-display-area');

    if (displayArea) displayArea.innerHTML = '';
    
    renderSubheader(page, `"${query}" için işletmeler aranıyor...`);
    showLoader();
    try {
        const results = await findPlace(query);

        if (!results.data || results.data.length === 0) {
            showToast('İşletme bulunamadı.', 'error');
            if (resultsContainer) resultsContainer.innerHTML = '<p class="data-status-text">Sonuç bulunamadı.</p>';
            renderSubheader(page, `"${query}" için sonuç bulunamadı.`);
        } else {
            if (resultsContainer) {
                renderBusinessResults(resultsContainer, results.data, handleBusinessClick);
            }
        }
    } catch (err) {
        showToast('İşletmeler getirilirken hata oluştu.', 'error');
    } finally {
        hideLoader();
    }
}

// Yorum filtreleme butonları için olay dinleyicisi
document.getElementById('maps-reviews-page').addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        const newFilter = e.target.dataset.rating;
        if (newFilter === activeReviewFilter) return;
        activeReviewFilter = newFilter;

        // DÜZELTME: Yorumların render edildiği doğru konteyneri bulup güncelliyoruz.
        const reviewsContainer = document.getElementById('maps-reviews-page').querySelector('#reviews-container');
        if (reviewsContainer) {
            renderReviews(reviewsContainer, fullReviewsData, activeReviewFilter);
        }
    }
});


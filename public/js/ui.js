/**
 * @file Bu dosya, uygulamanın tüm DOM manipülasyonu ve arayüz render
 * işlemlerinden sorumlu fonksiyonları içerir.
 */

// =================================================================================
// --- GENEL UI YARDIMCILARI ---
// =================================================================================

/**
 * Sayfanın ana başlığını dinamik olarak günceller.
 * @param {string} title - Gösterilecek yeni başlık.
 */
export function updatePageTitle(title) {
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) {
        pageTitleEl.textContent = title;
    }
}

/**
 * Sayfa başlığını (sidebar'dan gelen) değil, sayfa içindeki arama sonuçları
 * için kullanılan alt başlığı günceller.
 * @param {HTMLElement} pageElement - Başlığın gösterileceği sayfa elementi.
 * @param {string} text - Gösterilecek metin.
 */
export function renderSubheader(pageElement, text) {
    const headerContainer = pageElement.querySelector('.search-results-header');
    if (headerContainer) {
        headerContainer.innerHTML = text ? `<h2 class="search-results-subheader">${text}</h2>` : '';
    }
}

/**
 * Ekranda bir bildirim mesajı (toast) gösterir.
 * @param {string} message - Gösterilecek mesaj.
 * @param {string} type - 'error' veya 'success' gibi bir bildirim türü.
 */
export function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

/** Yüklenme animasyonunu gösterir. */
export function showLoader() {
    document.getElementById('loader').classList.add('show');
}

/** Yüklenme animasyonunu gizler. */
export function hideLoader() {
    document.getElementById('loader').classList.remove('show');
}


// =================================================================================
// --- "KONUM GÖNDERİLERİ" SAYFASI İÇİN RENDER FONKSİYONLARI ---
// =================================================================================

/**
 * Instagram lokasyon arama sonuçlarını listeler.
 * @param {HTMLElement} container - Sonuçların render edileceği HTML elementi.
 * @param {Array} locations - API'den gelen lokasyon nesneleri dizisi.
 * @param {Function} onLocationClick - Bir lokasyona tıklandığında çalışacak callback fonksiyonu.
 */
export function renderLocationResults(container, locations, onLocationClick) {
    container.innerHTML = '';
    locations.forEach(loc => {
        const div = document.createElement('div');
        div.className = 'location-item';
        div.innerHTML = `
            <strong>${loc.name}</strong><br>
            <small>${loc.address || loc.city || 'Adres bilgisi yok'}</small>
        `;
        div.addEventListener('click', () => onLocationClick(loc));
        container.appendChild(div);
    });
}

/**
 * Belirtilen bir lokasyona ait Instagram gönderilerini render eder.
 * @param {HTMLElement} container - Gönderilerin render edileceği grid konteyneri.
 * @param {Array} posts - API'den gelen gönderi nesneleri dizisi.
 * @param {boolean} append - Yeni gönderilerin mevcutların üzerine mi ekleneceğini belirtir.
 */
export function renderPosts(container, posts, append = false) {
    if (!append) {
        container.innerHTML = '';
    }

    posts.forEach(post => {
        const user = post.owner || post.user || {};
        const username = user.username || 'Bilinmiyor';
        const fullName = user.full_name || ''; // full_name geri eklendi
        const isVerified = user.is_verified ? '✔️' : '';
        const profilePicUrl = user.profile_pic_url;
        const imageUrl = post.image_versions?.length > 0 ? post.image_versions[0].url : null;
        const captionText = post.caption?.text || '';
        const likeCount = post.like_count ?? 0;
        const commentCount = post.comment_count ?? 0;
        const postUrl = post.code ? `https://www.instagram.com/p/${post.code}/` : "#"; // postUrl geri eklendi
        const createdAt = post.taken_at ? new Date(post.taken_at * 1000).toLocaleDateString() : '';

        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
            <div class="post-card-header">
                <img src="${profilePicUrl}" class="profile-pic" alt="${username}" referrerpolicy="no-referrer">
                <div class="username-group">
                    <strong class="username">@${username}${isVerified}</strong>
                    <div class="full-name">${fullName}</div>
                </div>
            </div>
            ${imageUrl ? `<img src="${imageUrl}" class="post-image" alt="Gönderi resmi">` : ''}
            <div class="post-card-body">
                <p class="post-card-caption">${captionText}</p>
                <div class="post-card-stats">
                    <span>❤️ ${likeCount}</span>
                    <span>💬 ${commentCount}</span>
                    <small>${createdAt}</small>
                </div>
            </div>
            <div class="post-card-footer">
                <a href="${postUrl}" target="_blank" rel="noopener noreferrer">Instagram'da Görüntüle</a>
            </div>
        `;
        container.appendChild(card);
    });
}



// =================================================================================
// --- "KULLANICI ANALİZİ" SAYFASI İÇİN RENDER FONKSİYONLARI ---
// =================================================================================

/**
 * Kullanıcının kendi gönderilerini beğenenlerin listesini render eder.
 * @param {Array} likers - Beğenen kullanıcı nesneleri dizisi.
 * @param {number} visibleCount - Gösterilecek maksimum kullanıcı sayısı.
 */
export function renderOwnPostLikers(likers, visibleCount) {
    const container = document.querySelector('#user-analysis-page #own-posts-likers-list');
    const loadMoreBtn = document.querySelector('#user-analysis-page #load-more-own-likers-btn');
    
    const likersToRender = likers.slice(0, visibleCount);
    container.innerHTML = '';

    likersToRender.forEach(user => {
        const item = document.createElement('li');
        item.className = 'liker-item';
        item.innerHTML = `
            <strong class="username">@${user.username || 'Bilinmiyor'}</strong>
            <span class="full-name">${user.full_name || ''}</span>
        `;
        container.appendChild(item);
    });

    loadMoreBtn.style.display = likers.length > visibleCount ? 'block' : 'none';
}

/**
 * Kullanıcının etiketlendiği gönderileri beğenenlerin listesini render eder.
 * @param {Array} likers - Beğenen kullanıcı nesneleri dizisi.
 * @param {number} visibleCount - Gösterilecek maksimum kullanıcı sayısı.
 */
export function renderTaggedPostLikers(likers, visibleCount) {
    const container = document.querySelector('#user-analysis-page #tagged-posts-likers-list');
    const loadMoreBtn = document.querySelector('#user-analysis-page #load-more-tagged-likers-btn');

    const likersToRender = likers.slice(0, visibleCount);
    container.innerHTML = '';
    
    likersToRender.forEach(user => {
        const item = document.createElement('li');
        item.className = 'liker-item';
        item.innerHTML = `
            <strong class="username">@${user.username || 'Bilinmiyor'}</strong>
            <span class="full-name">${user.full_name || ''}</span>
        `;
        container.appendChild(item);
    });

    loadMoreBtn.style.display = likers.length > visibleCount ? 'block' : 'none';
}

/**
 * Analiz edilmiş "Potansiyel Müşteri" verisini (En Sadık Takipçiler ve İlgili Kitle) render eder.
 * @param {Array} topLikers - Sıralanmış en sadık takipçiler dizisi.
 * @param {Array} warmAudience - Benzersiz ilgili kitle dizisi.
 * @param {number} limit - Gösterilecek maksimum kullanıcı sayısı.
 */
export function renderAnalysis(topLikers, warmAudience, limit) {
    const topLikersContainer = document.querySelector('#user-analysis-page #top-likers-list');
    const warmAudienceContainer = document.querySelector('#user-analysis-page #warm-audience-list');

    topLikersContainer.innerHTML = '';
    warmAudienceContainer.innerHTML = '';

    const limitedTopLikers = topLikers.slice(0, limit);
    limitedTopLikers.forEach(user => {
        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `
            <strong class="username">@${user.username}</strong>
            <span class="full-name">${user.full_name || ''}</span>
            <span class="like-count">${user.likeCount} Beğeni</span>
        `;
        topLikersContainer.appendChild(card);
    });

    const limitedWarmAudience = warmAudience.slice(0, limit);
    limitedWarmAudience.forEach(user => {
        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `
            <strong class="username">@${user.username}</strong>
            <span class="full-name">${user.full_name || ''}</span>
        `;
        warmAudienceContainer.appendChild(card);
    });
}


// =================================================================================
// --- "HARİTA YORUMLARI" SAYFASI İÇİN RENDER FONKSİYONLARI ---
// =================================================================================

/**
 * Harita API'sinden gelen işletme arama sonuçlarını listeler.
 * @param {HTMLElement} container - Sonuçların ekleneceği element.
 * @param {Array} businesses - İşletme nesnelerinden oluşan dizi.
 * @param {Function} onBusinessClick - Bir işletmeye tıklandığında çalışacak olan callback fonksiyonu.
 */
export function renderBusinessResults(container, businesses, onBusinessClick) {
    container.innerHTML = '';
    
    if (!businesses || businesses.length === 0) {
        container.innerHTML = '<p class="data-status-text">Bu arama için sonuç bulunamadı.</p>';
        return;
    }

    businesses.forEach(business => {
        const item = document.createElement('div');
        item.className = 'location-item'; // Mevcut stilimizi yeniden kullanabiliriz
        item.innerHTML = `
            <strong>${business.name}</strong>
            <small>${business.full_address || 'Adres bilgisi yok'}</small>
        `;
        // Tıklandığında tüm işletme nesnesini callback'e gönder
        item.addEventListener('click', () => onBusinessClick(business));
        container.appendChild(item);
    });
}

/**
 * Harita API'sinden gelen yorumları, filtreleriyle birlikte render eder.
 * @param {HTMLElement} container - Yorumların ve filtrelerin ekleneceği ana element.
 * @param {object} data - Yorumları içeren tam API yanıtı.
 * @param {string} activeFilter - O an aktif olan filtre ('all', '5', '4' vb.).
 */
export function renderReviews(container, data, activeFilter = 'all') {
    if (!data) {
        container.innerHTML = '<p>Analiz için bir işletme seçin.</p>';
        return;
    }

    const reviews = data.reviews || (data.data && data.data.reviews) || [];
    const name = data.name || (data.data && data.data.name) || 'Yorumlar';
    const rating = data.rating || (data.data && data.data.rating);

    // Filtreleme mantığı
    const filteredReviews = activeFilter === 'all'
        ? reviews
        : reviews.filter(review => review.rating == activeFilter);

    // Tüm HTML'i tek bir değişkende oluştur
    let contentHtml = `
        <div id="review-filters">
            <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-rating="all">Tümü</button>
            <button class="filter-btn ${activeFilter === '5' ? 'active' : ''}" data-rating="5">5 ★</button>
            <button class="filter-btn ${activeFilter === '4' ? 'active' : ''}" data-rating="4">4 ★</button>
            <button class="filter-btn ${activeFilter === '3' ? 'active' : ''}" data-rating="3">3 ★</button>
            <button class="filter-btn ${activeFilter === '2' ? 'active' : ''}" data-rating="2">2 ★</button>
            <button class="filter-btn ${activeFilter === '1' ? 'active' : ''}" data-rating="1">1 ★</button>
        </div>
    `;

    if (filteredReviews.length === 0) {
        contentHtml += '<p class="data-status-text">Bu filtre için yorum bulunamadı.</p>';
    } else {
        filteredReviews.forEach(review => {
            const reviewDate = new Date(review.review_datetime_utc).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            contentHtml += `
                <div class="review-card">
                    <div class="review-card-header">
                        <div class="review-card-author">
                            <strong>${review.author_name}</strong>
                            <small>${reviewDate}</small>
                        </div>
                        <div class="review-card-rating">${review.rating} ★</div>
                    </div>
                    <p class="review-text">${review.review_text}</p>
                </div>
            `;
        });
    }

    // Oluşturulan tüm HTML'i tek seferde konteynerin içine bas
    container.innerHTML = contentHtml;
}


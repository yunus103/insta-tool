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
    div.addEventListener('click', () => onLocationClick(loc));
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
    const username = user.username || 'Bilinmeyen Kullanıcı';
    const fullName = user.full_name || '';
    const isVerified = user.is_verified ? '✔️' : '';

    const createdAtUnix = post.caption?.created_at || post.taken_at;
    const createdAt = createdAtUnix
      ? new Date(createdAtUnix * 1000).toLocaleString()
      : 'Belirsiz Tarih';

    const likeCount = post.like_count ?? 0;
    const commentCount = post.comment_count ?? 0;
    const taggedUsers = post.caption?.mentions?.length > 0
      ? post.caption.mentions.join(', ')
      : 'Yok';
    
    const postUrl = post.code
      ? `https://www.instagram.com/p/${post.code}/`
      : "#";

    const profilePic = post.user.profile_pic_url;
    
    const div = document.createElement('div');
    div.className = 'post-item';
    div.innerHTML = `
      <img src="${profilePic}">
      <p>
        <strong>@${username}</strong> ${isVerified}
        ${fullName ? `(${fullName})` : ''} — <small>${createdAt}</small>
      </p>
      <p>${captionText}</p>
      <p>❤️ ${likeCount} | 💬 ${commentCount}</p>
      <p><em>Etiketli Kullanıcılar: ${taggedUsers}</em></p>
      <a href="${postUrl}" target="_blank" rel="noopener noreferrer">Instagram'da Görüntüle</a>
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

export function renderReviews(data, activeFilter = 'all') { // <-- MODIFIED signature
  const container = document.getElementById('reviews-container');
  
  if (!data) {
    container.innerHTML = '<p>Click "Analyze Location" to begin.</p>';
    return;
  }
  
  const reviews = data.reviews || (data.data && data.data.reviews) || [];
  const name = data.name || (data.data && data.data.name) || 'Reviews';
  const rating = data.rating || (data.data && data.data.rating);

  // --- FILTERING LOGIC ---
  const filteredReviews = activeFilter === 'all'
    ? reviews
    : reviews.filter(review => review.rating == activeFilter);

  let reviewsHtml = `<h3>${name}${rating ? ` (${rating} ★)` : ''}</h3>`;

  // --- DYNAMICALLY CREATE FILTER BUTTONS ---
  reviewsHtml += `<div id="review-filters">
    <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-rating="all">All</button>
    <button class="filter-btn ${activeFilter === '5' ? 'active' : ''}" data-rating="5">5 ★</button>
    <button class="filter-btn ${activeFilter === '4' ? 'active' : ''}" data-rating="4">4 ★</button>
    <button class="filter-btn ${activeFilter === '3' ? 'active' : ''}" data-rating="3">3 ★</button>
    <button class="filter-btn ${activeFilter === '2' ? 'active' : ''}" data-rating="2">2 ★</button>
    <button class="filter-btn ${activeFilter === '1' ? 'active' : ''}" data-rating="1">1 ★</button>
  </div>`;
  
  if (filteredReviews.length === 0) {
    reviewsHtml += '<h3>No reviews found for this rating.</h3>';
  } else {
    // --- RENDER FILTERED REVIEWS ---
    filteredReviews.forEach(review => {
      const reviewDate = new Date(review.review_datetime_utc).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      reviewsHtml += `
        <div class="review-item">
          <div class="review-header">
            <strong>${review.author_name}</strong>
            <small>${reviewDate}</small>
          </div>
          <div class="review-rating">${review.rating} ★</div>
          <p class="review-text">${review.review_text}</p>
          <a href="${review.review_link}" target="_blank" rel="noopener noreferrer">View on Maps</a>
        </div>
      `;
    });
  }

  container.innerHTML = reviewsHtml;
}


export function renderOwnPostLikers(likers, visibleCount) {
  const container = document.getElementById('own-posts-likers-list');
  const loadMoreBtn = document.getElementById('load-more-own-likers-btn');

  const likersToRender = likers.slice(0, visibleCount);
  container.innerHTML = ''; // Önceki listeyi temizle

  likersToRender.forEach(user => {
    const listItem = document.createElement('li');
    listItem.className = 'liker-item'; // Yeni CSS class'ımız
    // Resim etiketini kaldırdık
    listItem.innerHTML = `
      <strong class="username">@${user.username || 'Bilinmiyor'}</strong>
      <span class="full-name">${user.full_name || ''}</span>
    `;
    container.appendChild(listItem);
  });

  // "Daha Fazla Yükle" butonunu yönet
  if (likers.length > visibleCount) {
    loadMoreBtn.style.display = 'block';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

export function renderTaggedPostLikers(likers, visibleCount) {
  const container = document.getElementById('tagged-posts-likers-list');
  const loadMoreBtn = document.getElementById('load-more-tagged-likers-btn');

  const likersToRender = likers.slice(0, visibleCount);
  container.innerHTML = ''; // Önceki listeyi temizle

  likersToRender.forEach(user => {
    const listItem = document.createElement('li');
    listItem.className = 'liker-item'; // Yeni CSS class'ımız
    // Resim etiketini kaldırdık
    listItem.innerHTML = `
      <strong class="username">@${user.username || 'Bilinmiyor'}</strong>
      <span class="full-name">${user.full_name || ''}</span>
    `;
    container.appendChild(listItem);
  });

  // "Daha Fazla Yükle" butonunu yönet
  if (likers.length > visibleCount) {
    loadMoreBtn.style.display = 'block';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}


// Add a placeholder for the analysis renderer too
// renderAnalysis fonksiyonunu bu yeni versiyonla değiştirin
export function renderAnalysis(topLikers, warmAudience, limit) {
  const topLikersContainer = document.getElementById('top-likers-list');
  const warmAudienceContainer = document.getElementById('warm-audience-list');
  const analysisResultsContainer = document.getElementById('analysis-results-container');
  
  // --- DEĞİŞİKLİK BURADA: Veriyi render etmeden önce limitle ---
  const limitedTopLikers = topLikers.slice(0, limit);
  const limitedWarmAudience = warmAudience.slice(0, limit);

  // Önceki sonuçları temizle
  topLikersContainer.innerHTML = '';
  warmAudienceContainer.innerHTML = '';
  // CSS class'ını doğru şekilde ayarla
  topLikersContainer.className = 'analysis-list-container';
  warmAudienceContainer.className = 'analysis-list-container';
  
  // En Sadık Takipçileri render et
  if (limitedTopLikers.length > 0) {
    limitedTopLikers.forEach(user => {
      const listItem = document.createElement('li');
      listItem.className = 'analysis-card'; // Yeni CSS class'ımız
      listItem.innerHTML = `
        <strong class="username">@${user.username}</strong>
        <span class="full-name">${user.full_name || ''}</span>
        <span class="like-count">${user.likeCount} Beğeni</span>
      `;
      topLikersContainer.appendChild(listItem);
    });
  } else {
    topLikersContainer.innerHTML = '<p>Analiz edilecek veri bulunamadı.</p>';
  }

  // İlgili Kitleyi render et
  if (limitedWarmAudience.length > 0) {
    limitedWarmAudience.forEach(user => {
      const listItem = document.createElement('li');
      listItem.className = 'analysis-card'; // Yeni CSS class'ımız
      listItem.innerHTML = `
        <strong class="username">@${user.username}</strong>
        <span class="full-name">${user.full_name || ''}</span>
      `;
      warmAudienceContainer.appendChild(listItem);
    });
  } else {
    warmAudienceContainer.innerHTML = '<p>Analiz edilecek veri bulunamadı.</p>';
  }

  // Kontrol ve export butonunu göster
  document.getElementById('analysis-controls').style.display = 'flex';
}
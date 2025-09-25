/**
 * @file Bu dosya, uygulamanın ana giriş noktasıdır (entry point).
 * Sayfalar arası navigasyonu yönetir, "bağlama duyarlı" arama çubuğunu kontrol eder
 * ve genel UI olaylarını (tema, scroll vb.) başlatır.
 */

// Gerekli iş akışı ve UI modüllerini içe aktar
import { initializeLocationSearch } from './instaLocationWorkflow.js';
import { initializeUserSearch } from './userAnalysisWorkflow.js';
import { initializeMapsSearch } from './mapsReviewsWorkflow.js';
import { showToast, updatePageTitle } from './ui.js';

// --- UI Elementleri ---
const sidebarNavItems = document.querySelectorAll('.sidebar-nav .nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const mainContent = document.querySelector('.main-content');
const sidebar = document.querySelector('.sidebar');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');



// --- Durum (State) Yönetimi ---
let activePageId = 'insta-location-page'; // Başlangıç sayfası

/**
 * Kenar çubuğundaki bir linke tıklandığında tetiklenir.
 * İlgili sayfayı gösterir ve diğerlerini gizler.
 * @param {Event} e - Tıklama olayı.
 */
function handleNavigation(e) {
    e.preventDefault();
    
    // DÜZELTME: Tıklanan <a> etiketinin parent'ı olan .nav-item'ı buluyoruz.
    const navItem = e.currentTarget.closest('.nav-item');
    if (!navItem) return; // Güvenlik kontrolü

    const targetPageId = navItem.getAttribute('data-page');

    if (targetPageId === activePageId) return; // Zaten aktif sayfadaysa bir şey yapma

    activePageId = targetPageId;

    // Tüm sayfalardan ve menü öğelerinden 'active' class'ını kaldır
    pages.forEach(page => page.classList.remove('active-page'));
    sidebarNavItems.forEach(item => item.classList.remove('active'));

    // Hedef sayfayı ve menü öğesini aktif yap
    document.getElementById(targetPageId).classList.add('active-page');
    navItem.classList.add('active');

    // Sayfa başlığını güncelle
    updatePageTitle(navItem.querySelector('a').textContent);
}

/**
 * Arama butonuna tıklandığında veya Enter'a basıldığında tetiklenir.
 * Aktif olan sayfaya göre doğru arama iş akışını başlatır.
 */
function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showToast('Lütfen bir arama terimi girin.', 'error');
        return;
    }

    // Aktif sayfaya göre yönlendirme yap
    switch (activePageId) {
        case 'insta-location-page':
            initializeLocationSearch(query);
            break;
        case 'user-analysis-page':
            if (query.startsWith('@')) {
                initializeUserSearch(query);
            } else {
                showToast("Kullanıcı analizi için lütfen '@' ile başlayan bir kullanıcı adı girin.", 'error');
            }
            break;
        case 'maps-reviews-page':
            initializeMapsSearch(query);
            break;
    }
}

/**
 * Genel UI olaylarını (tema, scroll vb.) yönetir.
 */
function applyTheme(theme) {
    body.classList.toggle('dark-theme', theme === 'dark');
    themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function handleThemeToggle() {
    const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

function handleScroll() {
    scrollToTopBtn.classList.toggle('show', window.scrollY > 200);
}

function handleTopClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Uygulamayı başlatan ana fonksiyon.
 * Tüm olay dinleyicilerini (event listeners) ayarlar.
 */
function init() {
    // Navigasyon olayları
    sidebarNavItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            link.addEventListener('click', handleNavigation);
        }
    });

    // Arama olayları
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    sidebarToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Olayın dışarıya yayılmasını engelle
        sidebar.classList.toggle('open');
    });

    sidebarNavItems.forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation(); // Olayın dışarıya yayılmasını engelle
            sidebar.classList.toggle('open');
        });
    });

    // Bonus: İçeriğe tıklandığında menüyü kapat
    mainContent.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
            sidebar.classList.toggle('open');
        }
    });

    // Genel UI olayları
    themeToggleBtn.addEventListener('click', handleThemeToggle);
    window.addEventListener('scroll', handleScroll);
    scrollToTopBtn.addEventListener('click', handleTopClick);

    // Başlangıç temasını uygula
    applyTheme(localStorage.getItem('theme') || 'light');
}

// Sayfa yüklendiğinde uygulamayı başlat
init();


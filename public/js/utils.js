/**
 * @file Bu dosya, projenin herhangi bir yerinde kullanılabilecek
 * genel yardımcı fonksiyonları içerir (veri işleme, export vb.).
 */

//import * as XLSX from 'xlsx';

/**
 * Beğenenler dizisini alır ve her kullanıcının kaç kez beğeni yaptığını sayarak
 * en çok beğeni yapandan en aza doğru sıralar.
 * @param {Array} likersArray - Kullanıcı nesnelerinden oluşan dizi.
 * @returns {Array} - Sıralanmış ve 'likeCount' eklenmiş kullanıcı nesneleri dizisi.
 */
export function rankTopLikers(likersArray) {
    if (!likersArray || likersArray.length === 0) return [];
    const likerCounts = new Map();
    likersArray.forEach(user => {
        if (user && user.username) {
            const count = (likerCounts.get(user.username)?.count || 0) + 1;
            likerCounts.set(user.username, { user, count });
        }
    });
    return Array.from(likerCounts.values())
        .sort((a, b) => b.count - a.count)
        .map(item => ({ ...item.user, likeCount: item.count }));
}

/**
 * Beğenenler dizisindeki tekrar eden kullanıcıları kaldırarak benzersiz bir liste oluşturur.
 * @param {Array} likersArray - Kullanıcı nesnelerinden oluşan dizi.
 * @returns {Array} - Benzersiz kullanıcı nesnelerinden oluşan dizi.
 */
export function getUniqueAudience(likersArray) {
    if (!likersArray || likersArray.length === 0) return [];
    const uniqueUsers = new Map();
    likersArray.forEach(user => {
        if (user && user.username && !uniqueUsers.has(user.username)) {
            uniqueUsers.set(user.username, user);
        }
    });
    return Array.from(uniqueUsers.values());
}

/**
 * Verilen bir veri dizisini bir Excel (.xlsx) dosyasına dönüştürür ve indirir.
 * @param {Array} data - Dışa aktarılacak nesneler dizisi.
 * @param {string} fileName - İndirilecek dosyanın adı (uzantısız).
 */
export function exportToExcel(data, fileName) {
    if (!data || data.length === 0) {
        // Hata mesajı gösterme ui.js'den import edilerek yapılabilir
        alert('Dışa aktarılacak veri bulunamadı.');
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * FinTrack Pro – Google Translate Integration
 * Injects Google Translate widget and manages language preference
 */

(function () {
    const LANG_MAP = { en: 'en', es: 'es', fr: 'fr', ar: 'ar', ur: 'ur' };

    // Initialize Google Translate
    function initGoogleTranslate() {
        // Add Google Translate script
        if (!document.getElementById('gt-script')) {
            const script = document.createElement('script');
            script.id = 'gt-script';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            document.body.appendChild(script);
        }

        // Create hidden container for the widget
        if (!document.getElementById('google_translate_element')) {
            const div = document.createElement('div');
            div.id = 'google_translate_element';
            div.style.display = 'none';
            document.body.appendChild(div);
        }
    }

    // Google Translate callback
    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr,ar,ur',
            autoDisplay: false
        }, 'google_translate_element');

        // Apply saved language preference after widget loads
        setTimeout(() => {
            const savedLang = getSavedLanguage();
            if (savedLang && savedLang !== 'en') {
                setGoogleTranslateLang(savedLang);
            }
        }, 1000);
    };

    // Set Google Translate language via cookie manipulation
    function setGoogleTranslateLang(langCode) {
        const lang = LANG_MAP[langCode] || 'en';

        // Set the Google Translate cookie
        document.cookie = `googtrans=/en/${lang};path=/;`;
        document.cookie = `googtrans=/en/${lang};path=/;domain=${window.location.hostname}`;

        // Try to trigger the translate element
        const frame = document.querySelector('.goog-te-menu-frame');
        if (frame) {
            const items = frame.contentDocument.querySelectorAll('.goog-te-menu2-item span.text');
            items.forEach(item => {
                if (item.textContent.toLowerCase().includes(getLanguageName(lang).toLowerCase())) {
                    item.click();
                }
            });
        } else {
            // Fallback: reload to apply cookie-based translation
            if (document.cookie.includes('googtrans') && !window._gtReloaded) {
                window._gtReloaded = true;
                window.location.reload();
            }
        }
    }

    function getLanguageName(code) {
        const names = { en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic', ur: 'Urdu' };
        return names[code] || 'English';
    }

    function getSavedLanguage() {
        try {
            const user = JSON.parse(localStorage.getItem('fintrack_user'));
            return user?.language || 'en';
        } catch { return 'en'; }
    }

    // Save language preference to server
    async function saveLanguagePreference(lang) {
        const token = localStorage.getItem('fintrack_token');
        if (!token) return;

        try {
            await fetch('/api/auth/language', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ language: lang })
            });

            // Update local storage
            const user = JSON.parse(localStorage.getItem('fintrack_user') || '{}');
            user.language = lang;
            localStorage.setItem('fintrack_user', JSON.stringify(user));
        } catch (err) {
            console.warn('Failed to save language preference:', err);
        }
    }

    // Bind language selector
    function bindLangSelector() {
        const select = document.getElementById('langSelect');
        if (!select) return;

        // Set current value from saved preference
        const saved = getSavedLanguage();
        select.value = saved;

        select.addEventListener('change', (e) => {
            const lang = e.target.value;
            setGoogleTranslateLang(lang);
            saveLanguagePreference(lang);
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { initGoogleTranslate(); bindLangSelector(); });
    } else {
        initGoogleTranslate();
        bindLangSelector();
    }
})();

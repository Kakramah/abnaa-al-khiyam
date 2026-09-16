/* ============================================================
   يا من تقولوا أبناء الخيم...
   تفاعل الصفحة — شريط القراءة، التكبير، والمشاركة
   القيم والتنسيقات محصورة في :root في style.css
   ============================================================ */
(function () {
    'use strict';

    const root = document.documentElement;
    root.classList.add('js');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- الظهور التدريجي (Reveal) ---------- */
    const revealed = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealed.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
        revealed.forEach(function (el) { io.observe(el); });
    }

    /* ---------- شريط التقدّم ومؤشر التمرير ---------- */
    const bar = document.querySelector('.reading-progress-bar');
    const indicator = document.querySelector('.scroll-indicator');
    let ticking = false;

    function onScroll() {
        const max = root.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? window.scrollY / max : 0;
        if (bar) bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
        if (indicator && window.scrollY > 80) indicator.classList.add('is-gone');
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
    onScroll();

    /* ---------- نافذة التكبير (Lightbox) ---------- */
    const triggers = Array.prototype.slice.call(document.querySelectorAll('.lb-trigger'));
    const items = triggers.map(function (btn) { return btn.querySelector('img'); });
    const box = document.querySelector('.lightbox');
    const boxImg = box.querySelector('.lb-image');
    const boxTitle = box.querySelector('.lb-title');
    const boxDesc = box.querySelector('.lb-desc');
    const boxCount = box.querySelector('.lb-count');
    const closeBtn = box.querySelector('.lb-close');
    let current = 0;
    let opener = null;

    function toArabicDigits(n) {
        return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; });
    }

    function render() {
        const img = items[current];
        if (!img) return;
        boxImg.src = img.getAttribute('src');
        boxImg.alt = img.getAttribute('alt');
        boxTitle.textContent = img.dataset.title || '';
        boxDesc.textContent = img.dataset.desc || '';
        boxCount.textContent = toArabicDigits(current + 1) + ' من ' + toArabicDigits(items.length);
    }

    function openLightbox(index) {
        current = index;
        opener = triggers[index];
        render();
        box.hidden = false;
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function closeLightbox() {
        box.hidden = true;
        document.body.style.overflow = '';
        if (opener) opener.focus();
    }

    function nextLightbox() {
        current = (current + 1) % items.length;
        render();
    }

    function prevLightbox() {
        current = (current - 1 + items.length) % items.length;
        render();
    }

    triggers.forEach(function (btn, i) {
        btn.addEventListener('click', function () { openLightbox(i); });
    });

    closeBtn.addEventListener('click', closeLightbox);
    box.querySelector('.lb-next').addEventListener('click', nextLightbox);
    box.querySelector('.lb-prev').addEventListener('click', prevLightbox);
    box.addEventListener('click', function (e) {
        if (e.target === box) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
        if (box.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') prevLightbox();  // RTL: اليمين للصورة السابقة
        if (e.key === 'ArrowLeft') nextLightbox();
        if (e.key === 'Tab') {
            const focusables = box.querySelectorAll('button');
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                last.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    });

    /* ---------- انشر الحكاية (Share Buttons) ---------- */
    const pageUrl = window.location.href;
    const pageTitle = document.title;
    const shareText = 'يا من تقولوا أبناء الخيم... وثيقة اعتزاز وطني بأبناء المحرر السوري الذين أسقطوا نظام الاستبداد.';

    const shareCopyBtn = document.querySelector('.share-copy');
    const shareNativeBtn = document.querySelector('.share-native');
    const shareStatus = document.querySelector('.share-status');

    if (navigator.share && shareNativeBtn) {
        shareNativeBtn.hidden = false;
        shareNativeBtn.addEventListener('click', function () {
            navigator.share({
                title: pageTitle,
                text: shareText,
                url: pageUrl
            }).catch(function () {});
        });
    }

    if (shareCopyBtn) {
        shareCopyBtn.addEventListener('click', function () {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(pageUrl).then(function () {
                    shareStatus.textContent = 'تم نسخ الرابط بنجاح';
                    setTimeout(function () { shareStatus.textContent = ''; }, 3500);
                }).catch(function () {
                    prompt('انسخ الرابط:', pageUrl);
                });
            } else {
                prompt('انسخ الرابط:', pageUrl);
            }
        });
    }

    const shareLinks = document.querySelectorAll('.share-link');
    shareLinks.forEach(function (link) {
        const net = link.getAttribute('data-network');
        let href = '#';
        if (net === 'whatsapp') {
            href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText + ' ' + pageUrl);
        } else if (net === 'telegram') {
            href = 'https://t.me/share/url?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(shareText);
        } else if (net === 'x') {
            href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(pageUrl);
        } else if (net === 'facebook') {
            href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl);
        }
        link.href = href;
    });

})();

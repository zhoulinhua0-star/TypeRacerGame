// Landing page interactions: in-page nav, navbar shadow, scroll reveals
(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', function () {
        var guideTrigger = document.getElementById('keyboard-guide-trigger');
        var guideDialog = document.getElementById('keyboard-guide');
        var guideCard = guideDialog ? guideDialog.querySelector('.guide-card') : null;
        var guideCloseButton = guideDialog ? guideDialog.querySelector('.guide-close') : null;
        var guideBackground = [
            document.querySelector('.navbar'),
            document.querySelector('main'),
            document.querySelector('.footer')
        ].filter(Boolean);
        var previouslyFocused = null;
        var closeTimer = null;
        var openFrame = null;

        function getGuideFocusableElements() {
            if (!guideCard) return [];
            return Array.from(guideCard.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
                .filter(function (element) {
                    return !element.hidden;
                });
        }

        function setGuideBackgroundInert(isInert) {
            guideBackground.forEach(function (element) {
                element.inert = isInert;
                if (isInert) {
                    element.setAttribute('aria-hidden', 'true');
                } else {
                    element.removeAttribute('aria-hidden');
                }
            });
        }

        function openGuide() {
            if (!guideDialog || !guideDialog.hidden) return;

            window.clearTimeout(closeTimer);
            previouslyFocused = document.activeElement;
            guideDialog.hidden = false;
            guideTrigger.setAttribute('aria-expanded', 'true');
            document.body.classList.add('guide-open');
            guideCloseButton.focus();
            setGuideBackgroundInert(true);

            openFrame = window.requestAnimationFrame(function () {
                openFrame = null;
                guideDialog.classList.add('is-visible');
            });
        }

        function closeGuide() {
            if (!guideDialog || guideDialog.hidden) return;

            if (openFrame !== null) {
                window.cancelAnimationFrame(openFrame);
                openFrame = null;
            }
            guideDialog.classList.remove('is-visible');
            guideTrigger.setAttribute('aria-expanded', 'false');
            closeTimer = window.setTimeout(function () {
                guideDialog.hidden = true;
                document.body.classList.remove('guide-open');
                setGuideBackgroundInert(false);
                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                } else {
                    guideTrigger.focus();
                }
            }, prefersReducedMotion ? 0 : 220);
        }

        if (guideTrigger && guideDialog) {
            guideTrigger.addEventListener('click', openGuide);
            guideDialog.querySelectorAll('[data-guide-close]').forEach(function (element) {
                element.addEventListener('click', closeGuide);
            });

            document.addEventListener('keydown', function (event) {
                var dialogIsOpen = !guideDialog.hidden;

                if (!dialogIsOpen && event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    var target = event.target;
                    var isEditable = target && (
                        (typeof target.matches === 'function' && target.matches('input, textarea, select')) ||
                        target.isContentEditable
                    );
                    if (!isEditable) {
                        event.preventDefault();
                        openGuide();
                    }
                    return;
                }

                if (!dialogIsOpen) return;

                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeGuide();
                    return;
                }

                if (event.key === 'Tab') {
                    var focusable = getGuideFocusableElements();
                    if (focusable.length === 0) return;
                    var first = focusable[0];
                    var last = focusable[focusable.length - 1];

                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            const id = anchor.getAttribute('href');
            if (id.length < 2) {
                return;
            }
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(id);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: prefersReducedMotion ? 'auto' : 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        var navbar = document.querySelector('.navbar');
        var navInner = navbar ? navbar.querySelector('.nav-container') : null;
        if (navInner) {
            window.addEventListener('scroll', function () {
                if (window.pageYOffset <= 8) {
                    navInner.style.boxShadow = '';
                } else {
                    navInner.style.boxShadow = '0 14px 40px rgba(0, 0, 0, 0.45)';
                }
            }, { passive: true });
        }

        if (prefersReducedMotion) {
            document.querySelectorAll('.feature-card, .project-card').forEach(function (card) {
                card.style.opacity = '1';
                card.style.transform = 'none';
            });
            return;
        }

        var observerOptions = {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        };

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card, .project-card').forEach(function (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            card.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
            observer.observe(card);
        });
    });
})();

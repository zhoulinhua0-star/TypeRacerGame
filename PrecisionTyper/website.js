// Landing page interactions: in-page nav, navbar shadow, scroll reveals
(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', function () {
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

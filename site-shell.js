document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');

    const isLocalSimpleServer = (
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        window.location.port !== '8888'
    );

    if (isLocalSimpleServer) {
        document.querySelectorAll('a[href^="/"]').forEach((link) => {
            const href = link.getAttribute('href');
            if (href === '/blog' || href.startsWith('/blog#') || href.startsWith('/blog?')) {
                link.setAttribute('href', href.replace('/blog', '/blog/'));
            }
        });
    }

    let headerFrame = 0;
    const updateHeader = () => {
        headerFrame = 0;
        header?.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    const requestHeaderUpdate = () => {
        if (headerFrame) return;
        headerFrame = window.requestAnimationFrame(updateHeader);
    };

    updateHeader();
    window.addEventListener('scroll', requestHeaderUpdate, { passive: true });

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('nav-open', isOpen);
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            nav?.classList.remove('is-open');
            navToggle?.classList.remove('is-open');
            navToggle?.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('nav-open');
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px 80px 0px', threshold: 0.01 });
        revealElements.forEach((element) => observer.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add('is-visible'));
    }

});

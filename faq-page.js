document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    const closeItem = (item) => {
        item.classList.remove('is-active');
        item.querySelector('.faq-content')?.style.removeProperty('max-height');
        item.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
    };

    faqItems.forEach((item) => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');
        if (!trigger || !content) return;

        trigger.addEventListener('click', () => {
            const wasActive = item.classList.contains('is-active');
            faqItems.forEach((otherItem) => {
                if (otherItem !== item) closeItem(otherItem);
            });

            if (wasActive) {
                closeItem(item);
                return;
            }

            item.classList.add('is-active');
            content.style.maxHeight = `${content.scrollHeight}px`;
            trigger.setAttribute('aria-expanded', 'true');
        });
    });

    const resizeActiveItem = () => {
        const activeContent = document.querySelector('.faq-item.is-active .faq-content');
        if (activeContent) activeContent.style.maxHeight = `${activeContent.scrollHeight}px`;
    };

    resizeActiveItem();
    let resizeFrame = 0;
    window.addEventListener('resize', () => {
        if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = 0;
            resizeActiveItem();
        });
    }, { passive: true });
});

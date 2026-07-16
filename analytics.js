(function () {
    'use strict';

    const initAnalytics = () => {
        const trackGaEvent = (eventName, parameters = {}) => {
            if (typeof window.gtag !== 'function') return;
            window.gtag('event', eventName, {
                page_path: window.location.pathname,
                ...parameters
            });
        };

        if (!window.__spacegleamContactCtaTrackingBound) {
            window.__spacegleamContactCtaTrackingBound = true;
            const ctaSelector = [
                'a.header-cta',
                'a.mobile-fixed-cta',
                'a[href$="contact.html"]',
                'a[href*="contact.html#"]',
                'a[href$="#contact"]'
            ].join(',');

            const getCtaLocation = (link) => {
                if (link.closest('.header')) return 'header';
                if (link.classList.contains('mobile-fixed-cta')) return 'mobile_fixed';
                if (link.closest('.hero')) return 'hero';
                if (link.closest('.article-cta')) return 'article';
                if (link.closest('.works-section, .works-section-v2, .works-cta-banner-v2')) return 'works';
                if (link.closest('.faq-section, .faq-contact-bar')) return 'faq';
                if (link.closest('.contact-section')) return 'contact_section';
                if (link.closest('.footer')) return 'footer';
                return 'content';
            };

            document.addEventListener('click', (event) => {
                const link = event.target.closest(ctaSelector);
                if (!link) return;

                let destination = link.getAttribute('href') || '';
                try {
                    const url = new URL(destination, window.location.href);
                    destination = `${url.pathname}${url.hash}`;
                } catch (_) {
                    destination = destination.slice(0, 100);
                }

                trackGaEvent('cta_click', {
                    cta_location: getCtaLocation(link),
                    cta_text: (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
                    destination: destination.slice(0, 100)
                });
            });
        }

        const contactForm = document.querySelector('.contact-form');
        if (!contactForm || window.__spacegleamContactFormTrackingBound) return;
        window.__spacegleamContactFormTrackingBound = true;

        const formId = 'ai_mvp_contact';
        const formSuccess = document.querySelector('.form-success');
        const formStatus = document.querySelector('.contact-form-status');
        let formViewTracked = false;
        let leadTracked = false;
        let lastErrorType = '';

        const trackFormView = () => {
            if (formViewTracked) return;
            formViewTracked = true;
            trackGaEvent('contact_form_view', { form_id: formId });
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                trackFormView();
                observer.disconnect();
            }, { threshold: 0.25 });
            observer.observe(contactForm);
        } else {
            trackFormView();
        }

        contactForm.addEventListener('input', () => {
            trackGaEvent('contact_form_start', { form_id: formId });
        }, { once: true });

        contactForm.addEventListener('submit', () => {
            trackGaEvent('contact_form_submit', { form_id: formId });
        });

        if (formStatus && 'MutationObserver' in window) {
            const statusObserver = new MutationObserver(() => {
                if (!formStatus.classList.contains('is-error')) {
                    lastErrorType = '';
                    return;
                }
                const message = formStatus.textContent || '';
                const errorType = message.includes('同意')
                    ? 'privacy_not_accepted'
                    : message.includes('入力')
                        ? 'missing_required_fields'
                        : 'submission_error';
                if (errorType === lastErrorType) return;
                lastErrorType = errorType;
                trackGaEvent('contact_form_error', { form_id: formId, error_type: errorType });
            });
            statusObserver.observe(formStatus, { attributes: true, childList: true, characterData: true, subtree: true });
        }

        if (formSuccess && 'MutationObserver' in window) {
            const successObserver = new MutationObserver(() => {
                if (formSuccess.hidden || leadTracked) return;
                leadTracked = true;
                trackGaEvent('generate_lead', { form_id: formId, lead_type: 'form' });
            });
            successObserver.observe(formSuccess, { attributes: true, attributeFilter: ['hidden'] });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnalytics, { once: true });
    } else {
        initAnalytics();
    }
})();

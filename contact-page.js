document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');
    const formSuccess = document.querySelector('.form-success');
    const formStatus = document.querySelector('.contact-form-status');
    const contactMethodGroup = document.getElementById('contact-method-group');
    const bookingSchedulerContainer = document.getElementById('booking-scheduler-container');
    const bookingIframe = document.getElementById('booking-iframe');
    const recaptchaSiteKey = window.SPACEGLEAM_RECAPTCHA_SITE_KEY || '';
    const bookingUrl = window.SPACEGLEAM_BOOKING_URL || '';
    const urlParams = new URLSearchParams(window.location.search);
    const isBookingPolish = urlParams.get('v') === 'booking-polish';

    if (isBookingPolish && contactMethodGroup) {
        contactMethodGroup.style.display = 'grid';
    }

    if (recaptchaSiteKey) {
        const recaptchaScript = document.createElement('script');
        recaptchaScript.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaSiteKey)}`;
        recaptchaScript.async = true;
        document.head.appendChild(recaptchaScript);
    }

    const setFormStatus = (message, type = '') => {
        if (!formStatus) return;
        formStatus.textContent = message || '';
        formStatus.classList.toggle('is-error', type === 'error');
        formStatus.classList.toggle('is-success', type === 'success');
    };

    const getRecaptchaToken = () => new Promise((resolve) => {
        if (!recaptchaSiteKey || !window.grecaptcha) {
            resolve('');
            return;
        }

        window.grecaptcha.ready(() => {
            window.grecaptcha.execute(recaptchaSiteKey, { action: 'contact' })
                .then(resolve)
                .catch(() => resolve(''));
        });
    });

    if (!contactForm || !formSuccess) return;

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const budget = String(formData.get('budget') || '').trim();
        const deadline = String(formData.get('deadline') || '').trim();
        const referrer = String(formData.get('referrer') || '').trim();
        const message = String(formData.get('message') || '').trim();
        const meetingPref = isBookingPolish
            ? String(formData.get('meeting_pref') || 'schedule')
            : 'text';

        const payload = {
            company: String(formData.get('company') || '').trim(),
            name: String(formData.get('name') || '').trim(),
            email: String(formData.get('email') || '').trim(),
            category: 'AI活用案・概算費用相談',
            subject: 'SPACE GLEAM AI活用案・概算費用相談',
            message: [
                message,
                '',
                `予算感: ${budget || '未選択'}`,
                `希望納期: ${deadline || '未選択'}`,
                `認知経路: ${referrer || '未選択'}`
            ].join('\n'),
            budget,
            deadline,
            meeting: isBookingPolish && meetingPref === 'schedule' ? '日程調整をする' : 'フォームのみで相談',
            bookingUrl: isBookingPolish && meetingPref === 'schedule' ? bookingUrl : '',
            referrer,
            website: String(formData.get('website') || '').trim(),
            recaptchaToken: String(formData.get('recaptcha-token') || '').trim(),
            source: 'spacegleam-corp'
        };

        if (!payload.company || !payload.name || !payload.email || !payload.message) {
            setFormStatus('会社名、お名前、メールアドレス、相談内容を入力してください。', 'error');
            return;
        }

        if (!formData.get('privacy')) {
            setFormStatus('プライバシーポリシーへの同意をお願いします。', 'error');
            return;
        }

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalLabel = submitButton?.textContent || '送信する';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '送信しています...';
        }
        setFormStatus('送信しています...');

        try {
            payload.recaptchaToken = await getRecaptchaToken();
            const response = await fetch('/.netlify/functions/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            let result = null;
            try {
                result = await response.json();
            } catch (_) {
                result = null;
            }

            if (!response.ok || result?.success === false) {
                setFormStatus(result?.message || '送信に失敗しました。時間をおいて再度お試しください。', 'error');
                return;
            }

            contactForm.reset();
            contactForm.classList.add('is-submitted');
            setFormStatus('');

            if (isBookingPolish && meetingPref === 'schedule' && bookingUrl && bookingIframe && bookingSchedulerContainer) {
                bookingIframe.src = bookingUrl;
                bookingSchedulerContainer.style.display = 'flex';
            } else if (bookingSchedulerContainer) {
                bookingSchedulerContainer.style.display = 'none';
            }

            formSuccess.hidden = false;
            formSuccess.focus();
        } catch (_) {
            setFormStatus('送信に失敗しました。時間をおいて再度お試しください。', 'error');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalLabel;
            }
        }
    });
});

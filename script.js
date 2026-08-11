document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    const contactForm = document.querySelector('.contact-form');
    const formSuccess = document.querySelector('.form-success');
    const formStatus = document.querySelector('.contact-form-status');
    const recaptchaSiteKey = window.SPACEGLEAM_RECAPTCHA_SITE_KEY;

    // --- GA4 conversion funnel tracking ---
    // Never include form values, email addresses, names, or free-text messages.
    const trackGaEvent = (eventName, parameters = {}) => {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', eventName, {
            page_path: window.location.pathname,
            ...parameters
        });
    };

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

    const contactCtaSelector = [
        'a.header-cta',
        'a.mobile-fixed-cta',
        'a[href$="contact.html"]',
        'a[href*="contact.html#"]',
        'a[href$="#contact"]'
    ].join(',');

    document.addEventListener('click', (event) => {
        const link = event.target.closest(contactCtaSelector);
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

    // --- Local Server Route Helper ---
    // If running on a local static server like Python http.server,
    // ensure /blog automatically rewrites to /blog/ (with trailing slash)
    // so relative resources inside the blog page resolve correctly.
    const isLocalSimpleServer = (
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        window.location.port !== '8888' // 8888 is default Netlify Dev port, which handles redirects
    );

    if (isLocalSimpleServer) {
        document.querySelectorAll('a[href^="/"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href === '/blog' || href.startsWith('/blog#') || href.startsWith('/blog?')) {
                link.setAttribute('href', href.replace('/blog', '/blog/'));
            }
        });
    }

    // --- Booking Polish Setup ---
    const contactMethodGroup = document.getElementById('contact-method-group');
    const bookingSchedulerContainer = document.getElementById('booking-scheduler-container');
    const bookingIframe = document.getElementById('booking-iframe');
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

    const setHeaderState = () => {
        if (!header) return;
        header.classList.toggle('is-scrolled', window.scrollY > 12);
    };

    setHeaderState();
    window.addEventListener('scroll', setHeaderState, { passive: true });

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

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px 0px 80px 0px',
        threshold: 0.01
    });

    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

    // --- Partner Page Specific GA4 Logic ---
    const isPartnerPage = window.location.pathname.endsWith('/partner') || window.location.pathname.endsWith('/partner.html');
    if (isPartnerPage) {
        trackGaEvent('partner_page_view');
    }

    document.querySelectorAll('[data-partner-model]').forEach((button) => {
        button.addEventListener('click', () => {
            const model = button.getAttribute('data-partner-model');
            trackGaEvent('partner_cta_click', { partner_model: model || '' });
        });
    });

    if (contactForm) {
        let formViewTracked = false;
        const trackFormView = () => {
            if (formViewTracked) return;
            formViewTracked = true;
            trackGaEvent('contact_form_view', { form_id: 'ai_mvp_contact' });
        };

        if ('IntersectionObserver' in window) {
            const formViewObserver = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    trackFormView();
                    formViewObserver.disconnect();
                }
            }, { threshold: 0.25 });
            formViewObserver.observe(contactForm);
        } else {
            trackFormView();
        }

        contactForm.addEventListener('input', () => {
            trackGaEvent('contact_form_start', { form_id: 'ai_mvp_contact' });
        }, { once: true });
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

    if (contactForm && formSuccess) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            trackGaEvent('contact_form_submit', { form_id: 'ai_mvp_contact' });

            const formData = new FormData(contactForm);
            const budget = String(formData.get('budget') || '').trim();
            const deadline = String(formData.get('deadline') || '').trim();
            const referrer = String(formData.get('referrer') || '').trim();
            const message = String(formData.get('message') || '').trim();

            let meetingPref = 'text';
            if (isBookingPolish) {
                meetingPref = String(formData.get('meeting_pref') || 'schedule');
            }

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
                trackGaEvent('contact_form_error', {
                    form_id: 'ai_mvp_contact',
                    error_type: 'missing_required_fields'
                });
                setFormStatus('会社名、お名前、メールアドレス、相談内容を入力してください。', 'error');
                return;
            }

            if (!formData.get('privacy')) {
                trackGaEvent('contact_form_error', {
                    form_id: 'ai_mvp_contact',
                    error_type: 'privacy_not_accepted'
                });
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
                    trackGaEvent('contact_form_error', {
                        form_id: 'ai_mvp_contact',
                        error_type: 'api_rejected',
                        http_status: response.status
                    });
                    setFormStatus(result?.message || '送信に失敗しました。時間をおいて再度お試しください。', 'error');
                    return;
                }

                trackGaEvent('generate_lead', {
                    form_id: 'ai_mvp_contact',
                    lead_type: isBookingPolish && meetingPref === 'schedule' ? 'booking' : 'form'
                });

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
                trackGaEvent('contact_form_error', {
                    form_id: 'ai_mvp_contact',
                    error_type: 'network_error'
                });
                setFormStatus('送信に失敗しました。時間をおいて再度お試しください。', 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalLabel;
                }
            }
        });
    }

    // === Dynamic Volumetric Light Shafts Effect ===
    const initLightShafts = (canvasId) => {
        const lightCanvas = document.getElementById(canvasId);
        if (!lightCanvas) return;

        const ctx = lightCanvas.getContext('2d');
        const container = lightCanvas.parentElement;

        let width = lightCanvas.width = container.clientWidth;
        let height = lightCanvas.height = container.clientHeight;

        const handleResize = () => {
            if (!container) return;
            width = lightCanvas.width = container.clientWidth;
            height = lightCanvas.height = container.clientHeight;
        };
        window.addEventListener('resize', handleResize);

        // Define multiple light beam layers with unique angles, speeds, and phases for natural overlapping
        const beams = [
            { baseAngle: Math.PI * 0.5,   angleWidth: 0.18, maxAlpha: 0.12, speed: 0.42, phase: 0.0,  pulseSpeed: 0.45, pulsePhase: 0.0 }, // Center main (more visible)
            { baseAngle: Math.PI * 0.44,  angleWidth: 0.14, maxAlpha: 0.10, speed: 0.50, phase: 1.5,  pulseSpeed: 0.55, pulsePhase: 2.1 }, // Mid left
            { baseAngle: Math.PI * 0.56,  angleWidth: 0.16, maxAlpha: 0.10, speed: 0.35, phase: 3.1,  pulseSpeed: 0.38, pulsePhase: 0.8 }, // Mid right
            { baseAngle: Math.PI * 0.38,  angleWidth: 0.10, maxAlpha: 0.08, speed: 0.65, phase: 4.8,  pulseSpeed: 0.70, pulsePhase: 4.3 }, // Far left sharp beam
            { baseAngle: Math.PI * 0.62,  angleWidth: 0.11, maxAlpha: 0.08, speed: 0.55, phase: 0.9,  pulseSpeed: 0.62, pulsePhase: 1.7 }, // Far right sharp beam
            { baseAngle: Math.PI * 0.5,   angleWidth: 0.38, maxAlpha: 0.04, speed: 0.18, phase: 2.5,  pulseSpeed: 0.25, pulsePhase: 3.5 }  // Wide ambient glow
        ];

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Light source origin coordinates aligned to the doorway in the background image
            const cx = width * 0.5;
            const cy = height * 0.44;
            const R = Math.max(width, height) * 1.3;

            beams.forEach(beam => {
                const time = Date.now() * 0.001;

                // Drift the beam angle using sine wave (further increased for clear, beautiful movement)
                const angleCenter = beam.baseAngle + Math.sin(time * beam.speed + beam.phase) * 0.14;
                const a1 = angleCenter - beam.angleWidth * 0.5;
                const a2 = angleCenter + beam.angleWidth * 0.5;

                // Pulse the opacity (deeper contrast pulse range for dynamic visibility)
                const alpha = beam.maxAlpha * (0.5 + Math.sin(time * beam.pulseSpeed + beam.pulsePhase) * 0.5);

                // Create a radial gradient from the source doorway to the screen edge
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
                grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha})`);
                grad.addColorStop(0.2, `rgba(255, 255, 255, ${alpha * 0.75})`);
                grad.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.25})`);
                grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

                // Draw the light cone polygon
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1));
                ctx.lineTo(cx + R * Math.cos(a2), cy + R * Math.sin(a2));
                ctx.closePath();

                ctx.fillStyle = grad;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();
    };

    initLightShafts('hero-light-shafts');
    initLightShafts('problem-light-shafts');

    // --- Works Detail Tabs ---
    const worksTabs = document.querySelectorAll('.works-detail-tabs-v2 button[data-service]');
    const worksDetailMain = document.querySelector('.works-detail-main-v2');
    const worksDetails = {
        mcp: {
            title: 'Remote MCP Server',
            tag: 'AIエージェント連携基盤',
            lead: '自社サイトにRemote MCP Serverを本番実装。ChatGPTやClaudeなど外部のAIエージェントから、サービス検索・AI開発診断・相談要件の整理を直接実行できます。',
            images: [
                { src: 'images/mcp-architecture-diagram.webp', alt: 'Remote MCP Serverの構成図' }
            ],
            background: 'AIエージェントが企業サイトの情報を「読む」だけでなく「使える」状態にする取り組みです。<br><br>Streamable HTTP（JSON-RPC 2.0）でMCPエンドポイントを公開し、OpenAPI仕様とllms.txtもあわせて提供しています。<br><br>問い合わせ送信は、利用者の明示的な同意を確認したうえでのみ実行される設計にしています。',
            features: ['search_services', 'run_diagnosis', 'generate_project_brief', 'create_lead', 'get_company_profile'],
            stack: 'Streamable HTTP（JSON-RPC 2.0）<br>MCP Protocol 2025-03-26<br>Netlify Functions<br>OpenAPI / llms.txt 公開',
            period: '<strong>5つのMCPツールを公開</strong><br>Resources・Promptsの標準仕様にも対応',
            status: '本番運用中<br>ツールの追加と応答精度の改善を継続',
            href: 'mcp/',
            linkText: 'Remote MCPの仕様を見る'
        },
        omiotsuke: {
            title: '御御御付',
            tag: 'AI献立提案アプリ',
            lead: 'スマホで冷蔵庫の食材を撮るだけ。AIが食材を認識し、その日の一杯に合う味噌汁レシピと栄養バランスを提案するWebアプリ。',
            images: [
                { src: 'images/omiotsuke-step-home.png?v=20260723-v2', alt: '御御御付のホーム画面' },
                { src: 'images/omiotsuke-step-diagnosis.png?v=20260723-v2', alt: '食材を撮影して認識する画面' },
                { src: 'images/omiotsuke-step-builder.png?v=20260723-v2', alt: '具材を選んでレシピを組み立てる画面' },
                { src: 'images/omiotsuke-step-result.png?v=20260723-v2', alt: '提案されたレシピの結果画面' },
                { src: 'images/omiotsuke-step-nutrition.png?v=20260723-v2', alt: '栄養バランスの表示画面' }
            ],
            background: '冷蔵庫にある食材を撮影するだけ。<br><br>御御御付は、AIが写真から食材を認識し、登録済みの具材データをもとに味噌汁のレシピと栄養データを提案します。<br><br>AIの出力にはゆらぎがあるため、確信を持てなかった食材は「確認が必要な候補」としてUIに提示し、利用者が手動で選び直せる設計にしています。最終的な決定権を人に残すことで、認識ミスによる離脱を抑えています。',
            features: ['写真からの食材認識', '具材データとの照合・補正', 'レシピ提案', '栄養バランス表示', 'PWA対応'],
            stack: 'Next.js / TypeScript<br>Gemini API（画像解析）<br>具材マスタとのマッチングエンジン<br>栄養計算ロジック<br>PWA',
            period: '<strong>撮影・認識からレシピ提案までを実装</strong><br>具材マスタの拡充と認識精度の改善を継続中',
            status: '一般公開中<br>具材データの追加と提案ロジックの改善を継続',
            href: 'https://omiotsuke.spacegleam.co.jp/',
            linkText: '御御御付のサービスサイトを見る'
        },
        diffsense: {
            title: 'DIFFsense',
            tag: 'AI契約レビューSaaS',
            lead: '契約書の変更箇所を検出し、AIでリスク・要点・修正案を整理。電子署名や期限管理までつなげる契約業務SaaS。',
            images: [
                { src: 'images/diffsense-site-hero.webp?v=20260612-site', alt: 'DIFFsenseサービスサイトのファーストビュー' },
                { src: 'images/diffsense-site-one-step-analysis.webp?v=20260612-site', alt: '契約書取り込み一括生成画面' },
                { src: 'images/diffsense-site-dashboard.webp?v=20260612-site', alt: 'DIFFsenseダッシュボードのサービス画面' },
                { src: 'images/diffsense-ui-diff-latest.webp?v=20260612-ui', alt: '契約書差分比較画面' },
                { src: 'images/diffsense-ui-contracts-latest.webp?v=20260612-ui', alt: '契約書一覧画面' },
                { src: 'images/diffsense-ui-history-latest.webp?v=20260612-ui', alt: '解析履歴画面' },
                { src: 'images/diffsense-ui-alert-latest.webp?v=20260612-ui', alt: '期限アラート管理画面' },
                { src: 'images/diffsense-ui-signature-latest.webp?v=20260612-ui', alt: '署名管理画面' }
            ],
            background: '契約書をアップロードするだけ。<br><br>DIFFsenseは、AIによる要約、リスク分析、修正案の提案、契約期限の管理、電子署名、契約台帳への自動登録までを一括で実行します。<br><br>従来は複数のツールや担当者をまたいで行われていた契約業務を、ひとつの画面で完結できるよう設計されています。',
            features: ['契約書差分比較', 'AI要約・リスク判定', '修正案の生成', '電子署名', '期限・履歴管理', 'MCP連携'],
            stack: '静的フロントエンド<br>Firebase認証<br>バックエンドAPI連携<br>PDF / Word(.docx) / テキスト解析<br>決済連携',
            period: '<strong>LP・ダッシュボード・契約取込を実装</strong><br>差分比較、AI解析、電子署名UI、課金導線まで対応',
            status: '公開サイト・ダッシュボード・署名フローを実装済み<br>解析・比較・電子署名まわりを継続改善中',
            href: 'https://diffsense.spacegleam.co.jp/',
            linkText: 'DIFFsenseのサービスサイトを見る'
        },
        merki: {
            title: 'MERKI',
            tag: '通知システム',
            lead: '法律・制度の期限管理を自動化する通知サービス。',
            images: [
                { src: 'images/merki-site-hero.webp?v=20260613-site', alt: 'MERKIサービスサイトのファーストビュー' },
                { src: 'images/merki-site-flow.webp?v=20260613-site', alt: 'MERKIの導入フロー・使い方説明画面' },
                { src: 'images/merki-site-dashboard.webp?v=20260613-site', alt: 'MERKI期限管理ダッシュボードのサービス画面' }
            ],
            background: '制度変更や期限管理は確認漏れが起きやすく、担当者の手作業に依存しがちでした。情報収集から通知までを仕組み化し、必要な対応を見落とさない運用を支えるために開発しました。',
            features: ['法改正・期限の自動収集', 'カレンダー連携・通知', 'カスタムルール設定', 'チーム共有・権限管理'],
            stack: 'Next.js / TypeScript<br>通知ジョブ設計<br>データベース設計<br>メール通知 / カレンダー連携',
            period: '<strong>通知システム構築：約2週間</strong><br>運用しながら通知精度を改善',
            status: '期限管理・通知業務の省力化に活用<br>ルール追加と改善を継続',
            href: 'https://merki.spacegleam.co.jp/',
            linkText: 'MERKIのサービスサイトを見る'
        },
        xdraft: {
            title: 'XDraft',
            tag: 'アイデア整理ツール',
            lead: 'アイデア整理・構造化を効率化するデジタルツール。',
            images: [
                { src: 'images/xdraft-site-workspace.webp?v=20260613-site', alt: 'XDraftの投稿作成・編集画面ワークスペース' },
                { src: 'images/xdraft-site-features.webp?v=20260613-site', alt: 'XDraftの主な機能説明画面' }
            ],
            background: '事業アイデアや企画メモは散らばりやすく、次のアクションに落とし込みにくい課題があります。発想を階層化し、ドラフト化まで進めやすくするために開発しました。',
            features: ['アイデアの階層化・可視化', 'ドラフトの自動生成支援', 'タグ付け・関連付け', 'チームでの共同編集'],
            stack: 'Next.js / TypeScript<br>AI生成支援<br>構造化データ設計<br>チーム編集機能',
            period: '<strong>MVP開発：約1週間</strong><br>利用フィードバックをもとに改善',
            status: 'アイデア整理・企画作成の検証に活用<br>生成支援機能を継続改善',
            href: 'https://xdraft.spacegleam.co.jp/',
            linkText: 'XDraftのサービスサイトを見る'
        },

        misc: {
            title: 'その他プロダクト',
            tag: 'パーツ開発・受託',
            lead: 'LP、管理画面、データ構造化システム、決済導線などの実装知見を蓄積。',
            images: [
                { src: 'images/misc-app-development.webp?v=20260613-site', alt: 'スマホアプリ開発受託 of 紹介' },
                { src: 'images/misc-saas-development.webp?v=20260613-site', alt: 'SaaS開発受託 of 紹介' },
                { src: 'images/misc-web-development.webp?v=20260613-site', alt: 'ホームページ・LP制作 of 紹介' }
            ],
            background: '自社プロダクトで培った実装パターンを活かし、LP、管理画面、データ構造化、決済導線など、事業検証に必要な部品を短期間で構築しています。',
            features: ['LP / コーポレートサイト', '管理画面・ダッシュボード', 'データ構造化・可視化', '決済・外部サービス連携'],
            stack: 'HTML / CSS / JavaScript<br>Next.js / TypeScript<br>API連携<br>決済・認証・管理画面',
            period: '<strong>3日〜1週間</strong><br>要件に合わせて小さく実装',
            status: '新規事業・業務改善の検証部品として提供<br>必要に応じて継続開発へ拡張',
            href: 'contact.html',
            linkText: 'このような開発を相談する'
        }
    };

    let carouselInterval = null;

    const initCarousel = () => {
        if (carouselInterval) {
            clearInterval(carouselInterval);
            carouselInterval = null;
        }

        const carousel = document.querySelector('.works-detail-carousel');
        if (!carousel) return;

        const track = carousel.querySelector('.works-detail-carousel-track');
        const slides = carousel.querySelectorAll('.works-detail-carousel-slide');
        const dots = carousel.querySelectorAll('.carousel-dot');
        const prevBtn = carousel.querySelector('.prev-btn');
        const nextBtn = carousel.querySelector('.next-btn');

        if (!track || !slides.length) return;

        let currentIndex = 0;
        const totalSlides = slides.length;

        const updateCarousel = (index) => {
            currentIndex = (index + totalSlides) % totalSlides;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            slides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === currentIndex);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === currentIndex);
            });
        };

        const nextSlide = () => {
            updateCarousel(currentIndex + 1);
        };

        const prevSlide = () => {
            updateCarousel(currentIndex - 1);
        };

        const startTimer = () => {
            if (!carouselInterval) {
                carouselInterval = setInterval(nextSlide, 8000);
            }
        };

        const stopTimer = () => {
            if (carouselInterval) {
                clearInterval(carouselInterval);
                carouselInterval = null;
            }
        };

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            prevSlide();
            stopTimer();
            startTimer();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nextSlide();
            stopTimer();
            startTimer();
        });

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(dot.dataset.index, 10);
                updateCarousel(index);
                stopTimer();
                startTimer();
            });
        });

        carousel.addEventListener('mouseenter', stopTimer);
        carousel.addEventListener('mouseleave', startTimer);

        let startX = 0;
        let isSwiping = false;

        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiping = true;
            stopTimer();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            const diffX = e.changedTouches[0].clientX - startX;
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    prevSlide();
                } else {
                    nextSlide();
                }
            }
            isSwiping = false;
            startTimer();
        }, { passive: true });

        startTimer();
    };

    const renderWorksDetail = (key) => {
        const detail = worksDetails[key];
        if (!detail || !worksDetailMain) return;

        let shotHtml = '';
        let shotClass = '';

        if (detail.images && detail.images.length) {
            shotClass = ' works-detail-shot-carousel-v2';
            shotHtml = `
                <div class="works-detail-carousel">
                    <div class="works-detail-carousel-track">
                        ${detail.images.map((img, i) => `
                            <div class="works-detail-carousel-slide${i === 0 ? ' is-active' : ''}" data-index="${i}">
                                <img src="${img.src}" alt="${img.alt}">
                            </div>
                        `).join('')}
                    </div>
                    <button class="carousel-btn prev-btn" type="button" aria-label="前へ">‹</button>
                    <button class="carousel-btn next-btn" type="button" aria-label="次へ">›</button>
                    <div class="carousel-dots">
                        ${detail.images.map((_, i) => `
                            <span class="carousel-dot${i === 0 ? ' is-active' : ''}" data-index="${i}"></span>
                        `).join('')}
                    </div>
                    <div class="carousel-zoom-hint">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                        <span>クリックで拡大</span>
                    </div>
                </div>
            `;
        } else {
            const previewStrip = Array.isArray(detail.previewImages) && detail.previewImages.length
                ? `<div class="works-detail-shot-strip-v2" aria-hidden="true">${detail.previewImages.map(src => `<img src="${src}" alt="">`).join('')}</div>`
                : '';
            const isLogo = detail.image.includes('logo') || detail.image.includes('sate_logo') || detail.image.includes('conversion');
            shotClass = isLogo ? ' works-detail-shot-logo-v2' : (detail.previewImages ? ' works-detail-shot-diffsense-v2' : '');
            shotHtml = `<img src="${detail.image}" alt="${detail.imageAlt}">${previewStrip}`;
        }


        const hasSingleAction = detail.href === 'contact.html';
        const actionsHtml = hasSingleAction
            ? `<a class="works-detail-link-v2" href="${detail.href}">${detail.linkText} <span>→</span></a>`
            : `
                <a class="works-detail-link-v2" href="${detail.href}" target="_blank" rel="noopener noreferrer">${detail.linkText} <span>↗</span></a>
                <a class="works-detail-contact-v2" href="contact.html">このようなAI開発について無料で相談する <span>→</span></a>
            `;

        worksDetailMain.innerHTML = `
            <div class="works-detail-heading-v2">
                <div>
                    <h3>${detail.title} <span>${detail.tag}</span></h3>
                    <p>${detail.lead}</p>
                </div>
            </div>
            <div class="works-detail-body-v2">
                <div class="works-detail-shot-v2${shotClass}">${shotHtml}</div>
                <div class="works-detail-copy-v2">
                    <section><h4>開発の背景</h4><p>${detail.background}</p></section>
                    <section><h4>主な機能</h4><div class="works-detail-tags-v2">${detail.features.map(feature => `<span>${feature}</span>`).join('')}</div></section>
                </div>
            </div>
            <div class="works-detail-info-v2">
                <div><h4>公開可能な構成</h4><p>${detail.stack}</p></div>
                <div><h4>開発範囲</h4><p>${detail.period}</p></div>
                <div><h4>現在の状況</h4><p>${detail.status}</p></div>
            </div>
            <div class="works-detail-actions-v2${hasSingleAction ? ' has-single-action' : ''}">
                ${actionsHtml}
            </div>
        `;

        if (detail.images && detail.images.length) {
            initCarousel();
        }
    };

    const worksCards = document.querySelectorAll('.works-product-card-v2[data-service]');

    const switchWorksService = (serviceKey) => {
        worksTabs.forEach((item) => {
            if (item.dataset.service === serviceKey) {
                item.classList.add('is-active');
            } else {
                item.classList.remove('is-active');
            }
        });
        worksCards.forEach((item) => {
            if (item.dataset.service === serviceKey) {
                item.classList.add('is-active');
            } else {
                item.classList.remove('is-active');
            }
        });
        renderWorksDetail(serviceKey);
    };

    worksTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            switchWorksService(tab.dataset.service);
        });
    });

    worksCards.forEach((card) => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            switchWorksService(card.dataset.service);
        });
    });

    // --- Click-to-zoom with slide navigation for product screenshots ---
    const createImageLightbox = () => {
        const lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.innerHTML = `
            <button class="image-lightbox__close" type="button" aria-label="閉じる">×</button>
            <button class="image-lightbox__prev" type="button" aria-label="前へ">‹</button>
            <img class="image-lightbox__image" alt="">
            <button class="image-lightbox__next" type="button" aria-label="次へ">›</button>
            <div class="image-lightbox__counter"></div>
        `;
        document.body.appendChild(lightbox);

        const image = lightbox.querySelector('.image-lightbox__image');
        const counter = lightbox.querySelector('.image-lightbox__counter');
        const prevBtn = lightbox.querySelector('.image-lightbox__prev');
        const nextBtn = lightbox.querySelector('.image-lightbox__next');

        let images = [];
        let currentIdx = 0;

        const showSlide = (idx) => {
            currentIdx = (idx + images.length) % images.length;
            image.src = images[currentIdx].src;
            image.alt = images[currentIdx].alt || '';
            counter.textContent = images.length > 1 ? `${currentIdx + 1} / ${images.length}` : '';
            prevBtn.style.display = images.length > 1 ? 'inline-flex' : 'none';
            nextBtn.style.display = images.length > 1 ? 'inline-flex' : 'none';
        };

        const close = () => {
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            image.removeAttribute('src');
            image.alt = '';
            images = [];
        };

        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showSlide(currentIdx - 1); });
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showSlide(currentIdx + 1); });

        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox || event.target.closest('.image-lightbox__close')) close();
        });
        document.addEventListener('keydown', (event) => {
            if (!lightbox.classList.contains('is-open')) return;
            if (event.key === 'Escape') close();
            if (event.key === 'ArrowLeft') showSlide(currentIdx - 1);
            if (event.key === 'ArrowRight') showSlide(currentIdx + 1);
        });

        return {
            open(target) {
                // Collect all slides from the carousel if available
                const carousel = document.querySelector('.works-detail-carousel');
                if (carousel) {
                    const slideImgs = carousel.querySelectorAll('.works-detail-carousel-slide img');
                    images = Array.from(slideImgs).map(img => ({ src: img.currentSrc || img.src, alt: img.alt }));
                    const clickedSrc = target.currentSrc || target.src;
                    currentIdx = images.findIndex(img => img.src === clickedSrc);
                    if (currentIdx < 0) currentIdx = 0;
                } else {
                    images = [{ src: target.currentSrc || target.src, alt: target.alt || '' }];
                    currentIdx = 0;
                }
                showSlide(currentIdx);
                lightbox.classList.add('is-open');
                lightbox.setAttribute('aria-hidden', 'false');
            }
        };
    };

    const productImageLightbox = createImageLightbox();
    document.addEventListener('click', (event) => {
        const target = event.target.closest('.works-detail-shot-diffsense-v2 img, .works-detail-carousel-slide img');
        if (!target) return;
        productImageLightbox.open(target);
    });

    // Initialize carousel on load
    initCarousel();
    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');

        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('is-active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('is-active')) {
                    otherItem.classList.remove('is-active');
                    otherItem.querySelector('.faq-content').style.maxHeight = null;
                    otherItem.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
                }
            });

            if (isActive) {
                item.classList.remove('is-active');
                content.style.maxHeight = null;
                trigger.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('is-active');
                content.style.maxHeight = content.scrollHeight + 'px';
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Initialize default active FAQ item
    const activeFaqItem = document.querySelector('.faq-item.is-active');
    if (activeFaqItem) {
        const activeContent = activeFaqItem.querySelector('.faq-content');
        if (activeContent) {
            activeContent.style.maxHeight = activeContent.scrollHeight + 'px';
        }
    }

    window.addEventListener('resize', () => {
        const activeFaq = document.querySelector('.faq-item.is-active .faq-content');
        if (activeFaq) {
            activeFaq.style.maxHeight = activeFaq.scrollHeight + 'px';
        }
    });

    // Render whichever tab is marked active in the markup, so the highlighted
    // tab and the shown content never disagree. Falls back to the first tab.
    const initialWorksTab = document.querySelector('.works-detail-tabs-v2 button[data-service].is-active') || worksTabs[0];
    if (initialWorksTab) {
        switchWorksService(initialWorksTab.dataset.service);
    }
});

/* ===== Blog NEW badge on header nav ===== */
(function () {
    document.querySelectorAll('.nav a').forEach(function (a) {
        if (a.textContent.trim() === 'Blog' && !a.querySelector('.nav-new-badge')) {
            var b = document.createElement('span');
            b.className = 'nav-new-badge';
            b.textContent = '新着記事あり';
            a.appendChild(b);
        }
    });
})();

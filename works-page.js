document.addEventListener('DOMContentLoaded', () => {
    const worksTabs = document.querySelectorAll('.works-detail-tabs-v2 button[data-service]');
    const worksDetailMain = document.querySelector('.works-detail-main-v2');

    if (!worksDetailMain || !worksTabs.length) return;

    const worksDetails = {
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
            period: '<strong>本番運用を前提とした初期開発：約1週間</strong><br>利用フィードバックをもとに改善',
            status: 'アイデア整理・企画作成の検証に活用<br>生成支援機能を継続改善',
            href: 'https://xdraft.spacegleam.co.jp/',
            linkText: 'XDraftのサービスサイトを見る'
        },
        misc: {
            title: 'その他プロダクト',
            tag: 'パーツ開発・受託',
            lead: 'LP、管理画面、データ構造化システム、決済導線などの実装知見を蓄積。',
            images: [
                { src: 'images/misc-app-development.webp?v=20260613-site', alt: 'スマホアプリ開発受託の紹介' },
                { src: 'images/misc-saas-development.webp?v=20260613-site', alt: 'SaaS開発受託の紹介' },
                { src: 'images/misc-web-development.webp?v=20260613-site', alt: 'ホームページ・LP制作の紹介' }
            ],
            background: '自社プロダクトで培った実装パターンを活かし、LP、管理画面、データ構造化、決済導線など、事業検証に必要な部品を短期間で構築しています。',
            features: ['LP / コーポレートサイト', '管理画面・ダッシュボード', 'データ構造化・可視化', '決済・外部サービス連携'],
            stack: 'HTML / CSS / JavaScript<br>Next.js / TypeScript<br>API連携<br>決済・認証・管理画面',
            period: '<strong>3日〜1週間</strong><br>本番接続を見据えて優先範囲を実装',
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

        if (!track || !slides.length || !prevBtn || !nextBtn) return;

        let currentIndex = 0;
        const totalSlides = slides.length;

        const updateCarousel = (index) => {
            currentIndex = (index + totalSlides) % totalSlides;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            slides.forEach((slide, i) => slide.classList.toggle('is-active', i === currentIndex));
            dots.forEach((dot, i) => dot.classList.toggle('is-active', i === currentIndex));
        };

        const nextSlide = () => updateCarousel(currentIndex + 1);
        const prevSlide = () => updateCarousel(currentIndex - 1);

        const startTimer = () => {
            if (!carouselInterval) carouselInterval = setInterval(nextSlide, 8000);
        };

        const stopTimer = () => {
            if (!carouselInterval) return;
            clearInterval(carouselInterval);
            carouselInterval = null;
        };

        prevBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            prevSlide();
            stopTimer();
            startTimer();
        });

        nextBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            nextSlide();
            stopTimer();
            startTimer();
        });

        dots.forEach((dot) => {
            dot.addEventListener('click', (event) => {
                event.stopPropagation();
                updateCarousel(Number.parseInt(dot.dataset.index, 10));
                stopTimer();
                startTimer();
            });
        });

        carousel.addEventListener('mouseenter', stopTimer);
        carousel.addEventListener('mouseleave', startTimer);

        let startX = 0;
        let isSwiping = false;

        carousel.addEventListener('touchstart', (event) => {
            startX = event.touches[0].clientX;
            isSwiping = true;
            stopTimer();
        }, { passive: true });

        carousel.addEventListener('touchend', (event) => {
            if (!isSwiping) return;
            const diffX = event.changedTouches[0].clientX - startX;
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) prevSlide();
                else nextSlide();
            }
            isSwiping = false;
            startTimer();
        }, { passive: true });

        startTimer();
    };

    const renderWorksDetail = (key) => {
        const detail = worksDetails[key];
        if (!detail) return;

        const carouselHtml = `
            <div class="works-detail-carousel">
                <div class="works-detail-carousel-track">
                    ${detail.images.map((img, index) => `
                        <div class="works-detail-carousel-slide${index === 0 ? ' is-active' : ''}" data-index="${index}">
                            <img src="${img.src}" alt="${img.alt}" loading="lazy" decoding="async">
                        </div>
                    `).join('')}
                </div>
                <button class="carousel-btn prev-btn" type="button" aria-label="前へ">‹</button>
                <button class="carousel-btn next-btn" type="button" aria-label="次へ">›</button>
                <div class="carousel-dots">
                    ${detail.images.map((_, index) => `<span class="carousel-dot${index === 0 ? ' is-active' : ''}" data-index="${index}"></span>`).join('')}
                </div>
                <div class="carousel-zoom-hint">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    <span>クリックで拡大</span>
                </div>
            </div>
        `;

        const hasSingleAction = detail.href === 'contact.html';
        const actionsHtml = hasSingleAction
            ? `<a class="works-detail-link-v2" href="${detail.href}">${detail.linkText} <span>→</span></a>`
            : `
                <a class="works-detail-link-v2" href="${detail.href}" target="_blank" rel="noopener noreferrer">${detail.linkText} <span>↗</span></a>
                <a class="works-detail-contact-v2" href="contact.html">このようなAI活用案を聞く <span>→</span></a>
            `;

        worksDetailMain.innerHTML = `
            <div class="works-detail-heading-v2">
                <div>
                    <h3>${detail.title} <span>${detail.tag}</span></h3>
                    <p>${detail.lead}</p>
                </div>
            </div>
            <div class="works-detail-body-v2">
                <div class="works-detail-shot-v2 works-detail-shot-carousel-v2">${carouselHtml}</div>
                <div class="works-detail-copy-v2">
                    <section><h4>開発の背景</h4><p>${detail.background}</p></section>
                    <section><h4>主な機能</h4><div class="works-detail-tags-v2">${detail.features.map((feature) => `<span>${feature}</span>`).join('')}</div></section>
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

        initCarousel();
    };

    const worksCards = document.querySelectorAll('.works-product-card-v2[data-service]');

    const switchWorksService = (serviceKey) => {
        worksTabs.forEach((item) => item.classList.toggle('is-active', item.dataset.service === serviceKey));
        worksCards.forEach((item) => item.classList.toggle('is-active', item.dataset.service === serviceKey));
        renderWorksDetail(serviceKey);
    };

    worksTabs.forEach((tab) => {
        tab.addEventListener('click', () => switchWorksService(tab.dataset.service));
    });

    worksCards.forEach((card) => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('a')) return;
            switchWorksService(card.dataset.service);
        });
    });

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
        let currentIndex = 0;

        const showSlide = (index) => {
            if (!images.length) return;
            currentIndex = (index + images.length) % images.length;
            image.src = images[currentIndex].src;
            image.alt = images[currentIndex].alt || '';
            counter.textContent = images.length > 1 ? `${currentIndex + 1} / ${images.length}` : '';
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

        prevBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showSlide(currentIndex - 1);
        });
        nextBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showSlide(currentIndex + 1);
        });
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox || event.target.closest('.image-lightbox__close')) close();
        });
        document.addEventListener('keydown', (event) => {
            if (!lightbox.classList.contains('is-open')) return;
            if (event.key === 'Escape') close();
            if (event.key === 'ArrowLeft') showSlide(currentIndex - 1);
            if (event.key === 'ArrowRight') showSlide(currentIndex + 1);
        });

        return {
            open(target) {
                const carousel = document.querySelector('.works-detail-carousel');
                if (carousel) {
                    const slideImages = carousel.querySelectorAll('.works-detail-carousel-slide img');
                    images = Array.from(slideImages).map((img) => ({
                        src: img.currentSrc || img.src,
                        alt: img.alt
                    }));
                    const clickedSrc = target.currentSrc || target.src;
                    currentIndex = images.findIndex((img) => img.src === clickedSrc);
                    if (currentIndex < 0) currentIndex = 0;
                } else {
                    images = [{ src: target.currentSrc || target.src, alt: target.alt || '' }];
                    currentIndex = 0;
                }
                showSlide(currentIndex);
                lightbox.classList.add('is-open');
                lightbox.setAttribute('aria-hidden', 'false');
            }
        };
    };

    const productImageLightbox = createImageLightbox();
    document.addEventListener('click', (event) => {
        const target = event.target.closest('.works-detail-shot-diffsense-v2 img, .works-detail-carousel-slide img');
        if (target) productImageLightbox.open(target);
    });

    renderWorksDetail('diffsense');
});

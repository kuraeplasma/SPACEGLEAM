document.addEventListener('DOMContentLoaded', () => {
    const worksTabs = document.querySelectorAll('.works-detail-tabs-v2 button[data-service]');
    const worksDetailMain = document.querySelector('.works-detail-main-v2');

    if (!worksDetailMain || !worksTabs.length) return;

    const worksDetails = {
        mcp: {
            title: 'SPACE GLEAM Remote MCP',
            tag: 'Remote MCP / AIエージェント連携',
            lead: 'ChatGPTなどのAIエージェントから、Webサイトのサービス検索・AI開発診断・案件要件整理まで直接実行できるRemote MCP Serverを自社開発・本番運用。',
            images: [
                { src: 'images/mcp-architecture-diagram.png', alt: 'SPACE GLEAM Remote MCP 構成図' },
                { src: 'blog/chatgpt-remote-mcp-web-agent/card.png', alt: 'ChatGPTからWebサイトの機能を直接使う。SPACE GLEAMがRemote MCPを実装・実機検証' },
                { src: 'blog/website-mcp-chatgpt-integration/card.png', alt: '自社WebサイトをChatGPTから使えるようにするには？MCP対応でできること・導入方法・費用を解説' }
            ],
            background: '生成AIの利用が「質問に回答する」段階から、外部サービスやWebサイトの機能をAIエージェントが直接利用する段階へ移行していることを踏まえ、SPACE GLEAMのコーポレートサイト自体をRemote MCP対応しました。<br><br>単なる技術デモではなく、実際に運用しているサービス情報・AI開発診断・案件整理機能などをMCP Toolとして公開。<br><br>ChatGPTなどの対応クライアントからWebサイトを経由せず機能を利用できる構成を自社環境で設計・開発・本番運用しています。',
            features: ['サービス検索', 'AI開発無料診断', '案件要件の自動整理', '会社情報取得', 'ユーザー同意後の問い合わせ連携', 'Resources対応', 'Prompts対応', 'OpenAPI 3.1', 'llms.txt', 'AIエージェント連携'],
            mcpTools: [
                { name: 'search_services', desc: 'サービス・開発領域の検索' },
                { name: 'run_diagnosis', desc: 'AI開発無料診断' },
                { name: 'generate_project_brief', desc: '開発相談用の案件要件概要を生成' },
                { name: 'get_company_profile', desc: '会社情報・対応領域を取得' },
                { name: 'create_lead', desc: 'ユーザーの明示的同意後のみ問い合わせ送信' }
            ],
            resourcesPrompts: {
                resources: ['spacegleam://company', 'spacegleam://services', 'spacegleam://case-studies'],
                prompts: ['ai-development-diagnosis', 'ai-project-brief']
            },
            safety: 'READ系ToolとWRITE系Toolを分離。サービス検索・診断・案件整理などは外部への副作用が発生しないREAD系として提供。問い合わせ送信はWRITE系として分離し、consentConfirmedによるユーザーの明示的同意を必須としています。また、入力バリデーション、サニタイズ、IPレート制限、ペイロード上限、dryRunなどを実装しています。',
            verification: '実際のChatGPT環境へSPACE GLEAM Remote MCPを登録して実機検証済み。ChatGPTから「サービス検索 ➔ AI開発無料診断 ➔ 案件要件整理」まで実際にTool Callできることを確認しています。単なるMCP ServerのHTTP疎通確認ではなく、実際のAIクライアントから利用できるところまで検証した実績です。',
            stats: [
                { num: '5', label: 'Tools' },
                { num: '3', label: 'Resources' },
                { num: '2', label: 'Prompts' },
                { num: '稼働中', label: '本番Remote MCP Server' },
                { num: '確認済', label: 'ChatGPT実機 Tool Call' }
            ],
            stack: 'Remote MCP Server<br>Streamable HTTP<br>JSON-RPC 2.0<br>OpenAPI 3.1<br>llms.txt<br>Netlify Functions<br>REST API',
            period: '<strong>実運用サイトへのRemote MCP実装・本番稼働</strong><br>既存Webサービスからの機能切り出し・Tool化・実機検証まで完全対応',
            status: '本番Remote MCP Serverが正常稼働中<br>ChatGPT設定（Streamable HTTP）での接続・動作を検証済み',
            href: '/mcp/',
            linkText: 'MCP開発・連携ガイドを見る',
            contactText: 'MCP / AIエージェント連携について相談する',
            relatedArticles: [
                {
                    title: 'ChatGPTからWebサイトの機能を直接使う。SPACE GLEAMがRemote MCPを実装・実機検証',
                    url: '/blog/chatgpt-remote-mcp-web-agent/',
                    date: '2026.08.10',
                    img: '/blog/chatgpt-remote-mcp-web-agent/card.png'
                },
                {
                    title: '自社WebサイトをChatGPTから使えるようにするには？MCP対応でできること・導入方法・費用を解説',
                    url: '/blog/website-mcp-chatgpt-integration/',
                    date: '2026.08.13',
                    img: '/blog/website-mcp-chatgpt-integration/card.png'
                }
            ]
        },
        omiotsuke: {
            title: '御御御付',
            tag: '具材認識AI味噌汁診断',
            lead: '冷蔵庫の具材をスマホで撮るだけで、食材を認識し、今日作れる味噌汁のレシピと栄養情報を自動提案するサービス。',
            images: [
                { src: 'images/omiotsuke-ogp.png', alt: '御御御付サービスイメージ（OGP）' },
                { src: 'images/omiotsuke-step-home.png?v=20260723-v2', alt: 'アプリホーム画面' },
                { src: 'images/omiotsuke-step-diagnosis.png?v=20260723-v2', alt: '気分・体調の診断画面' },
                { src: 'images/omiotsuke-step-builder.png?v=20260723-v2', alt: '具材を自由に選ぶビルダー画面' },
                { src: 'images/omiotsuke-step-result.png?v=20260723-v2', alt: '診断結果のレシピ画面' },
                { src: 'images/omiotsuke-step-nutrition.png?v=20260723-v2', alt: 'レシピの詳細な栄養バランス画面' }
            ],
            background: '「冷蔵庫にある食材を使い切りたい」「今日の栄養バランスを考えたい」という日常の課題を解決するために開発。<br><br>スマホで写真を1枚撮るだけで食材を自動認識し、最適な味噌汁のレシピからカロリーや塩分などの栄養情報までを瞬時に提案する仕組みです。<br><br>気分や体調に合わせた「診断」機能や、好きな具材を自由に組み合わせる「ビルダー」機能も搭載しています。',
            features: ['写真から食材自動認識', '味噌汁レシピ自動生成', '栄養バランス・カロリー計算', '気分や体調に合わせた診断', 'お気に入り保存機能'],
            stack: 'Next.js / TypeScript<br>画像認識AI (Vision API / Gemini API)<br>栄養データベース設計<br>レスポンシブWebデザイン (TailwindCSS)',
            period: '<strong>具材自動認識とレシピ生成を実装</strong><br>LP、診断、ビルダー、お気に入り、および画像解析API連携まで対応',
            status: 'Web版・PWAをリリース済み<br>レシピ追加や認識精度向上、ネイティブアプリ化を計画・進行中',
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

        const statsHtml = detail.stats ? `
            <div class="mcp-stats-grid">
                ${detail.stats.map(s => `
                    <div class="mcp-stat-card">
                        <span class="mcp-stat-num">${s.num}</span>
                        <span class="mcp-stat-label">${s.label}</span>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const mcpExtraHtml = detail.mcpTools ? `
            <div class="mcp-extra-sections">
                <section class="mcp-tools-section">
                    <h4>実装済み MCP Tools</h4>
                    <div class="mcp-tools-list">
                        ${detail.mcpTools.map(t => `
                            <div class="mcp-tool-item">
                                <code class="mcp-tool-code">${t.name}</code>
                                <span class="mcp-tool-desc">${t.desc}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>
                <div class="mcp-two-col-section">
                    <section class="mcp-safety-section">
                        <h4>安全設計（READ / WRITE 分離）</h4>
                        <p>${detail.safety}</p>
                    </section>
                    <section class="mcp-verification-section">
                        <h4>ChatGPT実機検証結果</h4>
                        <p>${detail.verification}</p>
                    </section>
                </div>
            </div>
        ` : '';

        const relatedArticlesHtml = detail.relatedArticles ? `
            <div class="mcp-related-articles-wrap">
                <h4>MCP関連記事・実機検証記事</h4>
                <div class="mcp-related-articles-grid">
                    ${detail.relatedArticles.map(a => `
                        <a href="${a.url}" class="mcp-related-article-card">
                            <div class="mcp-related-article-img">
                                <img src="${a.img}" alt="${a.title}" loading="lazy">
                            </div>
                            <div class="mcp-related-article-body">
                                <time>${a.date}</time>
                                <h5>${a.title}</h5>
                                <span>記事を読む →</span>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        ` : '';

        const hasSingleAction = detail.href === 'contact.html';
        let actionsHtml = '';
        if (key === 'mcp') {
            actionsHtml = `
                <a class="works-detail-contact-v2" href="contact.html">${detail.contactText} <span>→</span></a>
                <a class="works-detail-link-v2" href="${detail.href}">${detail.linkText} <span>→</span></a>
            `;
        } else if (hasSingleAction) {
            actionsHtml = `<a class="works-detail-link-v2" href="${detail.href}">${detail.linkText} <span>→</span></a>`;
        } else {
            actionsHtml = `
                <a class="works-detail-link-v2" href="${detail.href}" target="_blank" rel="noopener noreferrer">${detail.linkText} <span>↗</span></a>
                <a class="works-detail-contact-v2" href="contact.html">このようなAI開発について無料で相談する <span>→</span></a>
            `;
        }

        worksDetailMain.innerHTML = `
            <div class="works-detail-heading-v2">
                <div>
                    <h3>${detail.title} <span>${detail.tag}</span></h3>
                    <p>${detail.lead}</p>
                </div>
            </div>
            ${statsHtml}
            <div class="works-detail-body-v2">
                <div class="works-detail-shot-v2 works-detail-shot-carousel-v2">${carouselHtml}</div>
                <div class="works-detail-copy-v2">
                    <section><h4>開発の背景</h4><p>${detail.background}</p></section>
                    <section><h4>主な機能</h4><div class="works-detail-tags-v2">${detail.features.map((feature) => `<span>${feature}</span>`).join('')}</div></section>
                </div>
            </div>
            ${mcpExtraHtml}
            <div class="works-detail-info-v2">
                <div><h4>公開可能な構成</h4><p>${detail.stack}</p></div>
                <div><h4>開発範囲</h4><p>${detail.period}</p></div>
                <div><h4>現在の状況</h4><p>${detail.status}</p></div>
            </div>
            ${relatedArticlesHtml}
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

    const activeTab = document.querySelector('.works-detail-tabs-v2 button.is-active');
    const defaultService = activeTab ? activeTab.dataset.service : 'mcp';
    renderWorksDetail(defaultService);
});

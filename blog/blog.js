(function () {
    const allPosts = window.SPACEGLEAM_BLOG_POSTS || [];
    const now = Date.now();
    const posts = allPosts.filter((post) => post.status !== 'draft' && (!post.publishAt || new Date(post.publishAt).getTime() <= now));
    const listRoot = document.querySelector('[data-blog-list]');
    const featuredRoot = document.querySelector('[data-featured-list]');
    const popularRoot = document.querySelector('[data-popular-list]');
    const searchInput = document.querySelector('[data-blog-search]');
    const countRoot = document.querySelector('[data-blog-count]');
    const categoryButtons = document.querySelectorAll('[data-category-filter]');
    const paginationRoot = document.querySelector('[data-blog-pagination]');
    const mailForms = document.querySelectorAll('.blog-mail-cta form');
    const heroVideo = document.querySelector('.blog-hero-video');
    const header = document.querySelector('.header');
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    const articleSlug = document.body.dataset.articleSlug;
    const perPage = 6;
    let currentPage = 1;
    let query = '';
    let activeCategory = 'All';

    const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
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

    const formatDate = (value) => {
        const date = new Date(`${value}T00:00:00+09:00`);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));

    const createShareMarkup = (post) => {
        const title = post?.title || document.title.replace(/\s*\|\s*SPACE GLEAM\s*$/, '');
        const url = post?.url || window.location.href;
        return `
            <div class="article-share" aria-label="記事を共有">
                <button type="button" class="article-share-icon is-x" aria-label="Xでシェア" title="Xでシェア" data-share data-share-title="${escapeHtml(title)}" data-share-url="${escapeHtml(url)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"></path></svg>
                </button>
                <a href="mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}" class="article-share-icon is-mail" aria-label="メールでシェア" title="メールでシェア">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v.4l8 5.15 8-5.15V7H4Zm0 2.78V17h16V9.78l-8 5.15-8-5.15Z"></path></svg>
                </a>
                <button type="button" class="article-share-icon" aria-label="URLをコピー" title="URLをコピー" data-copy-url="${escapeHtml(url)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9.5A1.5 1.5 0 0 1 10.5 8h8A1.5 1.5 0 0 1 20 9.5v8A1.5 1.5 0 0 1 18.5 19h-8A1.5 1.5 0 0 1 9 17.5v-8Z"></path><path d="M6 15H5.5A1.5 1.5 0 0 1 4 13.5v-8A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V6"></path></svg>
                </button>
            </div>`;
    };

    const ensureArticleParts = () => {
        if (!articleSlug) return;
        const article = document.querySelector('main article');
        const articleHeader = article?.querySelector('.article-header');
        const current = allPosts.find((post) => post.slug === articleSlug);

        if (articleHeader && !article.querySelector('.article-share')) {
            articleHeader.insertAdjacentHTML('afterend', createShareMarkup(current));
        }

        if (!document.querySelector('[data-related-posts]')) {
            const anchor = document.querySelector('.article-nav') || document.querySelector('.article-back-link');
            const section = document.createElement('section');
            section.className = 'related-section';
            section.innerHTML = '<h2>関連記事</h2><div class="related-grid" data-related-posts></div>';
            if (anchor) anchor.before(section);
            else (article || document.querySelector('main .container'))?.insertAdjacentElement('afterend', section);
        }
    };

    ensureArticleParts();
    const relatedRoot = document.querySelector('[data-related-posts]');
    const shareButtons = document.querySelectorAll('[data-share]');
    const copyButtons = document.querySelectorAll('[data-copy-url]');

    const blogPath = (value) => {
        if (!value || /^(https?:|mailto:|tel:|#)/.test(value)) return value;

        const prefix = articleSlug ? '../' : './';
        if (value.startsWith('/blog/')) {
            const localPath = `${prefix}${value.slice('/blog/'.length)}`;
            return value.endsWith('/') ? `${localPath}index.html` : localPath;
        }
        if (value.startsWith('/')) return `${articleSlug ? '../../' : '../'}${value.slice(1)}`;
        return value;
    };

    const postHref = (post) => escapeHtml(blogPath(`/blog/${post.slug}/`));

    const normalizeArticleCta = () => {
        if (!articleSlug || articleSlug === 'free-ai-development-diagnosis') return;
        const cta = document.querySelector('.article-cta');
        if (!cta) return;

        cta.className = 'blog-diagnosis-embed';
        cta.id = 'blogDiagnosisWrapper';
        cta.setAttribute('aria-label', '無料AI開発診断');
        cta.innerHTML = '';

        document.documentElement.classList.add('diag-enabled');
        if (!document.querySelector('script[data-blog-diagnosis]')) {
            const script = document.createElement('script');
            script.src = blogPath('/diagnosis.js');
            script.defer = true;
            script.dataset.blogDiagnosis = 'true';
            document.body.appendChild(script);
        }
    };

    normalizeArticleCta();

    const compactDate = (value) => formatDate(value).replace(/年|月/g, '.').replace('日', '');

    const createThumbnail = (post, className) => {
        if (!post.thumbnail) {
            return `<div class="${className} is-fallback-thumb" aria-hidden="true"></div>`;
        }

        const src = escapeHtml(blogPath(post.thumbnail));
        const alt = escapeHtml(post.title || '');
        return `
            <div class="${className}">
                <img src="${src}" alt="${alt}" width="600" height="315" loading="lazy" decoding="async" onerror="if(!this.dataset.retry){this.dataset.retry='1';if(/\.webp/i.test(this.src)){this.src=this.src.replace(/\.webp/i,'.png');}else if(/\.png/i.test(this.src)){this.src=this.src.replace(/\.png/i,'.webp');}else{this.parentElement.classList.add('is-fallback-thumb');this.style.display='none';}}else{this.parentElement.classList.add('is-fallback-thumb');this.style.display='none';}">
            </div>
        `;
    };

    const createFeaturedCard = (post, index) => `
        <article class="blog-featured-card ${index === 0 ? 'is-primary' : ''}">
            <a href="${postHref(post)}" aria-label="${escapeHtml(post.title)}を読む">
                ${createThumbnail(post, 'blog-card-art')}
                <div class="blog-featured-body">
                    <div class="blog-card-meta">
                        <time datetime="${escapeHtml(post.date)}">${compactDate(post.date)}</time>
                        <span>${escapeHtml(post.category)}</span>
                    </div>
                    <h2>${escapeHtml(post.title)}</h2>
                    <p>${escapeHtml(post.excerpt)}</p>
                    <strong>Read More <span aria-hidden="true">→</span></strong>
                </div>
            </a>
        </article>
    `;

    const createLatestRow = (post) => `
        <article class="blog-latest-row">
            <a href="${postHref(post)}" aria-label="${escapeHtml(post.title)}を読む">
                ${createThumbnail(post, 'blog-latest-thumb')}
                <time datetime="${escapeHtml(post.date)}">${compactDate(post.date)}</time>
                <span>${escapeHtml(post.category)}</span>
                <h2>${escapeHtml(post.title)}</h2>
                <em aria-hidden="true">→</em>
            </a>
        </article>
    `;

    const createPopularRow = (post, index) => `
        <a class="blog-popular-row" href="${postHref(post)}">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div>
                <strong>${escapeHtml(post.title)}</strong>
                <small>${compactDate(post.date)} / ${escapeHtml(post.category)}</small>
            </div>
        </a>
    `;

    const createCard = (post, index) => `
        <article class="blog-card">
            <a class="blog-card-link" href="${postHref(post)}" aria-label="${escapeHtml(post.title)}を読む">
                <div class="blog-card-image">
                    ${post.thumbnail ? `<img src="${escapeHtml(blogPath(post.thumbnail))}" alt="" width="600" height="315" loading="lazy" decoding="async">` : '<div class="blog-card-image-placeholder" aria-hidden="true"></div>'}
                    <time class="blog-card-date" datetime="${escapeHtml(post.date)}">${compactDate(post.date)}</time>
                </div>
                <div class="blog-card-body">
                    <span class="blog-card-tagrow">
                        <span class="blog-card-tag">${escapeHtml(post.category)}</span>
                        ${index === 0 && currentPage === 1 ? '<span class="blog-card-badge">新着</span>' : ''}
                    </span>
                    <h2>${escapeHtml(post.title)}</h2>
                    <p>${escapeHtml(post.excerpt)}</p>
                    <span class="blog-card-more">続きを見る<em aria-hidden="true">→</em></span>
                </div>
            </a>
        </article>
    `;
    const renderList = () => {
        if (!listRoot && !featuredRoot && !popularRoot) return;
        const filtered = posts.filter((post) => {
            const matchesQuery = post.title.toLowerCase().includes(query.toLowerCase());
            const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
            return matchesQuery && matchesCategory;
        });
        const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
        currentPage = Math.min(currentPage, pageCount);
        const start = (currentPage - 1) * perPage;
        const visible = filtered.slice(start, start + perPage);

        if (featuredRoot) {
            featuredRoot.innerHTML = filtered.length
                ? filtered.slice(0, 3).map(createFeaturedCard).join('')
                : '<p class="blog-empty">該当する記事はありません。</p>';
        }

        if (listRoot) {
            const renderer = listRoot.classList.contains('blog-latest-list') ? createLatestRow : createCard;
            listRoot.innerHTML = visible.length
                ? visible.map(renderer).join('')
                : '<p class="blog-empty">該当する記事はありません。</p>';
        }

        if (countRoot) {
            countRoot.textContent = `${filtered.length}件の記事`;
        }

        if (popularRoot) {
            const popularPosts = posts
                .slice()
                .sort((a, b) => {
                    const aTime = new Date(a.publishAt || `${a.date}T00:00:00+09:00`).getTime();
                    const bTime = new Date(b.publishAt || `${b.date}T00:00:00+09:00`).getTime();
                    return bTime - aTime;
                })
                .slice(0, 5);
            popularRoot.innerHTML = popularPosts.map(createPopularRow).join('');
        }

        if (!paginationRoot) return;
        paginationRoot.innerHTML = '';
        if (pageCount <= 1) return;

        for (let index = 1; index <= pageCount; index += 1) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = String(index);
            button.className = index === currentPage ? 'is-active' : '';
            button.setAttribute('aria-label', `${index}ページ目を表示`);
            button.addEventListener('click', () => {
                currentPage = index;
                renderList();
                (listRoot || featuredRoot).scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            paginationRoot.appendChild(button);
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            query = event.target.value.trim();
            currentPage = 1;
            renderList();
        });
    }

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeCategory = button.dataset.categoryFilter || 'All';
            categoryButtons.forEach((item) => item.classList.toggle('is-active', item === button));
            currentPage = 1;
            renderList();
        });
    });

    const renderRelated = () => {
        if (!relatedRoot || !articleSlug) return;
        const current = posts.find((post) => post.slug === articleSlug);
        const related = posts
            .filter((post) => post.slug !== articleSlug)
            .sort((a, b) => Number(b.category === current?.category) - Number(a.category === current?.category))
            .slice(0, 3);

        relatedRoot.innerHTML = related.map((post) => `
            <a class="related-card" href="${postHref(post)}" aria-label="${escapeHtml(post.title)}を読む">
                ${post.thumbnail
                    ? `<img src="${escapeHtml(blogPath(post.thumbnail))}" alt="${escapeHtml(post.title)}" width="600" height="315" loading="lazy" decoding="async">`
                    : '<span class="related-card-placeholder" aria-hidden="true"></span>'}
            </a>
        `).join('');
    };

    renderList();
    renderRelated();

    shareButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const title = button.dataset.shareTitle || document.title;
            const url = button.dataset.shareUrl || window.location.href;
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer,width=720,height=520');
        });
    });

    copyButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const url = button.dataset.copyUrl || window.location.href;
            const label = button.getAttribute('aria-label') || button.title || 'URLをコピー';
            try {
                await navigator.clipboard.writeText(url);
                button.classList.add('is-copied');
                button.setAttribute('aria-label', 'コピーしました');
                button.title = 'コピーしました';
                window.setTimeout(() => {
                    button.classList.remove('is-copied');
                    button.setAttribute('aria-label', label);
                    button.title = label;
                }, 1800);
            } catch (_) {
                window.prompt('URLをコピーしてください', url);
            }
        });
    });

    const setNewsletterStatus = (form, message, state) => {
        const status = form.querySelector('[data-newsletter-status]');
        if (!status) return;
        status.textContent = message;
        status.dataset.state = state || '';
    };

    mailForms.forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const button = form.querySelector('button');
            const emailInput = form.querySelector('input[type="email"]');
            const websiteInput = form.querySelector('input[name="website"]');
            const email = emailInput ? emailInput.value.trim() : '';
            if (!button || !emailInput) return;

            if (!emailInput.checkValidity()) {
                emailInput.reportValidity();
                return;
            }

            button.disabled = true;
            button.textContent = '登録中';
            setNewsletterStatus(form, '登録しています。', 'pending');

            try {
                const response = await fetch('/.netlify/functions/blog-subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        website: websiteInput ? websiteInput.value : '',
                        source: 'blog-top'
                    })
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok || result.success === false) {
                    throw new Error(result.message || '登録に失敗しました。');
                }
                setNewsletterStatus(form, result.message || '登録しました。', 'success');
                form.reset();
            } catch (error) {
                const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
                if (isLocal) {
                    try {
                        const key = 'spacegleam_blog_subscribers';
                        const saved = JSON.parse(window.localStorage.getItem(key) || '[]');
                        if (!saved.includes(email)) {
                            saved.push(email);
                            window.localStorage.setItem(key, JSON.stringify(saved));
                        }
                        setNewsletterStatus(form, 'ローカルで登録しました。', 'success');
                        form.reset();
                    } catch (_) {
                        setNewsletterStatus(form, error.message || '登録に失敗しました。', 'error');
                    }
                } else {
                    setNewsletterStatus(form, error.message || '登録に失敗しました。時間をおいて再度お試しください。', 'error');
                }
            } finally {
                button.disabled = false;
                button.innerHTML = '登録する<span aria-hidden="true">→</span>';
            }
        });
    });

    if (heroVideo) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const saveData = navigator.connection?.saveData;
        const loadHeroVideo = () => {
            const src = heroVideo.dataset.videoSrc;
            if (!src || reducedMotion || saveData) return;
            const source = document.createElement('source');
            source.src = src;
            source.type = 'video/mp4';
            heroVideo.appendChild(source);
            heroVideo.removeAttribute('data-video-src');
            heroVideo.load();
            heroVideo.playbackRate = 0.45;
            heroVideo.play().catch(() => {});
        };
        window.addEventListener('load', () => {
            if ('requestIdleCallback' in window) window.requestIdleCallback(loadHeroVideo, { timeout: 1800 });
            else window.setTimeout(loadHeroVideo, 600);
        }, { once: true });
    }
}());




const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const failures = [];

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludes(file, haystack, needle, label = needle) {
  if (!haystack.includes(needle)) {
    failures.push(`${file}: missing ${label}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === '.git' ||
        entry.name === 'node_modules' ||
        entry.name === 'spacegleam_deploy' ||
        entry.name.startsWith('spacegleam_release_') ||
        entry.name.startsWith('_') ||
        entry.name.startsWith('Backup_')
      ) {
        return [];
      }
      return walk(full);
    }
    return [full];
  });
}

const indexHtml = read('index.html');
const worksHtml = read('works.html');
const styleCss = read('style.css');
const scriptJs = read('script.js');

for (const [file, content] of [
  ['index.html', indexHtml],
  ['works.html', worksHtml],
]) {
  assertIncludes(file, content, 'works-ui-restore-20260629-v1', 'current works cache buster');
  assertIncludes(file, content, 'AI開発事例・AIシステム開発実績', 'works section title');
  assertIncludes(file, content, 'works-detail-panel-v2', 'new works detail panel');
  assertIncludes(file, content, 'AI開発について無料で相談する', 'normalized header CTA text');
}

for (const href of ['services.html', 'pricing.html', 'works.html', 'faq.html']) {
  assertIncludes('index.html', indexHtml, `href="${href}"`, `header/page link ${href}`);
}

assertIncludes('style.css', styleCss, '.works-detail-panel-v2', 'new works CSS');

const requiredImages = [
  'images/diffsense-site-hero.webp',
  'images/diffsense-site-one-step-analysis.webp',
  'images/diffsense-site-dashboard.webp',
  'images/diffsense-ui-diff-latest.webp',
  'images/diffsense-ui-contracts-latest.webp',
  'images/diffsense-ui-history-latest.webp',
  'images/diffsense-ui-alert-latest.webp',
  'images/diffsense-ui-signature-latest.webp',
  'images/merki-site-hero.webp',
  'images/merki-site-flow.webp',
  'images/merki-site-dashboard.webp',
  'images/xdraft-site-workspace.webp',
  'images/xdraft-site-features.webp',
  'images/misc-app-development.webp',
  'images/misc-saas-development.webp',
  'images/misc-web-development.webp',
  'images/misc-saas-development-cropped.webp',
];

for (const image of requiredImages) {
  if (!fs.existsSync(path.join(root, image))) {
    failures.push(`missing image asset: ${image}`);
  }
}

const assetRefs = `${indexHtml}\n${worksHtml}\n${styleCss}\n${scriptJs}`.matchAll(
  /(?:src|href)\s*=\s*["']([^"']+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^"']*)?)["']|url\(["']?([^)"']+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^)"']*)?)["']?\)/gi
);

for (const match of assetRefs) {
  const ref = (match[1] || match[2] || '').split('?')[0];
  if (/^(?:https?:)?\/\//.test(ref) || ref.startsWith('data:') || ref.startsWith('/')) continue;
  if (!fs.existsSync(path.join(root, ref))) {
    failures.push(`broken asset reference: ${ref}`);
  }
}

for (const filePath of walk(root)) {
  if (!/\.(?:html|js)$/.test(filePath)) continue;
  const relative = path.relative(root, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  if (/class=["'][^"']*header-cta[^"']*["'][^>]*>[^<]*(?:AI活用案を無料で聞く|AI活用案を聞く|AI活用案を無料で相談する)/.test(content)) {
    failures.push(`${relative}: old header CTA text`);
  }

  // 自動検査ガード1: 長文に対する nowrap 乱用チェック (12文字以上の nowrap はスマホで横はみ出し原因)
  const nowrapMatches = content.matchAll(/<span\s+class=["'][^"']*nowrap[^"']*["'][^>]*>([^<]{12,})<\/span>/gi);
  for (const match of nowrapMatches) {
    if (!match[0].includes('最大') && !match[0].includes('97.5%')) {
      failures.push(`${relative}: long text inside .nowrap ("${match[1].slice(0, 15)}...") will overflow on mobile screen`);
    }
  }
}

// 自動検査ガード3: ブログ記事サムネイル画像存在検証 (PNG & WEBPの物理ファイル実在チェック)
const postsJsPath = path.join(root, 'blog', 'posts.js');
if (fs.existsSync(postsJsPath)) {
  const postsContent = fs.readFileSync(postsJsPath, 'utf8');
  const thumbnailMatches = postsContent.matchAll(/thumbnail:\s*['"]([^'"]+)['"]/g);
  for (const match of thumbnailMatches) {
    const rawPath = match[1].split('?')[0]; // Remove query strings like ?v=2
    const relPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    const fullImgPath = path.join(root, relPath);
    if (!fs.existsSync(fullImgPath)) {
      failures.push(`posts.js: thumbnail image file missing at ${relPath}`);
    }
    // PNG/WEBP 対で存在しているかチェック
    const altExt = relPath.endsWith('.webp') ? relPath.replace(/\.webp$/i, '.png') : relPath.replace(/\.png$/i, '.webp');
    if (!fs.existsSync(path.join(root, altExt))) {
      failures.push(`posts.js: missing fallback image pair for ${relPath} (expected ${altExt})`);
    }
  }
}

// 自動検査ガード2: style.css 内のレスポンシブ競合・非柔軟指定チェック
const currentStyleCss = read('style.css');
if (currentStyleCss) {
  // ① ハンバーガーボタン (nav-toggle) が表示可能になっているかチェック
  if (!currentStyleCss.includes('.nav-toggle') || !currentStyleCss.includes('navNewBlink')) {
    failures.push('style.css: missing critical responsive navigation styles');
  }

  // ② works-detail-tabs-v2 で 4列固定などの非可変指定がないかチェック
  if (/\.works-detail-tabs-v2\s*\{[^}]*grid-template-columns:\s*repeat\([345],/i.test(currentStyleCss)) {
    failures.push('style.css: .works-detail-tabs-v2 uses hardcoded repeat column count, will break when product tabs change');
  }
}

if (failures.length) {
  console.error('Spacegleam site integrity check failed:');
  for (const failure of failures) console.error(`- ${failure}`);

  // エラー時に contact@spacegleam.co.jp へアラートメールを直接即時送信
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL || 'contact@spacegleam.co.jp';

  if (apiKey) {
    const errorBody = failures.map((f) => `- ${f}`).join('\n');
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'SPACE GLEAM Monitor <noreply@send.spacegleam.co.jp>',
        to: [notifyEmail],
        subject: '【緊急アラート】サイト整合性チェックでエラーが検出されました',
        text: `SPACE GLEAM サイト整合性チェックでエラーが発生しました。\n\n検出対象: ${root}\n日時: ${new Date().toISOString()}\n\nエラー詳細:\n${errorBody}\n\n※ビルド/デプロイは未然にブロックされました。`
      })
    }).catch(() => null);
  }

  process.exit(1);
}

console.log(`Spacegleam site integrity check passed for ${root}`);

/* =====================================================================
 * SPACE GLEAM — AI開発診断（ローカルのみ / html.diag-enabled）
 * 仕様: docs/ai-diagnosis-spec.md（設問6問・結果6パターン P1〜P6）
 * 既存 .diag-* CSS を利用し、不足する構造スタイルのみ本ファイルで補完注入。
 * ===================================================================== */
(function () {
  'use strict';

  /* ---------------- データ（仕様書 §2・§5・§4） ---------------- */
  var QUESTIONS = [
    { id: 'q1', title: 'いま一番作りたいものは？', options: [
      { id: 'q1a', label: 'AIを使った業務システム（社内の効率化）', tags: ['gyomu','ai'] },
      { id: 'q1b', label: '新しいSaaS・Webサービス（外部提供・収益化）', tags: ['saas','revenue'] },
      { id: 'q1c', label: '社内ツール・作業の自動化', tags: ['internal','automation'] },
      { id: 'q1d', label: 'LP・コーポレートサイト・予約/問い合わせ系', tags: ['web'] },
      { id: 'q1e', label: 'まだ決まっていない／相談しながら決めたい', tags: ['undecided'] }
    ]},
    { id: 'q2', title: 'AIで実現したいことは？', options: [
      { id: 'q2a', label: '手作業・定型業務の自動化', tags: ['automation'] },
      { id: 'q2b', label: '文章/資料/提案の生成・要約', tags: ['genai'] },
      { id: 'q2c', label: '問い合わせ・接客対応（チャットボット等）', tags: ['support'] },
      { id: 'q2d', label: 'データ分析・予測・可視化', tags: ['data'] },
      { id: 'q2e', label: '新規事業の検証・収益化', tags: ['revenue'] },
      { id: 'q2f', label: '未定', tags: ['undecided'] }
    ]},
    { id: 'q3', title: 'いまのフェーズは？', options: [
      { id: 'q3a', label: 'アイデア段階（要件はこれから）', tags: ['idea'] },
      { id: 'q3b', label: 'やりたいことは固まっている', tags: ['defined'] },
      { id: 'q3c', label: '既存システム／サービスの改善・機能追加', tags: ['existing'] },
      { id: 'q3d', label: 'PoC・試作は済み。本番開発したい', tags: ['poc'] }
    ]},
    { id: 'q4', title: '希望のスピード感は？', options: [
      { id: 'q4a', label: 'とにかく早く（2〜4週間で形にしたい）', tags: ['fast'] },
      { id: 'q4b', label: '1〜2ヶ月', tags: ['mid'] },
      { id: 'q4c', label: '3ヶ月以上でじっくり', tags: ['slow'] },
      { id: 'q4d', label: '未定', tags: ['undecided'] }
    ]},
    { id: 'q5', title: '予算感は？（任意）', options: [
      { id: 'q5a', label: '〜50万円', tags: ['b_low'] },
      { id: 'q5b', label: '50〜100万円', tags: ['b_mid'] },
      { id: 'q5c', label: '100〜300万円', tags: ['b_high'] },
      { id: 'q5d', label: '300万円以上', tags: ['b_xhigh'] },
      { id: 'q5e', label: '未定／相談したい', tags: ['b_undecided'] }
    ]},
    { id: 'q6', title: '社内の開発体制は？', options: [
      { id: 'q6a', label: '社内に開発できる人がいない（すべてお任せしたい）', tags: ['outsource'] },
      { id: 'q6b', label: '一部内製できる（協業したい）', tags: ['hybrid'] },
      { id: 'q6c', label: '内製中だが手が足りない', tags: ['overflow'] }
    ]}
  ];

  var PATTERNS = {
    P1: { name: '初期リリース・スモールスタート型', cost: '25万〜60万円', period: '最短2〜4週間',
      summary: '中核機能だけに絞って本番品質で素早く公開し、反応を見ながら磨き込むタイプです。',
      features: ['中核機能に集中', '本番品質で公開', '素早い市場検証', 'そのまま拡張可能'],
      kReduce: '約30%', kRoi: '約4.5ヶ月', kScope: '1〜3機能',
      approach: 'まずは中核機能だけに絞り、本番品質で素早く公開。市場やユーザーの反応を見ながら磨き込みます。作り捨ての試作ではなく、そのまま育てられる形で立ち上げます。',
      tech: 'Next.js / TypeScript・OpenAI API・Supabase・Vercel',
      comment: '速さより“正しい方向に最初から作る”ことを一緒に見極めます。' },
    P2: { name: '業務システム自動化型', cost: '50万〜150万円', period: '3〜6週間',
      summary: '属人化・手作業の工程を洗い出し、AIとシステムで自動化することで、業務効率を大きく向上させるタイプです。',
      features: ['属人化の解消', '業務の自動化', '管理画面の構築', '通知・アラート連携'],
      kReduce: '約42%', kRoi: '約6.8ヶ月', kScope: '5〜12業務',
      approach: '属人化・手作業の工程を洗い出し、効果の大きい業務からAIで自動化。管理画面・権限・通知まで、実運用に耐える形で構築します。',
      tech: 'Next.js / TypeScript・OpenAI API・PostgreSQL/Supabase・各種業務API連携',
      comment: '“何を自動化すると一番効くか”の設計からご一緒します。' },
    P3: { name: 'SaaS・新規プロダクト型', cost: '100万〜300万円', period: '1〜3ヶ月',
      summary: '収益化を見据えて認証・決済・課金まで設計し、小さく公開して伸ばしていくタイプです。',
      features: ['認証・決済の実装', '課金・サブスク導線', 'スケール設計', '継続的な改善'],
      kReduce: '約35%', kRoi: '約8ヶ月', kScope: '収益化対応',
      approach: '収益化を見据え、認証・決済・課金導線まで含めて初期版を設計。小さく公開して検証し、伸ばせる土台を作ります。',
      tech: 'Next.js / TypeScript・OpenAI API・Supabase/PostgreSQL・Stripe・Clerk・AWS',
      comment: '自社でSaaSを開発・運営している知見を、そのまま設計に反映します。' },
    P4: { name: 'AI機能組み込み型', cost: '50万〜200万円', period: '3週間〜2ヶ月',
      summary: '既存システムやデータを活かし、必要な箇所にAIを組み込んで段階的に改善するタイプです。',
      features: ['既存システム連携', 'AI要約・分類・予測', 'データ可視化', '段階的に拡張'],
      kReduce: '約38%', kRoi: '約5ヶ月', kScope: '既存に追加',
      approach: '既存システムやデータを活かし、必要な箇所にAI（要約・分類・予測・チャット）を組み込みます。まず小さく試し、効果を確認しながら拡張します。',
      tech: 'OpenAI API・既存システム連携・データパイプライン・可視化基盤',
      comment: '“AIを足す”前に、どこに足すと効くかを一緒に見極めます。' },
    P5: { name: '商用公開・事業化型', cost: '100万〜300万円', period: '1〜3ヶ月',
      summary: '検証済みのプロダクトを商用レベルで公開し、事業として継続・拡大できる体制まで引き上げるタイプです。',
      features: ['商用品質へ強化', '認証・決済・権限', 'スケール・冗長化', 'セキュリティ強化'],
      kReduce: '約40%', kRoi: '約9ヶ月', kScope: '商用公開対応',
      approach: '検証済みの仕組みを、商用公開に耐える本番品質へ。認証・決済・スケール・セキュリティ・運用体制まで固めて、事業として回せる形にします。',
      tech: 'Next.js / TypeScript・OpenAI API・PostgreSQL・AWS・Stripe/Clerk',
      comment: '“動くデモ”と“事業として運用できる本番”の差を、実運用経験から埋めます。' },
    P6: { name: '要件整理・相談スタート型', cost: 'まずは無料相談から', period: '相談30分 → 最短2〜4週間',
      summary: 'まだ固まっていなくても大丈夫。何を・誰のために・どこから作るかを一緒に整理するタイプです。',
      features: ['要件の整理', '優先順位づけ', '最適構成の提案', '最初の一歩を定義'],
      kReduce: '', kRoi: '', kScope: '',
      approach: 'まだ固まっていなくても大丈夫です。何を・誰のために・どこから作るかを一緒に整理し、最初の一歩を定義します。',
      tech: '要件に応じて最適構成を提案',
      comment: '技術の話の前に、“事業として何を検証したいか”からご一緒できます。' }
  };

  function resolvePattern(tags) {
    var has = function (t) { return tags.indexOf(t) !== -1; };
    var undecidedCount = tags.filter(function (t) { return t === 'undecided' || t === 'b_undecided'; }).length;
    if (undecidedCount >= 2 || (has('idea') && has('b_undecided'))) return 'P6';
    if (has('poc')) return 'P5';
    if (has('saas') || has('revenue')) return 'P3';
    if (has('existing') || has('data')) return 'P4';
    if (has('gyomu') || has('internal') || has('automation')) return 'P2';
    return 'P1';
  }

  var STORE_KEY = 'diag_answers';
  var CARD_HIDDEN_KEY = 'diag_card_hidden';
  var CONTACT_URL = 'index.html#contact';
  // 診断パターン → 専用提案資料(PDF)
  var ASSET = {
    P1: 'assets/diagnosis/p1.pdf', P2: 'assets/diagnosis/p2.pdf', P3: 'assets/diagnosis/p3.pdf',
    P4: 'assets/diagnosis/p4.pdf', P5: 'assets/diagnosis/p5.pdf', P6: 'assets/diagnosis/p6.pdf'
  };
  var LEAD_ENDPOINT = '/.netlify/functions/diagnosis-lead';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------------- GA4 計測（gtag: G-1T9HP3BLMP） ---------------- */
  // 「どこまでやったか」「どんな人か（回答内容）」をGAイベントで取得。
  // ※個人情報(氏名・メール)はGAへ送らない（has_company等のフラグと回答ラベルのみ）。
  var diagMaxStep = 0;
  var diagCompleted = false;
  function track(name, params) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
      else { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, params || {})); }
    } catch (e) {}
  }
  function answerLabel(qid, optId) {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (QUESTIONS[i].id === qid) {
        for (var j = 0; j < QUESTIONS[i].options.length; j++) {
          if (QUESTIONS[i].options[j].id === optId) return QUESTIONS[i].options[j].label;
        }
      }
    }
    return optId;
  }
  function answersParams() {
    var p = {};
    for (var i = 0; i < QUESTIONS.length; i++) {
      var q = QUESTIONS[i];
      if (answers[q.id]) p[q.id + '_label'] = answerLabel(q.id, answers[q.id]);
    }
    return p;
  }

  // 「この資料でわかること」= 実際の提案資料「AI開発計画書に含まれる構成」（全6パターン共通）
  // 出典: AIkaiseki/*.pptx 最終スライド「AI開発計画書に含まれる構成」
  var DOC_CONTENTS = [
    ['clip', '機能定義一覧表', '実装する機能を一覧で整理'],
    ['doc', '画面構成ラフ案', '主要画面のレイアウト案'],
    ['cal', '開発ロードマップ（約5週間）', '要件定義からリリースまでの進め方'],
    ['yen', '概算費用シミュレーション', '想定費用の内訳を提示']
  ];

  /* ---------------- 補完CSS（不足する構造のみ） ---------------- */
  function injectCSS() {
    if (document.getElementById('diag-supplement-css')) return;
    var css = '' +
      /* 背景ぼかしを外して操作を軽くする（クリックごとの全画面再合成を回避） */
      '.diag-modal{-webkit-backdrop-filter:none !important;backdrop-filter:none !important;background:rgba(12,12,14,.74) !important}' +
      '.diag-modal.is-open{display:flex !important;opacity:1 !important}' +
      '.diag-panel{width:100%;max-width:520px;max-height:88vh;overflow:auto;background:#fbfaf7;border-radius:20px;padding:28px 28px 24px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);display:flex;flex-direction:column}' +
      '.diag-progress-bar{flex:1;height:6px;border-radius:99px;background:rgba(0,0,0,.08);overflow:hidden}' +
      '.diag-progress-bar>span{display:block;height:100%;background:#111;border-radius:99px;transition:width .3s ease}' +
      '.diag-progress-num{font-size:12px;font-weight:800;color:#888;white-space:nowrap}' +
      '.diag-q-title{font-size:18px;font-weight:800;color:#111;margin:0 0 18px}' +
      '.diag-option:hover{border-color:#111;transform:translateY(-1px)}' +
      '.diag-option.is-selected{border-color:#111;background:#f5f5f4}' +
      '.diag-option .chk{width:18px;height:18px;border-radius:50%;border:2px solid #d9d2c8;flex-shrink:0;margin-left:12px}' +
      '.diag-option.is-selected .chk{border-color:#111;background:#111;box-shadow:inset 0 0 0 3px #f5f5f4}' +
      '.diag-close{position:absolute;top:14px;right:16px;border:0;background:none;font-size:24px;line-height:1;color:#999;cursor:pointer}' +
      '.diag-actions{margin-top:18px}' +
      '.diag-btn-primary{padding:13px 18px;border:0;border-radius:12px;background:#111;color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}' +
      '.diag-btn-secondary{padding:13px;border:1.5px solid #2563eb;border-radius:10px;background:#fff;color:#2563eb;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;text-decoration:none;text-align:center;display:block}' +
      '.diag-btn-ghost{padding:10px;border:0;background:none;color:#777;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}' +
      '.diag-result h3{font-size:20px;font-weight:800;color:#111;margin:4px 0 6px}' +
      '.diag-result .tag{display:inline-block;background:#fde8ea;color:#dc2626;font-size:11px;font-weight:800;padding:3px 10px;border-radius:99px;margin-bottom:10px}' +
      '.diag-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}' +
      '.diag-metric .k{font-size:11px;color:#888;font-weight:700;display:block;margin-bottom:4px}' +
      '.diag-metric .v{font-size:17px;color:#111;font-weight:800}' +
      '.diag-tech{font-size:12.5px;color:#444;line-height:1.7;background:#f4f3f1;border-radius:10px;padding:12px 14px;margin:10px 0}' +
      '.diag-comment{font-size:13px;color:#333;line-height:1.8;margin:12px 0;padding-left:12px;border-left:3px solid #111}' +
      '.diag-estimate-note{font-size:11px;color:#999;line-height:1.6;margin:10px 0 0}' +
      '.diag-pricing-callout{margin:14px 0;padding:12px;border-radius:10px;background:#111;color:#fff;font-weight:800;font-size:13px;text-align:center}' +
      '.diag-field input{padding:11px 12px;border:1px solid rgba(0,0,0,.15);border-radius:8px;font:inherit;width:100%;box-sizing:border-box}' +
      '.diag-field label span{font-size:12px;font-weight:700;color:#374151}' +
      '.diag-form{display:grid;gap:14px}' +
      '.diag-privacy{font-size:11px;color:#888;line-height:1.6}' +
      '.diag-progress-restore-note{font-size:11px;color:#2563eb;background:#eef3fb;border-radius:8px;padding:8px 10px;margin-bottom:12px}' +
      '.diag-spinner{width:42px;height:42px;border:4px solid rgba(17,17,17,.18);border-top-color:#111;border-radius:50%;animation:diagSpin .8s linear infinite;margin:0 auto 14px}' +
      '@keyframes diagSpin{to{transform:rotate(360deg)}}' +
      '.diag-thanks p{font-size:13px;color:#444;line-height:1.8}' +
      /* 最小化（×）ボタン */
      '.diag-card__dismiss{position:absolute;top:12px;right:14px;width:26px;height:26px;border:0;border-radius:50%;background:rgba(0,0,0,.06);color:#777;font-size:16px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;z-index:2;font-family:inherit}' +
      '.diag-card__dismiss:hover{background:rgba(0,0,0,.12);color:#111}' +
      '@media (max-width:960px){.diag-card__dismiss{display:none !important}}' +
      /* 最小化後の付箋タブ（画面右端に固定・縦書き） */
      '.diag-sidetab{position:fixed;top:50%;right:0;transform:translateY(-50%);z-index:9998;display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 10px;border:1px solid rgba(0,0,0,.08);border-right:0;border-radius:14px 0 0 14px;background:#ffffff;color:#111111;font-family:inherit;font-size:13px;font-weight:800;letter-spacing:.15em;writing-mode:vertical-rl;text-orientation:upright;cursor:pointer;box-shadow:-4px 12px 30px rgba(0,0,0,.15);transition:transform .2s ease,background .2s ease}' +
      '.diag-sidetab:hover{background:#fbfaf7;transform:translateY(-50%) translateX(-3px)}' +
      '.diag-sidetab .diag-sidetab__ico{writing-mode:horizontal-tb;font-size:14px;color:#111;margin-bottom:4px}' +
      '.diag-sidetab:hover .diag-sidetab__ico{color:#111}' +
      '@media (max-width:600px){.diag-sidetab{font-size:12px;padding:18px 8px}}' +
      '.diag-lead{margin-top:16px;padding:18px;border:1.5px solid #e3e7ee;border-radius:14px;background:#fbfcfe}' +
      '.diag-lead-title{font-size:14px;font-weight:800;color:#111;line-height:1.5;margin:0 0 4px}' +
      '.diag-lead-sub{font-size:12px;color:#666;line-height:1.6;margin:0 0 14px}' +
      '.diag-consent{display:flex;align-items:flex-start;gap:8px;font-size:11.5px;color:#555;line-height:1.6;margin:2px 0 6px}' +
      '.diag-consent input{margin-top:2px}' +
      '.diag-lead-status{font-size:12px;margin:4px 0;min-height:16px}' +
      '.diag-lead-done{display:grid;gap:10px}' +
      '.diag-lead-sent{font-size:12px;color:#1a7a3a;line-height:1.6;margin:0;text-align:center}' +
      '.diag-btn-primary:disabled{opacity:.4;cursor:not-allowed}' +
      '.diag-option{transition:none !important}' +
      '.diag-option.is-selected{border-color:#111 !important;background:#fff !important;box-shadow:inset 0 0 0 2px #111,0 0 0 3px rgba(17,17,17,.12) !important;transform:none !important}' +
      '.diag-option.is-selected span{font-weight:700}' +
      '.diag-option.is-selected::after{content:"✓" !important;opacity:1 !important;width:22px;height:22px;flex:0 0 22px;border-radius:50%;background:#111;color:#fff;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;transform:none !important}' +
      '.diag-card__restart{display:block;width:100%;margin-top:8px;padding:6px;border:0;background:none;color:#888;font-family:inherit;font-size:12px;font-weight:600;text-decoration:underline;text-underline-offset:2px;cursor:pointer}' +
      '.diag-card__restart:hover{color:#111}' +
      /* hiddenを確実に効かせる（display:gridの上書き対策） */
      '.diag-lead-done[hidden]{display:none !important}' +
      '.diag-metric .v{white-space:nowrap}' +
      /* ===== 結果リニューアル（rv2） ===== */
      '.diag-rv2{--dg:#2f7d4f;--dgl:#e8f2eb;color:#1a1a1a;font-family:inherit}' +
      '.diag-rv2 svg{display:block}' +
      '.diag-rv2__head{text-align:center;margin-bottom:18px}' +
      '.diag-rv2__eyebrow{display:flex;align-items:center;justify-content:center;gap:12px;color:var(--dg);font-size:12px;font-weight:800;letter-spacing:.18em;margin-bottom:10px}' +
      '.diag-rv2__eyebrow span{width:26px;height:1.5px;background:var(--dg);opacity:.55}' +
      '.diag-rv2__title{font-size:clamp(26px,3.6vw,40px);font-weight:900;margin:0 0 12px;line-height:1.2;color:#111}' +
      '.diag-rv2__lead{max-width:640px;margin:0 auto;color:#555;font-size:14px;line-height:1.9}' +
      '.diag-rv2__summary{display:grid;grid-template-columns:1fr;gap:18px;background:#f7f9f8;border:1px solid #eceeed;border-radius:16px;padding:22px;margin:18px 0}' +
      '.diag-rv2__sumcell{text-align:center;padding:6px 18px;position:relative}' +
      '.diag-rv2__sumico{display:inline-flex;width:30px;height:30px;color:var(--dg);margin-bottom:8px}' +
      '.diag-rv2__sumico svg{width:100%;height:100%}' +
      '.diag-rv2__sumlabel{font-size:12px;font-weight:700;color:#555;margin-bottom:6px}' +
      '.diag-rv2__sumval{font-size:clamp(22px,2.6vw,30px);font-weight:900;color:#111;line-height:1.2}' +
      '.diag-rv2__sumsub{font-size:11.5px;color:#888;margin-top:8px;line-height:1.6}' +
      '.diag-rv2__sumcell--feat{text-align:left}' +
      '.diag-rv2__sumcell--feat .diag-rv2__sumico,.diag-rv2__sumcell--feat .diag-rv2__sumlabel{display:block;text-align:center;margin-left:auto;margin-right:auto}' +
      '.diag-rv2__feats{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:9px}' +
      '.diag-rv2__feats li{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;color:#222}' +
      '.diag-rv2__fchk{display:inline-flex;width:18px;height:18px;flex:0 0 18px;align-items:center;justify-content:center;border-radius:50%;background:var(--dgl);color:var(--dg)}' +
      '.diag-rv2__fchk svg{width:11px;height:11px}' +
      '.diag-rv2__effects{margin:18px 0}' +
      '.diag-rv2__h3{text-align:center;font-size:16px;font-weight:800;color:#222;margin:0 0 14px}' +
      '.diag-rv2__effgrid{display:grid;grid-template-columns:1fr;gap:14px}' +
      '.diag-rv2__eff{background:#f6f8f7;border:1px solid #eceeed;border-radius:14px;padding:18px;text-align:center}' +
      '.diag-rv2__effico{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--dgl);color:var(--dg);margin-bottom:10px}' +
      '.diag-rv2__effico svg{width:22px;height:22px}' +
      '.diag-rv2__efflabel{font-size:12px;font-weight:700;color:#555;margin-bottom:6px}' +
      '.diag-rv2__effval{font-size:clamp(22px,2.4vw,28px);font-weight:900;color:var(--dg);line-height:1.1}' +
      '.diag-rv2__effsub{font-size:11.5px;color:#888;margin-top:8px;line-height:1.6}' +
      '.diag-rv2__note{text-align:center;font-size:11px;color:#999;margin:12px 0 0}' +
      '.diag-rv2__cta2{display:grid;grid-template-columns:1fr;gap:20px;margin:18px 0;align-items:start}' +
      '.diag-rv2__form{background:#fafbfb;border:1px solid #ececec;border-radius:16px;padding:22px}' +
      '.diag-rv2__formhead{display:flex;gap:12px;align-items:flex-start;margin-bottom:16px}' +
      '.diag-rv2__formico{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;flex:0 0 40px;border-radius:50%;background:var(--dgl);color:var(--dg)}' +
      '.diag-rv2__formico svg{width:20px;height:20px}' +
      '.diag-rv2__formtitle{font-size:15px;font-weight:800;color:#1a1a1a;line-height:1.4}' +
      '.diag-rv2__formsub{font-size:12px;color:#777;line-height:1.7;margin-top:4px}' +
      '.diag-rv2 .diag-field{margin-bottom:14px}' +
      '.diag-rv2 .diag-field>label{display:block}' +
      '.diag-rv2 .diag-field label span{display:block;font-size:12.5px;font-weight:700;color:#333;margin-bottom:6px}' +
      '.diag-rv2 .diag-field label em{color:var(--dg);font-style:normal;font-size:11px;font-weight:800;margin-left:4px}' +
      '.diag-rv2 .diag-field input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #dfe3e1;border-radius:10px;font:inherit;font-size:14px;background:#fff}' +
      '.diag-rv2 .diag-field input:focus{outline:none;border-color:var(--dg);box-shadow:0 0 0 3px rgba(47,125,79,.12)}' +
      '.diag-rv2__frow{display:grid;grid-template-columns:1fr;gap:0}' +
      '.diag-rv2__hint{font-size:11px;color:#999;margin:6px 0 0}' +
      '.diag-rv2 .diag-consent{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#444;line-height:1.6;margin:4px 0 14px}' +
      '.diag-rv2 .diag-consent a{color:var(--dg);font-weight:700}' +
      '.diag-rv2 .diag-consent input{margin-top:1px;accent-color:var(--dg);width:16px;height:16px;flex:0 0 16px}' +
      '.diag-rv2 .diag-btn-primary{width:100%;padding:15px;border:0;border-radius:10px;background:#111;color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;text-align:center;display:block}' +
      '.diag-rv2__formnotes{margin-top:12px;font-size:10.5px;color:#9a9a9a;line-height:1.65}' +
      '.diag-rv2 .diag-lead-status:empty{display:none}' +
      '.diag-rv2__list{padding:6px 2px}' +
      '.diag-rv2__listtitle{font-size:15px;font-weight:800;color:#1a1a1a;padding-bottom:10px;border-bottom:2px solid var(--dgl);margin-bottom:16px}' +
      '.diag-rv2__know{list-style:none;margin:0;padding:0;display:grid;gap:16px}' +
      '.diag-rv2__know li{display:flex;gap:12px;align-items:flex-start}' +
      '.diag-rv2__kico{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;flex:0 0 38px;border-radius:50%;background:var(--dgl);color:var(--dg)}' +
      '.diag-rv2__kico svg{width:19px;height:19px}' +
      '.diag-rv2__ktitle{font-size:13.5px;font-weight:800;color:#222}' +
      '.diag-rv2__ksub{font-size:11.5px;color:#888;line-height:1.6;margin-top:2px}' +
      '.diag-rv2__consult{display:flex;align-items:center;gap:16px;background:#f3f7f4;border:1px solid #e4ece7;border-radius:14px;padding:18px 22px;margin:8px 0 14px}' +
      '.diag-rv2__consultico{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;flex:0 0 44px;border-radius:50%;background:var(--dgl);color:var(--dg)}' +
      '.diag-rv2__consultico svg{width:22px;height:22px}' +
      '.diag-rv2__consulttxt{flex:1}' +
      '.diag-rv2__consulttitle{font-size:15px;font-weight:800;color:#1a1a1a}' +
      '.diag-rv2__consultsub{font-size:12px;color:#777;margin-top:3px;line-height:1.6}' +
      '.diag-rv2__consultbtn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;padding:13px 22px;border:1.5px solid #333;border-radius:10px;background:#fff;color:#111;font-weight:800;font-size:13.5px;text-decoration:none;white-space:nowrap}' +
      '.diag-rv2__consultbtn:hover{background:#111;color:#fff;border-color:#111}' +
      '.diag-rv2__foot{text-align:center;font-size:11px;color:#aaa;margin:6px 0 0}' +
      '.diag-rv2__redo{border:0;background:none;color:#888;font-size:11px;text-decoration:underline;cursor:pointer;font-family:inherit;padding:0;margin-left:6px}' +
      '.diag-rv2__redo:hover{color:#111}' +
      '@media (min-width:900px){' +
        '.diag-modal .diag-panel:has(.diag-rv2){max-width:1040px !important;max-height:94vh;padding:34px 40px}' +
        '.diag-rv2__summary{grid-template-columns:1fr 1fr 1.2fr;gap:0;align-items:center}' +
        '.diag-rv2__summary .diag-rv2__sumcell+.diag-rv2__sumcell::before{content:"";position:absolute;left:0;top:6px;bottom:6px;width:1px;background:#e2e6e4}' +
        '.diag-rv2__effgrid{grid-template-columns:1fr 1fr 1fr}' +
        '.diag-rv2__cta2{grid-template-columns:1.25fr .75fr;gap:30px}' +
        /* スクロールを出さないための圧縮（PC・1画面フィット） */
        '.diag-modal .diag-panel:has(.diag-rv2){padding:22px 34px;max-height:96vh}' +
        '.diag-rv2__head{margin-bottom:8px}' +
        '.diag-rv2__eyebrow{margin-bottom:6px}' +
        '.diag-rv2__title{font-size:clamp(22px,2.4vw,30px);margin:0 0 6px}' +
        '.diag-rv2__lead{line-height:1.6;font-size:13px}' +
        '.diag-rv2__summary{margin:10px 0;padding:14px 18px}' +
        '.diag-rv2__sumico{width:26px;height:26px;margin-bottom:5px}' +
        '.diag-rv2__sumval{font-size:24px}' +
        '.diag-rv2__sumsub{margin-top:6px}' +
        '.diag-rv2__feats{gap:7px}' +
        '.diag-rv2__effects{margin:10px 0}' +
        '.diag-rv2__h3{margin:0 0 8px;font-size:15px}' +
        '.diag-rv2__eff{padding:12px}' +
        '.diag-rv2__effico{width:34px;height:34px;margin-bottom:5px}' +
        '.diag-rv2__effico svg{width:18px;height:18px}' +
        '.diag-rv2__effval{font-size:23px}' +
        '.diag-rv2__effsub{margin-top:5px}' +
        '.diag-rv2__note{margin:8px 0 0}' +
        '.diag-rv2__cta2{margin:10px 0;gap:24px}' +
        '.diag-rv2__form{padding:16px}' +
        '.diag-rv2__formhead{margin-bottom:10px;gap:10px}' +
        '.diag-rv2__formico{width:34px;height:34px;flex-basis:34px}' +
        '.diag-rv2__formtitle{font-size:14px}' +
        '.diag-rv2__formsub{font-size:11.5px;line-height:1.5;margin-top:3px}' +
        '.diag-rv2 .diag-field{margin-bottom:8px}' +
        '.diag-rv2 .diag-field label span{margin-bottom:3px;font-size:12px}' +
        '.diag-rv2 .diag-field input{padding:9px 12px;font-size:13px}' +
        '.diag-rv2__hint{margin:3px 0 0}' +
        '.diag-rv2 .diag-consent{margin:2px 0 8px}' +
        '.diag-rv2 .diag-btn-primary{padding:12px;font-size:13.5px}' +
        '.diag-rv2__formnotes{margin-top:8px;gap:3px}' +
        '.diag-rv2__formnotes p{font-size:10.5px}' +
        '.diag-rv2__listtitle{margin-bottom:12px;padding-bottom:8px}' +
        '.diag-rv2__know{gap:11px}' +
        '.diag-rv2__kico{width:34px;height:34px;flex-basis:34px}' +
        '.diag-rv2__consult{padding:12px 18px;margin:4px 0 8px}' +
        '.diag-rv2__consultico{width:38px;height:38px;flex-basis:38px}' +
        '.diag-rv2__foot{margin:4px 0 0}' +
        /* 会社名＋お名前を横並びにして高さを節約 */
        '.diag-rv2__frow{grid-template-columns:1fr 1fr;gap:14px;margin-bottom:8px}' +
        '.diag-rv2__frow .diag-field{margin-bottom:0}' +
        '.diag-rv2__summary{margin:8px 0;padding:12px 18px}' +
        '.diag-rv2__sumlabel{margin-bottom:4px}' +
        '.diag-rv2__feats{gap:6px}' +
        '.diag-rv2__feats li{font-size:12.5px}' +
        '.diag-rv2__effects{margin:8px 0}' +
        '.diag-rv2__effsub{font-size:11px}' +
        '.diag-rv2__formsub{font-size:11px}' +
        '.diag-rv2__ksub{font-size:11px}' +
        /* 1画面フィット 最終調整 */
        '.diag-modal .diag-panel:has(.diag-rv2){padding:18px 32px;max-height:98vh}' +
        '.diag-rv2__head{margin-bottom:6px}' +
        '.diag-rv2__title{font-size:clamp(20px,2.2vw,27px);margin:0 0 5px}' +
        '.diag-rv2__lead{font-size:12.5px;line-height:1.55}' +
        '.diag-rv2__summary{margin:7px 0;padding:12px 16px}' +
        '.diag-rv2__feats{grid-template-columns:1fr 1fr;gap:6px 14px}' +
        '.diag-rv2__effects{margin:7px 0}' +
        '.diag-rv2__h3{margin:0 0 7px}' +
        '.diag-rv2__eff{padding:11px}' +
        '.diag-rv2__effico{width:30px;height:30px;margin-bottom:4px}' +
        '.diag-rv2__effico svg{width:16px;height:16px}' +
        '.diag-rv2__note{margin:6px 0 0;font-size:10.5px}' +
        '.diag-rv2__cta2{margin:7px 0}' +
        '.diag-rv2__form{padding:14px}' +
        '.diag-rv2__formhead{margin-bottom:8px}' +
        '.diag-rv2 .diag-field{margin-bottom:7px}' +
        '.diag-rv2 .diag-field input{padding:7px 11px}' +
        '.diag-rv2__frow{margin-bottom:7px}' +
        '.diag-rv2 .diag-consent{margin:2px 0 7px}' +
        '.diag-rv2 .diag-btn-primary{padding:11px;font-size:13px}' +
        '.diag-rv2__formnotes{margin-top:8px}' +
        '.diag-rv2__consult{padding:11px 16px;margin:4px 0 6px}' +
        '.diag-rv2__consultico{width:34px;height:34px;flex-basis:34px}' +
        '.diag-rv2__foot{margin:3px 0 0}' +
      '}';
    var s = document.createElement('style');
    s.id = 'diag-supplement-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------------- 状態 ---------------- */
  var answers = {};          // { q1: optionId, ... }
  var stepIndex = 0;         // 0..QUESTIONS.length-1, then form, then result
  var modal, panel;

  function loadSaved() {
    try { var raw = localStorage.getItem(STORE_KEY); if (raw) answers = JSON.parse(raw) || {}; } catch (e) {}
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(answers)); } catch (e) {} }
  function clearSaved() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} answers = {}; }
  function isCardHidden() { try { return localStorage.getItem(CARD_HIDDEN_KEY) === '1'; } catch (e) { return false; } }
  function setCardHidden(value) { try { localStorage.setItem(CARD_HIDDEN_KEY, value ? '1' : '0'); } catch (e) {} }

  function collectTags() {
    var tags = [];
    QUESTIONS.forEach(function (q) {
      var oid = answers[q.id];
      if (!oid) return;
      var opt = q.options.filter(function (o) { return o.id === oid; })[0];
      if (opt) tags = tags.concat(opt.tags);
    });
    return tags;
  }

  /* ---------------- ヒーローのカード ---------------- */
  function buildCard() {
    var host = document.getElementById('heroInteractiveWrapper');
    if (!host) return;

    var existing = document.getElementById('diagRestore');
    if (existing) {
      existing.parentNode.removeChild(existing);
    }

    var isMobile = window.innerWidth <= 960;

    if (isCardHidden() && !isMobile) {
      host.innerHTML = '';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'diag-sidetab';
      btn.id = 'diagRestore';
      btn.innerHTML = '<span class="diag-sidetab__ico" aria-hidden="true">✦</span>AI開発診断';
      btn.addEventListener('click', function () {
        setCardHidden(false);
        buildCard();
      });
      document.body.appendChild(btn);
      return;
    }
    var hasProgress = Object.keys(answers).length > 0;
    host.innerHTML =
      '<div class="diag-card">' +
        '<button type="button" class="diag-card__dismiss" id="diagDismiss" aria-label="診断カードを閉じる">×</button>' +
        '<div class="diag-card__eyebrow">AI開発診断</div>' +
        '<h3 class="diag-card__title">あなたのアイデアは、どの開発プランで進めるべきか。</h3>' +
        '<p class="diag-card__sub">6つの質問に答えるだけで、AI業務システム・SaaS・自動化など、最適な進め方と概算費用を診断します。</p>' +
        '<p class="diag-card__features-label">診断でわかること</p>' +
        '<div class="diag-card__features">' +
          '<div class="diag-card__feature">' +
            '<span class="diag-card__feature-ico" aria-hidden="true">01</span>' +
            '<span class="diag-card__feature-copy"><strong class="diag-card__feature-title">開発タイプ</strong><span class="diag-card__feature-sub">AI業務システム / SaaS / 自動化</span></span>' +
          '</div>' +
          '<div class="diag-card__feature">' +
            '<span class="diag-card__feature-ico" aria-hidden="true">02</span>' +
            '<span class="diag-card__feature-copy"><strong class="diag-card__feature-title">概算費用</strong><span class="diag-card__feature-sub">初期予算の目安を表示</span></span>' +
          '</div>' +
          '<div class="diag-card__feature">' +
            '<span class="diag-card__feature-ico" aria-hidden="true">03</span>' +
            '<span class="diag-card__feature-copy"><strong class="diag-card__feature-title">想定期間</strong><span class="diag-card__feature-sub">リリースまでの進め方</span></span>' +
          '</div>' +
          '<div class="diag-card__feature">' +
            '<span class="diag-card__feature-ico" aria-hidden="true">04</span>' +
            '<span class="diag-card__feature-copy"><strong class="diag-card__feature-title">技術構成</strong><span class="diag-card__feature-sub">おすすめの開発スタック</span></span>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="diag-card__btn diag-btn-primary" id="diagStart"><span class="diag-card__btn-sparkle" aria-hidden="true">✦</span>' + (hasProgress ? '診断を再開する' : '無料で診断する') + '<span class="arrow" aria-hidden="true">→</span></button>' +
        (hasProgress ? '<button type="button" class="diag-card__restart" id="diagRestart">最初からやり直す</button>' : '') +
        '<p class="diag-card__note"><span class="diag-card__note-ico" aria-hidden="true">✓</span>入力不要・30秒で結果表示</p>' +
      '</div>';
    document.getElementById('diagStart').addEventListener('click', openModal);
    document.getElementById('diagDismiss').addEventListener('click', function () {
      setCardHidden(true);
      buildCard();
    });
    var restart = document.getElementById('diagRestart');
    if (restart) restart.addEventListener('click', function () {
      clearSaved();
      stepIndex = 0;
      buildCard();
      openModal();
    });
  }

  /* ---------------- モーダル ---------------- */
  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'diag-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="diag-panel"><button type="button" class="diag-close" aria-label="閉じる">×</button><div class="diag-body"></div></div>';
    document.body.appendChild(modal);
    panel = modal.querySelector('.diag-body');
    modal.querySelector('.diag-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });
  }

  // 診断中は背景動画を止めて軽くする（離脱防止・CPU負荷軽減）
  function setHeroVideo(play) {
    try {
      var v = document.querySelector('.hero-bg-video');
      if (!v) return;
      if (play) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else { v.pause(); }
    } catch (e) {}
  }
  function openModal() {
    // 最初の未回答ステップへ
    stepIndex = 0;
    for (var i = 0; i < QUESTIONS.length; i++) { if (!answers[QUESTIONS[i].id]) { stepIndex = i; break; } if (i === QUESTIONS.length - 1) stepIndex = i; }
    renderStep();
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setHeroVideo(false);
    track('diag_start', { resumed: Object.keys(answers).length > 0, start_step: stepIndex + 1 });
  }
  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setHeroVideo(true);
    // どこまで進んだか（離脱・完了問わず最終到達ステップ）
    if (diagMaxStep > 0) {
      track('diag_close', { max_step: diagMaxStep, total: QUESTIONS.length, completed: diagCompleted });
    }
    buildCard(); // 再開ボタン状態を更新
  }

  function progressHTML(current, total) {
    var pct = Math.round((current / total) * 100);
    return '<div class="diag-progress">' +
      '<div class="diag-progress-bar"><span style="width:' + pct + '%"></span></div>' +
      '<span class="diag-progress-num">' + current + ' / ' + total + '</span></div>';
  }

  function renderStep() {
    panel.classList.remove('diag-panel--wide');
    var q = QUESTIONS[stepIndex];
    var total = QUESTIONS.length;
    var restoreNote = (stepIndex === 0 && Object.keys(answers).length > 0)
      ? '<div class="diag-progress-restore-note">前回の回答を復元しました。最後まで進めると結果が表示されます。</div>' : '';
    var opts = q.options.map(function (o) {
      var sel = answers[q.id] === o.id ? ' is-selected' : '';
      return '<button type="button" class="diag-option' + sel + '" data-opt="' + o.id + '"><span>' + o.label + '</span></button>';
    }).join('');
    var lastStep = stepIndex === QUESTIONS.length - 1;
    panel.innerHTML =
      '<div class="diag-step">' +
        progressHTML(stepIndex + 1, total) + restoreNote +
        '<p class="diag-q-title">' + q.title + '</p>' +
        '<div class="diag-options">' + opts + '</div>' +
        '<div class="diag-actions">' +
          '<button type="button" class="diag-btn-primary diag-next" id="diagNext"' + (answers[q.id] ? '' : ' disabled') + '>' + (lastStep ? '結果を見る →' : '次へ →') + '</button>' +
          (stepIndex > 0 ? '<button type="button" class="diag-btn-ghost diag-back">← 戻る</button>' : '') +
        '</div>' +
      '</div>';
    var nextBtn = panel.querySelector('#diagNext');
    panel.querySelectorAll('.diag-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var optId = btn.getAttribute('data-opt');
        answers[q.id] = optId;
        save();
        panel.querySelectorAll('.diag-option').forEach(function (b) { b.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
        nextBtn.disabled = false;
        diagMaxStep = Math.max(diagMaxStep, stepIndex + 1);
        track('diag_answer', { step: stepIndex + 1, total: QUESTIONS.length, question_id: q.id, answer_id: optId, answer: answerLabel(q.id, optId) });
      });
    });
    nextBtn.addEventListener('click', function () { if (answers[q.id]) next(); });
    var back = panel.querySelector('.diag-back');
    if (back) back.addEventListener('click', prev);
  }

  function next() {
    if (stepIndex < QUESTIONS.length - 1) { stepIndex++; renderStep(); }
    else { generate(); }
  }
  function prev() {
    if (stepIndex > 0) { stepIndex--; renderStep(); }
  }

  /* ---------------- 連絡先フォーム（任意） ---------------- */
  function renderForm() {
    panel.innerHTML =
      '<div class="diag-step">' +
        progressHTML(QUESTIONS.length, QUESTIONS.length) +
        '<p class="diag-q-title">診断結果を表示します</p>' +
        '<p style="font-size:13px;color:#555;line-height:1.7;margin:-6px 0 16px">結果をPDFで受け取りたい方は、メールアドレスをご入力ください（任意・スキップ可）。</p>' +
        '<form class="diag-form" id="diagForm">' +
          '<div class="diag-field"><label><span>会社名（任意）</span><input type="text" name="company" autocomplete="organization"></label></div>' +
          '<div class="diag-field"><label><span>お名前（任意）</span><input type="text" name="name" autocomplete="name"></label></div>' +
          '<div class="diag-field"><label><span>メールアドレス（PDF希望時のみ）</span><input type="email" name="email" autocomplete="email"></label></div>' +
          '<p class="diag-privacy">入力情報はお見積り・ご連絡のみに使用します（<a href="privacy.html" target="_blank" rel="noopener">プライバシーポリシー</a>準拠）。</p>' +
          '<div class="diag-actions">' +
            '<button type="submit" class="diag-btn-primary">結果を見る →</button>' +
            '<button type="button" class="diag-btn-ghost" id="diagSkip">入力せず結果を見る</button>' +
            '<button type="button" class="diag-btn-ghost diag-back">← 戻る</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    panel.querySelector('#diagForm').addEventListener('submit', function (e) { e.preventDefault(); generate(); });
    panel.querySelector('#diagSkip').addEventListener('click', generate);
    panel.querySelector('.diag-back').addEventListener('click', function () { stepIndex = QUESTIONS.length - 1; renderStep(); });
  }

  /* ---------------- 生成演出 → 結果 ---------------- */
  function generate() {
    panel.classList.remove('diag-panel--wide');
    panel.innerHTML =
      '<div class="diag-generating" style="min-height:300px;color:#111">' +
        '<div style="text-align:center"><div class="diag-spinner"></div>' +
        '<p style="font-weight:800;font-size:15px;color:#111">最適な進め方を解析中…</p>' +
        '<p style="font-size:12px;color:#888;margin-top:6px">あなたの回答からパターンを判定しています</p></div>' +
      '</div>';
    setTimeout(renderResult, 1800);
  }

  function renderResult() {
    var key = resolvePattern(collectTags());
    var p = PATTERNS[key];
    diagCompleted = true;
    diagMaxStep = QUESTIONS.length;
    track('diag_result', Object.assign({ pattern: key, pattern_name: p.name, cost: p.cost, period: p.period }, answersParams()));
    panel.classList.add('diag-panel--wide', 'diag-panel--rv2');
    var I = {
      clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      yen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l5 7 5-7"/><path d="M12 11v9"/><path d="M8 14h8"/><path d="M8 17.5h8"/></svg>',
      target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4 4L19 7"/></svg>',
      trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M16 7h5v5"/></svg>',
      list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><circle cx="3.5" cy="6" r="1.1"/><circle cx="3.5" cy="12" r="1.1"/><circle cx="3.5" cy="18" r="1.1"/></svg>',
      doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>',
      clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4.5h6"/><path d="M9 11h6"/><path d="M9 15h6"/></svg>',
      cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9.5h16"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>',
      bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V11"/><path d="M12 20V4"/><path d="M19 20v-6"/></svg>',
      cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5v-9z"/><path d="M12 11.5v9.5"/><path d="M20 7l-8 4.5L4 7"/></svg>',
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.3"/><path d="M16.5 14c2.5.2 4.5 2.3 4.5 5"/></svg>'
    };
    var feats = (p.features || []).map(function (f) {
      return '<li><span class="diag-rv2__fchk">' + I.check + '</span>' + f + '</li>';
    }).join('');
    var hasKpi = !!p.kReduce;
    var effects = hasKpi ?
      '<div class="diag-rv2__effects">' +
        '<h3 class="diag-rv2__h3">導入によって期待できる効果</h3>' +
        '<div class="diag-rv2__effgrid">' +
          '<div class="diag-rv2__eff"><span class="diag-rv2__effico">' + I.clock + '</span><div class="diag-rv2__efflabel">削減できる工数</div><div class="diag-rv2__effval">' + p.kReduce + '</div><div class="diag-rv2__effsub">手作業時間を大幅に削減</div></div>' +
          '<div class="diag-rv2__eff"><span class="diag-rv2__effico">' + I.trend + '</span><div class="diag-rv2__efflabel">投資回収の目安（ROI）</div><div class="diag-rv2__effval">' + p.kRoi + '</div><div class="diag-rv2__effsub">早期の投資回収が見込めます</div></div>' +
          '<div class="diag-rv2__eff"><span class="diag-rv2__effico">' + I.list + '</span><div class="diag-rv2__efflabel">自動化できる業務</div><div class="diag-rv2__effval">' + p.kScope + '</div><div class="diag-rv2__effsub">コア業務に集中できる環境へ</div></div>' +
        '</div>' +
        '<p class="diag-rv2__note">※ 上記は一般的なケースの目安です。実際の数値はご要件により変動します。</p>' +
      '</div>' : '';
    var knowList = DOC_CONTENTS.map(function (r) {
      return '<li><span class="diag-rv2__kico">' + (I[r[0]] || I.clip) + '</span><div><div class="diag-rv2__ktitle">' + r[1] + '</div><div class="diag-rv2__ksub">' + r[2] + '</div></div></li>';
    }).join('');

    panel.innerHTML =
      '<div class="diag-rv2">' +
        '<div class="diag-rv2__head">' +
          '<div class="diag-rv2__eyebrow"><span></span>あなたの診断結果<span></span></div>' +
          '<h2 class="diag-rv2__title">' + p.name + '</h2>' +
          '<p class="diag-rv2__lead">' + (p.summary || p.approach) + '</p>' +
        '</div>' +
        '<div class="diag-rv2__summary">' +
          '<div class="diag-rv2__sumcell"><span class="diag-rv2__sumico">' + I.clock + '</span><div class="diag-rv2__sumlabel">想定開発期間</div><div class="diag-rv2__sumval">' + p.period + '</div><div class="diag-rv2__sumsub">最短でのスピード開発が可能です</div></div>' +
          '<div class="diag-rv2__sumcell"><span class="diag-rv2__sumico">' + I.yen + '</span><div class="diag-rv2__sumlabel">想定開発予算</div><div class="diag-rv2__sumval">' + p.cost + '</div><div class="diag-rv2__sumsub">ご要件に応じて最適なプランをご提案</div></div>' +
          '<div class="diag-rv2__sumcell diag-rv2__sumcell--feat"><span class="diag-rv2__sumico">' + I.target + '</span><div class="diag-rv2__sumlabel">主な特徴</div><ul class="diag-rv2__feats">' + feats + '</ul></div>' +
        '</div>' +
        effects +
        '<div class="diag-rv2__cta2">' +
          '<div class="diag-rv2__form">' +
            '<div class="diag-rv2__formhead"><span class="diag-rv2__formico">' + I.doc + '</span><div><div class="diag-rv2__formtitle">あなた専用の提案資料を受け取る</div><div class="diag-rv2__formsub">想定機能・開発期間・概算費用・推奨構成をまとめた提案資料（PDF）をお送りします。</div></div></div>' +
            '<form class="diag-form" id="diagLeadForm">' +
              '<div class="diag-rv2__frow">' +
                '<div class="diag-field"><label><span>会社名・屋号（任意）</span><input type="text" name="company" autocomplete="organization" placeholder="例）株式会社SPACE GLEAM"></label></div>' +
                '<div class="diag-field"><label><span>お名前 <em>必須</em></span><input type="text" name="name" autocomplete="name" placeholder="例）山田 太郎" required></label></div>' +
              '</div>' +
              '<div class="diag-field"><label><span>メールアドレス <em>必須</em></span><input type="email" name="email" autocomplete="email" placeholder="例）yamada@example.com" required></label></div>' +
              '<label class="diag-consent"><input type="checkbox" name="consent" required> <span><a href="privacy.html" target="_blank" rel="noopener">プライバシーポリシー</a>に同意する</span></label>' +
              '<p class="diag-lead-status" id="diagLeadStatus" role="status" aria-live="polite"></p>' +
              '<button type="submit" class="diag-btn-primary" id="diagLeadBtn">診断レポートを受け取る　→</button>' +
            '</form>' +
            '<div class="diag-lead-done" id="diagLeadDone" hidden>' +
              '<a class="diag-btn-primary" id="diagDownload" href="' + ASSET[key] + '" download style="text-decoration:none">資料をダウンロード（PDF）</a>' +
              '<p class="diag-lead-sent" id="diagLeadSent"></p>' +
            '</div>' +
            '<p class="diag-rv2__formnotes">🔒 ご入力情報は資料送付・ご連絡のみに利用します。営業電話はいたしません。法人・個人いずれもご相談いただけます。</p>' +
          '</div>' +
          '<div class="diag-rv2__list">' +
            '<div class="diag-rv2__listtitle">この資料でわかること</div>' +
            '<ul class="diag-rv2__know">' + knowList + '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="diag-rv2__consult">' +
          '<span class="diag-rv2__consultico">' + I.users + '</span>' +
          '<div class="diag-rv2__consulttxt"><div class="diag-rv2__consulttitle">すぐに相談したい方はこちら</div><div class="diag-rv2__consultsub">診断結果をもとに、専門家が30分無料でご相談に対応します。</div></div>' +
          '<a class="diag-rv2__consultbtn" href="' + CONTACT_URL + '" id="diagToContact">無料相談を予約する　→</a>' +
        '</div>' +
        '<p class="diag-rv2__foot">※ 本診断は簡易的な目安です。詳細は個別にご相談ください。　<button type="button" class="diag-rv2__redo" id="diagRedo">もう一度診断する</button></p>' +
      '</div>';
    panel.querySelector('#diagToContact').addEventListener('click', function () {
      track('diag_consult_click', { pattern: key, pattern_name: p.name });
      closeModal();
    });
    panel.querySelector('#diagRedo').addEventListener('click', function () {
      track('diag_redo', { pattern: key });
      clearSaved(); stepIndex = 0; diagMaxStep = 0; diagCompleted = false; renderStep();
    });
    panel.querySelector('#diagLeadForm').addEventListener('submit', function (e) {
      e.preventDefault();
      submitLead(e.target, key, p);
    });
    var dl = panel.querySelector('#diagDownload');
    if (dl) dl.addEventListener('click', function () {
      track('diag_download', { pattern: key, pattern_name: p.name });
    });
  }

  /* ---------------- リード送信 → ダウンロード解放 ---------------- */
  function submitLead(form, key, p) {
    var statusEl = form.querySelector('#diagLeadStatus');
    var btn = form.querySelector('#diagLeadBtn');
    var email = (form.email.value || '').trim();
    if (!EMAIL_RE.test(email)) { statusEl.textContent = '正しいメールアドレスをご入力ください。'; statusEl.style.color = '#dc2626'; return; }
    if (!form.consent.checked) { statusEl.textContent = 'プライバシーポリシーへの同意が必要です。'; statusEl.style.color = '#dc2626'; return; }
    btn.disabled = true; statusEl.style.color = '#555'; statusEl.textContent = '送信中…';

    var lead = {
      pattern: key, patternName: p.name, cost: p.cost, period: p.period,
      company: (form.company.value || '').trim(), name: (form.name.value || '').trim(),
      email: email, answers: answers,
      assetUrl: location.origin + '/' + ASSET[key],
      pageUrl: location.href, ts: new Date().toISOString()
    };
    try { localStorage.setItem('diag_lead', JSON.stringify(lead)); } catch (e) {}

    // GAへリード送信を記録（氏名・メールは送らず、属性フラグ＋回答ラベルのみ）
    track('diag_lead', Object.assign({
      pattern: key, pattern_name: p.name,
      has_company: !!lead.company, has_name: !!lead.name
    }, answersParams()));

    var reveal = function (sent, attached) {
      form.hidden = true;
      var done = panel.querySelector('#diagLeadDone');
      done.hidden = false;
      var msg;
      if (sent && attached) msg = '✅ ご入力のメール（' + email + '）に提案資料（PDF）を添付してお送りしました。下のボタンからもダウンロードできます。';
      else if (sent) msg = '✅ ご入力のメール（' + email + '）に診断結果をお送りしました。資料は下のボタンからダウンロードしてください。';
      else msg = '※ メール送信は環境により後ほど届く場合があります。今すぐ下のボタンからダウンロードできます。';
      var el = panel.querySelector('#diagLeadSent');
      el.textContent = msg;
      el.style.color = sent ? '#1a7a3a' : '#888';
      panel.querySelector('#diagDownload').focus();
    };

    fetch(LEAD_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead)
    })
      .then(function (r) { return r.ok ? r.json() : { ok: false }; })
      .then(function (d) { reveal(!!(d && d.ok), !!(d && d.attached)); })
      .catch(function () { reveal(false, false); });
  }

  /* ---------------- PDF保存（印刷ダイアログ経由・日本語OK） ---------------- */
  function printResult(p) {
    var w = window.open('', '_blank');
    if (!w) { alert('ポップアップを許可するとPDF保存できます。'); return; }
    var html = '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>AI開発診断 結果 - SPACE GLEAM</title>' +
      '<style>body{font-family:"Noto Sans JP","Hiragino Sans",sans-serif;color:#111;max-width:680px;margin:40px auto;padding:0 24px;line-height:1.8}' +
      'h1{font-size:18px;border-bottom:2px solid #111;padding-bottom:8px}h2{font-size:15px;color:#111;margin:22px 0 6px}' +
      '.row{display:flex;gap:24px;margin:10px 0}.row div{flex:1;border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center}' +
      '.k{font-size:11px;color:#888}.v{font-size:17px;font-weight:800;color:#111}.note{font-size:11px;color:#999;margin-top:24px}' +
      '.cta{margin-top:20px;padding:12px;background:#111;color:#fff;text-align:center;border-radius:8px;font-weight:800}</style></head><body>' +
      '<h1>AI開発診断 結果｜SPACE GLEAM</h1>' +
      '<p style="font-size:12px;color:#888">診断タイプ</p><div style="font-size:20px;font-weight:800">' + p.name + '</div>' +
      '<h2>おすすめの進め方</h2><p>' + p.approach + '</p>' +
      '<div class="row"><div><div class="k">概算費用</div><div class="v">' + p.cost + '</div></div><div><div class="k">想定期間</div><div class="v">' + p.period + '</div></div></div>' +
      '<h2>推奨技術スタック</h2><p>' + p.tech + '</p>' +
      '<h2>SPACE GLEAMから</h2><p>' + p.comment + '</p>' +
      '<div class="cta">AI開発 25万円〜・最短2〜4週間 / 無料相談 受付中</div>' +
      '<p class="note">※ 概算です。要件・機能数・外部連携・非機能要件により変動します。正確なお見積りは無料相談で。<br>SPACE GLEAM株式会社 https://spacegleam.co.jp/</p>' +
      '<script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>';
    w.document.write(html);
    w.document.close();
  }

  var resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      buildCard();
    }, 200);
  }

  /* ---------------- 初期化 ---------------- */
  // プレビュー用: 結果画面を直接開く（?diagresult=1 / #diagresult）
  function openResultDirect() {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setHeroVideo(false);
    renderResult();
  }

  function init() {
    injectCSS();
    loadSaved();
    buildModal();
    buildCard();
    window.addEventListener('resize', handleResize);
    try {
      if (/diagresult|diag=result/.test(location.search + location.hash)) {
        openResultDirect();
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

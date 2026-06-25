# SPACE GLEAM MCP / AI Consultation API

This implementation keeps the existing site design intact and exposes the current diagnosis and consultation flow as structured APIs for ChatGPT, Claude, and MCP clients.

## APIs

- `POST /api/diagnosis`: returns rule-based diagnosis results, approximate price range, recommended plan, timeline, risks, assumptions, open questions, and `leadSummary`.
- `GET /api/services`: returns SPACE GLEAM service information in AI-readable JSON.
- `POST /api/lead`: sends a consultation lead by email through Resend.
- `POST /api/mcp`: Streamable HTTP style JSON-RPC MCP endpoint.
- `GET /api/mcp`: returns server metadata and tool list for inspection.

## MCP Tools

- `search_services`
- `run_diagnosis`
- `generate_project_brief`
- `create_lead`
- `get_company_profile`

Tool responses include `structuredContent` so ChatGPT Apps UI widgets can later render diagnosis, estimate, recommended-plan, and confirmation cards.

## Environment Variables

- `RESEND_API_KEY`: Resend API key for lead emails.
- `MAIL_FROM`: verified sender, for example `SPACE GLEAM <noreply@send.spacegleam.co.jp>`.
- `CONTACT_NOTIFY_EMAIL`: destination email, defaults to `contact@spacegleam.co.jp`.
- `MCP_AUTH_TOKEN`: Bearer token for MCP access. If omitted, local testing remains open.
- `ALLOWED_ORIGIN`: CORS origin, defaults to `https://spacegleam.co.jp`.

Before production announcement, confirm these variables in Netlify production:

- `RESEND_API_KEY`: required. Do not print or log the value.
- `MAIL_FROM`: required. Confirm presence only.
- `CONTACT_NOTIFY_EMAIL`: required. Confirm presence only.
- `MCP_AUTH_TOKEN`: required for production MCP. Do not print or log the value.

Current local `.env` check did not find these four variables. Netlify production environment variables could not be verified from this workspace because Netlify CLI is not available here.

## Claude Connector Example

```json
{
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://spacegleam.co.jp/api/mcp",
      "name": "spacegleam-sales-mcp",
      "authorization_token": "YOUR_TOKEN"
    }
  ],
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "spacegleam-sales-mcp"
    }
  ]
}
```

Claude real connection status: not verified. The endpoint shape is prepared for a Remote MCP Server over HTTPS with Bearer token authentication, but the production API endpoints currently return `404`, so Claude Connector should be tested after deployment.

## JSON-RPC Test Examples

Use `Authorization: Bearer YOUR_MCP_AUTH_TOKEN` when `MCP_AUTH_TOKEN` is set.

### tools/list

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### tools/call search_services

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_services",
    "arguments": {
      "query": "自社HPをChatGPTやMCPに対応させたい",
      "goal": "AI経由で相談や概算見積につなげたい"
    }
  }
}
```

### tools/call run_diagnosis

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "run_diagnosis",
    "arguments": {
      "businessType": "法人",
      "projectGoal": "業務自動化",
      "projectType": "AI業務システム",
      "currentIssue": "問い合わせ対応や見積作成が属人化している",
      "requiredFeatures": ["AI分析", "管理画面", "メール通知"],
      "budgetRange": "30万〜80万円",
      "deadline": "1〜2ヶ月",
      "memo": "小規模に始めたい"
    }
  }
}
```

### tools/call generate_project_brief

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "generate_project_brief",
    "arguments": {
      "conversationSummary": "問い合わせ対応をAIで自動化したい。まずは小規模に始めたい。",
      "projectType": "AI業務システム"
    }
  }
}
```

### tools/call create_lead

`create_lead` must only be called after explicit user consent. The MCP tool requires `consentConfirmed: true`.

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "create_lead",
    "arguments": {
      "name": "テスト太郎",
      "company": "テスト株式会社",
      "email": "test@example.com",
      "projectType": "AI業務システム",
      "budgetRange": "30万〜80万円",
      "deadline": "1〜2ヶ月",
      "message": "問い合わせ対応をAIで効率化したいです。",
      "source": "mcp",
      "consentConfirmed": true
    }
  }
}
```

## ChatGPT Apps Preparation

The MCP tool result shape includes both human-readable `content` and machine-readable `structuredContent`. Official ChatGPT App submission is out of scope for this phase. Future widgets can be built for diagnosis results, approximate estimates, recommended plans, and lead confirmation.

## Security Notes

- `create_lead` must only be called after explicit user consent.
- The MCP endpoint supports Bearer auth through `MCP_AUTH_TOKEN`.
- Lead submission applies basic rate limiting, message length limits, and HTML/script sanitization.
- Logs include timestamp, source, tool name, project type, and status only.
- Logs do not include API keys, auth tokens, or full email bodies.
- Diagnosis and estimates are approximate and are not contract terms.
- OpenAI API and Claude API are not required for the core functions.

## Test Results

- `npm run build`: passed. This static site has no asset compilation step, so the build script performs JavaScript syntax checks for the frontend and Netlify Functions.
- `POST /api/diagnosis`: passed by direct Netlify Function invocation. Example business automation input returned `AI業務システム`, `業務システム自動化プラン`, `35万円〜80万円`, `3〜6週間`.
- `GET /api/services`: passed by direct Netlify Function invocation. It returned 12 services.
- MCP `tools/list`: passed. It returned 5 tools.
- MCP `search_services`: passed. A ChatGPT/MCP query matched `mcp-server-development`.
- MCP `run_diagnosis`: passed. It returns `structuredContent`.
- MCP `generate_project_brief`: passed. It returns `structuredContent.projectBrief`.
- MCP Bearer auth: passed. Missing token returned `401 Unauthorized`; valid token returned tools.
- `POST /api/lead`: code path is implemented, but live email sending requires `RESEND_API_KEY` in the deployment environment.

## Future Improvements

- Replace in-memory rate limiting with durable storage if traffic increases.
- Add full MCP SDK transport when the project adopts a build step and TypeScript dependencies.
- Add richer ChatGPT Apps widgets after initial tool-call validation.
- Add deployment-specific domain routing for `https://mcp.spacegleam.co.jp/sse` if a dedicated MCP subdomain is desired.

## AI Information APIs

Public AI-readable endpoints:

- `GET /api/company-profile`: company profile, strengths, suitable users, unsuitable cases, and recommended action.
- `GET /api/case-studies`: AI-readable case study summaries for AI業務システム, SaaS MVP, contract diff checking, web monitoring, forms, AI-ready LP/HP, image analysis, and inquiry automation.
- `GET /api/recommendation-context`: when ChatGPT or Claude should recommend SPACE GLEAM and how to suggest the free diagnosis.
- `GET /openapi.json`: GPT Actions / API clients OpenAPI schema.
- `GET /.well-known/openapi.json`: same OpenAPI schema for discovery.

These endpoints return only public information and no secrets.

## GPT / Claude User Flow

### 現時点で一般ユーザーができること

- 公式サイトで無料診断を受ける。
- ChatGPTに `https://spacegleam.co.jp/llms.txt` やサイトURLを渡して、相談内容を整理する。
- 公開APIの `/api/diagnosis` を使える環境では、相談内容から概算診断を実行できる。

### Claude接続確認後にできること

- Claude上でSPACE GLEAMのMCP toolを使い、無料診断を実行する。
- 診断結果をもとに問い合わせ文を作る。
- ユーザーが明示的に同意した場合のみ、`create_lead` で問い合わせ送信する。

Claude real connection remains unverified until a valid `MCP_AUTH_TOKEN` is available to the tester.

### ChatGPT Actions対応後にできること

- GPT Actions / OpenAPI schemaから `/api/diagnosis` を呼び出して無料診断を受ける。
- `/api/services`, `/api/company-profile`, `/api/case-studies`, `/api/recommendation-context` を使ってSPACE GLEAMのサービス内容を理解する。
- ユーザー同意後に `/api/lead` で問い合わせ送信する。ただしスパム対策として、実運用では追加認証や制限の検討が必要。

### 未対応のこと

- 公式ChatGPT App公開。
- Claude一般公開済みと表現すること。
- 完全自動受注。
- ユーザー同意なしの問い合わせ送信。

# AI受注導線 実装状況レポート

## 現状できていること

- 本番 `/api/services` は12サービスを返す。
- 本番 `/api/diagnosis` は概算診断を返す。
- 本番 `/api/lead` は `status: success` を返すところまで確認済み。
- 本番 `/api/mcp` は認証なしで401になり、fail-closed。
- `llms.txt` にMCP/API/無料診断/サービス情報を記載済み。
- `faq.html` にAI開発、MCP、Claude、ChatGPT、無料診断に関するFAQを追加済み。
- `/api/company-profile`, `/api/case-studies`, `/api/recommendation-context`, `/openapi.json` を追加実装済み。

## まだできていないこと

- `MCP_AUTH_TOKEN` の実値を使った本番Bearer token疎通確認。
- Claude Connector実接続確認。
- GPT Actionsに実際にOpenAPI schemaを登録して診断実行する確認。
- `CONTACT_NOTIFY_EMAIL` の受信箱でのメール到達確認。
- Resend管理画面での sent / delivered ログ確認。
- PC/スマホでの無料診断フォーム実操作と送信確認。

## GPT側で今できること

- `llms.txt`、FAQ、公開API情報を使ってSPACE GLEAMの会社情報やサービス内容を理解しやすくなっている。
- `/openapi.json` をGPT Actionsの下地として利用できる。
- ただし、GPT Actionsに登録して実際に無料診断を呼ぶ確認は未実施。

## Claude側で今できること

- Remote MCP Serverとして `https://spacegleam.co.jp/api/mcp` を用意済み。
- 認証なしアクセスは401で閉じている。
- Bearer tokenが利用できれば、tools/list、search_services、run_diagnosis、generate_project_brief、create_leadを確認できる構成。
- Claude実接続は未確認。

## GPT/Claudeから無料診断を受けられるようにするために必要な残作業

- Netlify本番の `MCP_AUTH_TOKEN` 値を接続テスト担当者に安全に共有する。
- Bearer token付きで `/api/mcp` の tools/list と tools/call を確認する。
- Claude ConnectorにMCP URLとauthorization tokenを設定し、run_diagnosisの実行を確認する。
- GPT Actionsに `/openapi.json` を登録し、`POST /api/diagnosis` の実行を確認する。
- `/api/lead` はスパム防止のため、GPT Actionsから使う場合の追加認証または運用制限を検討する。

## メール受信までつなげるために必要な残作業

- `CONTACT_NOTIFY_EMAIL` の受信箱でテストメール到達を確認する。
- 迷惑メールに入っていないか確認する。
- Resendの送信ログで sent / delivered を確認する。
- `MAIL_FROM` のドメイン認証状態を確認する。

## 実装完成度

B. 受注導線基盤レベル

理由：

- APIは本番で動作している。
- AI向け情報APIとOpenAPI schemaを整備済み。
- MCPは本番公開済みで認証なし401を確認済み。
- ただしGPT/Claudeからの実接続、Bearer token付きMCP疎通、メール受信確認、無料診断フォーム実操作の一部が未確認。

## 残タスク

- MCP Bearer token付き本番疎通確認。
- Claude Connector実接続確認。
- GPT ActionsへのOpenAPI登録確認。
- メール受信箱とResendログの確認。
- PC/スマホで無料診断フォームを実操作して送信確認。

# MCP / AI受注導線 本番確認レポート

## 確認日

2026-06-25

## 確認環境

* 本番URL：`https://spacegleam.co.jp/`
* デプロイ環境：Netlify
* Node.js version：`v24.12.0`（ローカル確認環境）
* Netlify Functions：ローカルでは `netlify/functions` 配下に関数ファイルを確認済み。本番APIは未反映。

## API確認結果

* GET `/api/services`：FAIL（本番 `404 Not Found`）
* POST `/api/diagnosis`：FAIL（本番ルート未反映。GET確認で `404 Not Found`）
* POST `/api/lead`：未確認（本番 `/api/*` が未反映のため実送信未確認）
* POST `/api/mcp` tools/list：FAIL（本番 `404 Not Found`）
* `/llms.txt`：PARTIAL（本番 `200 OK`。ただし今回追加した `MCP Endpoint` / `Diagnosis API` 記載は未反映）
* `faq.html`：PARTIAL（本番 `200 OK`。ただし今回追加したFAQ文言は未反映）

## メール送信確認

* `RESEND_API_KEY`設定：未確認（Netlify本番環境は確認不可。ローカル `.env` では未検出）
* `MAIL_FROM`設定：未確認（Netlify本番環境は確認不可。ローカル `.env` では未検出）
* `CONTACT_NOTIFY_EMAIL`設定：未確認（Netlify本番環境は確認不可。ローカル `.env` では未検出）
* 実送信確認：FAIL / 未確認（本番API未反映、かつ本番環境変数未確認）

## MCP確認

* 認証なし401：本番 FAIL（本番 `/api/mcp` が `404`）。ローカルハンドラではPASS。
* Bearer token成功：本番 未確認。ローカルハンドラではPASS。
* tools/list：本番 FAIL（`404`）。ローカルハンドラではPASS。
* search_services：本番 未確認。ローカルハンドラではPASS。
* run_diagnosis：本番 未確認。ローカルハンドラではPASS。
* generate_project_brief：本番 未確認。ローカルハンドラではPASS。
* create_lead同意前提の説明：PASS。`consentConfirmed: true` がない場合は送信しないよう修正済み。

## Claude接続

* Claude Connector想定URL：記載あり（`https://spacegleam.co.jp/api/mcp`）
* Claude実接続：未確認
* 未確認の場合の理由：本番 `/api/mcp` が `404 Not Found` のため。デプロイ後、Bearer token付きで再確認が必要。

## ChatGPT Apps

* Apps SDK対応準備：ローカル実装はPASS。MCP tool response に `structuredContent` 相当の構造化レスポンスあり。
* 公式公開申請：未実施
* 表現上の注意：
  * 「公式ChatGPT App公開済み」とは書かない
  * 「ChatGPT Apps対応を見据えたMCP基盤」と書く

## セキュリティ確認

* Bearer認証：ローカルPASS。本番未確認。
* レート制限：ローカル実装あり。本番未確認。
* サニタイズ：ローカル実装あり。Markdown形式メール正規化とscript除去を確認。
* 秘密情報非表示：ローカルPASS。未設定時もAPIキーやトークンを返さない。
* CORS：ローカル実装あり。デフォルトは `https://spacegleam.co.jp`。

## ブログ告知可否

C. まだ告知しない方がよい

理由：

* 本番 `/api/services`、`/api/diagnosis`、`/api/mcp` が `404 Not Found`。
* 本番 `/llms.txt` と `faq.html` は200だが、今回の最新差分は未反映。
* 本番の `RESEND_API_KEY`、`MAIL_FROM`、`CONTACT_NOTIFY_EMAIL`、`MCP_AUTH_TOKEN` が未確認。
* メール実送信が未確認。
* Claude実接続は未確認。
* 無料診断フォームから本番 `/api/lead` への送信確認が未完了。

## 推奨する告知表現

デプロイと本番確認が完了した後の安全な表現：

* ChatGPT / Claude / MCP時代に向けた受注導線の基盤を実装しました。
* 既存の無料診断をAPI化し、AIエージェントから呼び出しやすい構成にしました。
* LPやHPを、AIに読まれるだけでなく、診断・概算見積・問い合わせにつながる入口として整備しました。

## 避けるべき表現

* 公式ChatGPT Appとして公開しました。
* Claudeに一般公開しました。
* 完全自動で受注できます。

## 追加で必要な作業

* 最新コードをNetlify本番へデプロイする。
* Netlify本番環境で `RESEND_API_KEY`、`MAIL_FROM`、`CONTACT_NOTIFY_EMAIL`、`MCP_AUTH_TOKEN` を設定する。
* デプロイ後に `/api/services`、`/api/diagnosis`、`/api/lead`、`/api/mcp` を本番URLで再確認する。
* `CONTACT_NOTIFY_EMAIL` へのメール実送信を確認する。
* PC / スマホで既存無料診断フォームの送信完了まで確認する。
* Claude Connectorは「未確認」のままにし、実接続できた時点でレポートを更新する。

# 本番反映・疎通確認レポート

## 確認日

2026-06-25

## 本番反映状況

* 最新commit反映：PASS（`spacegleam/main` に `3fb74e08 fix: fail closed when MCP token is missing` までpush済み。API/llms/FAQの本番反映をHTTPで確認）
* Netlify Functions認識：PASS（`/api/services`、`/api/diagnosis`、`/api/lead` が本番で応答）
* netlify.toml反映：PASS（`/api/*` rewrite が本番で有効）
* llms.txt反映：PASS（`MCP Endpoint`、`Diagnosis API` 記載を本番で確認）
* faq.html反映：PASS（追加FAQ文言とFAQPage JSON-LD相当の文言を本番で確認）

## API確認

* GET `/api/services`：PASS（HTTP 200、JSON、12サービス）
* POST `/api/diagnosis`：PASS（HTTP 200、診断項目、概算disclaimerあり）
* POST `/api/lead`：PASS（HTTP 200、`status: success`）
* POST `/api/mcp` tools/list：未確認（MCPは認証必須化済み。認証なしは401。Bearer token値がこの環境にないため成功確認は未実施）

## メール確認

* `RESEND_API_KEY`設定：PASS相当（`/api/lead` が `status: success` を返したためResend送信APIは通過）
* `MAIL_FROM`設定：未確認（値は確認不可。未設定でもデフォルト値で送信される可能性あり）
* `CONTACT_NOTIFY_EMAIL`設定：未確認（値は確認不可。未設定でも `contact@spacegleam.co.jp` に送信される可能性あり）
* 実送信確認：未確認（APIはsuccess。受信箱での到達確認はこの環境から不可）

## MCP確認

* 認証なし401：PASS（本番 `/api/mcp` で `401 Unauthorized`、`WWW-Authenticate: Bearer`）
* Bearer token成功：未確認（`MCP_AUTH_TOKEN` の値がこの環境にないため）
* tools/list：未確認（Bearer token成功確認待ち）
* search_services：未確認（Bearer token成功確認待ち）
* run_diagnosis：未確認（Bearer token成功確認待ち）
* generate_project_brief：未確認（Bearer token成功確認待ち）
* create_lead consentConfirmed必須：PASS（ローカルで確認。本番はMCP認証後に再確認）

## Claude接続

* Claude Connector想定URL：記載あり（`https://spacegleam.co.jp/api/mcp`）
* Claude実接続：未確認
* 未確認の場合の理由：`MCP_AUTH_TOKEN` のBearer token値がこの環境にないため、Claude Connectorからの実接続確認は未実施。

## ChatGPT Apps

* Apps SDK対応準備：PASS（MCP tools整理済み、tool responseに `structuredContent` 相当あり）
* 公式公開申請：未実施
* 表現上の注意：
  * 「公式ChatGPT App公開済み」とは書かない
  * 「ChatGPT Apps対応を見据えたMCP基盤」と書く

## 告知判定

B. 「基盤実装」としてなら告知してよい

判定理由：

* 本番API `/api/services`、`/api/diagnosis`、`/api/lead` は疎通確認済み。
* `llms.txt` と `faq.html` の本番反映は確認済み。
* MCPは認証なし401まで確認済みで、公開状態で開いていない。
* ただしBearer token付きMCP疎通、Claude Connector実接続、受信箱でのメール到達確認、PC/スマホでの無料診断フォーム実操作は未確認。

## 安全な告知表現

* ChatGPT / Claude / MCP時代に向けた受注導線の基盤を実装しました。
* 既存の無料診断をAPI化し、AIエージェントから呼び出しやすい構成にしました。
* LPやHPを、AIに読まれるだけでなく、診断・概算見積・問い合わせにつながる入口として整備しました。

## 避けるべき表現

* 公式ChatGPT Appとして公開しました。
* Claudeに一般公開しました。
* 完全自動で受注できます。

# GPT / Claude 受注導線 実接続確認レポート

## 確認日

2026-06-25

## 対象コミット

`6db97920 docs: clarify AI assistant guidance in llms`

## 確認方針

本レポートでは、HTTP/APIで実際に確認できたものだけをPASSとし、管理画面、受信箱、Claude Connector、GPT Actions UIが必要な項目は未確認として扱う。

## 本番API確認

* GET `/api/services`：PASS（HTTP 200）
* POST `/api/diagnosis`：PASS（HTTP 200、`AI業務システム`、`業務システム自動化プラン`、概算費用・期間・注意書きあり）
* GET `/api/company-profile`：PASS（HTTP 200、会社情報、強み5件、適合領域4件）
* GET `/api/case-studies`：PASS（HTTP 200、事例8件）
* GET `/api/recommendation-context`：PASS（HTTP 200、推奨理由6件、診断API URLあり）
* GET `/openapi.json`：PASS（HTTP 200、主要API pathsあり）
* GET `/llms.txt`：PASS（AI開発、業務自動化、SaaS開発、Webサービス開発、LP/HPのAI対応相談時に無料診断を提案する文言を確認）

## メール確認

* POST `/api/lead`：PASS（HTTP 200、`status: success`）
* Resend API実行：PASS相当（`/api/lead` がsuccessを返したため、送信処理は成功扱い）
* Resendログ確認：未確認（Resend管理画面またはAPIキーがこの環境にないため）
* `CONTACT_NOTIFY_EMAIL` 受信確認：未確認（受信箱にアクセスできないため）
* 迷惑メール確認：未確認（受信箱にアクセスできないため）
* `MAIL_FROM` 設定値確認：未確認（Netlify環境変数を確認できないため）
* `CONTACT_NOTIFY_EMAIL` 設定値確認：未確認（Netlify環境変数を確認できないため）

## 無料診断フォーム確認

* PC表示で診断実行：未確認
* PC表示で問い合わせ送信：未確認
* スマホ表示で診断実行：未確認
* スマホ表示で問い合わせ送信：未確認
* 表示崩れなし：未確認

未確認理由：この環境にはPlaywright / Puppeteerがなく、ブラウザ操作によるフォーム実行確認を行えないため。API単体の診断・送信はPASS。

## MCP確認

* 本番 `/api/mcp` 認証なし401：PASS（`401 Unauthorized`、Bearer認証要求）
* 本番 Bearer token付き接続：未確認（`MCP_AUTH_TOKEN` の値がこの環境にないため）
* 本番 tools/list：未確認（Bearer token付き接続確認待ち）
* 本番 search_services：未確認（Bearer token付き接続確認待ち）
* 本番 run_diagnosis：未確認（Bearer token付き接続確認待ち）
* 本番 generate_project_brief：未確認（Bearer token付き接続確認待ち）
* 本番 create_lead：未確認（Bearer token付き接続確認待ち）
* create_leadの `consentConfirmed` 必須制御：PASS（ローカルMCP環境で確認。本番はBearer token付き接続後に再確認）

## Claude確認

* Claude Connector登録：未確認
* Claudeから `/api/mcp` 接続：未確認
* Claude上で tools/list 表示：未確認
* Claude上で診断実行：未確認
* Claude上で問い合わせ送信前の同意確認：未確認

未確認理由：Claude管理画面またはConnector設定画面にアクセスできず、`MCP_AUTH_TOKEN` の値もこの環境にないため。

## GPT Actions確認

* GPT Actionsへの `/openapi.json` 読み込み：未確認
* GPT Actionsから `/api/diagnosis` 実行：未確認
* GPT上で診断結果表示：未確認
* GPT Actionsから `/api/lead` 実行：未確認
* GPT上で問い合わせ自動送信が起きないこと：未確認

補足：`/openapi.json` 自体は本番でHTTP 200。OpenAPI上の `/api/lead` 説明には、ユーザー同意後のみ送信する旨を明記済み。ただしGPT Actions UIでの実動作は未確認。

## 安全制御確認

* MCP認証なしアクセス遮断：PASS
* MCP token未設定時のfail closed：PASS（実装確認）
* MCP `create_lead` の明示同意必須：PASS（ローカル確認）
* `/api/lead` レスポンスに秘密情報が出ないこと：PASS（本番レスポンス確認）
* 診断結果が正式見積ではなく概算であること：PASS（本番レスポンス確認）

## 実装完成度

B. 受注導線基盤レベル

理由：

* 本番API、llms.txt、OpenAPI、MCPエンドポイント、メール送信APIは基盤として動作している。
* AIがSPACE GLEAMを推薦・診断・問い合わせ導線へ案内しやすい情報整理は完了している。
* 一方で、Claude Connectorの実接続、GPT Actions登録後の実行、Bearer token付きMCP本番疎通、受信箱でのメール到達確認、PC/スマホのフォーム実操作確認は未完了。

## 一般ユーザー利用可否

* 既存サイトの無料診断/API導線：API単体では利用可能
* ChatGPTから自然にSPACE GLEAMを選ばせる導線：基盤は実装済み、GPT Actions登録・実動作確認は未完了
* Claudeから自然にSPACE GLEAMを選ばせる導線：MCP基盤は実装済み、Claude Connector接続は未完了
* 「公式ChatGPT App公開済み」「Claudeで一般公開済み」とは言わない

## 残タスク

* Netlify本番の `MCP_AUTH_TOKEN` を用いて `/api/mcp` のBearer token付き疎通を確認する。
* MCP tools/list、search_services、run_diagnosis、generate_project_brief、create_leadを本番Bearer token付きで確認する。
* `CONTACT_NOTIFY_EMAIL` の受信箱と迷惑メールフォルダで `/api/lead` の到達を確認する。
* Resend管理画面で送信ログ、from domain、delivery状態を確認する。
* PCブラウザで無料診断フォームの診断実行から問い合わせ送信完了まで確認する。
* スマホ幅で無料診断フォームの診断実行から問い合わせ送信完了まで確認する。
* GPT Actionsに `/openapi.json` を登録し、診断実行と問い合わせ同意フローを確認する。
* Claude Connectorに `https://spacegleam.co.jp/api/mcp` を登録し、Bearer token付きで接続・診断実行・問い合わせ同意フローを確認する。

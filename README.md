# Form Webhook Practice

Next.js + TypeScript + Tailwind CSS で作成したシンプルなリードキャプチャフォームです。

## 機能

- 3つの入力フィールド（名前、メールアドレス、電話番号）
- 基本的なバリデーション（必須フィールド）
- Webhook URLへのPOST送信
- 送信成功時のメッセージ表示

## セットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 環境変数の設定:
`.env.local`ファイルを作成し、以下のように設定してください:
```
NEXT_PUBLIC_WEBHOOK_URL=https://your-webhook-url.com/endpoint
```

3. 開発サーバーの起動:
```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## ビルド

```bash
npm run build
npm start
```

## 技術スタック

- Next.js 14
- TypeScript
- Tailwind CSS
- React 18


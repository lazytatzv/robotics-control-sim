# Robotics & Control Theory Simulator (Rust + WebAssembly)

超軽量・高速なブラウザベースのロボティクス ＆ 制御工学シミュレータです。
物理シミュレーションおよび制御アルゴリズムのコアは **Rust (`no_std` 対応設計)** で記述され、WebAssembly（Wasm）を通じてブラウザ上で 60 FPS のリアルタイムシミュレーションを実行します。

---

## 🌟 主な機能

### 1. 本格的 PID 制御シミュレータ
* **対象プラント**:
  * DCモータ 位置制御（$\theta$）
  * DCモータ 速度制御（$\omega$）
  * バネ・マス・ダンパ系 台車（$x$）
* **制御器アルゴリズム**:
  * 標準 PID（偏差ベース）
  * 微分先行型 PID（$PI\text{-}D$: 目標値急変時の微分キック防止）
  * 比例・微分先行型 PID（$I\text{-}PD$）
  * 微分ローパスフィルタ（$N$ 係数による高周波ノイズ遮断）
  * **アンチワインドアップ（Anti-Windup）**: Clamping（条件付き積分停止）および Back-Calculation（逆計算トラッキング）
  * 出力飽和リミット（±Umax）
* **評価指標（メトリクス）**:
  * 立ち上がり時間（$t_r$）、オーバーシュート率（$M_p$）、整定時間（$t_s$）、定常偏差（$e_{ss}$）をリアルタイム自動算出
* **外乱 ＆ ノイズ実験**:
  * 負荷トルク外乱、センサホワイトノイズ注入、ステップ応答テスト

### 2. 2自由度ロボットアーム運動学（Kinematics）
* **順運動学（FK）** ＆ **逆運動学（IK）**:
  * マウスドラッグで手先ターゲット位置を動かすと、Rust Wasm の IK ソルバーがリアルタイムに関節角度 $(\theta_1, \theta_2)$ を逆算
  * 上肘（Elbow-Up）/ 下肘（Elbow-Down）の解の切り替え
  * 作業領域（ワークスペース）と特異点（解なし領域）の可視化

---

## 🏗️ アーキテクチャ

* **Core Engine (`crates/control-core`)**: Pure Rust (`no_std` 対応可能)。PID制御器、RK4数値積分器、DCモータ/台車モデル、運動学。実機（マイコンやROS 2）にそのまま移植可能。
* **Wasm Bridge (`crates/wasm-bridge`)**: `wasm-bindgen` によるブラウザ連携。
* **Frontend (`src/`)**: Vite + TypeScript + 純粋な HTML5 Canvas 2D による超軽量・超高速描画（バンドルサイズ約 100 KB 以下、外部重厚ライブラリ非依存）。

---

## 🚀 ローカルでの開発・実行方法

### 必要要件
* Rust (最新の stable) + `wasm32-unknown-unknown`
* `wasm-pack` (`cargo install wasm-pack` または公式インストーラ)
* Node.js (v20 以上)

### 起動手順

```bash
# 依存関係インストール
npm install

# 開発サーバ起動 (Wasmコンパイル + Vite)
npm run build:wasm
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

### プロダクションビルド

```bash
npm run build
```

`dist/` フォルダに静的ファイル（HTML, JS, CSS, WASM）が出力されます。

---

## 🌐 GitHub Pages へのデプロイ

リポジトリ設定の **Settings > Pages > Build and deployment > Source** を `GitHub Actions` に設定すると、`main` または `master` ブランチへの `git push` をトリガーに自動デプロイされます。

```bash
git add .
git commit -m "feat: initial release of robotics & control simulator"
git push origin main
```

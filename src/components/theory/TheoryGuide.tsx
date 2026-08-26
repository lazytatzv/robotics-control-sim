import React, { useState } from 'react';

type SectionKey =
  | 'guide'
  | 'pid_2dof'
  | 'cascade'
  | 'smc'
  | 'notch_scurve'
  | 'bode_stability'
  | 'autotune'
  | 'kinematics';

export const TheoryGuide: React.FC = () => {
  const [activeKey, setActiveKey] = useState<SectionKey>('guide');

  const navItems: { key: SectionKey; title: string; subtitle: string }[] = [
    { key: 'guide', title: '01 // QUICK START & USAGE', subtitle: 'オシロスコープ・解析ツールの使い方' },
    { key: 'pid_2dof', title: '02 // PID, 2-DOF & FEEDFORWARD', subtitle: 'PID・2自由度重み・FF補償' },
    { key: 'cascade', title: '03 // CASCADE P-PI SERVO', subtitle: '産業用位置・速度2重ループ制御' },
    { key: 'smc', title: '04 // SLIDING MODE CONTROL (SMC)', subtitle: '最強のロバスト・非線形制御' },
    { key: 'notch_scurve', title: '05 // NOTCH FILTER & S-CURVE', subtitle: '機械共振抑制 & ジャーク制限加減速' },
    { key: 'bode_stability', title: '06 // BODE & STABILITY MARGINS', subtitle: 'ボード線図・ゲイン/位相余裕・帯域幅' },
    { key: 'autotune', title: '07 // AUTO-TUNING ALGORITHMS', subtitle: '極配置法・CHR法・ZN法の数理' },
    { key: 'kinematics', title: '08 // ROBOT ARM KINEMATICS', subtitle: '2軸ロボット順運動学・逆運動学 (FK/IK)' },
  ];

  return (
    <main style={{ gridTemplateColumns: '260px 1fr', background: 'var(--bg-black)', height: 'calc(100vh - 45px)' }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ borderRight: '1px solid var(--border-subtle)', padding: '0.75rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-bright)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          THEORY & REFERENCE MANUAL
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              style={{
                textAlign: 'left',
                padding: '0.6rem 0.75rem',
                background: activeKey === item.key ? '#27272a' : '#141417',
                border: activeKey === item.key ? '1px solid #3f3f46' : '1px solid #1f1f23',
                color: activeKey === item.key ? '#fafafa' : '#a1a1aa',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em' }}>{item.title}</div>
              <div style={{ fontSize: '0.62rem', color: '#71717a', marginTop: '0.2rem' }}>{item.subtitle}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <section style={{ overflowY: 'auto', padding: '2rem 3rem', maxWidth: '1050px', lineHeight: 1.7, color: 'var(--text-main)' }}>
        {/* SECTION 1: QUICK START & USAGE */}
        {activeKey === 'guide' && (
          <div className="reference-view">
            <h2>01 // SIMULATOR QUICK START & USAGE GUIDE</h2>
            <p>
              本システムは、Rust (WebAssembly) によるミリ秒精度の連続時間数値積分（RK4 / オイラー法）と、
              HTML5 Canvas による 60FPS リアルタイム・オシロスコープを備えたプロフェッショナル向け制御工学シミュレータです。
            </p>

            <h3>1. 3つのスコープモード（VIEW // SCOPE ANALYSIS MODE）</h3>
            <ul>
              <li>
                <strong>⏱️ TIME SCOPE（リアルタイムモード）</strong>:
                画面が等速で左スクロールするオシロスコープです。スライダー操作や外乱印加に対する過渡応答・挙動をインタラクティブに観察できます。
              </li>
              <li>
                <strong>📊 BODE PLOT（周波数応答モード）</strong>:
                現在設定されているPIDゲインとモーター物理定数から、開ループ L(jω) および閉ループ T(jω) のボード線図（振幅特性・位相特性）をリアルタイム計算します。
              </li>
              <li>
                <strong>⚡ 5S BATCH（5秒一括バッチモード）</strong>:
                MATLAB の <code>step(sys)</code> と同様に、0〜5.0秒のステップ応答（2.5秒時点の外乱応答を含む）を Rust 内で1ミリ秒で一括計算して静止プロットします。
              </li>
            </ul>

            <h3>2. 比較・解析ツール</h3>
            <ul>
              <li>
                <strong>📸 CAPTURE A/B（ゴーストトレース比較）</strong>:
                現在の波形をグレーの破線（ゴースト）として固定。ゲインや制御モードを変更した後の波形と直接重ね合わせて、ビフォーアフターの過渡特性を比較できます。
              </li>
              <li>
                <strong>💾 CSV EXPORT（データ書き出し）</strong>:
                時刻 t、目標値 r、出力 y、速度 v、操作量 u、各項（P, I, D, FF）、モータ電流 i、飽和フラグをCSVダウンロードし、MATLAB や Python (Pandas) で分析できます。
              </li>
              <li>
                <strong>⚡ STEP INVERT & PULSE LOAD</strong>:
                ワンクリックで目標値を ±1.57 rad 反転させたり、4.0 N·m のパルス負荷外乱を与えて外乱抑制性能（レギュレーション特性）をテストできます。
              </li>
            </ul>
          </div>
        )}

        {/* SECTION 2: PID, 2-DOF & FEEDFORWARD */}
        {activeKey === 'pid_2dof' && (
          <div className="reference-view">
            <h2>02 // CONTINUOUS PID, 2-DOF & FEEDFORWARD CONTROL</h2>
            
            <h3>1. 不完全微分（ローパスフィルタ付き）PIDの基本数式</h3>
            <p>
              高周波センサノイズの過大増幅を防ぐため、実務で標準の 1次ローパスフィルタ係数 N を備えた不完全微分を採用しています：
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              u(t) = Kp · e(t) + Ki · ∫ e(τ) dτ + Kd · (de_f(t)/dt)<br />
              where  de_f/dt + N · e_f = N · de/dt  (Filter Cutoff: ω_c ≈ N rad/s)
            </div>

            <h3>2. 2自由度PID（2-DOF PID / Setpoint Weighting）</h3>
            <p>
              従来のPIDでは「目標値追従性（サーボ特性）」と「外乱抑制性（レギュレーション特性）」を同時に最適化できないトレードオフが存在します。
              2-DOF PID では目標値重み係数 b (P項) および c (D項) を導入することで、両者を独立して最適化します：
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              e_p(t) = b · r(t) - y(t) &nbsp;&nbsp;&nbsp;&nbsp;(b &lt; 1 で目標値ステップ時のオーバーシュートを激減)<br />
              e_d(t) = c · r(t) - y(t) &nbsp;&nbsp;&nbsp;&nbsp;(c = 0 で微分キック完全防止の PI-D 構造)
            </div>

            <h3>3. フィードフォワード制御（Feedforward Compensation）</h3>
            <p>
              フィードバック制御（誤差が出てから修正する）の遅れを補うため、目標軌道から必要なトルク・電圧を事前入力します：
            </p>
            <ul>
              <li><strong>速度FF（Kvff · dr/dt）</strong>: 逆起電力 Ke·ω および粘性摩擦 B·ω を事前補償</li>
              <li><strong>加速度FF（Kaff · d²r/dt²）</strong>: ロータ慣性加速トルク J·α を事前補償</li>
              <li><strong>摩擦FF（Kfric · sign(dr/dt)）</strong>: 静止・クーロン摩擦のデッドゾーンを事前突破</li>
            </ul>

            <h3>4. 「Kp を下げると逆にオーバーシュートが大きくなる」理由</h3>
            <p>
              Ki（積分項）が残ったまま Kp を下げると、立ち上がりが遅くなることで誤差が長時間蓄積し（積分ワインドアップ）、目標値到達時に過大な積分出力が残って大オーバーシュートします。
              数学的にも2次系の減衰比 <code>ζ = (Beff + Km·Kp) / (2·sqrt(Km·Ki))</code> の分子に Kp が入っているため、Kp の低下は系の減衰不足（アンダーダンプ）を引き起こします。
            </p>
          </div>
        )}

        {/* SECTION 3: CASCADE P-PI */}
        {activeKey === 'cascade' && (
          <div className="reference-view">
            <h2>03 // CASCADE P-PI DUAL-LOOP SERVO CONTROL</h2>
            <p>
              産業用ロボットや工作機械のサーボアンプ（FANUC, Yaskawa, Mitsubishi, Beckhoff等）において、
              単一のPIDではなく<strong>カスケード位置・速度2重ループ制御</strong>が業界標準として100%採用されています。
            </p>

            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              【外側 位置Pループ】: v_target = clamp( Kpp · (r_pos - y_pos), -Vmax, +Vmax )<br />
              【内側 速度PIループ】: u = clamp( Kvp · (v_target - v_act) + Kvi · ∫(v_target - v_act)dt, -Umax, +Umax )
            </div>

            <h3>なぜカスケード制御が優れているのか？</h3>
            <ul>
              <li>
                <strong>① 最大速度・加速度の物理リミットを厳密に保証</strong>:
                位置ループの出力（目標速度 v_target）に上限クリップをかけるだけで、モーターの過回転や機構の破壊を確実に防止できます。
              </li>
              <li>
                <strong>② 内部外乱（摩擦・逆起電力・トルクリップル）の超高速遮断</strong>:
                内側の速度ループが高帯域（数十〜数百Hz）で動作し、負荷変動や摩擦外乱を位置ループに波及する前に即座に打ち消します。
              </li>
              <li>
                <strong>③ 調整（チューニング）の明確性</strong>:
                内側ループ（速度PI）でダンピングと剛性を固めた後、外側ループ（位置P）で応答周波数 Kpp を上げるだけで安全にゲイン調整できます。
              </li>
            </ul>
          </div>
        )}

        {/* SECTION 4: SLIDING MODE CONTROL */}
        {activeKey === 'smc' && (
          <div className="reference-view">
            <h2>04 // SLIDING MODE CONTROL (ROBUST SMC)</h2>
            <p>
              スライディングモード制御（SMC）は、プラントのパラメータ変動（負荷質量の変化、摩擦の不確かさ）や外乱に対して
              <strong>完全な不感性（Invariance Property）</strong>を持つ最強の非線形ロバスト制御アルゴリズムです。
            </p>

            <h3>1. 切替超平面（Sliding Surface）</h3>
            <p>
              状態誤差空間において、目標とする1次安定微分方程式を表すスライディング超平面 s(t) = 0 を設計します：
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              s(t) = e_dot(t) + λ · e(t) = 0 &nbsp;&nbsp;&nbsp;&nbsp;(λ: スライディング面の傾き / 収束時定数 τ = 1/λ)
            </div>

            <h3>2. 制御入力の構成とバウンダリ層（チャタリング抑制）</h3>
            <p>
              制御入力は「公称モデルを相殺する等価制御 u_eq」と「不確かさをねじ伏せる不連続ロバスト項 u_robust」の和で構成されます：
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              u(t) = u_eq + K_switch · sat( s(t) / ε )<br />
              where  sat(x) = x (|x| ≤ 1),  sign(x) (|x| &gt; 1)
            </div>
            <ul>
              <li><strong>超平面への拘束条件</strong>: リアプノフ関数 <code>V = (1/2)s²</code> に対し、時間微分が負定値となるよう K_switch を設定。</li>
              <li><strong>バウンダリ層 ε</strong>: 純粋な sign(s) は高周波振動（チャタリング）を招くため、厚み ε の連続飽和関数 sat で滑らかに補間。</li>
            </ul>
          </div>
        )}

        {/* SECTION 5: NOTCH FILTER & S-CURVE */}
        {activeKey === 'notch_scurve' && (
          <div className="reference-view">
            <h2>05 // MECHANICAL NOTCH FILTER & S-CURVE TRAJECTORY</h2>

            <h3>1. 2次双二次ノッチフィルタ（Bi-quad Notch Filter）</h3>
            <p>
              ロボットアームの減速機（ハーモニックドライブ等）やベルト駆動系には固有の機械共振周波数が存在し、ゲインを上げると発散・異音（ハンチング）が発生します。
              ノッチフィルタは共振点 ω_n のみをピンポイントで鋭く減衰させます：
            </p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              H_n(s) = ( s² + 2·ζ_num·ω_n·s + ω_n² ) / ( s² + 2·ζ_den·ω_n·s + ω_n² )<br />
              (ζ_num: ノッチの深さ / ζ_den: ノッチの帯域幅)
            </div>

            <h3>2. S字加減速・ジャーク制限軌道生成器（S-Curve Trajectory）</h3>
            <p>
              ステップ入力は数学的に加速度・躍度（ジャーク j(t) = d³r/dt³）が無限大となり、実機では衝撃・脱調・摩耗を引き起こします。
              S字軌道生成器は、速度・加速度・ジャークの3重制限をかけて滑らかな位置指令軌道を生成します：
            </p>
            <ul>
              <li><strong>台形速度プロファイル</strong>: 加速度が矩形波 $\to$ ジャークが無限大のスパイクになる。</li>
              <li><strong>S字プロファイル（Jerk-Limited）</strong>: 加速度を台形にし、ジャークを一定値 j_max 以内に制限 $\to$ 機械振動を励振しない滑らかな加減速。</li>
            </ul>
          </div>
        )}

        {/* SECTION 6: BODE & STABILITY */}
        {activeKey === 'bode_stability' && (
          <div className="reference-view">
            <h2>06 // FREQUENCY RESPONSE & STABILITY MARGINS</h2>
            <p>
              一巡伝達関数 L(s) = C(s) P(s) に s = jω を代入した複素周波数応答から、制御系の安定度とロバスト性を定量評価します。
            </p>

            <h3>1. ボード線図の読み方</h3>
            <ul>
              <li><strong>ゲイン交差周波数（ω_gc）</strong>: 開ループゲインが 0 dB（振幅比 1倍）を通過する角周波数。</li>
              <li><strong>位相余裕（Phase Margin: Φ_m）</strong>: ゲイン交差周波数 ω_gc における位相進み量 <code>Φ_m = 180° + ∠L(jω_gc)</code>。
                <br /><span style={{ color: '#22c55e' }}>推奨値: 45° 〜 60°</span>（30° 未満は激しいオーバーシュート・発振危険域）。
              </li>
              <li><strong>位相交差周波数（ω_pc）</strong>: 位相が -180° を通過する角周波数。</li>
              <li><strong>ゲイン余裕（Gain Margin: G_m）</strong>: 位相交差周波数 ω_pc におけるゲインの減衰量 <code>G_m = -20 log10 |L(jω_pc)| dB</code>。
                <br /><span style={{ color: '#22c55e' }}>推奨値: 6 dB 〜 12 dB 以上</span>。
              </li>
              <li><strong>閉ループ帯域幅（-3dB Bandwidth: ω_BW）</strong>: 閉ループ伝達関数 T(jω) が -3dB に低下する周波数。指令追従の限界応答速度を示す。</li>
            </ul>
          </div>
        )}

        {/* SECTION 7: AUTO-TUNING */}
        {activeKey === 'autotune' && (
          <div className="reference-view">
            <h2>07 // MATHEMATICAL AUTO-TUNING ALGORITHMS</h2>
            <p>
              プラントの物理パラメータ（慣性 J、抵抗 R、トルク定数 Kt 等）から理論的最適ゲインを自動合成する手法群です。
            </p>

            <h3>1. 極配置法（Pole Placement Method）</h3>
            <p>閉ループ特性方程式の極を望ましい固有角周波数 ω_n と減衰比 ζ に直接配置します：</p>
            <ul>
              <li><strong>臨界制動（ζ = 1.0）</strong>: 重根極 <code>(s + ω_n)²</code>。理論上オーバーシュート 0% で最短時間収束。</li>
              <li><strong>バターワース最適減衰（ζ = 1/√2 ≈ 0.707）</strong>: 通過帯域の平坦性を最大化し、オーバーシュートを約4.3%に抑えて最速立ち上がり。</li>
            </ul>

            <h3>2. CHR法（Chien-Hrones-Reswick Method）</h3>
            <p>Ziegler-Nichols の過大なオーバーシュート（25〜30%）を改良した産業界標準手法：</p>
            <ul>
              <li><strong>CHR 0% Overshoot</strong>: 目標値急変時でも行き過ぎを完全に禁止する調整。</li>
              <li><strong>CHR 20% Overshoot</strong>: 立ち上がり速度を優先し、許容オーバーシュート20%以内で限界チューニング。</li>
            </ul>
          </div>
        )}

        {/* SECTION 8: KINEMATICS */}
        {activeKey === 'kinematics' && (
          <div className="reference-view">
            <h2>08 // 2-LINK PLANAR ROBOT ARM KINEMATICS</h2>

            <h3>1. 順運動学（Forward Kinematics: FK）</h3>
            <p>関節角度 (θ1, θ2) から手先デカルト座標 (x, y) を計算：</p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              x = L1 · cos(θ1) + L2 · cos(θ1 + θ2)<br />
              y = L1 · sin(θ1) + L2 · sin(θ1 + θ2)
            </div>

            <h3>2. 解析的逆運動学（Inverse Kinematics: IK）</h3>
            <p>目標手先位置 (x, y) から必要な各関節角度 (θ1, θ2) を幾何学的に逆算：</p>
            <div style={{ background: '#121215', padding: '1rem', border: '1px solid #27272a', borderRadius: '4px', margin: '0.75rem 0', fontFamily: 'monospace' }}>
              cos(θ2) = ( x² + y² - L1² - L2² ) / ( 2 · L1 · L2 )<br />
              θ2 = ± arccos( cos(θ2) ) &nbsp;&nbsp;&nbsp;&nbsp;(肘上 / 肘下の2解が存在)<br />
              θ1 = atan2(y, x) - atan2( L2·sin(θ2), L1 + L2·cos(θ2) )
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

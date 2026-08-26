import React from 'react';

export const TheoryGuide: React.FC = () => {
  return (
    <main style={{ gridTemplateColumns: '1fr' }}>
      <div className="card theory-content">
        <h2>📚 制御工学 ＆ 運動学の理論解説</h2>

        <h3>1. PID制御の数式と各項の役割</h3>
        <p>標準的な連続時間PID制御器の出力 $u(t)$ は以下の通りです：</p>
        <p style={{ margin: '0.5rem 0' }}>
          <code>u(t) = Kp * e(t) + Ki * ∫ e(τ) dτ + Kd * (de(t)/dt)</code>
        </p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
          <li>
            <strong>比例項 (P)</strong>: 現在の偏差 $e(t)$ に比例して操作量を決定。応答速度を速めるが、摩擦や定常負荷があると定常偏差が残る。
          </li>
          <li>
            <strong>積分項 (I)</strong>: 過去の偏差を積算して操作量を補正。定常偏差をゼロにするが、位相遅れを生みオーバーシュートやワインドアップを引き起こしやすい。
          </li>
          <li>
            <strong>微分項 (D)</strong>: 偏差の変化速度（傾き）から未来の動きを予測してブレーキをかける。減衰を高めるが、高周波ノイズを増幅するため低域通過フィルタ（N）が必須。
          </li>
        </ul>

        <h3>2. ワインドアップ現象とアンチワインドアップ (Anti-Windup)</h3>
        <p>
          モータの駆動電圧やアクチュエータには最大出力リミット（飽和）が存在します。飽和中も積分器が偏差を溜め込み続けると、目標値に達した後も積分値が抜けるまで逆方向に動けなくなり、巨大なオーバーシュートと発振が発生します。
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Clamping (条件付き積分停止)</strong>: 出力が上限に達しており、さらに偏差が同符号（飽和を助長する方向）の場合は積分の更新を一時停止します。
        </p>

        <h3>3. 微分先行型PID (PI-D, I-PD)</h3>
        <p>
          目標値 $r(t)$ がステップ状に急変した際、偏差 $e = r - y$ を直接微分すると無限大に近い微分スパイク（キック）が発生します。これを防ぐため、微分項を測定値の微分 <code>-Kd * (dy/dt)</code> から算出するのが <strong>PI-D</strong> です。
        </p>

        <h3>4. 2リンクアームの逆運動学 (Inverse Kinematics: IK)</h3>
        <p>手先目標位置 $(x, y)$ から関節角度 $(\theta_1, \theta_2)$ を求める幾何学的解法：</p>
        <p style={{ margin: '0.5rem 0' }}>
          <code>cos(θ2) = (x^2 + y^2 - L1^2 - L2^2) / (2 * L1 * L2)</code>
        </p>
        <p>
          余弦定理により $\theta_2$ の解が 2つ（上肘 Elbow-Up / 下肘 Elbow-Down）存在し、ターゲットが $L_1 + L_2$ を超えると特異点（解なし）となります。
        </p>
      </div>
    </main>
  );
};

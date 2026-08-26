import { initializeWasm, Simulator, StepDataPoint } from './sim-bridge';
import { CanvasPlotter } from './renderers/plot';
import { PlantRenderer } from './renderers/plant';
import { ArmRenderer } from './renderers/arm';

async function bootstrap() {
  await initializeWasm();

  const sim = new Simulator();

  // Elements
  const selectPlant = document.getElementById('select-plant') as HTMLSelectElement;
  const selectPreset = document.getElementById('select-preset') as HTMLSelectElement;
  const inputKp = document.getElementById('input-kp') as HTMLInputElement;
  const inputKi = document.getElementById('input-ki') as HTMLInputElement;
  const inputKd = document.getElementById('input-kd') as HTMLInputElement;
  const inputFn = document.getElementById('input-fn') as HTMLInputElement;
  const selectPidForm = document.getElementById('select-pid-form') as HTMLSelectElement;
  const selectAntiWindup = document.getElementById('select-anti-windup') as HTMLSelectElement;
  const inputSat = document.getElementById('input-sat') as HTMLInputElement;
  const inputTarget = document.getElementById('input-target') as HTMLInputElement;
  const inputDist = document.getElementById('input-dist') as HTMLInputElement;
  const inputNoise = document.getElementById('input-noise') as HTMLInputElement;

  // Value displays
  const valKp = document.getElementById('val-kp')!;
  const valKi = document.getElementById('val-ki')!;
  const valKd = document.getElementById('val-kd')!;
  const valFn = document.getElementById('val-fn')!;
  const valSat = document.getElementById('val-sat')!;
  const valTarget = document.getElementById('val-target')!;
  const valDist = document.getElementById('val-dist')!;
  const valNoise = document.getElementById('val-noise')!;

  // Metrics
  const metricTr = document.getElementById('metric-tr')!;
  const metricMp = document.getElementById('metric-mp')!;
  const metricTs = document.getElementById('metric-ts')!;
  const metricEss = document.getElementById('metric-ess')!;

  // Buttons
  const btnStep = document.getElementById('btn-step-input') as HTMLButtonElement;
  const btnPulseDist = document.getElementById('btn-pulse-dist') as HTMLButtonElement;
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
  const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;

  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabs = {
    'tab-pid': document.getElementById('tab-pid')!,
    'tab-arm': document.getElementById('tab-arm')!,
    'tab-theory': document.getElementById('tab-theory')!,
  };

  let isPaused = false;
  const history: StepDataPoint[] = [];
  const maxHistoryPoints = 1000;
  const simDt = 0.005; // 5ms simulation step

  // Canvases
  const canvasPlant = document.getElementById('canvas-plant') as HTMLCanvasElement;
  const canvasResponse = document.getElementById('canvas-response') as HTMLCanvasElement;
  const canvasControl = document.getElementById('canvas-control') as HTMLCanvasElement;
  const canvasArm = document.getElementById('canvas-arm') as HTMLCanvasElement;

  const plantRenderer = new PlantRenderer(canvasPlant);
  const responsePlotter = new CanvasPlotter(canvasResponse, {
    title: '時間応答: 目標値 r(t) vs 出力 y(t)',
  });
  const controlPlotter = new CanvasPlotter(canvasControl, {
    title: '制御入力 u(t) および 各項成分 (P, I, D)',
  });
  const armRenderer = new ArmRenderer(canvasArm);

  function syncConfigFromUI() {
    const kp = parseFloat(inputKp.value);
    const ki = parseFloat(inputKi.value);
    const kd = parseFloat(inputKd.value);
    const fn = parseFloat(inputFn.value);
    const sat = parseFloat(inputSat.value);
    const form = selectPidForm.value;
    const aw = selectAntiWindup.value;

    valKp.textContent = kp.toFixed(1);
    valKi.textContent = ki.toFixed(1);
    valKd.textContent = kd.toFixed(2);
    valFn.textContent = fn.toFixed(0);
    valSat.textContent = sat.toFixed(1);
    valTarget.textContent = parseFloat(inputTarget.value).toFixed(2);
    valDist.textContent = parseFloat(inputDist.value).toFixed(1);
    valNoise.textContent = parseFloat(inputNoise.value).toFixed(3);

    sim.configure_pid(kp, ki, kd, fn, -sat, sat, aw, form, 1.0);
  }

  function applyPreset(preset: string) {
    switch (preset) {
      case 'tuned':
        inputKp.value = '5.0';
        inputKi.value = '3.0';
        inputKd.value = '0.35';
        inputFn.value = '10';
        selectPidForm.value = 'standard';
        selectAntiWindup.value = 'clamping';
        inputSat.value = '12.0';
        break;
      case 'oscillatory':
        inputKp.value = '18.0';
        inputKi.value = '8.0';
        inputKd.value = '0.02';
        inputFn.value = '10';
        selectPidForm.value = 'standard';
        selectAntiWindup.value = 'clamping';
        break;
      case 'sluggish':
        inputKp.value = '0.8';
        inputKi.value = '0.2';
        inputKd.value = '0.05';
        inputFn.value = '10';
        break;
      case 'windup_demo':
        inputKp.value = '2.0';
        inputKi.value = '12.0';
        inputKd.value = '0.1';
        inputSat.value = '3.0'; // low saturation
        selectAntiWindup.value = 'none'; // Windup will occur!
        break;
      case 'ipd_demo':
        inputKp.value = '5.0';
        inputKi.value = '3.0';
        inputKd.value = '0.35';
        selectPidForm.value = 'i_pd';
        break;
    }
    syncConfigFromUI();
  }

  // Setup Event Listeners
  selectPlant.addEventListener('change', () => {
    sim.set_plant_type(selectPlant.value);
    history.length = 0;
  });

  selectPreset.addEventListener('change', (e) => {
    applyPreset((e.target as HTMLSelectElement).value);
  });

  [
    inputKp, inputKi, inputKd, inputFn, inputSat,
    selectPidForm, selectAntiWindup, inputTarget, inputDist, inputNoise,
  ].forEach((el) => {
    el.addEventListener('input', syncConfigFromUI);
  });

  btnReset.addEventListener('click', () => {
    sim.reset();
    history.length = 0;
  });

  btnPause.addEventListener('click', () => {
    isPaused = !isPaused;
    btnPause.classList.toggle('btn-active', isPaused);
    btnPause.textContent = isPaused ? '再開' : '一時停止';
  });

  btnStep.addEventListener('click', () => {
    const cur = parseFloat(inputTarget.value);
    const next = cur > 0 ? -1.57 : 1.57;
    inputTarget.value = next.toString();
    syncConfigFromUI();
  });

  btnPulseDist.addEventListener('click', () => {
    inputDist.value = '4.0';
    syncConfigFromUI();
    setTimeout(() => {
      inputDist.value = '0.0';
      syncConfigFromUI();
    }, 400);
  });

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab')!;
      Object.entries(tabs).forEach(([id, el]) => {
        el.classList.toggle('hidden', id !== targetId);
      });
      handleResize();
    });
  });

  // Arm Tab controls
  const inputL1 = document.getElementById('input-l1') as HTMLInputElement;
  const inputL2 = document.getElementById('input-l2') as HTMLInputElement;
  const valL1 = document.getElementById('val-l1')!;
  const valL2 = document.getElementById('val-l2')!;
  const selectElbow = document.getElementById('select-elbow') as HTMLSelectElement;

  const updateArmConfig = () => {
    const l1 = parseFloat(inputL1.value);
    const l2 = parseFloat(inputL2.value);
    valL1.textContent = l1.toFixed(1);
    valL2.textContent = l2.toFixed(1);
    armRenderer.setLengths(l1, l2);
    armRenderer.setElbowUp(selectElbow.value === 'up');
  };

  inputL1?.addEventListener('input', updateArmConfig);
  inputL2?.addEventListener('input', updateArmConfig);
  selectElbow?.addEventListener('change', updateArmConfig);

  function handleResize() {
    plantRenderer.handleResize();
    responsePlotter.handleResize();
    controlPlotter.handleResize();
    armRenderer.handleResize();
  }
  window.addEventListener('resize', handleResize);

  // Initialize
  syncConfigFromUI();
  updateArmConfig();

  // Metrics calculation
  function calculateMetrics(data: StepDataPoint[]) {
    if (data.length < 20) return;
    const target = data[data.length - 1].setpoint;
    const initial = data[0].actual;
    const delta = target - initial;
    if (Math.abs(delta) < 1e-3) {
      metricTr.textContent = '--';
      metricMp.textContent = '0.0 %';
      metricTs.textContent = '--';
      metricEss.textContent = Math.abs(target - data[data.length - 1].actual).toFixed(3);
      return;
    }

    let peak = initial;
    for (const d of data) {
      if (delta > 0 && d.actual > peak) peak = d.actual;
      if (delta < 0 && d.actual < peak) peak = d.actual;
    }

    const overshoot = delta > 0 ? Math.max(0, (peak - target) / delta) * 100 : Math.max(0, (target - peak) / -delta) * 100;
    metricMp.textContent = `${overshoot.toFixed(1)} %`;

    // 10% to 90% rise time
    const y10 = initial + delta * 0.1;
    const y90 = initial + delta * 0.9;
    let t10: number | null = null;
    let t90: number | null = null;

    for (const d of data) {
      if (t10 === null && (delta > 0 ? d.actual >= y10 : d.actual <= y10)) t10 = d.t;
      if (t90 === null && (delta > 0 ? d.actual >= y90 : d.actual <= y90)) t90 = d.t;
    }

    if (t10 !== null && t90 !== null && t90 >= t10) {
      metricTr.textContent = `${(t90 - t10).toFixed(2)} s`;
    } else {
      metricTr.textContent = '--';
    }

    // 5% settling time
    let ts: number | null = null;
    for (let i = data.length - 1; i >= 0; i--) {
      if (Math.abs(data[i].actual - target) > Math.abs(delta) * 0.05) {
        ts = data[i].t;
        break;
      }
    }
    metricTs.textContent = ts !== null ? `${ts.toFixed(2)} s` : '--';
    metricEss.textContent = Math.abs(target - data[data.length - 1].actual).toFixed(3);
  }

  // Animation Loop (60 FPS)
  let lastTime = performance.now();

  function loop(currentTime: number) {
    const elapsedSec = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Run physics steps
    if (!isPaused && tabs['tab-pid'].offsetParent !== null) {
      const setpoint = parseFloat(inputTarget.value);
      const disturbance = parseFloat(inputDist.value);
      const noise = parseFloat(inputNoise.value);

      // Advance physics simulation by fixed substeps to match elapsed wall time
      const stepsToRun = Math.min(Math.round(elapsedSec / simDt), 10) || 1;
      let lastPoint: StepDataPoint | null = null;

      for (let i = 0; i < stepsToRun; i++) {
        const dp = sim.step(simDt, setpoint, disturbance, noise) as StepDataPoint;
        history.push(dp);
        if (history.length > maxHistoryPoints) {
          history.shift();
        }
        lastPoint = dp;
      }

      if (lastPoint) {
        // Render 2D Plant Animation
        if (selectPlant.value === 'cart') {
          plantRenderer.renderCart(lastPoint);
        } else {
          plantRenderer.renderMotor(lastPoint, selectPlant.value === 'motor_velocity');
        }

        // Render Graphs
        responsePlotter.render(history, [
          { name: '目標値 r(t)', color: '#f59e0b', getValue: (d) => d.setpoint, dashed: true },
          { name: '現在値 y(t)', color: '#38bdf8', getValue: (d) => d.actual },
        ]);

        controlPlotter.render(history, [
          { name: '操作量 u(t)', color: '#ec4899', getValue: (d) => d.u, lineWidth: 2.5 },
          { name: 'P項', color: '#38bdf8', getValue: (d) => d.p_term, dashed: true, lineWidth: 1.2 },
          { name: 'I項', color: '#a855f7', getValue: (d) => d.i_term, dashed: true, lineWidth: 1.2 },
          { name: 'D項', color: '#10b981', getValue: (d) => d.d_term, dashed: true, lineWidth: 1.2 },
        ]);

        calculateMetrics(history);
      }
    }

    if (tabs['tab-arm'].offsetParent !== null) {
      armRenderer.render();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

bootstrap().catch((err) => {
  console.error('Failed to initialize application:', err);
});

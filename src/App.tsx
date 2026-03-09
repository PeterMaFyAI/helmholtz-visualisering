import { useMemo, useState } from "react";
import {
  ELECTRON_QM,
  SimulationState,
  computeMagneticField,
  computeOrbitRadius,
  formatReadouts
} from "./physics";

const DEFAULT_TURNS = 130;
const DEFAULT_COIL_RADIUS_M = 0.15;

function SimulationCanvas(props: { gunOn: boolean; coilOn: boolean; orbitRadiusM: number }) {
  const size = 520;
  const center = size / 2;
  const worldRadiusM = 0.18;
  const pxPerM = (size * 0.42) / worldRadiusM;

  const orbitRadiusPx = Math.max(0, Math.min(props.orbitRadiusM * pxPerM, size * 0.42));
  const emitterX = center;
  const emitterY = size * 0.66 + 9;
  const orbitCenterY = emitterY - orbitRadiusPx;

  const gunWidth = 36;
  const gunHeight = 34;
  const gunBottomY = size * 0.62 + 48;
  const gunTopY = gunBottomY - gunHeight;

  const showOrbitBeam = props.gunOn && props.coilOn && orbitRadiusPx > 2;
  const showStraightBeam = props.gunOn && !props.coilOn;

  const straightBeamStartX = center + gunWidth / 2;
  const straightBeamEndX = size - 18;

  const markSpacingPx = 0.02 * pxPerM; // 2 cm in model coordinates
  const crossHalfWidthPx = 18;
  const crossbarCount = 5;
  const crossbars = Array.from({ length: crossbarCount }, (_, i) => emitterY - (i + 1) * markSpacingPx);
  const scaleTopY = crossbars.length > 0 ? Math.min(...crossbars) - 26 : emitterY - markSpacingPx - 26;

  return (
    <div className="viz-wrap">
      <svg className="viz" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Elektronstrale i Helmholtzspole">
        <defs>
          <radialGradient id="bulbGradient" cx="50%" cy="45%" r="58%">
            <stop offset="0%" stopColor="rgba(248, 250, 255, 0.95)" />
            <stop offset="65%" stopColor="rgba(198, 220, 240, 0.20)" />
            <stop offset="100%" stopColor="rgba(130, 170, 210, 0.12)" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width={size} height={size} fill="url(#bulbGradient)" />

        {showStraightBeam ? (
          <>
            <line
              x1={straightBeamStartX}
              y1={emitterY}
              x2={straightBeamEndX}
              y2={emitterY}
              fill="none"
              stroke="rgba(120, 255, 245, 0.98)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1={straightBeamStartX}
              y1={emitterY}
              x2={straightBeamEndX}
              y2={emitterY}
              fill="none"
              stroke="rgba(120, 255, 245, 0.98)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glow)"
            />
          </>
        ) : null}

        <circle cx={center} cy={center} r={size * 0.43} fill="none" stroke="rgba(80,120,150,0.45)" strokeWidth="3" />

        <circle cx={center} cy={center} r={size * 0.34} fill="none" stroke="rgba(210, 78, 68, 0.8)" strokeWidth="8" />
        <circle cx={center} cy={center} r={size * 0.29} fill="none" stroke="rgba(210, 78, 68, 0.7)" strokeWidth="8" />

        {showOrbitBeam ? (
          <circle
            cx={emitterX}
            cy={orbitCenterY}
            r={orbitRadiusPx}
            fill="none"
            stroke="rgba(120, 255, 245, 0.98)"
            strokeWidth="5"
            filter="url(#glow)"
          />
        ) : null}

        <line x1={emitterX} y1={scaleTopY} x2={emitterX} y2={gunTopY + 2} stroke="#111111" strokeWidth="4" />
        {crossbars.map((y) => (
          <line
            key={y}
            x1={emitterX - crossHalfWidthPx}
            y1={y}
            x2={emitterX + crossHalfWidthPx}
            y2={y}
            stroke="#111111"
            strokeWidth="4"
          />
        ))}

        <rect x={center - gunWidth / 2} y={gunTopY} width={gunWidth} height={gunHeight} rx="12" fill="#1d1f25" />
      </svg>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<SimulationState>(() => ({
    gunOn: false,
    voltageV: 200,
    coilCurrentA: 1.2,
    coilTurns: DEFAULT_TURNS,
    coilRadiusM: DEFAULT_COIL_RADIUS_M,
    measuredRadiusM: 0.045
  }));
  const [coilOn, setCoilOn] = useState(false);

  const effectiveCoilCurrentA = coilOn ? state.coilCurrentA : 0;

  const orbitRadiusM = useMemo(
    () =>
      state.gunOn && coilOn
        ? computeOrbitRadius(
            {
              voltageV: state.voltageV,
              coilCurrentA: effectiveCoilCurrentA,
              coilTurns: state.coilTurns,
              coilRadiusM: state.coilRadiusM
            },
            ELECTRON_QM
          )
        : 0,
    [state.gunOn, coilOn, state.voltageV, effectiveCoilCurrentA, state.coilTurns, state.coilRadiusM]
  );

  const magneticFieldT = computeMagneticField({
    coilCurrentA: effectiveCoilCurrentA,
    coilTurns: state.coilTurns,
    coilRadiusM: state.coilRadiusM
  });
  const readouts = formatReadouts({
    currentA: effectiveCoilCurrentA,
    magneticFieldT,
    radiusM: state.measuredRadiusM,
    qmValue: ELECTRON_QM
  });

  const setPartial = (patch: Partial<SimulationState>) => setState((prev) => ({ ...prev, ...patch }));

  return (
    <main className="page">
      <section className="controls">
        <h1>Bestam q/m for elektronen</h1>
        <p className="subtitle">Helmholtz-spole + elektronkanon (gymnasielabb)</p>

        <label className="switch-row" htmlFor="gun-toggle">
          Elektronkanon
          <button
            id="gun-toggle"
            className={`toggle ${state.gunOn ? "on" : "off"}`}
            onClick={() => setPartial({ gunOn: !state.gunOn })}
            aria-pressed={state.gunOn}
          >
            {state.gunOn ? "PA" : "AV"}
          </button>
        </label>

        <label className="switch-row" htmlFor="coil-toggle">
          Helmholtz-spole
          <button
            id="coil-toggle"
            className={`toggle ${coilOn ? "on" : "off"}`}
            onClick={() => setCoilOn((prev) => !prev)}
            aria-pressed={coilOn}
          >
            {coilOn ? "PA" : "AV"}
          </button>
        </label>

        <label className="field" htmlFor="voltage">
          Accelerationsspanning U: <strong>{state.voltageV.toFixed(0)} V</strong>
          <input
            id="voltage"
            type="range"
            min={50}
            max={300}
            step={1}
            value={state.voltageV}
            onChange={(e) => setPartial({ voltageV: Number(e.target.value) })}
          />
        </label>

        <label className="field" htmlFor="current">
          Strom genom Helmholtz-spole I: <strong>{state.coilCurrentA.toFixed(2)} A</strong>
          <input
            id="current"
            type="range"
            min={0.8}
            max={2}
            step={0.01}
            value={state.coilCurrentA}
            onChange={(e) => setPartial({ coilCurrentA: Number(e.target.value) })}
          />
        </label>

        <section className="readouts" aria-label="Instrumentpanel">
          <h2>Instrumentpanel</h2>
          <div><span>Amperemeter:</span><strong>{readouts.currentA}</strong></div>
          <div><span>Magnetfalt B:</span><strong>{readouts.magneticFieldmT}</strong></div>
        </section>
      </section>

      <section className="visualization">
        <SimulationCanvas gunOn={state.gunOn} coilOn={coilOn} orbitRadiusM={orbitRadiusM} />
      </section>
    </main>
  );
}



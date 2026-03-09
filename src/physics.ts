export const MU_0 = 4e-7 * Math.PI;
export const ELECTRON_QM = 1.758820e11; // C/kg

export interface SimulationState {
  gunOn: boolean;
  voltageV: number;
  coilCurrentA: number;
  coilTurns: number;
  coilRadiusM: number;
  measuredRadiusM: number;
}

export function computeMagneticField(state: Pick<SimulationState, "coilCurrentA" | "coilTurns" | "coilRadiusM">): number {
  if (state.coilRadiusM <= 0) {
    return 0;
  }

  const factor = Math.pow(4 / 5, 1.5);
  return MU_0 * factor * ((state.coilTurns * state.coilCurrentA) / state.coilRadiusM);
}

export function computeOrbitRadius(
  state: Pick<SimulationState, "voltageV" | "coilCurrentA" | "coilTurns" | "coilRadiusM">,
  electronQM = ELECTRON_QM
): number {
  const b = computeMagneticField(state);

  if (b <= 0 || state.voltageV <= 0 || electronQM <= 0) {
    return 0;
  }

  return Math.sqrt((2 * state.voltageV) / (electronQM * b * b));
}

export function computeQMFromMeasurements(state: Pick<SimulationState, "voltageV" | "measuredRadiusM" | "coilCurrentA" | "coilTurns" | "coilRadiusM">): number {
  const b = computeMagneticField(state);

  if (b <= 0 || state.measuredRadiusM <= 0 || state.voltageV <= 0) {
    return 0;
  }

  return (2 * state.voltageV) / (b * b * state.measuredRadiusM * state.measuredRadiusM);
}

export interface FormattedReadouts {
  currentA: string;
  magneticFieldmT: string;
  radiusCm: string;
  qmScientific: string;
  qmErrorPercent: string;
}

export function formatReadouts(params: {
  currentA: number;
  magneticFieldT: number;
  radiusM: number;
  qmValue: number;
  referenceQM?: number;
}): FormattedReadouts {
  const referenceQM = params.referenceQM ?? ELECTRON_QM;
  const errorPercent = referenceQM > 0 ? ((params.qmValue - referenceQM) / referenceQM) * 100 : 0;

  return {
    currentA: `${params.currentA.toFixed(2)} A`,
    magneticFieldmT: `${(params.magneticFieldT * 1e3).toFixed(2)} mT`,
    radiusCm: `${(params.radiusM * 100).toFixed(2)} cm`,
    qmScientific: `${params.qmValue.toExponential(4)} C/kg`,
    qmErrorPercent: `${errorPercent.toFixed(2)} %`
  };
}

import { describe, expect, it } from "vitest";
import {
  ELECTRON_QM,
  computeMagneticField,
  computeOrbitRadius,
  computeQMFromMeasurements
} from "./physics";

describe("computeMagneticField", () => {
  it("ger rimligt B-falt for kanda parametrar", () => {
    const b = computeMagneticField({
      coilCurrentA: 1,
      coilTurns: 130,
      coilRadiusM: 0.15
    });

    // Handraknat ~0.78 mT
    expect(b).toBeGreaterThan(0.00075);
    expect(b).toBeLessThan(0.00082);
  });
});

describe("q/m-kedjan", () => {
  it("aterfinner korrekt q/m inom 1% med syntetisk idealdata", () => {
    const base = {
      voltageV: 200,
      coilCurrentA: 1.3,
      coilTurns: 130,
      coilRadiusM: 0.15
    };

    const syntheticRadius = computeOrbitRadius(base, ELECTRON_QM);
    const qm = computeQMFromMeasurements({ ...base, measuredRadiusM: syntheticRadius });

    const relativeError = Math.abs((qm - ELECTRON_QM) / ELECTRON_QM);
    expect(relativeError).toBeLessThan(0.01);
  });
});

import { performance } from "node:perf_hooks";

import { packPallet, packPallets } from "../src/lib/packer.ts";
import { PACKER_BENCHMARK_SCENARIOS } from "../src/lib/benchmarks/packerBenchmarkScenarios.ts";

interface BenchmarkRow {
  scenario: string;
  mode: "single" | "multi";
  packedUnits: number;
  unpackedUnits: number;
  totalHeightOrMaxHeight: number;
  palletCount: number;
  layerCount: number;
  durationMs: number;
}

function formatMs(value: number): string {
  return `${value.toFixed(1)} ms`;
}

function main(): void {
  const rows: BenchmarkRow[] = [];

  for (const scenario of PACKER_BENCHMARK_SCENARIOS) {
    const started = performance.now();

    if (scenario.mode === "multi") {
      const result = packPallets(
        { ...scenario.pallet },
        scenario.cartons.map((carton) => ({ ...carton })),
      );
      const ended = performance.now();
      rows.push({
        scenario: scenario.id,
        mode: "multi",
        packedUnits: result.packedUnits,
        unpackedUnits: result.unpacked.reduce((sum, carton) => sum + carton.quantity, 0),
        totalHeightOrMaxHeight: result.maxHeight,
        palletCount: result.pallets.length,
        layerCount: result.pallets.reduce((sum, pallet) => sum + pallet.result.layers.length, 0),
        durationMs: ended - started,
      });
      continue;
    }

    const result = packPallet(
      { ...scenario.pallet },
      scenario.cartons.map((carton) => ({ ...carton })),
    );
    const ended = performance.now();
    rows.push({
      scenario: scenario.id,
      mode: "single",
      packedUnits: result.layers.reduce((sum, layer) => sum + layer.cartons.length, 0),
      unpackedUnits: result.unpacked.reduce((sum, carton) => sum + carton.quantity, 0),
      totalHeightOrMaxHeight: result.totalHeight,
      palletCount: 1,
      layerCount: result.layers.length,
      durationMs: ended - started,
    });
  }

  console.log("Packer benchmark scenarios");
  console.table(rows.map((row) => ({
    scenario: row.scenario,
    mode: row.mode,
    packedUnits: row.packedUnits,
    unpackedUnits: row.unpackedUnits,
    height: row.totalHeightOrMaxHeight,
    palletCount: row.palletCount,
    layerCount: row.layerCount,
    duration: formatMs(row.durationMs),
  })));

  console.log("Scenario notes");
  for (const scenario of PACKER_BENCHMARK_SCENARIOS) {
    console.log(`- ${scenario.id}: ${scenario.description}`);
  }
}

main();

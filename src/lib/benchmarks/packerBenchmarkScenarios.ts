import type { CartonInput, PalletInput } from "../packerTypes";

export interface PackerBenchmarkScenario {
  id: string;
  description: string;
  pallet: PalletInput;
  cartons: CartonInput[];
  mode?: "single" | "multi";
}

function carton(overrides: Partial<CartonInput> & Pick<CartonInput, "id" | "title">): CartonInput {
  return {
    id: overrides.id,
    title: overrides.title,
    width: overrides.width ?? 300,
    length: overrides.length ?? 200,
    height: overrides.height ?? 150,
    weight: overrides.weight ?? 2,
    quantity: overrides.quantity ?? 1,
    color: overrides.color ?? "#73c98f",
    uprightPolicy: overrides.uprightPolicy ?? "tailOnly",
  };
}

export const PACKER_BENCHMARK_SCENARIOS: PackerBenchmarkScenario[] = [
  {
    id: "single-type-edge-48",
    description: "Single-type multi-layer stack that should start interlocking from layer 1.",
    mode: "single",
    pallet: {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "none",
    },
    cartons: [
      carton({
        id: "A",
        title: "Carton A",
        width: 300,
        length: 200,
        height: 150,
        weight: 2,
        quantity: 48,
      }),
    ],
  },
  {
    id: "single-type-center-48",
    description: "Center-compact version of the same multi-layer interlock case.",
    mode: "single",
    pallet: {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "centerCompact",
      extraPalletMode: "none",
    },
    cartons: [
      carton({
        id: "A",
        title: "Carton A",
        width: 300,
        length: 200,
        height: 150,
        weight: 2,
        quantity: 48,
      }),
    ],
  },
  {
    id: "mixed-abc-lower-shelf",
    description: "Mixed shelf case that should reuse lower same-type supports before climbing.",
    mode: "single",
    pallet: {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "none",
    },
    cartons: [
      carton({ id: "A", title: "A", width: 300, length: 200, height: 150, weight: 4, quantity: 32 }),
      carton({ id: "B", title: "B", width: 500, length: 150, height: 250, weight: 3, quantity: 16 }),
      carton({ id: "C", title: "C", width: 250, length: 400, height: 100, weight: 1, quantity: 32 }),
    ],
  },
  {
    id: "mixed-abcd-late-bulky",
    description: "Late bulky-carton case where large cartons tend to get stranded if the shelf is wasted.",
    mode: "single",
    pallet: {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "none",
    },
    cartons: [
      carton({ id: "A", title: "A", width: 300, length: 200, height: 150, weight: 4, quantity: 32 }),
      carton({ id: "B", title: "B", width: 500, length: 150, height: 250, weight: 3, quantity: 10 }),
      carton({ id: "C", title: "C", width: 250, length: 400, height: 100, weight: 1, quantity: 32 }),
      carton({ id: "D", title: "D", width: 400, length: 350, height: 400, weight: 2, quantity: 8 }),
    ],
  },
  {
    id: "guidance-center-multipallet",
    description: "Guided multi-pallet case used to watch search-step quality and runtime drift.",
    mode: "multi",
    pallet: {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 900,
      packingStyle: "edgeAligned",
      extraPalletMode: "full",
      sampleGuidance: {
        preferredMode: "center",
        preferredPackingStyle: "centerCompact",
        confidence: 1.2,
        sourceSampleCount: 8,
        cfgScale: 1.4,
        searchSteps: 6,
        randomSeed: 1337,
        sampleFilter: "dims",
      },
    },
    cartons: [
      carton({ id: "A", title: "A", quantity: 90 }),
      carton({ id: "B", title: "B", width: 250, length: 200, height: 120, weight: 1.8, quantity: 60 }),
    ],
  },
];

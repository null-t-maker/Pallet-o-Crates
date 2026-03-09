import type { PackedCarton, PalletInput } from "../../lib/packer";
import * as THREE from "three";
import { BASE_H } from "./visualizerHelpers";
import type { ManualPatch } from "./manualCartonEditingCore";

export function setMeshPositionFromCarton(
  mesh: THREE.Mesh,
  carton: PackedCarton,
  pallet: PalletInput,
): void {
  mesh.position.set(
    carton.x + carton.w / 2 - pallet.width / 2,
    carton.z + carton.h / 2 + BASE_H,
    carton.y + carton.l / 2 - pallet.length / 2,
  );
}

export function buildTranslationPatchFromMesh(
  mesh: THREE.Mesh,
  source: PackedCarton,
  pallet: PalletInput,
): ManualPatch | null {
  if (!Number.isFinite(mesh.position.x) || !Number.isFinite(mesh.position.y) || !Number.isFinite(mesh.position.z)) {
    return null;
  }

  return {
    x: mesh.position.x + pallet.width / 2 - source.w / 2,
    y: mesh.position.z + pallet.length / 2 - source.l / 2,
    z: mesh.position.y - BASE_H - source.h / 2,
  };
}

export function clampMeshAbovePalletTop(mesh: THREE.Mesh, carton: PackedCarton): void {
  const minMeshY = BASE_H + carton.h / 2;
  if (mesh.position.y < minMeshY) {
    mesh.position.y = minMeshY;
  }
}

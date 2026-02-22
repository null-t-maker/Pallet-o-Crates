import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls, Edges, Environment } from "@react-three/drei";
import { PackResult, PalletInput, PackedCarton } from "../lib/packer";
import * as THREE from "three";
import { Translations } from "../i18n";

interface Props {
    pallet: PalletInput;
    result: PackResult | null;
    visibleLayers: number;
    diagnosticsVisible: boolean;
    onToggleDiagnostics: () => void;
    t: Translations;
}

const BASE_H = 144;
const WOOD = "#c9a06c";
const LEGACY_BLUE_TO_GREEN: Record<string, string> = {
    "#58a6ff": "#43b66f",
    "#79c0ff": "#5fc486",
    "#56d4dd": "#6cc79a",
};

function displayCartonColor(input: string): string {
    const key = input.trim().toLowerCase();
    return LEGACY_BLUE_TO_GREEN[key] ?? input;
}

function overlapArea2D(a: PackedCarton, b: PackedCarton): number {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    const y2 = Math.min(a.y + a.l, b.y + b.l);
    return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

function overlapVolume3D(a: PackedCarton, b: PackedCarton): number {
    const area = overlapArea2D(a, b);
    if (area <= 1e-6) return 0;
    const z1 = Math.max(a.z, b.z);
    const z2 = Math.min(a.z + a.h, b.z + b.h);
    const h = Math.max(0, z2 - z1);
    return area * h;
}

const CartonBox: React.FC<{
    c: PackedCarton;
    pw: number;
    pl: number;
    selected: boolean;
    onHover: (c: PackedCarton | null) => void;
    onSelect: (c: PackedCarton) => void;
}> = ({ c, pw, pl, selected, onHover, onSelect }) => {
    const [hovered, setHovered] = React.useState(false);
    const col = new THREE.Color(displayCartonColor(c.color));
    const selectedCol = col.clone().lerp(new THREE.Color("#ffffff"), 0.3);
    const highlighted = hovered || selected;

    const px = c.x + c.w / 2 - pw / 2;
    const py = c.z + c.h / 2 + BASE_H;
    const pz = c.y + c.l / 2 - pl / 2;

    return (
        <mesh
            position={[px, py, pz]}
            castShadow
            receiveShadow
            onPointerOver={e => { e.stopPropagation(); setHovered(true); onHover(c); }}
            onPointerOut={e => { e.stopPropagation(); setHovered(false); onHover(null); }}
            onClick={e => { e.stopPropagation(); onSelect(c); }}
        >
            <boxGeometry args={[c.w, c.h, c.l]} />
            <meshStandardMaterial
                color={selected ? selectedCol : col}
                roughness={selected ? 0.5 : 0.65}
                metalness={selected ? 0.08 : 0.05}
                emissive={selected ? selectedCol : highlighted ? col : new THREE.Color(0x000000)}
                emissiveIntensity={selected ? 0.62 : highlighted ? 0.35 : 0}
            />
            <Edges scale={1.002} threshold={15} color={selected ? displayCartonColor(c.color) : hovered ? "#ffffff" : "#111111"} />
        </mesh>
    );
};

export const Visualizer: React.FC<Props> = ({ pallet, result, visibleLayers, diagnosticsVisible, onToggleDiagnostics, t }) => {
    const [hovered, setHovered] = React.useState<PackedCarton | null>(null);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const cameraRef = React.useRef<THREE.OrthographicCamera | null>(null);
    const baseZoomRef = React.useRef(1);
    const zoomFactorRef = React.useRef(1);
    const hasManualZoomRef = React.useRef(false);
    const syncCameraRef = React.useRef(false);
    const prevMaxDimRef = React.useRef<number | null>(null);
    const [viewportSize, setViewportSize] = React.useState({ width: 1200, height: 800 });
    const [windowSize, setWindowSize] = React.useState(() => ({
        width: typeof window === "undefined" ? 0 : window.innerWidth,
        height: typeof window === "undefined" ? 0 : window.innerHeight,
    }));

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            const rect = el.getBoundingClientRect();
            setViewportSize({
                width: Math.max(1, rect.width),
                height: Math.max(1, rect.height),
            });
        };
        const updateWindow = () => {
            setWindowSize({
                width: Math.max(1, window.innerWidth),
                height: Math.max(1, window.innerHeight),
            });
        };

        update();
        updateWindow();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        window.addEventListener("resize", updateWindow);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateWindow);
        };
    }, []);

    const cartons = useMemo(() => {
        if (!result) return [];
        const out: PackedCarton[] = [];
        result.layers.forEach((layer, i) => {
            if (visibleLayers === 0 || i < visibleLayers) out.push(...layer.cartons);
        });
        return out;
    }, [result, visibleLayers]);
    const selectedCarton = useMemo(() => cartons.find((c) => c.id === selectedId) ?? null, [cartons, selectedId]);

    const packedHeight = (result?.totalHeight ?? 0) + BASE_H;
    const fallbackHeight = Math.max(pallet.width, pallet.length) * 0.75;
    const maxDim = Math.max(pallet.width, pallet.length, result ? packedHeight : fallbackHeight);
    const minViewportDim = Math.max(280, Math.min(viewportSize.width, viewportSize.height));
    const zoom = (minViewportDim * 0.95) / maxDim;
    const orbitTargetY = BASE_H + (result ? result.totalHeight / 2 : 100);
    const cameraPosition = useMemo<[number, number, number]>(() => {
        const dist = maxDim * 1.4;
        return [dist, dist, dist];
    }, [maxDim]);
    const orbitTarget = useMemo<[number, number, number]>(() => {
        return [0, orbitTargetY, 0];
    }, [orbitTargetY]);
    const unpackedCount = result ? result.unpacked.reduce((a, c) => a + c.quantity, 0) : 0;
    const limitsExceeded = !!result
        && (
            result.totalWeight > pallet.maxWeight + 1e-6
            || result.totalHeight > pallet.maxHeight + 1e-6
        );
    const unpackedMessage = limitsExceeded && t.unpackedLimitExceeded
        ? t.unpackedLimitExceeded(unpackedCount)
        : t.unpacked(unpackedCount);
    const windowResolutionLabel = t.windowResolution ?? "Window resolution";
    const diagnostics = useMemo(() => {
        if (!result) return null;

        const packed = result.layers.flatMap((l) => l.cartons);
        const requestedUnits = packed.length + unpackedCount;
        let overlapCount = 0;
        let boundsViolations = 0;

        for (const c of packed) {
            if (
                c.x < -1e-6
                || c.y < -1e-6
                || c.x + c.w > pallet.width + 1e-6
                || c.y + c.l > pallet.length + 1e-6
                || c.z < -1e-6
                || c.z + c.h > pallet.maxHeight + 1e-6
            ) {
                boundsViolations++;
            }
        }

        for (let i = 0; i < packed.length; i++) {
            for (let j = i + 1; j < packed.length; j++) {
                if (overlapVolume3D(packed[i], packed[j]) > 1e-6) overlapCount++;
            }
        }

        const hasIssues = overlapCount > 0
            || boundsViolations > 0
            || limitsExceeded;

        return {
            requestedUnits,
            packedUnits: packed.length,
            overlapCount,
            boundsViolations,
            hasIssues,
        };
    }, [result, unpackedCount, pallet.width, pallet.length, pallet.maxHeight, limitsExceeded]);

    React.useEffect(() => {
        const camera = cameraRef.current;
        if (!camera) return;

        const prevMaxDim = prevMaxDimRef.current;
        const sceneChanged = prevMaxDim !== null && Math.abs(prevMaxDim - maxDim) > 1e-6;
        if (sceneChanged) {
            hasManualZoomRef.current = false;
            zoomFactorRef.current = 1;
        }

        baseZoomRef.current = zoom;
        const effectiveZoom = hasManualZoomRef.current
            ? zoom * zoomFactorRef.current
            : zoom;

        syncCameraRef.current = true;
        camera.zoom = Math.max(0.01, effectiveZoom);
        camera.updateProjectionMatrix();
        syncCameraRef.current = false;

        prevMaxDimRef.current = maxDim;
    }, [zoom, maxDim]);

    React.useEffect(() => {
        if (!selectedId) return;
        if (!selectedCarton) {
            setSelectedId(null);
        }
    }, [selectedId, selectedCarton]);

    const handleControlsChange = React.useCallback(() => {
        if (syncCameraRef.current) return;
        const camera = cameraRef.current;
        if (!camera) return;

        const baseZoom = baseZoomRef.current;
        if (!Number.isFinite(baseZoom) || baseZoom <= 0) return;

        const nextFactor = camera.zoom / baseZoom;
        if (!Number.isFinite(nextFactor)) return;

        if (Math.abs(nextFactor - zoomFactorRef.current) > 1e-4) {
            hasManualZoomRef.current = true;
            zoomFactorRef.current = THREE.MathUtils.clamp(nextFactor, 0.05, 20);
        }
    }, []);

    return (
        <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
            <Canvas shadows={{ type: THREE.PCFShadowMap }}>
                <OrthographicCamera
                    ref={cameraRef}
                    makeDefault
                    position={cameraPosition}
                    near={-10000}
                    far={10000}
                />
                <OrbitControls
                    makeDefault
                    target={orbitTarget}
                    enableDamping
                    dampingFactor={0.08}
                    maxPolarAngle={Math.PI / 2 - 0.05}
                    onChange={handleControlsChange}
                    mouseButtons={{
                        LEFT: THREE.MOUSE.ROTATE,
                        MIDDLE: THREE.MOUSE.ROTATE,
                        RIGHT: THREE.MOUSE.PAN,
                    }}
                />

                <ambientLight intensity={0.5} />
                <directionalLight position={[maxDim * 2, maxDim * 3, maxDim]} intensity={1} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                <Environment preset="warehouse" />

                <gridHelper args={[maxDim * 6, 40, "#2f2f2f", "#181818"]} position={[0, -1, 0]} />

                <mesh position={[0, BASE_H / 2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[pallet.width, BASE_H, pallet.length]} />
                    <meshStandardMaterial color={WOOD} roughness={0.85} />
                    <Edges scale={1.002} threshold={15} color="#7a5c3a" />
                </mesh>

                {cartons.map(c => (
                    <CartonBox
                        key={c.id}
                        c={c}
                        pw={pallet.width}
                        pl={pallet.length}
                        selected={selectedId === c.id}
                        onHover={setHovered}
                        onSelect={() => setSelectedId(c.id)}
                    />
                ))}
            </Canvas>

            <div className="glass overlay info-banner">
                <strong>{t.infoBannerTitle}</strong>
                <p>{t.infoBannerLine1}</p>
                <p>{t.infoBannerLine2}</p>
                <p>{t.infoBannerLine3}</p>
            </div>

            {result && diagnostics && diagnosticsVisible && (
                <div className="glass overlay diagnostics">
                    <h3 style={{ marginBottom: 6, fontSize: "0.95rem" }}>{t.diagnostics}</h3>
                    <p style={{ margin: "3px 0", fontSize: "0.83rem" }}>{t.requestedUnits}: <strong>{diagnostics.requestedUnits}</strong></p>
                    <p style={{ margin: "3px 0", fontSize: "0.83rem" }}>{t.packedUnits}: <strong>{diagnostics.packedUnits}</strong></p>
                    <p style={{ margin: "3px 0", fontSize: "0.83rem" }}>{t.overlapCount}: <strong>{diagnostics.overlapCount}</strong></p>
                    <p style={{ margin: "3px 0", fontSize: "0.83rem" }}>{t.boundsViolations}: <strong>{diagnostics.boundsViolations}</strong></p>
                    <p style={{ margin: "3px 0", fontSize: "0.83rem" }}>{windowResolutionLabel}: <strong>{windowSize.width} x {windowSize.height}</strong></p>
                    <p style={{
                        margin: "4px 0 0",
                        fontSize: "0.82rem",
                        color: diagnostics.hasIssues ? "var(--error)" : "var(--success)",
                    }}>
                        <strong>{t.hardChecks}: {diagnostics.hasIssues ? t.checksIssues : t.checksOk}</strong>
                    </p>
                </div>
            )}
            {result && diagnostics && (
                <div className="overlay diagnostics-ctrl">
                    <button
                        type="button"
                        className="diagnostics-toggle"
                        onClick={onToggleDiagnostics}
                    >
                        {diagnosticsVisible ? t.hideDiagnostics : t.showDiagnostics}
                    </button>
                </div>
            )}

            <div className="overlay bottom-left-stack">
                {hovered && (
                    <div className="glass hover-card in-stack">
                        <strong style={{ display: "block", marginBottom: 2 }}>{hovered.title}</strong>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                            {hovered.w}x{hovered.l}x{hovered.h} mm
                            <span className="meta-separator">|</span>
                            {hovered.weight} kg
                        </span>
                    </div>
                )}
                {selectedCarton && (
                    <div className="glass selected-card in-stack">
                        <div className="selected-card-head">
                            <strong>{selectedCarton.title}</strong>
                            <button
                                type="button"
                                className="selected-card-close"
                                aria-label="Clear selected carton"
                                onClick={() => setSelectedId(null)}
                            >
                                x
                            </button>
                        </div>
                        <p style={{ margin: "5px 0 2px", fontSize: "0.83rem", color: "var(--text-muted)" }}>
                            {selectedCarton.w}x{selectedCarton.l}x{selectedCarton.h} mm
                            <span className="meta-separator">|</span>
                            {selectedCarton.weight} kg
                        </p>
                        <p style={{ margin: "0", fontSize: "0.77rem", color: "var(--text-muted)" }}>
                            x:{selectedCarton.x.toFixed(0)} y:{selectedCarton.y.toFixed(0)} z:{selectedCarton.z.toFixed(0)} mm
                        </p>
                    </div>
                )}

                {result && (
                    <div className="glass stats in-stack">
                        <h3 style={{ marginBottom: 6, fontSize: "0.95rem" }}>{t.stats}</h3>
                        <p style={{ margin: "3px 0", fontSize: "0.85rem" }}>{t.weight}: <strong>{result.totalWeight.toFixed(1)} / {pallet.maxWeight} kg</strong></p>
                        <p style={{ margin: "3px 0", fontSize: "0.85rem" }}>{t.height}: <strong>{result.totalHeight.toFixed(0)} / {pallet.maxHeight} mm</strong></p>
                        <p style={{ margin: "3px 0", fontSize: "0.85rem" }}>{t.layerCount}: <strong>{result.layers.length}</strong></p>
                        {unpackedCount > 0 && (
                            <p style={{ margin: "3px 0", color: limitsExceeded ? "var(--error)" : "var(--text-muted)", fontSize: "0.85rem" }}>
                                <strong>{unpackedMessage}</strong>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


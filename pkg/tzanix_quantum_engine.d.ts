/* tslint:disable */
/* eslint-disable */

export class QuantumEngineWasm {
    free(): void;
    [Symbol.dispose](): void;
    add_wave(fx: number, fy: number, fz: number, amplitude: number, phase: number): void;
    clear_waves(): void;
    /**
     * Returns the edges of the emergent graph computed in the last render_particles call
     */
    get_graph_edges(): Float32Array;
    constructor(capacity: number, resolution: number);
    /**
     * Measures the field in 3D, applies retroactive feedback, and computes graph topology
     */
    render_particles(start: number, end: number, step: number): Float32Array;
    set_observer_capacity(capacity: number): void;
    set_observer_resolution(resolution: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_quantumenginewasm_free: (a: number, b: number) => void;
    readonly quantumenginewasm_add_wave: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly quantumenginewasm_clear_waves: (a: number) => void;
    readonly quantumenginewasm_get_graph_edges: (a: number) => any;
    readonly quantumenginewasm_new: (a: number, b: number) => number;
    readonly quantumenginewasm_render_particles: (a: number, b: number, c: number, d: number) => any;
    readonly quantumenginewasm_set_observer_capacity: (a: number, b: number) => void;
    readonly quantumenginewasm_set_observer_resolution: (a: number, b: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

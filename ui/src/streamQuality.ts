export type QualityPreset = 'low' | 'medium' | 'high' | 'original';

export interface CustomQuality {
    maxBitrateKbps: number | null;   // null = 不限
    scaleUpTo: number;               // 目标纵向分辨率上限(px)
}

export type StreamQuality =
    | { mode: 'preset'; preset: QualityPreset }
    | { mode: 'custom'; custom: CustomQuality };

export interface RuntimeQuality {
    maxBitrate?: number;             // 未设置 = 不限(bps)
    scaleResolutionDownBy: number;
    maxFramerate: number;
}

const PRESET_QUALITY: Record<QualityPreset, {targetHeight?: number; maxBitrate: number}> = {
    low: {targetHeight: 480, maxBitrate: 2_000_000},
    medium: {targetHeight: 720, maxBitrate: 3_500_000},
    high: {targetHeight: 1080, maxBitrate: 6_000_000},
    original: {targetHeight: undefined, maxBitrate: 10_000_000},
};

// 浏览器对 scaleResolutionDownBy 的实际支持是这些离散值
const LEGAL_SCALES = [1, 1.5, 2, 2.25, 3, 4, 6, 8, 16];

const clampScale = (scale: number): number =>
    LEGAL_SCALES.find((s) => s >= scale - Number.EPSILON) ?? 16;

const computeScale = (sourceHeight: number, targetHeight: number | undefined): number => {
    if (!targetHeight || targetHeight >= sourceHeight || sourceHeight <= 0) {
        return 1;   // 无法放大；源尺寸已 ≤ 目标则无需缩放；拿不到高则退化为不缩放
    }
    return clampScale(Math.ceil(sourceHeight / targetHeight));
};

export const resolveQuality = (
    quality: StreamQuality,
    sourceHeight: number,
    framerate: number
): RuntimeQuality => {
    if (quality.mode === 'custom') {
        const {maxBitrateKbps, scaleUpTo} = quality.custom;
        return {
            maxBitrate: maxBitrateKbps != null ? maxBitrateKbps * 1000 : undefined,
            scaleResolutionDownBy: computeScale(sourceHeight, scaleUpTo),
            maxFramerate: framerate,
        };
    }
    const preset = PRESET_QUALITY[quality.preset];
    return {
        maxBitrate: preset.maxBitrate,
        scaleResolutionDownBy: computeScale(sourceHeight, preset.targetHeight),
        maxFramerate: framerate,
    };
};

// 供 UI 列出可选档位文案
export const QUALITY_PRESETS: QualityPreset[] = ['low', 'medium', 'high', 'original'];

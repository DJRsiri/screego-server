import React from 'react';
import {QualityPreset, StreamQuality} from './streamQuality';
export const CodecBestQuality: PreferredCodec = {mimeType: 'BEST_QUALITY'};
export const CodecDefault: PreferredCodec = {mimeType: 'DEFAULT'};

export const preferCodecEquals = (a: PreferredCodec, b: PreferredCodec): boolean => {
    return a.mimeType === b.mimeType && a.sdpFmtpLine === b.sdpFmtpLine;
};

export const codecName = (mimeType: string): string => {
    switch (mimeType) {
        case CodecBestQuality.mimeType:
            return 'Preset: Best Quality';
        case CodecDefault.mimeType:
            return 'Preset: Browser Default';
        default:
            return mimeType;
    }
};

export const resolveCodecPlaceholder = (
    codec: PreferredCodec | undefined
): PreferredCodec | undefined => {
    switch (codec?.mimeType) {
        case CodecBestQuality.mimeType:
            return {
                mimeType: 'video/VP9',
                sdpFmtpLine: 'profile-id=2',
            };
        case CodecDefault.mimeType:
            return undefined;
        default:
            return codec;
    }
};

export interface Settings {
    name?: string;
    displayMode: VideoDisplayMode;
    preferCodec?: PreferredCodec;
    framerate: number;
    streamQuality: StreamQuality;
}
export interface PreferredCodec {
    mimeType: string;
    sdpFmtpLine?: string;
}

export enum VideoDisplayMode {
    FitToWindow = 'FitToWindow',
    FitWidth = 'FitWidth',
    FitHeight = 'FitHeight',
    OriginalSize = 'OriginalSize',
}

const SettingsKey = 'screegoSettings';

const defaults = (): Settings => ({
    displayMode: VideoDisplayMode.FitToWindow,
    framerate: 30,
    streamQuality: {mode: 'preset', preset: 'original'},
});

// 当 localStorage 无用户首选项时，写入服务端下发的默认档位(仅启动时调用一次)。
export const applyStreamQualityDefault = (preset: QualityPreset): void => {
    const raw = localStorage.getItem(SettingsKey);
    const parsed = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    if (parsed.streamQuality != null) {
        return;   // 用户已设置，不覆盖
    }
    saveSettings({...defaults(), ...parsed, streamQuality: {mode: 'preset', preset}});
};

export const loadSettings = (): Settings => {
    const settings: Partial<Settings> = JSON.parse(localStorage.getItem(SettingsKey) ?? '{}') ?? {};

    if (settings && typeof settings === 'object') {
        return {
            name: settings.name?.toString(),
            framerate: settings.framerate ?? defaults().framerate,
            displayMode:
                Object.values(VideoDisplayMode).find((mode) => mode === settings.displayMode) ??
                defaults().displayMode,
            preferCodec: settings.preferCodec ?? CodecDefault,
            streamQuality: settings.streamQuality ?? defaults().streamQuality,
        };
    }
    return defaults();
};

export const saveSettings = (settings: Settings): void => {
    localStorage.setItem(SettingsKey, JSON.stringify(settings));
};

export const useSettings = (): [Settings, (s: Settings) => void] => {
    const [settings, setSettings] = React.useState(loadSettings);

    return [
        settings,
        (newSettings) => {
            setSettings(newSettings);
            saveSettings(newSettings);
        },
    ];
};

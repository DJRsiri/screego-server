import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
    Autocomplete,
    Box,
} from '@mui/material';
import {
    CodecBestQuality,
    CodecDefault,
    codecName,
    loadSettings,
    PreferredCodec,
    Settings,
    VideoDisplayMode,
} from './settings';
import {NumberField} from './NumberField';
import {QUALITY_PRESETS, QualityPreset, StreamQuality} from './streamQuality';

export interface SettingDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    updateName: (s: string) => void;
    saveSettings: (s: Settings) => void;
}

const getAvailableCodecs = (): PreferredCodec[] => {
    if ('getCapabilities' in RTCRtpSender) {
        return RTCRtpSender.getCapabilities('video')?.codecs ?? [];
    }
    return [];
};

const NativeCodecs = getAvailableCodecs();

const qualityLabel = (quality: StreamQuality): string => {
    if (quality.mode === 'custom') {
        return 'Custom';
    }
    switch (quality.preset) {
        case 'low':
            return 'Low';
        case 'medium':
            return 'Medium';
        case 'high':
            return 'High';
        case 'original':
            return 'Original';
    }
};

export const SettingDialog = ({open, setOpen, updateName, saveSettings}: SettingDialogProps) => {
    const [settingsInput, setSettingsInput] = React.useState(loadSettings);

    const doSubmit = () => {
        saveSettings(settingsInput);
        updateName(settingsInput.name ?? '');
        setOpen(false);
    };

    const {name, preferCodec, displayMode, framerate, streamQuality} = settingsInput;

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth={'xs'} fullWidth>
            <DialogTitle>Settings</DialogTitle>
            <DialogContent>
                <form onSubmit={doSubmit}>
                    <Box sx={{paddingBottom: 1}}>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Username"
                            value={name}
                            onChange={(e) =>
                                setSettingsInput((c) => ({...c, name: e.target.value}))
                            }
                            fullWidth
                        />
                    </Box>
                    {NativeCodecs.length > 0 ? (
                        <Box sx={{paddingY: 1}}>
                            <Autocomplete<PreferredCodec>
                                options={[CodecBestQuality, CodecDefault, ...NativeCodecs]}
                                getOptionLabel={({mimeType, sdpFmtpLine}) =>
                                    codecName(mimeType) + (sdpFmtpLine ? ` (${sdpFmtpLine})` : '')
                                }
                                value={preferCodec}
                                isOptionEqualToValue={(a, b) =>
                                    a.mimeType === b.mimeType && a.sdpFmtpLine === b.sdpFmtpLine
                                }
                                fullWidth
                                onChange={(_, value) =>
                                    setSettingsInput((c) => ({
                                        ...c,
                                        preferCodec: value ?? undefined,
                                    }))
                                }
                                renderInput={(params) => (
                                    <TextField {...params} label="Preferred Codec" />
                                )}
                            />
                        </Box>
                    ) : undefined}
                    <Box sx={{paddingTop: 1}}>
                        <Autocomplete<VideoDisplayMode>
                            options={Object.values(VideoDisplayMode)}
                            onChange={(_, value) =>
                                setSettingsInput((c) => ({
                                    ...c,
                                    displayMode: value ?? VideoDisplayMode.FitToWindow,
                                }))
                            }
                            value={displayMode}
                            fullWidth
                            renderInput={(params) => <TextField {...params} label="Display Mode" />}
                        />
                    </Box>
                    <Box sx={{paddingTop: 1}}>
                        <NumberField
                            label="FrameRate"
                            min={1}
                            onChange={(framerate) => setSettingsInput((c) => ({...c, framerate}))}
                            value={framerate}
                            fullWidth
                        />
                    </Box>
                    <Box sx={{paddingTop: 1}}>
                        <Autocomplete<StreamQuality>
                            options={[
                                ...QUALITY_PRESETS.map(
                                    (preset) => ({mode: 'preset', preset}) as StreamQuality
                                ),
                                {mode: 'custom', custom: {maxBitrateKbps: null, scaleUpTo: 1080}},
                            ]}
                            getOptionLabel={qualityLabel}
                            isOptionEqualToValue={(a, b) =>
                                a.mode === b.mode &&
                                (a.mode === 'custom'
                                    ? true
                                    : (a as {mode: 'preset'; preset: QualityPreset}).preset ===
                                      (b as {mode: 'preset'; preset: QualityPreset}).preset)
                            }
                            value={streamQuality}
                            fullWidth
                            onChange={(_, value) =>
                                value && setSettingsInput((c) => ({...c, streamQuality: value}))
                            }
                            renderInput={(params) => (
                                <TextField {...params} label="Stream Quality" />
                            )}
                        />
                    </Box>
                    {streamQuality.mode === 'custom' ? (
                        <Box sx={{paddingTop: 1}}>
                            <NumberField
                                label="Max Bitrate (kbps, 0 = unlimited)"
                                min={0}
                                onChange={(maxBitrateKbps) =>
                                    setSettingsInput((c) => ({
                                        ...c,
                                        streamQuality: {
                                            mode: 'custom',
                                            custom: {
                                                maxBitrateKbps:
                                                    maxBitrateKbps === 0 ? null : maxBitrateKbps,
                                                scaleUpTo: c.streamQuality.mode === 'custom'
                                                    ? c.streamQuality.custom.scaleUpTo
                                                    : 1080,
                                            },
                                        },
                                    }))
                                }
                                value={streamQuality.custom.maxBitrateKbps ?? 0}
                                fullWidth
                            />
                        </Box>
                    ) : undefined}
                    {streamQuality.mode === 'custom' ? (
                        <Box sx={{paddingTop: 1}}>
                            <NumberField
                                label="Scale Up To (px height)"
                                min={1}
                                onChange={(scaleUpTo) =>
                                    setSettingsInput((c) => ({
                                        ...c,
                                        streamQuality: {
                                            mode: 'custom',
                                            custom: {
                                                maxBitrateKbps: c.streamQuality.mode === 'custom'
                                                    ? c.streamQuality.custom.maxBitrateKbps
                                                    : null,
                                                scaleUpTo,
                                            },
                                        },
                                    }))
                                }
                                value={streamQuality.custom.scaleUpTo}
                                fullWidth
                            />
                        </Box>
                    ) : undefined}
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)} color="primary">
                    Cancel
                </Button>
                <Button onClick={doSubmit} color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

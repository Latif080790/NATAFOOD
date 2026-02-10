import { useSettingsStore } from '@/store/settingsStore'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Store, MapPin, Phone, Percent, Sun, Moon, Monitor,
    Printer, RotateCcw, Save, Palette, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export default function Settings() {
    const settings = useSettingsStore()

    // Apply theme
    useEffect(() => {
        const root = document.documentElement
        if (settings.theme === 'dark') {
            root.classList.add('dark')
        } else if (settings.theme === 'light') {
            root.classList.remove('dark')
        } else {
            // system
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.toggle('dark', prefersDark)
        }
    }, [settings.theme])

    const handleReset = () => {
        settings.resetDefaults()
        toast.info('Pengaturan dikembalikan ke default.')
    }

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 space-y-8 pb-24">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Pengaturan</h1>
                    <p className="text-sm text-muted-foreground">Konfigurasi toko, tampilan, dan perangkat.</p>
                </div>

                {/* ─── Store Profile ─── */}
                <Section title="Profil Toko" icon={<Store className="w-5 h-5" />}>
                    <SettingRow label="Nama Toko" icon={<Store className="w-4 h-4" />}>
                        <Input
                            value={settings.storeName}
                            onChange={(e) => settings.updateSetting('storeName', e.target.value)}
                            className="max-w-xs"
                        />
                    </SettingRow>
                    <SettingRow label="Alamat" icon={<MapPin className="w-4 h-4" />}>
                        <Input
                            value={settings.storeAddress}
                            onChange={(e) => settings.updateSetting('storeAddress', e.target.value)}
                            className="max-w-xs"
                        />
                    </SettingRow>
                    <SettingRow label="Telepon" icon={<Phone className="w-4 h-4" />}>
                        <Input
                            value={settings.storePhone}
                            onChange={(e) => settings.updateSetting('storePhone', e.target.value)}
                            className="max-w-xs"
                        />
                    </SettingRow>
                </Section>

                {/* ─── Tax & Pricing ─── */}
                <Section title="Pajak & Biaya" icon={<Percent className="w-5 h-5" />}>
                    <SettingRow label="PPN (%)" icon={<Percent className="w-4 h-4" />}>
                        <Input
                            type="number"
                            min={0} max={100} step={1}
                            value={Math.round(settings.taxRate * 100)}
                            onChange={(e) => settings.updateSetting('taxRate', Number(e.target.value) / 100)}
                            className="w-24"
                        />
                    </SettingRow>
                    <SettingRow label="Service Charge (%)" icon={<Percent className="w-4 h-4" />}>
                        <Input
                            type="number"
                            min={0} max={100} step={1}
                            value={Math.round(settings.serviceCharge * 100)}
                            onChange={(e) => settings.updateSetting('serviceCharge', Number(e.target.value) / 100)}
                            className="w-24"
                        />
                    </SettingRow>
                </Section>

                {/* ─── Appearance ─── */}
                <Section title="Tampilan" icon={<Palette className="w-5 h-5" />}>
                    <SettingRow label="Tema" icon={<Sun className="w-4 h-4" />}>
                        <div className="flex gap-2">
                            {([
                                { key: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
                                { key: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
                                { key: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
                            ] as const).map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => settings.updateSetting('theme', opt.key)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                                        settings.theme === opt.key
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : "bg-muted/50 text-muted-foreground border-transparent hover:border-primary/30"
                                    )}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </SettingRow>
                    <SettingRow label="Densitas" icon={<Palette className="w-4 h-4" />}>
                        <div className="flex gap-2">
                            {(['compact', 'comfortable'] as const).map(d => (
                                <button
                                    key={d}
                                    onClick={() => settings.updateSetting('density', d)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize",
                                        settings.density === d
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : "bg-muted/50 text-muted-foreground border-transparent hover:border-primary/30"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </SettingRow>
                </Section>

                {/* ─── Printer ─── */}
                <Section title="Printer" icon={<Printer className="w-5 h-5" />}>
                    <SettingRow label="Aktifkan Printer" icon={<Printer className="w-4 h-4" />}>
                        <button
                            onClick={() => settings.updateSetting('printerEnabled', !settings.printerEnabled)}
                            className={cn(
                                "w-12 h-7 rounded-full transition-colors relative",
                                settings.printerEnabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform",
                                settings.printerEnabled ? "translate-x-6" : "translate-x-1"
                            )} />
                        </button>
                    </SettingRow>
                    {settings.printerEnabled && (
                        <SettingRow label="Nama Printer" icon={<Printer className="w-4 h-4" />}>
                            <Input
                                placeholder="e.g. EPSON TM-T82"
                                value={settings.printerName}
                                onChange={(e) => settings.updateSetting('printerName', e.target.value)}
                                className="max-w-xs"
                            />
                        </SettingRow>
                    )}
                </Section>

                {/* ─── About ─── */}
                <Section title="Tentang" icon={<Info className="w-5 h-5" />}>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Versi Aplikasi</span>
                        <span className="font-mono font-medium">v2.5.0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Build</span>
                        <span className="font-mono font-medium">React 19 + Vite 7</span>
                    </div>
                </Section>

                {/* ─── Actions ─── */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" className="flex-1" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset ke Default
                    </Button>
                    <Button className="flex-1" onClick={() => toast.success('Pengaturan berhasil disimpan!')}>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Reusable Sub-Components ────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="text-primary">{icon}</span>
                {title}
            </h2>
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm divide-y">
                {children}
            </div>
        </div>
    )
}

function SettingRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                <span className="text-muted-foreground">{icon}</span>
                {label}
            </div>
            {children}
        </div>
    )
}

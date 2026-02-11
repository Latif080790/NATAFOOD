import { useSettingsStore } from '@/store/settingsStore'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Store, MapPin, Phone, Percent, Sun, Moon, Monitor,
    Printer, RotateCcw, Save, Palette, Info, UtensilsCrossed, ScrollText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import MenuManagement from './settings/MenuManagement'
import RecipeManagement from './settings/RecipeManagement'
import TableManagement from './settings/TableManagement'
import UserManagement from './settings/UserManagement'
import HPPDashboard from './settings/HPPDashboard'

type Tab = 'general' | 'menu' | 'recipe' | 'table' | 'user' | 'hpp'

import { useSearchParams } from 'react-router-dom'

export default function Settings() {
    const [searchParams, setSearchParams] = useSearchParams()
    const initialTab = searchParams.get('tab') as Tab || 'general'
    const [activeTab, setActiveTab] = useState<Tab>(initialTab)

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab)
        setSearchParams({ tab })
    }
    const settings = useSettingsStore()

    // Apply theme
    useEffect(() => {
        const root = document.documentElement
        if (settings.theme === 'dark') {
            root.classList.add('dark')
        } else if (settings.theme === 'light') {
            root.classList.remove('dark')
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.toggle('dark', prefersDark)
        }
    }, [settings.theme])

    const handleReset = () => {
        settings.resetDefaults()
        toast.info('Pengaturan dikembalikan ke default.')
    }

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen overflow-hidden flex flex-col">
            <div className="p-6 pb-0 max-w-7xl mx-auto w-full">
                <h1 className="text-2xl font-bold mb-6">Pengaturan & Manajemen</h1>

                {/* Tabs */}
                <div className="flex gap-1 border-b mb-6 overflow-x-auto">
                    <TabButton
                        active={activeTab === 'general'}
                        onClick={() => handleTabChange('general')}
                        icon={<Store className="w-4 h-4" />}
                        label="Umum"
                    />
                    <TabButton
                        active={activeTab === 'menu'}
                        onClick={() => handleTabChange('menu')}
                        icon={<UtensilsCrossed className="w-4 h-4" />}
                        label="Manajemen Menu"
                    />
                    <TabButton
                        active={activeTab === 'recipe'}
                        onClick={() => handleTabChange('recipe')}
                        icon={<ScrollText className="w-4 h-4" />}
                        label="Resep & Bahan"
                    />
                    <TabButton
                        active={activeTab === 'table'}
                        onClick={() => handleTabChange('table')}
                        icon={<Store className="w-4 h-4" />}
                        label="Meja"
                    />
                    <TabButton
                        active={activeTab === 'user'}
                        onClick={() => handleTabChange('user')}
                        icon={<Store className="w-4 h-4" />}
                        label="User"
                    />
                    <TabButton
                        active={activeTab === 'hpp'}
                        onClick={() => handleTabChange('hpp')}
                        icon={<Percent className="w-4 h-4" />}
                        label="HPP / BOM"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24 max-w-7xl mx-auto w-full">
                {activeTab === 'general' && (
                    <div className="space-y-8 max-w-2xl">
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
                )}

                {activeTab === 'menu' && <MenuManagement />}
                {activeTab === 'recipe' && <RecipeManagement />}
                {activeTab === 'table' && <TableManagement />}
                {activeTab === 'user' && <UserManagement />}
                {activeTab === 'hpp' && <HPPDashboard />}
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                active
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
        >
            {icon}
            {label}
        </button>
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

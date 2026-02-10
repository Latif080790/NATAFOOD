import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, MapPin, Phone, CheckCircle } from 'lucide-react'

export default function Scan() {
    const [scanning, setScanning] = useState(true)
    const [scannedData, setScannedData] = useState<any>(null)

    // Mock scan effect
    useEffect(() => {
        if (scanning) {
            const timer = setTimeout(() => {
                setScanning(false)
                setScannedData({
                    orderId: 'ORD-8821',
                    customer: 'Ibu Budi',
                    address: 'Jl. Nangka No. 5, Jakarta Selatan',
                    phone: '0812-3456-7890',
                    items: ['2x Nasi Goreng', '1x Es Teh Manis']
                })
            }, 3000) // 3 seconds "scanning"
            return () => clearTimeout(timer)
        }
    }, [scanning])

    const handleDeliver = () => {
        // Open WA logic mock
        const message = `Halo Ibu Budi, pesanan ${scannedData.orderId} sedang diantar ke ${scannedData.address}.`
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        alert("Status updated to On Delivery")
        setScannedData(null)
        setScanning(true)
    }

    return (
        <div className="p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
            {scanning ? (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="relative">
                        <QrCode className="h-64 w-64 text-primary" />
                        <div className="absolute inset-0 border-4 border-primary/50 animate-ping rounded-xl"></div>
                    </div>
                    <p className="text-xl font-bold text-muted-foreground">Mencari QR Code...</p>
                    <p className="text-sm text-center">Arahkan kamera ke struk atau paket.</p>
                </div>
            ) : (
                <Card className="w-full max-w-md animate-in slide-in-from-bottom duration-500">
                    <CardHeader className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-center pb-2">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                        <CardTitle>Scan Berhasil!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Tujuan Pengiriman</h3>
                            <p className="text-xl font-bold">{scannedData.customer}</p>
                            <div className="flex items-start gap-2 mt-1">
                                <MapPin className="h-4 w-4 mt-1 text-primary" />
                                <p>{scannedData.address}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Kontak</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Phone className="h-4 w-4 text-primary" />
                                <p>{scannedData.phone}</p>
                            </div>
                        </div>
                        <div className="bg-muted p-2 rounded text-sm">
                            <p className="font-medium mb-1">Detail Pesanan:</p>
                            <ul className="list-disc list-inside">
                                {scannedData.items.map((i: string, idx: number) => (
                                    <li key={idx}>{i}</li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full font-bold text-lg h-12" onClick={handleDeliver}>
                            Jalan Sekarang (WA)
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {!scanning && !scannedData && (
                <Button onClick={() => setScanning(true)}>Scan Ulang</Button>
            )}
        </div>
    )
}

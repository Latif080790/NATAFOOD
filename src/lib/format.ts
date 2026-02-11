/**
 * Shared formatting & utility functions for NataFood POS.
 * Single source of truth — do NOT use inline Intl.NumberFormat elsewhere.
 */

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
})

/** Format number as Indonesian Rupiah: Rp25.000 */
export function formatRupiah(amount: number): string {
    return rupiahFormatter.format(amount)
}

/** Format Date to readable Indonesian date: "10 Feb 2026" */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

/** Format Date to time: "10:42" */
export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}

/** Format Date to readable time with AM/PM: "10:42 AM" */
export function formatTime12h(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

/** Generate a sequential-looking order ID: "ORD-00128" */
let orderCounter = 125
export function generateOrderId(): string {
    orderCounter++
    return `ORD-${String(orderCounter).padStart(5, '0')}`
}

export function formatDateToLocal(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

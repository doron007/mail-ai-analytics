'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            {/* Content */}
            {children}
        </div>
    )
}

const DialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-5xl mx-4 max-h-[90vh] overflow-auto',
            'rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-gray-950 to-slate-950 shadow-[0_0_60px_rgba(34,211,238,0.1)]',
            'animate-in fade-in-0 zoom-in-95',
            className
        )}
        {...props}
    >
        {onClose && (
            <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
                <X className="h-5 w-5" />
            </button>
        )}
        {children}
    </div>
))
DialogContent.displayName = 'DialogContent'

const DialogHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('px-6 pt-6 pb-4', className)}
        {...props}
    />
))
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn('text-2xl font-bold text-white', className)}
        {...props}
    />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-gray-400 mt-1', className)}
        {...props}
    />
))
DialogDescription.displayName = 'DialogDescription'

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }

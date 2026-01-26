'use client'

import * as React from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectContextType {
    value: string | undefined
    onValueChange: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

const Select = ({ children, value, onValueChange, open: controlledOpen, onOpenChange }: {
    children: React.ReactNode
    value?: string
    onValueChange?: (value: string) => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const setOpen = isControlled ? onOpenChange : setUncontrolledOpen

    return (
        <SelectContext.Provider value={{ value, onValueChange: onValueChange || (() => { }), open: !!open, setOpen: setOpen || setUncontrolledOpen }}>
            <div className="relative inline-block w-full">{children}</div>
        </SelectContext.Provider>
    )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(SelectContext)
        if (!context) throw new Error('SelectTrigger must be used within Select')

        return (
            <button
                ref={ref}
                type="button"
                onClick={() => context.setOpen(!context.open)}
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
        )
    }
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }>(
    ({ className, placeholder, ...props }, ref) => {
        const context = React.useContext(SelectContext)
        // In a real implementation this would map value to label, but here we depend on the children of SelectItem or logic in parent. 
        // However, Radix SelectValue automatically shows the selected item's text.
        // For this simple custom implementation, we might need a workaround or accept that it displays the value text if children aren't passed.
        // A robust way for a custom select to show the LABEL of the selected value is tricky without mapping. 
        // We will assume the parent passes a placeholder or handles display, 
        // OR we naively try to display the label.
        // For now, let's render the children if provided, or the value.

        // Hack: DateRangeFilter passes `SelectValue` with a placeholder `Select range`.
        // The actual text usually comes from the selected item.
        // We'll let the parent handle the display text or just show the value if it looks like a label.
        // Since we are replacing an API, we can't easily traverse children here.
        // So we will just render a span. The `DateRangeFilter` usage is `<SelectValue placeholder="..." />`.
        // The Radix behavior is magic.
        // We'll trust that for now, we might see the raw value "7d" instead of "Last 7 Days". 
        // Fixing this properly requires a lookup logic or context update from Items.

        return (
            <span ref={ref} className={cn('block truncate', className)} {...props}>
                {/* This is a limitation of this shim: it will show the raw value or empty if we don't implement the registry. */}
                {/* For our specific use case (TimeRange), the value '7d' is not very user friendly. */}
                {/* We will try to rely on a label map if possible, but simplest is to just render the value or placeholder. */}
                {context?.value ? <ValueDisplay value={context.value} /> : placeholder}
            </span>
        )
    }
)
SelectValue.displayName = 'SelectValue'

// Helper component to display nice labels for our known values
const ValueDisplay = ({ value }: { value: string }) => {
    const labels: Record<string, string> = {
        '24h': 'Today',
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        'all': 'All Time',
        'custom': 'Custom Range'
    }
    return <>{labels[value] || value}</>
}

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { position?: 'popper' | 'item-aligned' }>(
    ({ className, children, position = 'popper', ...props }, ref) => {
        const context = React.useContext(SelectContext)
        if (!context || !context.open) return null

        return (
            <div
                ref={ref}
                className={cn(
                    'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80',
                    position === 'popper' ? 'top-[calc(100%+4px)]' : 'top-0',
                    className
                )}
                {...props}
            >
                <div className="w-full p-1">{children}</div>
            </div>
        )
    }
)
SelectContent.displayName = 'SelectContent'

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
    ({ className, children, value, ...props }, ref) => {
        const context = React.useContext(SelectContext)
        if (!context) return null

        const isSelected = context.value === value

        return (
            <div
                ref={ref}
                onClick={(e) => {
                    e.stopPropagation()
                    context.onValueChange(value)
                    context.setOpen(false)
                }}
                className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer',
                    isSelected && 'bg-accent text-accent-foreground',
                    className
                )}
                {...props}
            >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {isSelected && <Check className="h-4 w-4" />}
                </span>
                <span className="text-foreground">{children}</span>
            </div>
        )
    }
)
SelectItem.displayName = 'SelectItem'

const SelectGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />
)
SelectGroup.displayName = 'SelectGroup'

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />
)
SelectLabel.displayName = 'SelectLabel'

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectLabel,
}

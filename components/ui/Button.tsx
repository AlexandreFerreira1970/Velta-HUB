'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--azure-ring)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer'

const variants: Record<string, string> = {
  primary:
    'bg-[var(--navy)] text-[var(--ink-inverse)] border border-[var(--navy)] hover:bg-[var(--azure)] hover:border-[var(--azure)] active:bg-[var(--azure-hover)] active:border-[var(--azure-hover)]',
  secondary:
    'bg-transparent text-[var(--ink-primary)] border border-[var(--steel-strong)] hover:bg-[var(--surface-2)] active:bg-[var(--steel)]',
  ghost:
    'bg-transparent text-[var(--ink-secondary)] border border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--ink-primary)] active:bg-[var(--steel-soft)]',
  destructive:
    'bg-[var(--semantic-error)] text-white border border-[var(--semantic-error)] hover:opacity-90 active:opacity-80',
}

const sizes: Record<string, string> = {
  sm: 'h-7 px-3 text-xs rounded-[var(--radius-sm)]',
  md: 'h-9 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-11 px-6 text-sm rounded-[var(--radius-lg)]',
}

const Spinner = () => (
  <svg
    className="animate-spin h-3.5 w-3.5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

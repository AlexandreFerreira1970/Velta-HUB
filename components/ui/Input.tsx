'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium tracking-wide uppercase"
            style={{ color: 'var(--ink-secondary)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            h-9 w-full px-3 text-sm
            bg-[var(--control-bg)]
            text-[var(--ink-primary)]
            placeholder:text-[var(--ink-muted)]
            border transition-colors duration-150
            rounded-[var(--radius-sm)]
            outline-none
            disabled:opacity-40 disabled:cursor-not-allowed
            ${hasError
              ? 'border-[var(--semantic-error)] focus:border-[var(--semantic-error)] focus:border-l-2'
              : 'border-[var(--control-border)] focus:border-[var(--control-border-focus)] focus:border-l-2'
            }
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {hasError ? (
          <p id={`${inputId}-error`} className="text-xs" style={{ color: 'var(--semantic-error)' }}>
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'

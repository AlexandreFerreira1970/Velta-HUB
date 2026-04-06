'use client'

import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, id, rows = 4, className = '', ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium tracking-wide uppercase"
            style={{ color: 'var(--ink-secondary)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`
            w-full px-3 py-2 text-sm
            bg-[var(--control-bg)]
            text-[var(--ink-primary)]
            placeholder:text-[var(--ink-muted)]
            border transition-colors duration-150
            rounded-[var(--radius-sm)]
            outline-none resize-y
            disabled:opacity-40 disabled:cursor-not-allowed
            ${hasError
              ? 'border-[var(--semantic-error)] focus:border-[var(--semantic-error)] focus:border-l-2'
              : 'border-[var(--control-border)] focus:border-[var(--control-border-focus)] focus:border-l-2'
            }
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {hasError ? (
          <p id={`${textareaId}-error`} className="text-xs" style={{ color: 'var(--semantic-error)' }}>
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

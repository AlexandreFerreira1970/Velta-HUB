'use client'

import React, { useEffect, useRef } from 'react'

interface CheckboxProps {
  label?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  indeterminate?: boolean
  id?: string
}

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IndeterminateIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2 5H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  indeterminate = false,
  id,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const checkboxId = id ?? (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  const isActive = checked || indeterminate

  return (
    <label
      htmlFor={checkboxId}
      className={`
        inline-flex items-center gap-2.5 cursor-pointer select-none
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      <div className="relative flex items-center justify-center">
        <input
          ref={inputRef}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
          aria-label={label}
        />
        <div
          className={`
            w-4 h-4 flex items-center justify-center
            border transition-all duration-150
            rounded-[var(--radius-sm)]
            peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--azure-ring)] peer-focus-visible:ring-offset-1
            ${isActive
              ? 'bg-[var(--azure)] border-[var(--azure)] border-l-2'
              : 'bg-[var(--control-bg)] border-[var(--control-border)] hover:border-[var(--steel-strong)]'
            }
          `}
        >
          {checked && !indeterminate && <CheckIcon />}
          {indeterminate && <IndeterminateIcon />}
        </div>
      </div>
      {label && (
        <span className="text-sm" style={{ color: 'var(--ink-primary)' }}>
          {label}
        </span>
      )}
    </label>
  )
}

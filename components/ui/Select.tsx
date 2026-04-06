'use client'

import React, { useRef, useState, useEffect } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  placeholder?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  id?: string
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{
      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 150ms ease',
      flexShrink: 0,
    }}
  >
    <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function Select({
  label,
  placeholder = 'Selecionar...',
  options,
  value,
  onChange,
  error,
  disabled = false,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasError = Boolean(error)
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
  }

  function handleSelect(optionValue: string) {
    onChange?.(optionValue)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium tracking-wide uppercase"
          style={{ color: 'var(--ink-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={hasError}
          onKeyDown={handleKeyDown}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          className={`
            h-9 w-full px-3 text-sm text-left
            flex items-center justify-between gap-2
            bg-[var(--control-bg)]
            border transition-colors duration-150
            rounded-[var(--radius-sm)]
            outline-none
            disabled:opacity-40 disabled:cursor-not-allowed
            ${hasError
              ? `border-[var(--semantic-error)] ${open ? 'border-l-2' : ''}`
              : open
                ? 'border-[var(--control-border-focus)] border-l-2'
                : 'border-[var(--control-border)] hover:border-[var(--steel-strong)]'
            }
          `}
          style={{ color: selectedOption ? 'var(--ink-primary)' : 'var(--ink-muted)' }}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <ul
            role="listbox"
            aria-label={label}
            className="
              absolute z-50 mt-1 w-full
              bg-[var(--surface-0)]
              border border-[var(--steel)]
              rounded-[var(--radius-sm)]
              py-1 overflow-auto max-h-56
            "
            style={{ boxShadow: '0 4px 12px rgba(12, 26, 46, 0.08)' }}
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    flex items-center justify-between
                    px-3 py-2 text-sm cursor-pointer
                    transition-colors duration-100
                    ${isSelected
                      ? 'bg-[var(--azure-light)] text-[var(--azure)]'
                      : 'text-[var(--ink-primary)] hover:bg-[var(--surface-2)]'
                    }
                  `}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <span style={{ color: 'var(--azure)' }}>
                      <CheckIcon />
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {hasError && (
        <p className="text-xs" style={{ color: 'var(--semantic-error)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

'use client'

import React from 'react'

type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'body-sm'
  | 'label'
  | 'caption'
  | 'overline'
  | 'numeric'

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'inverse' | 'azure' | 'error' | 'success' | 'warning'

type As = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label' | 'caption' | 'div' | 'strong' | 'em' | 'time' | 'code'

interface TextProps {
  variant?: TextVariant
  color?: TextColor
  as?: As
  uppercase?: boolean
  truncate?: boolean
  className?: string
  children?: React.ReactNode
  htmlFor?: string
  dateTime?: string
  style?: React.CSSProperties
}

const defaultElement: Record<TextVariant, As> = {
  display: 'h1',
  title: 'h2',
  heading: 'h3',
  subheading: 'h4',
  body: 'p',
  'body-sm': 'p',
  label: 'span',
  caption: 'span',
  overline: 'span',
  numeric: 'span',
}

const variantStyles: Record<TextVariant, React.CSSProperties> = {
  display: {
    fontSize: 'var(--text-display-size)',
    fontWeight: 'var(--text-display-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-display-leading)',
    letterSpacing: 'var(--text-display-tracking)',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  title: {
    fontSize: 'var(--text-title-size)',
    fontWeight: 'var(--text-title-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-title-leading)',
    letterSpacing: 'var(--text-title-tracking)',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  heading: {
    fontSize: 'var(--text-heading-size)',
    fontWeight: 'var(--text-heading-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-heading-leading)',
    letterSpacing: 'var(--text-heading-tracking)',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  subheading: {
    fontSize: 'var(--text-subheading-size)',
    fontWeight: 'var(--text-subheading-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-subheading-leading)',
    letterSpacing: 'var(--text-subheading-tracking)',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  body: {
    fontSize: 'var(--text-body-size)',
    fontWeight: 'var(--text-body-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-body-leading)',
    letterSpacing: 'var(--text-body-tracking)',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  'body-sm': {
    fontSize: 'var(--text-body-sm-size)',
    fontWeight: 'var(--text-body-sm-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-body-sm-leading)',
    letterSpacing: 'var(--text-body-sm-tracking)',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  label: {
    fontSize: 'var(--text-label-size)',
    fontWeight: 'var(--text-label-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-label-leading)',
    letterSpacing: 'var(--text-label-tracking)',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  caption: {
    fontSize: 'var(--text-caption-size)',
    fontWeight: 'var(--text-caption-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-caption-leading)',
    letterSpacing: 'var(--text-caption-tracking)',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  overline: {
    fontSize: 'var(--text-overline-size)',
    fontWeight: 'var(--text-overline-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-overline-leading)',
    letterSpacing: 'var(--text-overline-tracking)',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  numeric: {
    fontSize: 'var(--text-numeric-size)',
    fontWeight: 'var(--text-numeric-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-numeric-leading)',
    letterSpacing: 'var(--text-numeric-tracking)',
    fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
    fontVariantNumeric: 'tabular-nums',
  },
}

const colorStyles: Record<TextColor, React.CSSProperties> = {
  primary: { color: 'var(--ink-primary)' },
  secondary: { color: 'var(--ink-secondary)' },
  tertiary: { color: 'var(--ink-tertiary)' },
  muted: { color: 'var(--ink-muted)' },
  inverse: { color: 'var(--ink-inverse)' },
  azure: { color: 'var(--azure)' },
  error: { color: 'var(--semantic-error)' },
  success: { color: 'var(--semantic-success)' },
  warning: { color: 'var(--semantic-warning)' },
}

const defaultColor: Record<TextVariant, TextColor> = {
  display: 'primary',
  title: 'primary',
  heading: 'primary',
  subheading: 'primary',
  body: 'primary',
  'body-sm': 'secondary',
  label: 'secondary',
  caption: 'tertiary',
  overline: 'tertiary',
  numeric: 'primary',
}

export function Text({
  variant = 'body',
  color,
  as,
  uppercase = false,
  truncate = false,
  className = '',
  children,
  style,
  ...props
}: TextProps) {
  const Tag = (as ?? defaultElement[variant]) as React.ElementType
  const resolvedColor = color ?? defaultColor[variant]

  const computedStyle: React.CSSProperties = {
    ...variantStyles[variant],
    ...colorStyles[resolvedColor],
    ...(uppercase && variant !== 'label' && variant !== 'overline' ? { textTransform: 'uppercase' } : {}),
    ...(truncate ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}),
    ...style,
  }

  return (
    <Tag className={className} style={computedStyle} {...props}>
      {children}
    </Tag>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Text } from '@/components/ui'
import type { ChatMessage } from '@/lib/conversations'

// ─── Icons ───────────────────────────────────────────────────────────────────

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 8L2 2l2.5 6L2 14l12-6Z" fill="currentColor" />
  </svg>
)

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[72%] space-y-1">
        <div
          className="px-4 py-3 rounded-[var(--radius-lg)] text-sm leading-relaxed whitespace-pre-wrap"
          style={
            isUser
              ? {
                  background: 'var(--navy)',
                  color: 'var(--ink-inverse)',
                  borderRadius: '12px 12px 2px 12px',
                }
              : {
                  background: 'var(--surface-0)',
                  color: 'var(--ink-primary)',
                  border: '1px solid var(--steel-soft)',
                  borderRadius: '2px 12px 12px 12px',
                }
          }
        >
          {message.content}
          {isStreaming && (
            <span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
              style={{ background: 'var(--azure)' }}
            />
          )}
        </div>
        <Text
          variant="caption"
          color="muted"
          className={`px-1 ${isUser ? 'text-right' : 'text-left'}`}
        >
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
      <div
        className="w-12 h-12 rounded-[var(--radius-sm)] flex items-center justify-center"
        style={{ background: 'var(--navy)' }}
      >
        <span style={{ color: 'var(--ink-inverse)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-geist-sans)' }}>
          V
        </span>
      </div>
      <Text variant="subheading">Assistente Velta</Text>
      <Text variant="body-sm" color="secondary" className="max-w-xs">
        Envie uma mensagem para começar. O assistente irá solicitar os dados da sua empresa e o pilar de interesse.
      </Text>
    </div>
  )
}

// ─── Main chat page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load history
  useEffect(() => {
    fetch('/api/chat')
      .then((r) => r.json())
      .then(({ messages: history }) => {
        setMessages(history ?? [])
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false))
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || loading) return

    setInput('')
    setLoading(true)

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }
    setStreamingMessage(assistantMsg)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const data = JSON.parse(raw) as { delta?: string; done?: boolean; error?: string }
            if (data.error) throw new Error(data.error)
            if (data.delta) {
              accumulated += data.delta
              setStreamingMessage((prev) => prev ? { ...prev, content: accumulated } : prev)
            }
            if (data.done) break
          } catch {
            // skip malformed chunk
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { ...assistantMsg, content: accumulated },
      ])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      setMessages((prev) => [
        ...prev,
        {
          ...assistantMsg,
          content: `⚠ Erro ao conectar com o assistente: ${errMsg}`,
        },
      ])
    } finally {
      setStreamingMessage(null)
      setLoading(false)
    }
  }, [input, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const allMessages = streamingMessage
    ? [...messages, streamingMessage]
    : messages

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--canvas)' }}>
      {/* Top nav */}
      <header
        className="flex items-center justify-between px-6 h-14 shrink-0 border-b"
        style={{
          background: 'var(--surface-0)',
          borderColor: 'var(--steel-soft)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center"
            style={{ background: 'var(--navy)' }}
          >
            <span style={{ color: 'var(--ink-inverse)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-geist-sans)' }}>V</span>
          </div>
          <Text variant="subheading" as="span" style={{ color: 'var(--navy)' }}>Velta</Text>
          <span style={{ color: 'var(--steel)', fontSize: 16, userSelect: 'none' }}>|</span>
          <Text variant="body-sm" color="tertiary">Assistente</Text>
        </div>

        <div className="flex items-center gap-4">
          {session?.user?.name && (
            <Text variant="body-sm" color="secondary">{session.user.name}</Text>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-sm)] border transition-colors duration-150"
            style={{
              borderColor: 'var(--steel)',
              color: 'var(--ink-secondary)',
              background: 'transparent',
              fontSize: 12,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <LogoutIcon />
            Sair
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <Text variant="caption" color="tertiary">Carregando histórico...</Text>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <EmptyState />
            </div>
          ) : (
            allMessages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={streamingMessage !== null && i === allMessages.length - 1 && msg.role === 'assistant'}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input bar */}
      <footer
        className="shrink-0 border-t px-4 py-3"
        style={{
          background: 'var(--surface-0)',
          borderColor: 'var(--steel-soft)',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border outline-none transition-colors duration-150 disabled:opacity-50"
            style={{
              background: 'var(--control-bg)',
              borderColor: 'var(--control-border)',
              color: 'var(--ink-primary)',
              lineHeight: '1.5',
              maxHeight: 160,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--control-border-focus)'
              e.currentTarget.style.borderLeftWidth = '2px'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--control-border)'
              e.currentTarget.style.borderLeftWidth = '1px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: loading ? 'var(--azure-hover)' : 'var(--navy)',
              color: 'var(--ink-inverse)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim()) e.currentTarget.style.background = 'var(--azure)'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = 'var(--navy)'
            }}
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <Text variant="caption" color="muted" className="text-center">
            Assistente de gestão corporativa · Velta Platform
          </Text>
        </div>
      </footer>
    </div>
  )
}

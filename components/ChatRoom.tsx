'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, ChatMessage } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ChatRoom() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState('')
  const [isUsernameSet, setIsUsernameSet] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Carregar sala padrão
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('name', 'General Chat')
          .single()

        if (error) {
          console.error('Erro ao carregar sala:', error)
        } else if (data) {
          console.log('Sala carregada:', data)
          setRoomId(data.id)
        }
      } catch (err) {
        console.error('Erro:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadRoom()
  }, [])

  // Carregar mensagens e configurar real-time
  useEffect(() => {
    if (!roomId) return

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (error) {
          console.error('Erro ao carregar mensagens:', error)
        } else if (data) {
          console.log('💩 Mensagens carregadas:', data.length)
          setMessages(data)
        }
      } catch (err) {
        console.error('Erro:', err)
      }
    }

    loadMessages()

    // Configurar real-time
    console.log('🔤 Conectando ao realtime para room:', roomId)
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('✅ Nova mensagem em tempo real:', payload.new)
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            // Evitar duplicatas
            if (prev.some(m => m.id === newMsg.id)) {
              return prev
            }
            return [...prev, newMsg]
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do canal:', status)
      })

    return () => {
      console.log('💌"Desconectando do realtime')
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      setIsUsernameSet(true)
      localStorage.setItem('chatUsername', username)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !roomId) return

    console.log('💤 Enviando mensagem:', newMessage)
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        username: username,
        content: newMessage.trim()
      })
      .select()

    if (error) {
      console.error('❌ Erro ao enviar:', error)
      alert('Erro ao enviar mensagem: ' + error.message)
    } else {
      console.log('✅ Mensagem enviada:', data)
      setNewMessage('')
    }
  }

  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername')
    if (savedUsername) {
      setUsername(savedUsername)
      setIsUsernameSet(true)
    }
  }, [])

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1f2937',
        color: 'white',
        fontSize: '20px'
      }}>
        Carregando chat...
      </div>
    )
  }

  if (!isUsernameSet) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '24px',
            color: '#4f46e5'
          }}>
            Bem-vindo ao Chat! 💬
          </h1>
          <form onSubmit={handleSetUsername}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Escolha seu nome de usuário:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu nome..."
              maxLength={20}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #d1d5bb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                marginBottom: '16px',
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Entrar no Chat
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5', margin: 0 }}>
              Live Chat 💬
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Conectado como: <span style={{ fontWeight: '600', color: '#4f46e5' }}>{username}</span>
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('chatUsername')
              setIsUsernameSet(false)
              setUsername('')
            }}
            style={{
              fontSize: '14px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 12px'
            }}
          >
            Trocar nome
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '18px', marginTop: '40px' }}>
            Nenhuma mensagem ainda. Seja o primeiro! 👋
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.username === username
            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  marginBottom: '16px'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: isOwn ? '#4f46e5' : 'white',
                  color: isOwn ? 'white' : '#1f2937',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderBottomRightRadius: isOwn ? '4px' : '16px',
                  borderBottomLeftRadius: isOwn ? '16px' : '4px'
                }}>
                  {!isOwn && (
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#4f46e5', marginBottom: '4px' }}>
                      {message.username}
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: '15px', wordBreak: 'break-word' }}>
                    {message.content}
                  </p>
                  <div style={{
                    fontSize: '11px',
                    marginTop: '4px',
                    color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af'
                  }}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 24px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              maxLength={500}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              style={{
                backgroundColor: newMessage.trim() ? '#4f46e5' : '#9ca3af',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

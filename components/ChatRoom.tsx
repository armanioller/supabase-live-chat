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

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Carregar sala padrão
  useEffect(() => {
    const loadRoom = async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('name', 'General Chat')
        .single()

      if (data) {
        setRoomId(data.id)
      }
      setIsLoading(false)
    }

    loadRoom()
  }, [])

  // Carregar mensagens
  useEffect(() => {
    if (!roomId) return

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        setMessages(data)
      }
    }

    loadMessages()

    // Inscrever-se para mensagens em tempo real
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => {
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

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        username: username,
        content: newMessage.trim()
      })

    if (!error) {
      setNewMessage('')
    }
  }

  // Verificar username salvo
  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername')
    if (savedUsername) {
      setUsername(savedUsername)
      setIsUsernameSet(true)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  if (!isUsernameSet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-indigo-600">
            Bem-vindo ao Chat! 💬
          </h1>
          <form onSubmit={handleSetUsername} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Escolha seu nome de usuário:
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Digite seu nome..."
                maxLength={20}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 transform hover:scale-105"
            >
              Entrar no Chat
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Live Chat 💬</h1>
            <p className="text-sm text-gray-500">Conectado como: <span className="font-semibold text-indigo-600">{username}</span></p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('chatUsername')
              setIsUsernameSet(false)
              setUsername('')
            }}
            className="text-sm text-gray-600 hover:text-indigo-600 transition"
          >
            Trocar nome
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-messages max-w-4xl w-full mx-auto px-4 py-6 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.username === username
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md ${
                  isOwnMessage
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                }`}
              >
                {!isOwnMessage && (
                  <div className="font-semibold text-sm text-indigo-600 mb-1">
                    {message.username}
                  </div>
                )}
                <p className="break-words">{message.content}</p>
                <div
                  className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-indigo-200' : 'text-gray-500'
                  }`}
                >
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Digite sua mensagem..."
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 transform hover:scale-105"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

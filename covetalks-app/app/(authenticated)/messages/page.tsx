'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Search, Paperclip, MoreVertical, Archive, Star, Trash2, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  is_read: boolean
  is_archived: boolean
  is_starred: boolean
  created_at: string
  sender: {
    name: string
    email: string
    member_type: string
  }
  recipient: {
    name: string
    email: string
    member_type: string
  }
}

interface Conversation {
  participant: {
    id: string
    name: string
    email: string
    member_type: string
  }
  lastMessage: Message
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchConversations()
      
      // Subscribe to new messages
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${currentUser.id}`,
          },
          (payload) => {
            handleNewMessage(payload.new as Message)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [currentUser])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.participant.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function fetchCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setCurrentUser(member)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  async function fetchConversations() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (name, email, member_type),
          recipient:recipient_id (name, email, member_type)
        `)
        .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        // Group messages by conversation
        const conversationMap = new Map<string, Conversation>()
        
        data.forEach((message) => {
          const isSender = message.sender_id === currentUser.id
          const participant = isSender ? message.recipient : message.sender
          const participantId = isSender ? message.recipient_id : message.sender_id
          
          if (!conversationMap.has(participantId)) {
            conversationMap.set(participantId, {
              participant: {
                id: participantId,
                name: participant.name,
                email: participant.email,
                member_type: participant.member_type
              },
              lastMessage: message,
              unreadCount: 0
            })
          }
          
          const conv = conversationMap.get(participantId)!
          if (message.created_at > conv.lastMessage.created_at) {
            conv.lastMessage = message
          }
          
          if (!message.is_read && message.recipient_id === currentUser.id) {
            conv.unreadCount++
          }
        })
        
        setConversations(Array.from(conversationMap.values()))
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages(participantId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (name, email, member_type),
          recipient:recipient_id (name, email, member_type)
        `)
        .or(
          `and(sender_id.eq.${currentUser.id},recipient_id.eq.${participantId}),and(sender_id.eq.${participantId},recipient_id.eq.${currentUser.id})`
        )
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data) {
        setMessages(data)
        
        // Mark messages as read
        const unreadMessageIds = data
          .filter(m => m.recipient_id === currentUser.id && !m.is_read)
          .map(m => m.id)
        
        if (unreadMessageIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessageIds)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: selectedConversation.participant.id,
          subject: 'Direct Message',
          content: newMessage,
          is_read: false
        })

      if (error) throw error

      setNewMessage('')
      fetchMessages(selectedConversation.participant.id)
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  function handleNewMessage(message: Message) {
    if (selectedConversation && message.sender_id === selectedConversation.participant.id) {
      setMessages(prev => [...prev, message])
    }
    fetchConversations()
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function archiveConversation(participantId: string) {
    // Implementation for archiving conversation
    console.log('Archive conversation with', participantId)
  }

  async function deleteConversation(participantId: string) {
    // Implementation for deleting conversation
    console.log('Delete conversation with', participantId)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.participant.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.participant.id === conversation.participant.id
                    ? 'bg-foam'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {conversation.participant.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.lastMessage.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-calm mb-1">
                      {conversation.participant.member_type}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.sender_id === currentUser.id && 'You: '}
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 bg-calm text-white text-xs rounded-full px-2 py-1">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Message Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="font-semibold text-gray-900">
                {selectedConversation.participant.name}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedConversation.participant.member_type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Archive className="h-4 w-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Star className="h-4 w-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => {
              const isSender = message.sender_id === currentUser.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isSender
                        ? 'bg-calm text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className={isSender ? 'text-white' : 'text-gray-800'}>
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isSender ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Paperclip className="h-5 w-5 text-gray-600" />
              </button>
              <input
                type="text"
                className="flex-1 form-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="btn btn-primary"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}
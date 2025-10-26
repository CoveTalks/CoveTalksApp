'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Send, 
  Search, 
  Paperclip, 
  MoreVertical, 
  Archive, 
  Star, 
  Trash2, 
  MessageSquare,
  Plus,
  X,
  User,
  Users,
  Check
} from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  message: string  // Changed from 'content' to 'message'
  status: 'unread' | 'read' | 'archived'  // Changed from boolean flags
  read_at?: string | null
  opportunity_id?: string | null
  parent_message_id?: string | null
  thread_id?: string | null
  metadata?: any
  created_at: string
  updated_at?: string
  sender: {
    id?: string
    name: string
    email: string
    member_type: string
  }
  recipient: {
    id?: string
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
    profile_image_url?: string
  }
  lastMessage: Message
  unreadCount: number
}

interface Member {
  id: string
  name: string
  email: string
  member_type: string
  profile_image_url?: string
  title?: string
  location?: string
}

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const newMessageTo = searchParams.get('new')
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [searchingMembers, setSearchingMembers] = useState(false)
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])
  const [selectedNewRecipient, setSelectedNewRecipient] = useState<Member | null>(null)
  const [initialMessage, setInitialMessage] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchConversations()
      
      // If there's a new message recipient in the URL
      if (newMessageTo) {
        handleNewMessageFromUrl(newMessageTo)
      }
      
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
  }, [currentUser, newMessageTo])

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
          sender:sender_id (id, name, email, member_type, profile_image_url),
          recipient:recipient_id (id, name, email, member_type, profile_image_url)
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
                member_type: participant.member_type,
                profile_image_url: participant.profile_image_url
              },
              lastMessage: message,
              unreadCount: 0
            })
          }
          
          const conv = conversationMap.get(participantId)!
          if (message.created_at > conv.lastMessage.created_at) {
            conv.lastMessage = message
          }
          
          // Count unread messages (status is 'unread' instead of is_read boolean)
          if (message.status === 'unread' && message.recipient_id === currentUser.id) {
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
          sender:sender_id (id, name, email, member_type, profile_image_url),
          recipient:recipient_id (id, name, email, member_type, profile_image_url)
        `)
        .or(
          `and(sender_id.eq.${currentUser.id},recipient_id.eq.${participantId}),and(sender_id.eq.${participantId},recipient_id.eq.${currentUser.id})`
        )
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data) {
        setMessages(data)
        
        // Mark messages as read (update status to 'read')
        const unreadMessageIds = data
          .filter(m => m.recipient_id === currentUser.id && m.status === 'unread')
          .map(m => m.id)
        
        if (unreadMessageIds.length > 0) {
          await supabase
            .from('messages')
            .update({ 
              status: 'read',
              read_at: new Date().toISOString()
            })
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
          message: newMessage,  // Changed from 'content' to 'message'
          status: 'unread'
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

  async function startNewConversation() {
    if (!selectedNewRecipient || !initialMessage.trim()) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: selectedNewRecipient.id,
          subject: 'Direct Message',
          message: initialMessage,  // Changed from 'content' to 'message'
          status: 'unread'
        })

      if (error) throw error

      // Close modal and reset
      setShowNewMessageModal(false)
      setSelectedNewRecipient(null)
      setInitialMessage('')
      setMemberSearchTerm('')
      
      // Refresh conversations and select the new one
      await fetchConversations()
      
      // Find and select the new conversation
      const newConv = conversations.find(c => c.participant.id === selectedNewRecipient.id)
      if (newConv) {
        setSelectedConversation(newConv)
      } else {
        // Create a temporary conversation object
        const tempConv: Conversation = {
          participant: selectedNewRecipient,
          lastMessage: {
            id: 'temp',
            sender_id: currentUser.id,
            recipient_id: selectedNewRecipient.id,
            subject: 'Direct Message',
            message: initialMessage,
            status: 'unread',
            created_at: new Date().toISOString(),
            sender: currentUser,
            recipient: selectedNewRecipient
          },
          unreadCount: 0
        }
        setSelectedConversation(tempConv)
        fetchMessages(selectedNewRecipient.id)
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function searchMembers(searchQuery: string) {
    if (!searchQuery.trim()) {
      setAvailableMembers([])
      return
    }

    setSearchingMembers(true)
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email, member_type, profile_image_url, title, location')
        .neq('id', currentUser.id) // Exclude current user
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error

      setAvailableMembers(data || [])
    } catch (error) {
      console.error('Error searching members:', error)
    } finally {
      setSearchingMembers(false)
    }
  }

  async function handleNewMessageFromUrl(recipientId: string) {
    try {
      // Fetch the recipient details
      const { data: recipient, error } = await supabase
        .from('members')
        .select('id, name, email, member_type, profile_image_url')
        .eq('id', recipientId)
        .single()

      if (error) throw error

      if (recipient) {
        // Check if conversation already exists
        const existingConv = conversations.find(c => c.participant.id === recipientId)
        if (existingConv) {
          setSelectedConversation(existingConv)
        } else {
          // Open new message modal with recipient pre-selected
          setSelectedNewRecipient(recipient)
          setShowNewMessageModal(true)
        }
      }
    } catch (error) {
      console.error('Error handling new message from URL:', error)
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

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.message.toLowerCase().includes(searchTerm.toLowerCase())  // Changed from 'content'
  )

  function renderAvatar(participant: any) {
    if (participant.profile_image_url) {
      return (
        <img
          src={participant.profile_image_url}
          alt={participant.name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }
    
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-calm to-deep flex items-center justify-center text-white font-semibold">
        {participant.name?.charAt(0).toUpperCase()}
      </div>
    )
  }

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
        {/* Header with New Message Button */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Message
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No conversations yet</p>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="btn btn-primary btn-sm"
              >
                Start a Conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.participant.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.participant.id === conversation.participant.id
                    ? 'bg-foam'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {renderAvatar(conversation.participant)}
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
                      {conversation.lastMessage.message}  {/* Changed from 'content' */}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-calm text-white text-xs rounded-full px-2 py-1">
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
            <div className="flex items-center gap-3">
              {renderAvatar(selectedConversation.participant)}
              <div>
                <h2 className="font-semibold text-gray-900">
                  {selectedConversation.participant.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedConversation.participant.member_type}
                </p>
              </div>
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
                      {message.message}  {/* Changed from 'content' */}
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
            <p className="text-gray-600 mb-4">Select a conversation to start messaging</p>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="btn btn-primary"
            >
              Start New Conversation
            </button>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">New Message</h2>
                <button
                  onClick={() => {
                    setShowNewMessageModal(false)
                    setSelectedNewRecipient(null)
                    setInitialMessage('')
                    setMemberSearchTerm('')
                    setAvailableMembers([])
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Recipient Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To:
                </label>
                
                {selectedNewRecipient ? (
                  <div className="flex items-center justify-between p-3 bg-foam rounded-lg">
                    <div className="flex items-center gap-3">
                      {renderAvatar(selectedNewRecipient)}
                      <div>
                        <p className="font-semibold text-gray-900">{selectedNewRecipient.name}</p>
                        <p className="text-sm text-gray-600">{selectedNewRecipient.member_type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNewRecipient(null)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        className="form-input pl-10"
                        placeholder="Search for a member by name or email..."
                        value={memberSearchTerm}
                        onChange={(e) => {
                          setMemberSearchTerm(e.target.value)
                          searchMembers(e.target.value)
                        }}
                      />
                    </div>

                    {/* Search Results */}
                    {memberSearchTerm && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                        {searchingMembers ? (
                          <div className="p-4 text-center text-gray-500">
                            Searching...
                          </div>
                        ) : availableMembers.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No members found
                          </div>
                        ) : (
                          availableMembers.map((member) => (
                            <div
                              key={member.id}
                              onClick={() => {
                                setSelectedNewRecipient(member)
                                setMemberSearchTerm('')
                                setAvailableMembers([])
                              }}
                              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-0"
                            >
                              {renderAvatar(member)}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-600">
                                  {member.member_type} {member.location && `• ${member.location}`}
                                </p>
                              </div>
                              {member.member_type === 'Speaker' ? (
                                <User className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Users className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Message Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message:
                </label>
                <textarea
                  className="form-input min-h-[200px]"
                  placeholder="Type your message..."
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowNewMessageModal(false)
                    setSelectedNewRecipient(null)
                    setInitialMessage('')
                    setMemberSearchTerm('')
                    setAvailableMembers([])
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={startNewConversation}
                  disabled={!selectedNewRecipient || !initialMessage.trim() || sending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
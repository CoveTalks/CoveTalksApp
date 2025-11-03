'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
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
  Check,
  Loader2,
  Bell
} from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'archived'
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
    profile_image_url?: string
  }
  recipient: {
    id?: string
    name: string
    email: string
    member_type: string
    profile_image_url?: string
  }
}

interface PresenceState {
  userId: string
  userName: string
  isTyping: boolean
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
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [newMessageAlert, setNewMessageAlert] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const messageChannelRef = useRef<RealtimeChannel | null>(null)
  const typingChannelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchCurrentUser()

    // Cleanup function for subscriptions
    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current)
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchConversations()
      setupRealtimeSubscription()
    }
  }, [currentUser])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.participant.id)
      setupTypingChannel(selectedConversation.participant.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    if (newMessageTo && currentUser) {
      handleNewMessageFromUrl(newMessageTo)
    }
  }, [newMessageTo, currentUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Setup real-time subscription for messages
  async function setupRealtimeSubscription() {
    if (!currentUser) return

    // Remove existing channel if it exists
    if (messageChannelRef.current) {
      await supabase.removeChannel(messageChannelRef.current)
    }

    // Create new channel for real-time messages
    const channel = supabase
      .channel(`messages:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as Message
          console.log('Real-time message event:', newMessage)
          
          // Check if this message involves the current user
          if (newMessage.sender_id === currentUser.id || newMessage.recipient_id === currentUser.id) {
            
            // Fetch full message details with sender and recipient info
            const { data: fullMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:sender_id (id, name, email, member_type, profile_image_url),
                recipient:recipient_id (id, name, email, member_type, profile_image_url)
              `)
              .eq('id', newMessage.id)
              .single()

            if (fullMessage) {
              // Check if this message belongs to the currently selected conversation
              if (selectedConversation) {
                const belongsToCurrentConv = 
                  (fullMessage.sender_id === selectedConversation.participant.id && fullMessage.recipient_id === currentUser.id) ||
                  (fullMessage.recipient_id === selectedConversation.participant.id && fullMessage.sender_id === currentUser.id)

                if (belongsToCurrentConv) {
                  console.log('Adding message to current conversation')
                  
                  // Add to messages array - check for duplicates first
                  setMessages(prev => {
                    const exists = prev.some(m => m.id === fullMessage.id)
                    if (exists) return prev
                    return [...prev, fullMessage].sort((a, b) => 
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                  })

                  // Mark as read if it's an incoming message
                  if (fullMessage.sender_id !== currentUser.id && fullMessage.status === 'unread') {
                    await supabase
                      .from('messages')
                      .update({ 
                        status: 'read',
                        read_at: new Date().toISOString()
                      })
                      .eq('id', fullMessage.id)
                  }

                  // Scroll to bottom
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                } else {
                  // Different conversation - show notification
                  setNewMessageAlert(true)
                  setTimeout(() => setNewMessageAlert(false), 5000)
                  playNotificationSound()
                }
              }

              // Always update conversation list
              await fetchConversations()
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    messageChannelRef.current = channel
  }

  // Setup typing indicator channel
  async function setupTypingChannel(participantId: string) {
    if (!currentUser) return

    // Remove existing typing channel
    if (typingChannelRef.current) {
      await supabase.removeChannel(typingChannelRef.current)
    }

    // Create a unique channel for this conversation
    const channelName = [currentUser.id, participantId].sort().join('-')
    
    const channel = supabase
      .channel(`typing:${channelName}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        const typingUsers = Object.values(state).filter(
          (presence) => presence[0]?.isTyping && presence[0]?.userId !== currentUser.id
        )
        setIsTyping(typingUsers.length > 0)
        if (typingUsers.length > 0) {
          setTypingUser(typingUsers[0][0]?.userName || 'Someone')
        } else {
          setTypingUser(null)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUser.id,
            userName: currentUser.name,
            isTyping: false
          })
        }
      })

    typingChannelRef.current = channel
  }

  // Handle new incoming message
  async function handleNewMessageReceived(message: Message) {
    console.log('New message received:', message) // Debug log
    
    // Fetch sender details
    const { data: sender } = await supabase
      .from('members')
      .select('id, name, email, member_type, profile_image_url')
      .eq('id', message.sender_id)
      .single()

    const messageWithSender = {
      ...message,
      sender: sender || { name: 'Unknown', email: '', member_type: '' },
      recipient: currentUser
    }

    if (selectedConversation && 
        (selectedConversation.participant.id === message.sender_id || 
        selectedConversation.participant.id === message.recipient_id)) {
      
      console.log('Message is for current conversation, updating...') // Debug log
      
      // Add message to current conversation
      setMessages(prev => [...prev, messageWithSender])
      
      // Mark as read if it's an incoming message (not sent by current user)
      if (message.sender_id !== currentUser.id && message.recipient_id === currentUser.id) {
        await supabase
          .from('messages')
          .update({ 
            status: 'read',
            read_at: new Date().toISOString()
          })
          .eq('id', message.id)
      }
    } else {
      // Message is for a different conversation - show notification
      console.log('Message is for different conversation, showing notification') // Debug log
      setNewMessageAlert(true)
      setTimeout(() => setNewMessageAlert(false), 5000)
      
      // Play notification sound (optional)
      playNotificationSound()
    }

    // Update conversations list
    await fetchConversations()
  }

  // Handle new outgoing message
  async function handleNewMessageSent(message: Message) {
    
    // Only update if this is the current conversation
    if (selectedConversation && 
        (selectedConversation.participant.id === message.recipient_id || 
        selectedConversation.participant.id === message.sender_id)) {
      
      const { data: recipient } = await supabase
        .from('members')
        .select('id, name, email, member_type, profile_image_url')
        .eq('id', message.recipient_id)
        .single()

      const messageWithDetails = {
        ...message,
        sender: currentUser,
        recipient: recipient || { name: 'Unknown', email: '', member_type: '' }
      }

      // Check if this message already exists (to prevent duplicates)
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id)
        if (exists) {
          return prev
        }
        return [...prev, messageWithDetails]
      })
    }

    // Update conversations list
    await fetchConversations()
  }

  // Handle message updates (like read status)
  function handleMessageUpdate(updatedMessage: Message) {
    setMessages(prev => prev.map(msg => 
      msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
    ))

    // Update unread count in conversations
    if (updatedMessage.status === 'read') {
      setConversations(prev => prev.map(conv => {
        if (conv.participant.id === updatedMessage.sender_id || 
            conv.participant.id === updatedMessage.recipient_id) {
          return {
            ...conv,
            unreadCount: Math.max(0, conv.unreadCount - 1)
          }
        }
        return conv
      }))
    }
  }

  // Handle typing indicator
  async function handleTyping(isTyping: boolean) {
    if (!typingChannelRef.current || !currentUser) return

    await typingChannelRef.current.track({
      userId: currentUser.id,
      userName: currentUser.name,
      isTyping: isTyping
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false)
      }, 3000)
    }
  }

  // Play notification sound
  function playNotificationSound() {
    try {
      const audio = new Audio('/notification.mp3') // You'll need to add this file
      audio.volume = 0.3
      audio.play().catch(e => console.log('Could not play notification sound'))
    } catch (e) {
      console.log('Notification sound not available')
    }
  }

  async function fetchCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('members')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setCurrentUser(data)
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  async function fetchConversations() {
    try {
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (id, name, email, member_type, profile_image_url),
          recipient:recipient_id (id, name, email, member_type, profile_image_url)
        `)
        .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (allMessages) {
        const conversationMap = new Map<string, Conversation>()
        
        allMessages.forEach((message) => {
          const participantId = message.sender_id === currentUser.id 
            ? message.recipient_id 
            : message.sender_id
          
          const participant = message.sender_id === currentUser.id
            ? message.recipient
            : message.sender
          
          if (!conversationMap.has(participantId)) {
            conversationMap.set(participantId, {
              participant,
              lastMessage: message,
              unreadCount: 0
            })
          }
          
          const conv = conversationMap.get(participantId)!
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
        
        // Mark messages as read
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
    
    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`
    
    // Create the optimistic message object
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: selectedConversation.participant.id,
      subject: 'Direct Message',
      message: newMessage,
      status: 'unread',
      created_at: new Date().toISOString(),
      sender: currentUser,
      recipient: selectedConversation.participant
    }
    
    // Add message immediately to UI (optimistic update)
    setMessages(prev => [...prev, optimisticMessage])
    
    // Clear input immediately for better UX
    const messageToSend = newMessage
    setNewMessage('')
    
    // Scroll to bottom immediately
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    
    try {
      // Send to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: selectedConversation.participant.id,
          subject: 'Direct Message',
          message: messageToSend,
          status: 'unread'
        })
        .select()
        .single()

      if (error) throw error

      // Replace the temporary message with the real one from database
      if (data) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...data, sender: currentUser, recipient: selectedConversation.participant }
            : msg
        ))
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      
      // Restore the message in input so user can try again
      setNewMessage(messageToSend)
      
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
      handleTyping(false)
    }
  }

  // Handle message input changes
  function handleMessageInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNewMessage(e.target.value)
    
    // Update typing indicator
    if (e.target.value.trim()) {
      handleTyping(true)
    } else {
      handleTyping(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleNewMessageFromUrl(recipientId: string) {
    // Fetch recipient details and start conversation
    const { data: recipient } = await supabase
      .from('members')
      .select('*')
      .eq('id', recipientId)
      .single()

    if (recipient) {
      setSelectedNewRecipient(recipient)
      setShowNewMessageModal(true)
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
          message: initialMessage,
          status: 'unread'
        })

      if (error) throw error

      // Close modal and reset
      setShowNewMessageModal(false)
      setSelectedNewRecipient(null)
      setInitialMessage('')
      setMemberSearchTerm('')
      
      // The new conversation will appear via real-time subscription
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
        .neq('id', currentUser.id)
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

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* New Message Alert */}
      {newMessageAlert && (
        <div className="fixed top-20 right-4 bg-calm text-white px-4 py-3 rounded-lg shadow-lg flex items-center animate-slide-in-right z-50">
          <Bell className="h-5 w-5 mr-2" />
          <span>New message received!</span>
        </div>
      )}

      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="p-2 bg-calm text-white rounded-lg hover:bg-deep transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-calm" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.participant.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedConversation?.participant.id === conversation.participant.id
                    ? 'bg-blue-50'
                    : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {conversation.participant.profile_image_url ? (
                      <img
                        src={conversation.participant.profile_image_url}
                        alt={conversation.participant.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {conversation.participant.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.sender_id === currentUser?.id && (
                        <span className="text-gray-500">You: </span>
                      )}
                      {conversation.lastMessage.message}
                    </p>
                    
                    {conversation.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-1 bg-calm text-white text-xs rounded-full">
                        {conversation.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Message Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedConversation.participant.profile_image_url ? (
                    <img
                      src={selectedConversation.participant.profile_image_url}
                      alt={selectedConversation.participant.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedConversation.participant.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.participant.member_type}
                    </p>
                  </div>
                </div>
                
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="mt-2 text-sm text-gray-500 italic">
                  {typingUser} is typing...
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUser?.id
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-lg ${
                      message.sender_id === currentUser?.id
                        ? 'bg-calm text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.message}</p>
                    <div className="flex items-center justify-end mt-1 space-x-2">
                      <span className={`text-xs ${
                        message.sender_id === currentUser?.id ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </span>
                      {message.sender_id === currentUser?.id && (
                        <span>
                          {message.status === 'read' ? (
                            <Check className="h-3 w-3 text-white/70" />
                          ) : (
                            <Check className="h-3 w-3 text-white/50" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-end space-x-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </button>
                
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={handleMessageInputChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-calm focus:border-transparent"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-calm text-white rounded-lg hover:bg-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">New Message</h3>
                <button
                  onClick={() => {
                    setShowNewMessageModal(false)
                    setSelectedNewRecipient(null)
                    setInitialMessage('')
                    setMemberSearchTerm('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Member Search */}
              {!selectedNewRecipient ? (
                <>
                  <input
                    type="text"
                    placeholder="Search for a member..."
                    value={memberSearchTerm}
                    onChange={(e) => {
                      setMemberSearchTerm(e.target.value)
                      searchMembers(e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent mb-4"
                    autoFocus
                  />

                  {searchingMembers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-calm" />
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {availableMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedNewRecipient(member)}
                          className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                        >
                          {member.profile_image_url ? (
                            <img
                              src={member.profile_image_url}
                              alt={member.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.member_type}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Selected Recipient */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedNewRecipient.profile_image_url ? (
                        <img
                          src={selectedNewRecipient.profile_image_url}
                          alt={selectedNewRecipient.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{selectedNewRecipient.name}</p>
                        <p className="text-sm text-gray-500">{selectedNewRecipient.member_type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNewRecipient(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Message Input */}
                  <textarea
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-calm focus:border-transparent"
                    autoFocus
                  />

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setShowNewMessageModal(false)
                        setSelectedNewRecipient(null)
                        setInitialMessage('')
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startNewConversation}
                      disabled={!initialMessage.trim() || sending}
                      className="flex-1 px-4 py-2 bg-calm text-white rounded-lg hover:bg-deep disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </span>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to format time
function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}
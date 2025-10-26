'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Bell, Shield, CreditCard, Globe, Mail, 
  Save, Camera, Check, X, Eye, EyeOff 
} from 'lucide-react'

interface UserSettings {
  id: string
  email: string
  name: string
  phone: string
  bio: string
  member_type: 'Speaker' | 'Organization'
  notifications: {
    email_opportunities: boolean
    email_applications: boolean
    email_messages: boolean
    email_newsletter: boolean
  }
  privacy: {
    profile_visibility: 'public' | 'private' | 'members'
    show_email: boolean
    show_phone: boolean
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setSettings({
        id: member.id,
        email: member.email,
        name: member.name,
        phone: member.phone || '',
        bio: member.bio || '',
        member_type: member.member_type,
        notifications: member.notifications || {
          email_opportunities: true,
          email_applications: true,
          email_messages: true,
          email_newsletter: false
        },
        privacy: member.privacy || {
          profile_visibility: 'public',
          show_email: false,
          show_phone: false
        }
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: settings.name,
          phone: settings.phone,
          bio: settings.bio,
          notifications: settings.notifications,
          privacy: settings.privacy,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function updatePassword() {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: 'Failed to update password. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load settings</p>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-calm text-white'
                        : 'text-gray-600 hover:bg-foam'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:w-3/4">
          {/* Success/Error Messages */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p>{message.text}</p>
                <button
                  onClick={() => setMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-deep">Profile Information</h2>
                
                <div className="space-y-4">
                  {/* Profile Photo */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-foam flex items-center justify-center">
                        <span className="text-2xl font-bold text-deep">
                          {settings.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <button className="absolute bottom-0 right-0 bg-calm text-white p-2 rounded-full hover:bg-deep">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{settings.name}</p>
                      <p className="text-sm text-gray-600">{settings.member_type}</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={settings.email}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email address cannot be changed
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {/* Bio */}
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={settings.bio}
                      onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Brief description for your public profile
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-deep">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">New Opportunities</p>
                      <p className="text-sm text-gray-600">
                        Get notified when new speaking opportunities match your profile
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications.email_opportunities}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email_opportunities: e.target.checked }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Application Updates</p>
                      <p className="text-sm text-gray-600">
                        Receive updates on your application status
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications.email_applications}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email_applications: e.target.checked }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">New Messages</p>
                      <p className="text-sm text-gray-600">
                        Get notified when you receive new messages
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications.email_messages}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email_messages: e.target.checked }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Newsletter</p>
                      <p className="text-sm text-gray-600">
                        Receive our monthly newsletter with tips and updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications.email_newsletter}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email_newsletter: e.target.checked }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-deep">Privacy Settings</h2>
                
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Profile Visibility</label>
                    <select
                      className="form-select"
                      value={settings.privacy.profile_visibility}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, profile_visibility: e.target.value as any }
                      })}
                    >
                      <option value="public">Public - Anyone can view your profile</option>
                      <option value="members">Members Only - Only registered users can view</option>
                      <option value="private">Private - Only you can view your profile</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Show Email Address</p>
                      <p className="text-sm text-gray-600">
                        Display your email address on your public profile
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.privacy.show_email}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, show_email: e.target.checked }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Show Phone Number</p>
                      <p className="text-sm text-gray-600">
                        Display your phone number on your public profile
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.privacy.show_phone}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, show_phone: e.target.checked }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    Save Privacy Settings
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-deep">Security Settings</h2>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Change Password</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input pr-10"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={updatePassword}
                    disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                    className="btn btn-primary"
                  >
                    Update Password
                  </button>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn btn-outline">
                    Enable Two-Factor Authentication
                  </button>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-deep">Billing & Subscription</h2>
                
                <div className="p-6 bg-foam rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">Current Plan</p>
                      <p className="text-2xl font-bold text-calm">Free Plan</p>
                    </div>
                    <button className="btn btn-primary">
                      Upgrade Plan
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Access to basic features</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>5 applications per month</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Basic profile visibility</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    No payment method on file
                  </p>
                  <button className="btn btn-outline">
                    Add Payment Method
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Billing History</h3>
                  <p className="text-sm text-gray-600">
                    No billing history available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
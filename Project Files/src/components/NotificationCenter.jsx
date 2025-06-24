"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "../services/supabase"

const NotificationCenter = ({ userId }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Use refs to store subscription and prevent multiple subscriptions
  const subscriptionRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (userId) {
      loadNotifications()
      setupNotificationSubscription()
    }

    // Cleanup function
    return () => {
      cleanupSubscription()
    }
  }, [userId])

  const cleanupSubscription = () => {
    if (subscriptionRef.current) {
      console.log("Cleaning up notification subscription")
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
      channelRef.current = null
    }
  }

  const setupNotificationSubscription = () => {
    // Clean up any existing subscription first
    cleanupSubscription()

    if (!userId) return

    try {
      // Create a unique channel name to avoid conflicts
      const channelName = `notifications_${userId}_${Date.now()}`

      console.log("Setting up notification subscription for user:", userId)

      const channel = supabase.channel(channelName)

      const subscription = channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Notification update received:", payload)
            handleNotificationUpdate(payload)
          },
        )
        .subscribe((status) => {
          console.log("Notification subscription status:", status)
        })

      // Store references
      subscriptionRef.current = channel
      channelRef.current = channel
    } catch (error) {
      console.error("Failed to setup notification subscription:", error)
    }
  }

  const handleNotificationUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case "INSERT":
        setNotifications((prev) => [newRecord, ...prev])
        setUnreadCount((prev) => prev + 1)
        // Show browser notification if permission granted
        showBrowserNotification(newRecord)
        break

      case "UPDATE":
        setNotifications((prev) => prev.map((notif) => (notif.id === newRecord.id ? newRecord : notif)))
        if (newRecord.read && !oldRecord?.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
        break

      case "DELETE":
        setNotifications((prev) => prev.filter((notif) => notif.id !== oldRecord.id))
        if (!oldRecord?.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
        break

      default:
        break
    }
  }

  const loadNotifications = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter((n) => !n.read).length || 0)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) throw error
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("read", false)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const showBrowserNotification = (notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
      })
    }
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission()
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
      case "error":
        return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
      default:
        return <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Don't render if no userId
  if (!userId) {
    return null
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium min-w-[16px] sm:min-w-[20px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown - Fully Responsive */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" onClick={() => setIsOpen(false)} />

          {/* Notification Panel */}
          <div className="fixed inset-x-4 top-20 bottom-4 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 md:w-96 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gray-50 sm:bg-white flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 text-sm sm:text-base mt-3">Loading notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${!notification.read ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm sm:text-base font-medium text-gray-900 leading-tight">
                              {notification.title}
                            </h4>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded flex-shrink-0"
                              aria-label="Delete notification"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center">
                  <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No notifications yet</h4>
                  <p className="text-sm sm:text-base text-gray-500">
                    We'll notify you when something important happens
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter

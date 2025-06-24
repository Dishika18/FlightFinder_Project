"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plane,
  LogOut,
  Calendar,
  X,
  RefreshCw,
  AlertCircle,
  Menu,
  MapPin,
  Users,
  Star,
  TrendingUp,
  Search,
  ArrowRight,
  CheckCircle,
  Globe,
} from "lucide-react"
import {
  getCurrentUser,
  getUserProfile,
  signOut,
  searchFlights,
  getUserBookings,
  cancelBooking,
  subscribeToFlights,
  subscribeToBookings,
  unsubscribeFromChannel,
} from "../services/supabase"
import FlightSearch from "../components/FlightSearch"
import FlightCard from "../components/FlightCard"
import NotificationCenter from "../components/NotificationCenter"
import Toast from "../components/Toast"

const Home = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [flights, setFlights] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState(null)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })
  const [refreshing, setRefreshing] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigate = useNavigate()

  // Use refs to store subscriptions and prevent multiple subscriptions
  const flightSubscriptionRef = useRef(null)
  const bookingSubscriptionRef = useRef(null)

  useEffect(() => {
    checkAuth()
    return () => {
      // Cleanup subscriptions on unmount
      cleanupSubscriptions()
    }
  }, [])

  const cleanupSubscriptions = () => {
    if (flightSubscriptionRef.current) {
      console.log("Cleaning up flight subscription")
      unsubscribeFromChannel(flightSubscriptionRef.current)
      flightSubscriptionRef.current = null
    }
    if (bookingSubscriptionRef.current) {
      console.log("Cleaning up booking subscription")
      unsubscribeFromChannel(bookingSubscriptionRef.current)
      bookingSubscriptionRef.current = null
    }
  }

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        navigate("/")
        return
      }

      const { data: userProfile } = await getUserProfile(currentUser.id)
      if (!userProfile || userProfile.role !== "user") {
        navigate("/")
        return
      }

      setUser(currentUser)
      setProfile(userProfile)

      // Load initial data
      await Promise.all([loadAllFlights(), loadBookings(currentUser.id)])

      // Set up real-time subscriptions
      setupRealTimeSubscriptions(currentUser.id)
    } catch (error) {
      showToast("Failed to load user data", "error")
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeSubscriptions = (userId) => {
    // Clean up any existing subscriptions first
    cleanupSubscriptions()

    try {
      // Subscribe to flight changes
      console.log("Setting up flight subscription")
      const flightSub = subscribeToFlights((payload) => {
        console.log("Flight update received:", payload)
        handleFlightUpdate(payload)
      })
      flightSubscriptionRef.current = flightSub

      // Subscribe to booking changes
      console.log("Setting up booking subscription")
      const bookingSub = subscribeToBookings((payload) => {
        console.log("Booking update received:", payload)
        handleBookingUpdate(payload, userId)
      })
      bookingSubscriptionRef.current = bookingSub
    } catch (error) {
      console.error("Failed to setup subscriptions:", error)
    }
  }

  const handleFlightUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setFlights((prevFlights) => {
      switch (eventType) {
        case "INSERT":
          if (newRecord.status === "active") {
            return [...prevFlights, newRecord]
          }
          return prevFlights

        case "UPDATE":
          return prevFlights.map((flight) => (flight.id === newRecord.id ? newRecord : flight))

        case "DELETE":
          return prevFlights.filter((flight) => flight.id !== oldRecord.id)

        default:
          return prevFlights
      }
    })

    // Update bookings if flight status changed
    if (eventType === "UPDATE" && newRecord.status !== oldRecord?.status) {
      loadBookings(user?.id)

      if (newRecord.status === "cancelled") {
        showToast(`Flight ${newRecord.flight_number} has been cancelled`, "error")
      } else if (newRecord.status === "delayed") {
        showToast(`Flight ${newRecord.flight_number} has been delayed`, "warning")
      }
    }
  }

  const handleBookingUpdate = (payload, userId) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Refresh flights to update seat availability
    loadAllFlights()

    // Refresh user's bookings if it affects them
    if (newRecord?.user_id === userId || oldRecord?.user_id === userId) {
      loadBookings(userId)
    }
  }

  const loadAllFlights = async () => {
    try {
      const { data, error } = await searchFlights("all", "all")
      if (!error && data) {
        setFlights(data)
      }
    } catch (error) {
      console.error("Failed to load flights:", error)
    }
  }

  const loadBookings = async (userId) => {
    if (!userId) return
    try {
      const { data, error } = await getUserBookings(userId)
      if (!error && data) {
        setBookings(data)
      }
    } catch (error) {
      console.error("Failed to load bookings:", error)
    }
  }

  const handleSearch = useCallback(async (fromCity, toCity) => {
    setSearchLoading(true)
    try {
      const { data, error } = await searchFlights(fromCity, toCity)
      if (!error && data) {
        setFlights(data)
      } else {
        setFlights([])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setFlights([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const handleSignOut = async () => {
    // Cleanup subscriptions before signing out
    cleanupSubscriptions()
    await signOut()

    // Show logout toast
    showToast("You've been logged out", "info")

    // Small delay to show toast before navigation
    setTimeout(() => {
      navigate("/")
    }, 1000)
  }

  const handleCancelBooking = async (bookingId) => {
    setCancellingBooking(bookingId)
    try {
      const { error } = await cancelBooking(bookingId)
      if (error) throw error

      showToast("Booking cancelled successfully", "success")
      // Real-time subscription will handle the updates
    } catch (error) {
      showToast(error.message || "Failed to cancel booking", "error")
    } finally {
      setCancellingBooking(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([loadAllFlights(), loadBookings(user?.id)])
      showToast("Data refreshed successfully", "success")
    } catch (error) {
      showToast("Failed to refresh data", "error")
    } finally {
      setRefreshing(false)
    }
  }

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getFlightStatusBadge = (status) => {
    if (!status) return null

    const statusConfig = {
      active: { label: "On Time", class: "bg-green-100 text-green-800 border-green-200" },
      delayed: { label: "Delayed", class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      cancelled: { label: "Cancelled", class: "bg-red-100 text-red-800 border-red-200" },
      completed: { label: "Completed", class: "bg-gray-100 text-gray-800 border-gray-200" },
    }

    const config = statusConfig[status] || statusConfig.active

    return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.class}`}>{config.label}</span>
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case "delayed":
        return "⚠️ This flight has been delayed. Please check for updates."
      case "cancelled":
        return "❌ This flight has been cancelled. Please contact support."
      default:
        return null
    }
  }

  // Filter out cancelled bookings and bookings with null flights
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled" && booking.flights !== null)

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
  //       <div className="text-center">
  //         <div className="relative mb-8">
  //           <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
  //             <Plane className="h-10 w-10 text-white animate-pulse" />
  //           </div>
  //           <div className="absolute inset-0 animate-spin">
  //             <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
  //           </div>
  //         </div>
  //         <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Aboard</h2>
  //         <p className="text-gray-600 text-lg font-medium">Preparing your flight dashboard...</p>
  //       </div>
  //     </div>
  //   )
  // }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Preparing your flight dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-3">
            {/* Logo */}
            <div className="flex items-center group">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 lg:p-3 rounded-2xl mr-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Plane className="h-6 w-6 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FlightFinder
                </span>
                <div className="text-xs text-gray-500 font-medium hidden sm:block">Your Journey Dashboard</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                <NotificationCenter userId={user?.id} />
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                  title="Refresh data"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-300`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    Welcome back, {profile?.email?.split("@")[0] || "Traveler"}
                  </div>
                  <div className="text-xs text-gray-500">Ready for your next adventure?</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                >
                  <LogOut className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              <NotificationCenter userId={user?.id} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 space-y-2 bg-white/95 backdrop-blur-sm">
              <div className="px-3 py-2">
                <div className="text-sm font-semibold text-gray-900">
                  Welcome, {profile?.email?.split("@")[0] || "Traveler"}
                </div>
                <div className="text-xs text-gray-500">Ready for your next adventure?</div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center w-full px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Data
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl text-white p-6 lg:p-12 mb-8 lg:mb-12 shadow-2xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-3xl lg:text-5xl font-bold mb-3 lg:mb-4">
                  Discover Your Next
                  <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    Adventure
                  </span>
                </h1>
                <p className="text-blue-100 text-lg lg:text-xl max-w-2xl leading-relaxed">
                  Search through thousands of flights, compare prices, and book your perfect journey with real-time
                  updates and instant confirmations.
                </p>
              </div>

              {/* <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4 text-blue-100">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">500+ Destinations</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">2M+ Travelers</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-300" />
                  <Star className="h-4 w-4 text-yellow-300" />
                  <Star className="h-4 w-4 text-yellow-300" />
                  <Star className="h-4 w-4 text-yellow-300" />
                  <Star className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm text-blue-100 ml-2">4.9/5 Rating</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Flight Search */}
        <div className="mb-8 lg:mb-12">
          <FlightSearch onSearch={handleSearch} loading={searchLoading} />
        </div>

        {/* Search Results */}
        <div className="mb-12 lg:mb-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Available Flights</h2>
              <p className="text-gray-600">Find the perfect flight for your journey</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm border">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>
                  {flights.length} flight{flights.length !== 1 ? "s" : ""} found
                </span>
              </div>
            </div>
          </div>

          {searchLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 lg:p-8 animate-pulse border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-gray-200 p-4 rounded-2xl mr-4 h-16 w-16"></div>
                      <div>
                        <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-24 bg-gray-200 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : flights.length > 0 ? (
            <div className="grid gap-6">
              {flights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 lg:py-24 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Plane className="h-12 w-12 text-gray-400" />
                </div>
                {/* <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Search className="h-4 w-4 text-blue-600" />
                </div> */}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No flights found</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                Try adjusting your search criteria or explore different destinations
              </p>
              <button
                onClick={() => handleSearch("all", "all")}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Globe className="h-5 w-5 mr-2" />
                Show All Flights
              </button>
            </div>
          )}
        </div>

        {/* My Bookings */}
        <div>
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">My Bookings</h2>
              <p className="text-gray-600">Manage your upcoming flights and travel plans</p>
            </div>
            {activeBookings.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm border">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>
                  {activeBookings.length} active booking{activeBookings.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {activeBookings.length > 0 ? (
            <div className="grid gap-6">
              {activeBookings.map((booking) => {
                const flight = booking.flights
                const statusMessage = getStatusMessage(flight?.status)

                return (
                  <div
                    key={booking.id}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 lg:p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300 group"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-6">
                          <div
                            className={`p-4 rounded-2xl mr-4 shadow-lg transition-all duration-300 group-hover:scale-110 ${flight?.status === "active"
                                ? "bg-gradient-to-br from-green-400 to-emerald-500"
                                : flight?.status === "delayed"
                                  ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                  : flight?.status === "cancelled"
                                    ? "bg-gradient-to-br from-red-400 to-pink-500"
                                    : "bg-gradient-to-br from-gray-400 to-gray-500"
                              }`}
                          >
                            <Plane className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                              <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
                                {flight?.flight_number || "Flight N/A"}
                              </h3>
                              {getFlightStatusBadge(flight?.status)}
                            </div>
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span className="font-medium">
                                {flight?.source?.split(" ")[0] || "Unknown"} →{" "}
                                {flight?.destination?.split(" ")[0] || "Unknown"}
                              </span>
                            </div>
                            {statusMessage && (
                              <div className="flex items-start mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                                <AlertCircle className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-orange-700">{statusMessage}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                            <Calendar className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Departure</div>
                              <div className="text-sm font-bold text-gray-900">
                                {formatDateTime(flight?.departure_time)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                            <Plane className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-purple-600 font-medium uppercase tracking-wide">Seat</div>
                              <div className="text-sm font-bold text-gray-900">{booking.seat_number || "N/A"}</div>
                            </div>
                          </div>
                          <div className="flex items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                            <CheckCircle className="h-5 w-5 mr-3 text-green-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Status</div>
                              <div className="text-sm font-bold text-gray-900">
                                {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || "Unknown"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="xl:ml-8 mt-6 xl:mt-0">
                        {flight?.status !== "cancelled" ? (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingBooking === booking.id}
                            className="flex items-center justify-center w-full xl:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {cancellingBooking === booking.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel Booking
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="text-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-200">
                            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                            <p className="text-red-700 font-semibold text-sm">Flight Cancelled</p>
                            <p className="text-red-600 text-xs">Contact support for assistance</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 lg:py-24 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="h-12 w-12 text-blue-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No active bookings</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                Ready to plan your next adventure? Search and book flights above to see your reservations here.
              </p>
              <button
                onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plane className="h-5 w-5 mr-2" />
                Book Your First Flight
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}

export default Home

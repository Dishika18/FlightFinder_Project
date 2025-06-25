"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plane,
  Users,
  LogOut,
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  Menu,
  X,
  BarChart3,
  TrendingUp,
} from "lucide-react"
import {
  getCurrentUser,
  getUserProfile,
  signOut,
  getAllUsers,
  getAllFlightsAdmin,
  createFlight,
  updateFlight,
  deleteFlight,
  getAdminStats,
} from "../services/supabase"
import Toast from "../components/Toast"
import ConfirmModal from "../components/ConfirmModal"
import FlightFormModal from "../components/FlightFormModal"
import FlightBookings from "../components/FlightBookings"
import FlightStatusSelector from "../components/FlightStatusSelector"
import { updateFlightStatus } from "../services/supabase"
import { formatPrice } from "../utils/cities"
import { FaRupeeSign } from 'react-icons/fa'

const AdminDashboard = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [flights, setFlights] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [flightSearchTerm, setFlightSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [showFlightModal, setShowFlightModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [flightToDelete, setFlightToDelete] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  const [expandedFlights, setExpandedFlights] = useState(new Set())
  const [statusUpdating, setStatusUpdating] = useState(new Set())

  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      navigate("/")
      return
    }

    const { data: userProfile } = await getUserProfile(currentUser.id)
    if (!userProfile || userProfile.role !== "admin") {
      navigate("/")
      return
    }

    setUser(currentUser)
    setProfile(userProfile)

    await loadDashboardData()
    setLoading(false)
  }

  const loadDashboardData = async () => {
    try {
      const [usersResult, flightsResult, statsResult] = await Promise.all([
        getAllUsers(),
        getAllFlightsAdmin(),
        getAdminStats(),
      ])

      if (usersResult.data) setUsers(usersResult.data)
      if (flightsResult.data) setFlights(flightsResult.data)
      if (statsResult.data) setStats(statsResult.data)
    } catch (error) {
      showToast("Failed to load dashboard data", "error")
    }
  }

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
  }

  const handleSignOut = async () => {
    await signOut()

    showToast("You've been logged out", "info")

    setTimeout(() => {
      navigate("/")
    }, 1000)
  }

  const handleAddFlight = () => {
    setSelectedFlight(null)
    setShowFlightModal(true)
    setMobileMenuOpen(false)
  }

  const handleEditFlight = (flight) => {
    setSelectedFlight(flight)
    setShowFlightModal(true)
  }

  const handleDeleteFlight = (flight) => {
    setFlightToDelete(flight)
    setShowConfirmModal(true)
  }

  const handleFlightSubmit = async (flightData) => {
    setModalLoading(true)
    try {
      if (selectedFlight) {
        const { error } = await updateFlight(selectedFlight.id, flightData)
        if (error) throw error
        showToast("Flight updated successfully")
      } else {
        const { error } = await createFlight(flightData)
        if (error) throw error
        showToast("Flight added successfully")
      }

      setShowFlightModal(false)
      await loadDashboardData()
    } catch (error) {
      showToast(error.message || "Failed to save flight", "error")
    } finally {
      setModalLoading(false)
    }
  }

  const confirmDeleteFlight = async () => {
    try {
      const { error } = await deleteFlight(flightToDelete.id)
      if (error) throw error

      showToast("Flight deleted successfully")
      setShowConfirmModal(false)
      setFlightToDelete(null)
      await loadDashboardData()
    } catch (error) {
      showToast(error.message || "Failed to delete flight", "error")
    }
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleStatusChange = async (flightId, newStatus) => {
    setStatusUpdating((prev) => new Set([...prev, flightId]))
    try {
      const { error } = await updateFlightStatus(flightId, newStatus)
      if (error) throw error

      showToast(`Flight status updated to ${newStatus}`)
      await loadDashboardData()
    } catch (error) {
      showToast(error.message || "Failed to update flight status", "error")
    } finally {
      setStatusUpdating((prev) => {
        const newSet = new Set(prev)
        newSet.delete(flightId)
        return newSet
      })
    }
  }

  const toggleFlightExpansion = (flightId) => {
    setExpandedFlights((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(flightId)) {
        newSet.delete(flightId)
      } else {
        newSet.add(flightId)
      }
      return newSet
    })
  }

  const filteredUsers = users.filter((user) => user.email.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredFlights = flights.filter((flight) => {
    const matchesSearch =
      flight.flight_number.toLowerCase().includes(flightSearchTerm.toLowerCase()) ||
      flight.source.toLowerCase().includes(flightSearchTerm.toLowerCase()) ||
      flight.destination.toLowerCase().includes(flightSearchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || flight.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Header - Responsive */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-xl mr-3 shadow-lg">
                <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">FlightFinder</span>
                <div className="flex items-center">
                  <Shield className="h-3 w-3 text-purple-600 mr-1" />
                  <span className="text-xs text-purple-600 font-medium">Admin</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={handleAddFlight}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Flight
              </button>
              <div className="flex items-center text-gray-600">
                <span className="font-medium">{profile?.email?.split("@")[0] || "Admin"}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 space-y-2">
              <button
                onClick={handleAddFlight}
                className="flex items-center w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Flight
              </button>
              <div className="px-3 py-2 text-sm text-gray-600">Admin: {profile?.email?.split("@")[0] || "User"}</div>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl text-white p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">Admin Dashboard</h1>
              <p className="text-purple-100 text-base sm:text-lg lg:text-xl">
                Manage flights, users, and system operations
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="flex items-center space-x-2 text-purple-100">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm font-medium">Real-time Analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards*/}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-sm font-medium mb-1">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalUsers?.toLocaleString() || 0}
                </p>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                  <span className="text-xs text-green-600 font-medium">+12%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg flex-shrink-0 ml-3">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-sm font-medium mb-1">Active Flights</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.activeFlights || 0}</p>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                  <span className="text-xs text-green-600 font-medium">+8%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg flex-shrink-0 ml-3">
                <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-sm font-medium mb-1">Today's Bookings</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.todayBookings || 0}</p>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                  <span className="text-xs text-green-600 font-medium">+24%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg flex-shrink-0 ml-3">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-sm font-medium mb-1">Total Revenue</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 break-all">
                  {formatPrice(stats.totalRevenue || 0)}
                </p>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                  <span className="text-xs text-green-600 font-medium">+18%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl shadow-lg flex-shrink-0 ml-3">
                <FaRupeeSign className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
          {/* User Management */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center min-w-0 flex-1">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl mr-3 shadow-lg flex-shrink-0">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">User Management</h2>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm text-sm"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{user.email}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Role: {user.role}</p>
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                      }`}
                  >
                    {user.role}
                  </span>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </div>

          {/* Flight Management */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <div className="flex items-center min-w-0 flex-1">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-xl mr-3 shadow-lg flex-shrink-0">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Flight Management</h2>
              </div>
              <button
                onClick={handleAddFlight}
                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                Add Flight
              </button>
            </div>

            <div className="mb-4 space-y-3 sm:space-y-0 sm:flex sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search flights..."
                  value={flightSearchTerm}
                  onChange={(e) => setFlightSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-8 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm appearance-none cursor-pointer text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto">
              {filteredFlights.map((flight) => (
                <div key={flight.id} className="p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                    <div className="flex items-center flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mr-2 sm:mr-3 truncate text-sm sm:text-base">{flight.flight_number}</h3>
                      <div className="flex-shrink-0">
                        <FlightStatusSelector
                          currentStatus={flight.status}
                          onStatusChange={(newStatus) => handleStatusChange(flight.id, newStatus)}
                          disabled={statusUpdating.has(flight.id)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-auto">
                      <button
                        onClick={() => handleEditFlight(flight)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit flight"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFlight(flight)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete flight"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {flight.source?.split(" ")[0]} → {flight.destination?.split(" ")[0]}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{formatDateTime(flight.departure_time)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {flight.available_seats}/{flight.total_seats} seats
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">{formatPrice(flight.price)}</span>
                    </div>
                  </div>

                  <FlightBookings
                    flight={flight}
                    isExpanded={expandedFlights.has(flight.id)}
                    onToggle={() => toggleFlightExpansion(flight.id)}
                  />
                </div>
              ))}

              {filteredFlights.length === 0 && (
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No flights found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <FlightFormModal
        isOpen={showFlightModal}
        onClose={() => setShowFlightModal(false)}
        onSubmit={handleFlightSubmit}
        flight={selectedFlight}
        loading={modalLoading}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDeleteFlight}
        title="Delete Flight"
        message={`Are you sure you want to delete flight ${flightToDelete?.flight_number}? This action cannot be undone.`}
        confirmText="Delete"
      />

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

export default AdminDashboard


{/* Made by Dishika Vaishkiyar - https://github.com/Dishika18 */}
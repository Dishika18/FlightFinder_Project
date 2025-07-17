"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Plane,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  LogOut,
  AlertCircle,
  Ticket,
  Shield,
  Star,
} from "lucide-react"
import SeatSelector from "../components/SeatSelector"
import {
  getCurrentUser,
  getUserProfile,
  getFlightById,
  getBookedSeats,
  createMultipleBookings,
  signOut,
} from "../services/supabase"
import { formatPrice } from "../utils/cities"
import Toast from "../components/Toast"

const BookFlight = () => {
  const { flightId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [flight, setFlight] = useState(null)
  const [bookedSeatsData, setBookedSeatsData] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [flightId])

  const checkAuthAndLoadData = async () => {
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

      await loadFlightData()
    } catch (err) {
      setError("Failed to load page data")
    } finally {
      setLoading(false)
    }
  }

  const loadFlightData = async () => {
    try {
      const { data: flightData, error: flightError } = await getFlightById(flightId)
      if (flightError) throw flightError

      if (!flightData) {
        setError("Flight not found")
        return
      }

      setFlight(flightData)

      const { data: bookedSeatsData, error: seatsError } = await getBookedSeats(flightId)
      if (seatsError) throw seatsError

      setBookedSeatsData(bookedSeatsData || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSeatsSelect = useCallback((seats) => {
    setSelectedSeats(seats)
    setError("")
  }, [])

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError("Please select at least one seat")
      return
    }

    if (selectedSeats.length > flight.available_seats) {
      setError("Not enough available seats")
      return
    }

    setBooking(true)
    setError("")

    try {
      const { data, error } = await createMultipleBookings(user.id, flightId, selectedSeats)

      if (error) throw error

      setShowSuccess(true)

      setTimeout(() => {
        navigate("/home")
      }, 4000)
    } catch (err) {
      setError(err.message || "Failed to book seats. Please try again.")
    } finally {
      setBooking(false)
    }
  }

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
  }

  const handleSignOut = async () => {
    showToast("You've been logged out", "info")
    await signOut()
    setTimeout(() => {
      navigate("/")
    }, 1000)
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateDuration = (departure, arrival) => {
    const diff = new Date(arrival) - new Date(departure)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const calculateTotalPrice = () => {
    return flight ? flight.price * selectedSeats.length : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading flight details...</p>
        </div>
      </div>
    )
  }

  if (error && !flight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md mx-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full mx-4 text-center">
          <div className="relative mb-6">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto" />
            <div className="absolute inset-0 animate-ping">
              <CheckCircle className="h-20 w-20 text-green-400 mx-auto opacity-75" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} on flight {flight.flight_number}{" "}
            {selectedSeats.length > 1 ? "have" : "has"} been successfully booked.
          </p>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl mb-6 border border-green-200">
            <div className="flex items-center justify-center mb-3">
              <Ticket className="h-6 w-6 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Booking Details</span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-green-800">
                <span className="font-medium">Flight:</span> {flight.flight_number}
              </p>
              <p className="text-green-700">
                <span className="font-medium">Route:</span> {flight.source?.split(' ')[0]} → {flight.destination?.split(' ')[0]}
              </p>
              <p className="text-green-700">
                <span className="font-medium">Seats:</span> {selectedSeats.join(", ")}
              </p>
              <p className="text-green-700">
                <span className="font-medium">Total:</span> {formatPrice(calculateTotalPrice())}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Redirecting to home page...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header - Responsive */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/home")}
                className="mr-3 sm:mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl mr-3 shadow-lg">
                <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">FlightFinder</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:inline text-gray-600 font-medium">{profile?.email?.split('@')[0]}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">Book Your Flight</h1>
          <p className="text-lg sm:text-xl text-gray-600">Select your preferred seats and complete your booking</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Flight Details */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200 sticky top-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Ticket className="h-6 w-6 mr-2 text-blue-600" />
                Flight Details
              </h2>

              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl mr-4 shadow-lg">
                    <Plane className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{flight.flight_number}</h3>
                    <p className="text-gray-600 text-lg">
                      {flight.source?.split(' ')[0]} → {flight.destination?.split(' ')[0]}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start p-4 bg-gray-50 rounded-2xl">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Departure</p>
                      <p className="text-gray-600 text-sm">{formatDateTime(flight.departure_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 bg-gray-50 rounded-2xl">
                    <Clock className="h-5 w-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Arrival</p>
                      <p className="text-gray-600 text-sm">{formatDateTime(flight.arrival_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 bg-gray-50 rounded-2xl">
                    <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Duration</p>
                      <p className="text-gray-600 text-sm">{calculateDuration(flight.departure_time, flight.arrival_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 bg-gray-50 rounded-2xl">
                    <Users className="h-5 w-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Available Seats</p>
                      <p className="text-gray-600 text-sm">
                        {flight.available_seats} of {flight.total_seats}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">Price per seat</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(flight.price)}</span>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <span className="text-lg font-semibold text-gray-900">
                        Total ({selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""})
                      </span>
                      <span className="text-3xl font-bold text-green-600">{formatPrice(calculateTotalPrice())}</span>
                    </div>
                  )}
                </div>

                {/* Trust indicators */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-2 text-green-500" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    <span>Instant booking confirmation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seat Selection*/}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <SeatSelector
              totalSeats={flight.total_seats}
              bookedSeatsData={bookedSeatsData}
              onSeatsSelect={handleSeatsSelect}
              selectedSeats={selectedSeats}
              currentUserId={user?.id}
            />

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Booking Confirmation */}
            {selectedSeats.length > 0 && (
              <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="h-6 w-6 mr-2 text-green-600" />
                  Booking Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">Flight Information</h4>
                    <div className="space-y-2 text-gray-600">
                      <p>
                        <span className="font-medium">Flight:</span> {flight.flight_number}
                      </p>
                      <p>
                        <span className="font-medium">Route:</span> {flight.source?.split(' ')[0]} → {flight.destination?.split(' ')[0]}
                      </p>
                      <p>
                        <span className="font-medium">Departure:</span> {formatDateTime(flight.departure_time)}
                      </p>
                      <p>
                        <span className="font-medium">Duration:</span>{" "}
                        {calculateDuration(flight.departure_time, flight.arrival_time)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">Passenger Information</h4>
                    <div className="space-y-2 text-gray-600">
                      <p>
                        <span className="font-medium">Email:</span> {profile.email}
                      </p>
                      <p>
                        <span className="font-medium">Seats:</span> {selectedSeats.join(", ")}
                      </p>
                      <p>
                        <span className="font-medium">Class:</span> Economy
                      </p>
                      <p>
                        <span className="font-medium">Passengers:</span> {selectedSeats.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-2xl font-bold text-gray-900">Total Amount</span>
                    <span className="text-3xl font-bold text-green-600">{formatPrice(calculateTotalPrice())}</span>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={booking || selectedSeats.length === 0}
                    className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                  >
                    {booking ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Processing Booking...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-6 w-6 mr-3" />
                        Confirm Booking ({selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
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

export default BookFlight

{/* Made by Dishika Vaishkiyar - https://github.com/Dishika18 */}
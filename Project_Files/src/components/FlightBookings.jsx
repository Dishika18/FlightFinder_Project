"use client"

import { useState, useEffect } from "react"
import { Users, Mail, MapPin, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { getFlightBookings } from "../services/supabase"

const FlightBookings = ({ flight, isExpanded, onToggle }) => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isExpanded && flight.id) {
      loadBookings()
    }
  }, [isExpanded, flight.id])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const { data, error } = await getFlightBookings(flight.id)
      if (!error && data) {
        setBookings(data)
      }
    } catch (error) {
      console.error("Failed to load bookings:", error)
    } finally {
      setLoading(false)
    }
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

  const groupBookingsByUser = (bookings) => {
    const grouped = {}
    bookings.forEach((booking) => {
      const email = booking.profiles?.email || "Unknown User"
      if (!grouped[email]) {
        grouped[email] = []
      }
      grouped[email].push(booking)
    })
    return grouped
  }

  const groupedBookings = groupBookingsByUser(bookings)
  const totalBookings = bookings.length
  const uniquePassengers = Object.keys(groupedBookings).length

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2" />
          <span>
            {totalBookings} booking{totalBookings !== 1 ? "s" : ""} • {uniquePassengers} passenger
            {uniquePassengers !== 1 ? "s" : ""}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 bg-gray-50 rounded-lg p-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading bookings...</span>
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedBookings).map(([email, userBookings]) => (
                <div key={email} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900">{email}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {userBookings.length} seat{userBookings.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Seats:</p>
                      <div className="flex flex-wrap gap-1">
                        {userBookings.map((booking) => (
                          <span
                            key={booking.id}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {booking.seat_number || "N/A"}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Booked:</p>
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDateTime(userBookings[0]?.booking_date)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userBookings[0]?.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userBookings[0]?.status?.charAt(0).toUpperCase() + userBookings[0]?.status?.slice(1) ||
                        "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No bookings for this flight</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FlightBookings

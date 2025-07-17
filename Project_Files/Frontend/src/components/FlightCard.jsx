"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plane, Users, Calendar, MapPin, ArrowRight, Clock, Star } from "lucide-react"
import { formatPrice } from "../utils/cities"

const FlightCard = ({ flight }) => {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return "N/A"
    const diff = new Date(arrival) - new Date(departure)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleBookFlight = () => {
    if (flight?.id) {
      navigate(`/book/${flight.id}`)
    }
  }

  const getAvailabilityColor = () => {
    const availability = flight.available_seats / flight.total_seats
    if (availability > 0.5) return "text-green-600 bg-green-50"
    if (availability > 0.2) return "text-orange-600 bg-orange-50"
    return "text-red-600 bg-red-50"
  }

  if (!flight) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="text-center text-gray-500">
          <Plane className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Flight information unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 cursor-pointer overflow-hidden ${
        isHovered ? "shadow-2xl scale-[1.02] border-blue-300 bg-gradient-to-br from-white to-blue-50" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBookFlight}
    >
      {/* Mobile-first responsive layout */}
      <div className="p-4 sm:p-6">
        {/* Header - Stack on mobile, side-by-side on larger screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center mb-3 sm:mb-0">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 shadow-lg">
              <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">{flight.flight_number || "N/A"}</h3>
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor()}`}
              >
                <Users className="h-3 w-3 mr-1" />
                {flight.available_seats || 0} of {flight.total_seats || 0} seats
              </div>
            </div>
          </div>

          <div className="text-right sm:text-left">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{formatPrice(flight.price)}</div>
            <p className="text-gray-500 text-xs sm:text-sm">per person</p>
          </div>
        </div>

        {/* Route Information - Responsive layout */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            {/* Departure */}
            <div className="flex-1 text-center sm:text-left mb-3 sm:mb-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {formatDateTime(flight.departure_time)}
              </div>
              <div className="flex items-center justify-center sm:justify-start text-gray-600">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-none">
                  {flight.source || "Unknown"}
                </span>
              </div>
            </div>

            {/* Duration and Arrow - Hidden on small screens, shown on larger */}
            <div className="hidden sm:flex flex-1 items-center justify-center mx-4 lg:mx-6 relative">
              <div className="flex items-center w-full">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                <div className="mx-3 bg-blue-100 p-2 rounded-full shadow-sm">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
              </div>
              <div className="absolute top-full mt-1 bg-white px-2 py-1 text-xs text-gray-500 font-medium rounded shadow-sm border">
                {calculateDuration(flight.departure_time, flight.arrival_time)}
              </div>
            </div>

            {/* Mobile duration display */}
            <div className="sm:hidden text-center mb-3">
              <div className="inline-flex items-center px-3 py-1 bg-blue-50 rounded-full">
                <Clock className="h-3 w-3 mr-1 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  {calculateDuration(flight.departure_time, flight.arrival_time)}
                </span>
              </div>
            </div>

            {/* Arrival */}
            <div className="flex-1 text-center sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {formatDateTime(flight.arrival_time)}
              </div>
              <div className="flex items-center justify-center sm:justify-end text-gray-600">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-none">
                  {flight.destination || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Details - Grid layout that adapts to screen size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-center sm:justify-start p-3 bg-gray-50 rounded-xl">
            <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              {flight.departure_time
                ? new Date(flight.departure_time).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Date unavailable"}
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-start p-3 bg-gray-50 rounded-xl">
            <Star className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              {flight.available_seats > 0 ? `${flight.available_seats} seats left` : "Fully booked"}
            </span>
          </div>
        </div>

        {/* Book Button - Full width on mobile, responsive on larger screens */}
        <button
          onClick={handleBookFlight}
          disabled={!flight.available_seats || flight.available_seats <= 0}
          className={`w-full py-3 sm:py-4 px-6 rounded-xl font-semibold text-sm sm:text-lg transition-all duration-300 transform ${
            flight.available_seats > 0
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {flight.available_seats > 0 ? (
            <span className="flex items-center justify-center">
              <Plane className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Book This Flight
            </span>
          ) : (
            "Fully Booked"
          )}
        </button>
      </div>
    </div>
  )
}

export default FlightCard

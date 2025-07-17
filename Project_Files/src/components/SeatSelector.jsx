"use client"

import { useState, useEffect, useMemo } from "react"
import { User, X, Check, Plane, Info, Users, MapPin } from "lucide-react"

const SeatSelector = ({ totalSeats, bookedSeatsData, onSeatsSelect, selectedSeats, currentUserId }) => {
  const [seats, setSeats] = useState([])
  const [viewMode, setViewMode] = useState("grid") // 'grid' or 'list' for mobile

  // Memoize booked seats to prevent unnecessary re-renders
  const bookedSeats = useMemo(() => {
    return bookedSeatsData?.map((booking) => booking.seat_number) || []
  }, [bookedSeatsData])

  const userBookedSeats = useMemo(() => {
    return bookedSeatsData?.filter((booking) => booking.user_id === currentUserId).map((b) => b.seat_number) || []
  }, [bookedSeatsData, currentUserId])

  useEffect(() => {
    generateSeats()
  }, [totalSeats, bookedSeats, selectedSeats])

  const generateSeats = () => {
    const seatArray = []
    const seatsPerRow = 6 // 3 seats on each side (A-C, D-F)
    const rows = Math.ceil(totalSeats / seatsPerRow)

    for (let row = 1; row <= rows; row++) {
      const rowSeats = []
      const seatLetters = ["A", "B", "C", "D", "E", "F"]

      for (let i = 0; i < seatsPerRow && (row - 1) * seatsPerRow + i < totalSeats; i++) {
        const seatNumber = `${row}${seatLetters[i]}`
        const isBooked = bookedSeats.includes(seatNumber)
        const isSelected = selectedSeats.includes(seatNumber)
        const isUserBooked = userBookedSeats.includes(seatNumber)

        rowSeats.push({
          number: seatNumber,
          isBooked,
          isSelected,
          isUserBooked,
          row,
          position: i,
          isWindow: i === 0 || i === 5,
          isAisle: i === 2 || i === 3,
          isMiddle: i === 1 || i === 4,
        })
      }
      seatArray.push(rowSeats)
    }

    setSeats(seatArray)
  }

  const handleSeatClick = (seatNumber, isBooked) => {
    if (isBooked) return

    const newSelectedSeats = selectedSeats.includes(seatNumber)
      ? selectedSeats.filter((seat) => seat !== seatNumber)
      : [...selectedSeats, seatNumber]

    onSeatsSelect(newSelectedSeats)
  }

  const getSeatClass = (seat) => {
    const baseClass =
      "relative flex items-center justify-center text-xs font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 rounded-lg"

    // Size classes for responsive design
    const sizeClass = "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"

    if (seat.isBooked) {
      if (seat.isUserBooked) {
        return `${baseClass} ${sizeClass} bg-gradient-to-br from-emerald-400 to-emerald-600 text-white cursor-default shadow-lg ring-2 ring-emerald-300`
      }
      return `${baseClass} ${sizeClass} bg-gradient-to-br from-red-400 to-red-600 text-white cursor-not-allowed opacity-75 shadow-md`
    } else if (seat.isSelected) {
      return `${baseClass} ${sizeClass} bg-gradient-to-br from-blue-500 to-blue-700 text-white cursor-pointer shadow-xl ring-2 ring-blue-300 scale-110`
    } else {
      return `${baseClass} ${sizeClass} bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 cursor-pointer border-2 border-gray-200 hover:border-blue-300 text-gray-700 shadow-sm hover:shadow-md`
    }
  }

  const getSeatIcon = (seat) => {
    if (seat.isBooked) {
      if (seat.isUserBooked) {
        return <Check className="h-3 w-3 sm:h-4 sm:w-4" />
      }
      return <X className="h-2 w-2 sm:h-3 sm:w-3" />
    } else if (seat.isSelected) {
      return <Check className="h-3 w-3 sm:h-4 sm:w-4" />
    }
    return <span className="text-[10px] sm:text-xs font-bold">{seat.number}</span>
  }

  const getSeatTooltip = (seat) => {
    const seatType = seat.isWindow ? "Window" : seat.isAisle ? "Aisle" : "Middle"
    if (seat.isBooked) {
      if (seat.isUserBooked) {
        return `Your booked seat - ${seat.number} (${seatType})`
      }
      return "Seat occupied"
    } else if (seat.isSelected) {
      return `Selected: ${seat.number} (${seatType})`
    }
    return `${seat.number} - ${seatType} seat`
  }

  const getSeatTypeIcon = (seat) => {
    if (seat.isWindow) return "🪟"
    if (seat.isAisle) return "🚶"
    return "👥"
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:p-6 lg:p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3" />
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Select Your Seats</h3>
          </div>
          <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Choose your preferred seats for the journey</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Legend */}
        <div className="mb-6 sm:mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Seat Legend
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">1A</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Your Bookings</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center">
                <X className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Occupied</span>
            </div>
          </div>
        </div>

        {/* Seat Type Legend */}
        <div className="mb-6 sm:mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Seat Types
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
              <span>🪟</span>
              <span className="font-medium text-blue-800">Window Seat</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
              <span>🚶</span>
              <span className="font-medium text-green-800">Aisle Seat</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg">
              <span>👥</span>
              <span className="font-medium text-orange-800">Middle Seat</span>
            </div>
          </div>
        </div>

        {/* Aircraft Layout */}
        <div className="max-w-2xl mx-auto">
          {/* Cockpit */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-t-3xl text-xs sm:text-sm font-bold flex items-center justify-center shadow-lg">
              <Plane className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span>Cockpit</span>
            </div>
          </div>

          {/* Seats Grid */}
          <div className="space-y-2 sm:space-y-3 bg-gradient-to-b from-blue-50 to-indigo-50 p-3 sm:p-4 lg:p-6 rounded-2xl shadow-inner">
            {seats.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center items-center gap-1 sm:gap-2 lg:gap-3">
                {/* Left side seats (A, B, C) */}
                <div className="flex gap-1 sm:gap-2">
                  {row.slice(0, 3).map((seat) => (
                    <div key={seat.number} className="relative group">
                      <button
                        onClick={() => handleSeatClick(seat.number, seat.isBooked)}
                        disabled={seat.isBooked && !seat.isUserBooked}
                        className={getSeatClass(seat)}
                        title={getSeatTooltip(seat)}
                      >
                        {getSeatIcon(seat)}

                        {/* Seat type indicator */}
                        <div className="absolute -top-1 -right-1 text-[8px] opacity-60">{getSeatTypeIcon(seat)}</div>
                      </button>

                      {/* Tooltip for larger screens */}
                      <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {getSeatTooltip(seat)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Row number and aisle */}
                <div className="flex flex-col items-center justify-center w-8 sm:w-10 lg:w-12">
                  <span className="text-xs sm:text-sm font-bold text-gray-600 bg-white px-2 py-1 rounded-full shadow-sm">
                    {row[0]?.row}
                  </span>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-1"></div>
                </div>

                {/* Right side seats (D, E, F) */}
                <div className="flex gap-1 sm:gap-2">
                  {row.slice(3, 6).map((seat) => (
                    <div key={seat.number} className="relative group">
                      <button
                        onClick={() => handleSeatClick(seat.number, seat.isBooked)}
                        disabled={seat.isBooked && !seat.isUserBooked}
                        className={getSeatClass(seat)}
                        title={getSeatTooltip(seat)}
                      >
                        {getSeatIcon(seat)}

                        {/* Seat type indicator */}
                        <div className="absolute -top-1 -right-1 text-[8px] opacity-60">{getSeatTypeIcon(seat)}</div>
                      </button>

                      {/* Tooltip for larger screens */}
                      <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {getSeatTooltip(seat)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tail */}
          <div className="text-center mt-4 sm:mt-6">
            <div className="bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 py-2 px-4 sm:px-6 rounded-b-3xl text-xs font-medium text-gray-700 shadow-lg">
              Tail Section
            </div>
          </div>
        </div>

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
              <div className="flex items-center mb-2 sm:mb-0">
                <User className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-blue-900 font-semibold text-sm sm:text-base">
                  Selected Seats ({selectedSeats.length})
                </span>
              </div>
              <button
                onClick={() => onSeatsSelect([])}
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium transition-colors duration-200 hover:underline self-start sm:self-auto"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedSeats.map((seat) => (
                <div
                  key={seat}
                  className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-200 group"
                >
                  <MapPin className="h-3 w-3 mr-1 opacity-80" />
                  <span>{seat}</span>
                  <button
                    onClick={() => handleSeatClick(seat, false)}
                    className="ml-2 hover:bg-blue-800 rounded-full p-0.5 transition-colors duration-200 group-hover:scale-110"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Mobile-friendly seat summary */}
            <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700">
              <p className="flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Tap seats to select/deselect • Scroll horizontally if needed
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SeatSelector

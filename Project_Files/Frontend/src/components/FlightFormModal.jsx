"use client"

import { useState, useEffect } from "react"
import { X, Plane, MapPin } from "lucide-react"
import { CITIES } from "../utils/cities"

const FlightFormModal = ({ isOpen, onClose, onSubmit, flight = null, loading = false }) => {
  const [formData, setFormData] = useState({
    flight_number: "",
    source: "",
    destination: "",
    departure_time: "",
    arrival_time: "",
    total_seats: "",
    price: "",
    status: "active",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (flight) {
      // Format datetime for input fields
      const formatDateTime = (dateString) => {
        const date = new Date(dateString)
        return date.toISOString().slice(0, 16)
      }

      setFormData({
        flight_number: flight.flight_number || "",
        source: flight.source || "",
        destination: flight.destination || "",
        departure_time: formatDateTime(flight.departure_time),
        arrival_time: formatDateTime(flight.arrival_time),
        total_seats: flight.total_seats?.toString() || "",
        price: flight.price?.toString() || "",
        status: flight.status || "active",
      })
    } else {
      setFormData({
        flight_number: "",
        source: "",
        destination: "",
        departure_time: "",
        arrival_time: "",
        total_seats: "",
        price: "",
        status: "active",
      })
    }
    setErrors({})
  }, [flight, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.flight_number.trim()) newErrors.flight_number = "Flight number is required"
    if (!formData.source.trim()) newErrors.source = "Source is required"
    if (!formData.destination.trim()) newErrors.destination = "Destination is required"
    if (!formData.departure_time) newErrors.departure_time = "Departure time is required"
    if (!formData.arrival_time) newErrors.arrival_time = "Arrival time is required"
    if (!formData.total_seats || formData.total_seats <= 0) newErrors.total_seats = "Valid total seats required"
    if (!formData.price || formData.price <= 0) newErrors.price = "Valid price required"

    // Check if source and destination are the same
    if (formData.source && formData.destination && formData.source === formData.destination) {
      newErrors.destination = "Destination must be different from source"
    }

    // Check if arrival is after departure
    if (formData.departure_time && formData.arrival_time) {
      if (new Date(formData.arrival_time) <= new Date(formData.departure_time)) {
        newErrors.arrival_time = "Arrival time must be after departure time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      const submitData = {
        ...formData,
        total_seats: Number.parseInt(formData.total_seats),
        available_seats: flight ? flight.available_seats : Number.parseInt(formData.total_seats),
        price: Number.parseFloat(formData.price),
        departure_time: new Date(formData.departure_time).toISOString(),
        arrival_time: new Date(formData.arrival_time).toISOString(),
      }
      onSubmit(submitData)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Plane className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">{flight ? "Edit Flight" : "Add New Flight"}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="flight_number" className="block text-sm font-medium text-gray-700 mb-1">
                Flight Number
              </label>
              <input
                type="text"
                id="flight_number"
                name="flight_number"
                value={formData.flight_number}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.flight_number ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="e.g., AI101, 6E234"
              />
              {errors.flight_number && <p className="text-red-600 text-xs mt-1">{errors.flight_number}</p>}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                From (Source)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.source ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select source city</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              {errors.source && <p className="text-red-600 text-xs mt-1">{errors.source}</p>}
            </div>

            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                To (Destination)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.destination ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select destination city</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              {errors.destination && <p className="text-red-600 text-xs mt-1">{errors.destination}</p>}
            </div>

            <div>
              <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Time
              </label>
              <input
                type="datetime-local"
                id="departure_time"
                name="departure_time"
                value={formData.departure_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.departure_time ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.departure_time && <p className="text-red-600 text-xs mt-1">{errors.departure_time}</p>}
            </div>

            <div>
              <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700 mb-1">
                Arrival Time
              </label>
              <input
                type="datetime-local"
                id="arrival_time"
                name="arrival_time"
                value={formData.arrival_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.arrival_time ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.arrival_time && <p className="text-red-600 text-xs mt-1">{errors.arrival_time}</p>}
            </div>

            <div>
              <label htmlFor="total_seats" className="block text-sm font-medium text-gray-700 mb-1">
                Total Seats
              </label>
              <input
                type="number"
                id="total_seats"
                name="total_seats"
                value={formData.total_seats}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.total_seats ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="e.g., 180"
              />
              {errors.total_seats && <p className="text-red-600 text-xs mt-1">{errors.total_seats}</p>}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="e.g., 15000"
              />
              {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : flight ? "Update Flight" : "Add Flight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FlightFormModal

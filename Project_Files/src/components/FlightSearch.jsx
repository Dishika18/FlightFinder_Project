"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, ArrowRight, Plane, RefreshCw } from "lucide-react"
import { CITIES } from "../utils/cities"

const FlightSearch = ({ onSearch, loading }) => {
  const [fromCity, setFromCity] = useState("all")
  const [toCity, setToCity] = useState("all")

  useEffect(() => {
    // Trigger search when cities change
    onSearch(fromCity, toCity)
  }, [fromCity, toCity, onSearch])

  const handleSwapCities = () => {
    const temp = fromCity
    setFromCity(toCity)
    setToCity(temp)
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center mb-2">
          <Search className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3" />
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Search Flights</h2>
        </div>
        <p className="text-center text-blue-100 text-sm sm:text-base">Find your perfect journey</p>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Search Form - Responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-end">
          {/* From City */}
          <div className="lg:col-span-2">
            <label htmlFor="from" className="block text-sm font-semibold text-gray-700 mb-2">
              From
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <select
                id="from"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="all">All Cities</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center lg:col-span-1">
            <button
              onClick={handleSwapCities}
              className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-full transition-all duration-300 group border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
              title="Swap cities"
            >
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>

          {/* To City */}
          <div className="lg:col-span-2">
            <label htmlFor="to" className="block text-sm font-semibold text-gray-700 mb-2">
              To
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <select
                id="to"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="all">All Cities</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results Info */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
          <div className="flex items-center text-sm sm:text-base text-gray-700 mb-2 sm:mb-0">
            <Plane className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
            <span className="font-medium">
              {fromCity === "all" && toCity === "all"
                ? "Showing all available flights"
                : `Flights from ${fromCity === "all" ? "any city" : fromCity.split(" ")[0]} to ${
                    toCity === "all" ? "any city" : toCity.split(" ")[0]
                  }`}
            </span>
          </div>
          {loading && (
            <div className="flex items-center text-sm text-blue-600 font-medium">
              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
              Searching flights...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FlightSearch

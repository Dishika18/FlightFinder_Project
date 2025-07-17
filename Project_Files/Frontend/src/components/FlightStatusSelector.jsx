"use client"

import { useState } from "react"
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

const FlightStatusSelector = ({ currentStatus, onStatusChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)

  const statusOptions = [
    { value: "active", label: "On Time", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    { value: "delayed", label: "Delayed", icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-100" },
    { value: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
    { value: "completed", label: "Completed", icon: CheckCircle, color: "text-gray-600", bgColor: "bg-gray-100" },
  ]

  const currentStatusOption = statusOptions.find((option) => option.value === currentStatus) || statusOptions[0]

  const handleStatusSelect = (status) => {
    onStatusChange(status)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          currentStatusOption.bgColor
        } ${currentStatusOption.color} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
      >
        <currentStatusOption.icon className="h-3 w-3 mr-1" />
        {currentStatusOption.label}
        {!disabled && <AlertTriangle className="h-3 w-3 ml-1 opacity-60" />}
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              className={`flex items-center w-full px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors ${
                option.value === currentStatus ? "bg-gray-100" : ""
              } ${option.color}`}
            >
              <option.icon className="h-3 w-3 mr-2" />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default FlightStatusSelector

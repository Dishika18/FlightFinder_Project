"use client"

import { Plane } from "lucide-react"

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <Plane className="h-8 w-8 text-blue-600 animate-pulse" />
        <div className="absolute inset-0 animate-spin">
          <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-600 rounded-full"></div>
        </div>
      </div>
      <p className="mt-4 text-gray-600 text-sm">{message}</p>
    </div>
  )
}

export default LoadingSpinner

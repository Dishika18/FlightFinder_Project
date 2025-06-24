"use client"

import { useState } from "react"
import { X, Eye, EyeOff, Plane } from "lucide-react"
import { signIn, signUp, getUserProfile } from "../services/supabase"

const AuthModal = ({ mode, onClose, onSuccess, onSwitchMode }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    setError("")

    // Validate email on change
    if (name === "email") {
      if (value && !validateEmail(value)) {
        setEmailError("Enter valid mail ID")
      } else {
        setEmailError("")
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate email before submission
    if (!validateEmail(formData.email)) {
      setEmailError("Enter valid mail ID")
      return
    }

    setLoading(true)
    setError("")
    setEmailError("")

    try {
      let userData = null

      if (mode === "signin") {
        const { data, error } = await signIn(formData.email, formData.password)
        if (error) throw error
        userData = data.user
      } else {
        const { data, error } = await signUp(formData.email, formData.password, formData.role)
        if (error) throw error
        userData = data.user
      }

      if (userData) {
        // Fetch user profile to get role
        const { data: profile, error: profileError } = await getUserProfile(userData.id)
        if (profileError) throw profileError

        // Call onSuccess with both user and profile data
        onSuccess(userData, profile)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Plane className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">{mode === "signin" ? "Sign In" : "Sign Up"}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  emailError ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your email"
              />
              {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role Selection (only for signup) */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={formData.role === "user"}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">User - Book and manage flights</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === "admin"}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Admin - Manage system and users</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || emailError}
            className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>

          {/* Switch Mode */}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={() => onSwitchMode(mode === "signin" ? "signup" : "signin")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthModal

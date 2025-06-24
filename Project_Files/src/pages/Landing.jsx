"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
    Plane,
    Shield,
    Star,
    Menu,
    X,
    ArrowRight,
    CheckCircle,
    Globe,
    Clock,
    Users,
    Award,
    Zap,
    Heart,
    TrendingUp,
    MapPin,
    Calendar,
    CreditCard,
} from "lucide-react"
import AuthModal from "../components/AuthModal"
import { getCurrentUser, getUserProfile } from "../services/supabase"
import Toast from "../components/Toast"

const Landing = () => {
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authMode, setAuthMode] = useState("signin")
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isVisible, setIsVisible] = useState({})
    const navigate = useNavigate()
    const [toast, setToast] = useState({ show: false, message: "", type: "success" })

    // Refs for intersection observer
    const heroRef = useRef(null)
    const featuresRef = useRef(null)
    const statsRef = useRef(null)
    const testimonialsRef = useRef(null)
    const ctaRef = useRef(null)

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type })
    }

    useEffect(() => {
        checkUserSession()
        setupIntersectionObserver()
    }, [])

    const checkUserSession = async () => {
        const user = await getCurrentUser()
        if (user) {
            const { data: profile } = await getUserProfile(user.id)
            if (profile) {
                if (profile.role === "admin") {
                    navigate("/admin/dashboard")
                } else {
                    navigate("/home")
                }
            }
        }
    }

    const setupIntersectionObserver = () => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible((prev) => ({
                            ...prev,
                            [entry.target.id]: true,
                        }))
                    }
                })
            },
            { threshold: 0.1, rootMargin: "50px" },
        )

        const elements = [heroRef, featuresRef, statsRef, testimonialsRef, ctaRef]
        elements.forEach((ref) => {
            if (ref.current) {
                observer.observe(ref.current)
            }
        })

        return () => observer.disconnect()
    }

    const handleAuthSuccess = async (user, profile) => {
        setShowAuthModal(false)

        showToast("Logged in successfully!", "success")

        setTimeout(async () => {
            await checkUserSession()
        }, 100)
    }

    const openSignIn = () => {
        setAuthMode("signin")
        setShowAuthModal(true)
        setMobileMenuOpen(false)
    }

    const openSignUp = () => {
        setAuthMode("signup")
        setShowAuthModal(true)
        setMobileMenuOpen(false)
    }

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })
        setMobileMenuOpen(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-x-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Floating Clouds */}
                <div className="absolute top-20 left-10 w-20 h-12 bg-white/30 rounded-full animate-float-slow"></div>
                <div className="absolute top-40 right-20 w-16 h-10 bg-white/20 rounded-full animate-float-medium"></div>
                <div className="absolute top-60 left-1/4 w-24 h-14 bg-white/25 rounded-full animate-float-fast"></div>
                <div className="absolute bottom-40 right-10 w-18 h-11 bg-white/30 rounded-full animate-float-slow"></div>

                {/* Animated Flight Path */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1200 800">
                    <path
                        d="M50,400 Q300,200 600,300 T1150,250"
                        stroke="url(#flightGradient)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="10,5"
                        className="animate-dash"
                    />
                    <defs>
                        <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="50%" stopColor="#6366F1" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Header */}
            <header className="relative bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4 sm:py-6 lg:py-3">
                        {/* Logo */}
                        <div className="flex items-center group cursor-pointer" onClick={() => scrollToSection("hero")}>
                            <div className="relative">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-2xl mr-3 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                    <Plane className="h-6 w-6 sm:h-8 sm:w-8 lg:h-6 lg:w-6 text-white transform group-hover:translate-x-1 transition-transform duration-300" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                            <div>
                                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    FlightFinder
                                </span>
                                <div className="text-xs text-gray-500 font-medium">Your Journey Starts Here</div>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-8">
                            <button
                                onClick={() => scrollToSection("features")}
                                className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 hover:scale-105 transform"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection("about")}
                                className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 hover:scale-105 transform"
                            >
                                About
                            </button>

                            <button
                                onClick={openSignIn}
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 rounded-lg hover:bg-blue-50 transform hover:scale-105"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={openSignUp}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5"
                            >
                                Get Started
                            </button>
                        </nav>

                        {/* Mobile menu button */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <div
                        className={`lg:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
                    >
                        <div className="border-t border-gray-200 py-4 space-y-2">
                            <button
                                onClick={() => scrollToSection("features")}
                                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors rounded-lg hover:bg-blue-50"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection("about")}
                                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors rounded-lg hover:bg-blue-50"
                            >
                                About
                            </button>
                            <button
                                onClick={() => scrollToSection("testimonials")}
                                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors rounded-lg hover:bg-blue-50"
                            >
                                Reviews
                            </button>
                            <div className="pt-2 space-y-2">
                                <button
                                    onClick={openSignIn}
                                    className="block w-full text-left px-3 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors rounded-lg hover:bg-blue-50"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={openSignUp}
                                    className="block w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section
                id="hero"
                ref={heroRef}
                className={`relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${isVisible.hero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    {/* Animated Airplane */}
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 -translate-y-20">
                        <div className="relative">
                            <Plane className="h-14 w-14 text-blue-600 animate-fly" />
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-5 h-1 bg-blue-300 rounded-full opacity-50 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Hero Content */}
                    <div className="pt-20 pb-12">
                        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                                <Zap className="h-4 w-4 mr-2" />
                                ✈️ Now with Real-time Flight Updates
                            </span>
                        </div>

                        <h1
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up"
                            style={{ animationDelay: "0.4s" }}
                        >
                            Your Dream Destination
                            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                                Awaits You
                            </span>
                        </h1>

                        <p
                            className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up"
                            style={{ animationDelay: "0.6s" }}
                        >
                            Discover the world with FlightFinder. Compare prices from 500+ airlines, find exclusive deals, and book
                            your perfect flight in seconds. Your next adventure is just one click away.
                        </p>

                        {/* CTA Buttons */}
                        <div
                            className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up"
                            style={{ animationDelay: "0.8s" }}
                        >
                            <button
                                onClick={openSignUp}
                                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1"
                            >
                                <span className="flex items-center justify-center">
                                    Start Your Journey
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                                </span>
                            </button>
                            <button
                                onClick={openSignIn}
                                className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <span className="flex items-center justify-center">
                                    Sign In
                                    <Plane className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                                </span>
                            </button>
                        </div>

                        {/* Trust Indicators */}
                        <div
                            className="flex flex-wrap justify-center items-center gap-8 text-gray-600 animate-fade-in-up"
                            style={{ animationDelay: "1s" }}
                        >
                            {/* <div className="flex items-center">
                                <Users className="h-5 w-5 mr-2 text-blue-600" />
                                <span className="text-sm font-medium">2M+ Happy Travelers</span>
                            </div> */}
                            <div className="flex items-center">
                                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                                <span className="text-sm font-medium">4.9/5 Rating</span>
                            </div>
                            <div className="flex items-center">
                                <Shield className="h-5 w-5 mr-2 text-green-500" />
                                <span className="text-sm font-medium">100% Secure</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section
                id="stats"
                ref={statsRef}
                className={`py-16 sm:py-24 bg-white/50 backdrop-blur-sm transition-all duration-1000 ${isVisible.stats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Globe, number: "500+", label: "Airlines", color: "text-blue-600" },
                            { icon: MapPin, number: "1000+", label: "Destinations", color: "text-green-600" },
                            { icon: Users, number: "2M+", label: "Happy Customers", color: "text-purple-600" },
                            { icon: Award, number: "99.9%", label: "Uptime", color: "text-orange-600" },
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="text-center group hover:scale-105 transition-transform duration-300"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 mb-4 group-hover:shadow-lg transition-all duration-300 ${stat.color}`}
                                >
                                    <stat.icon className="h-8 w-8" />
                                </div>
                                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section
                id="features"
                ref={featuresRef}
                className={`py-16 sm:py-24 transition-all duration-1000 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Why Choose FlightFinder?</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Experience the future of flight booking with our cutting-edge platform designed for modern travelers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[

                            {
                                icon: Star,
                                title: "Best Prices",
                                description: "Compare prices from 500+ airlines and get exclusive deals you won't find anywhere else.",
                                gradient: "from-green-500 to-emerald-600",
                                features: ["Price alerts", "Hidden deals", "Loyalty rewards"],
                            },

                            {
                                icon: Clock,
                                title: "Real-time Updates",
                                description:
                                    "Get instant notifications about flight changes, gate updates, and boarding announcements.",
                                gradient: "from-orange-500 to-red-500",
                                features: ["Live tracking", "Push notifications", "Status alerts"],
                            },
                            {
                                icon: Globe,
                                title: "Global Coverage",
                                description:
                                    "Access flights to over 1000 destinations worldwide with local currency and language support.",
                                gradient: "from-teal-500 to-cyan-600",
                                features: ["1000+ destinations", "Multi-currency", "Local support"],
                            },

                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div
                                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                                >
                                    <feature.icon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed mb-6 text-center">{feature.description}</p>

                                <div className="space-y-2">
                                    {feature.features.map((item, idx) => (
                                        <div key={idx} className="flex items-center text-sm text-gray-600">
                                            <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="about" className="py-16 sm:py-24 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Book in 3 Simple Steps</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our streamlined process makes booking flights faster and easier than ever before.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                        {[
                            {
                                step: "01",
                                icon: MapPin,
                                title: "Search & Compare",
                                description:
                                    "Enter your destination and travel dates. Our AI instantly searches 500+ airlines to find the best options for you.",
                            },
                            {
                                step: "02",
                                icon: Calendar,
                                title: "Select & Customize",
                                description:
                                    "Choose your perfect flight and customize your journey with seat selection, meals, and additional services.",
                            },
                            {
                                step: "03",
                                icon: CreditCard,
                                title: "Book & Fly",
                                description:
                                    "Secure payment in seconds with instant confirmation. Get your boarding pass and you're ready to fly!",
                            },
                        ].map((step, index) => (
                            <div key={index} className="relative text-center group">
                                {/* Connection Line */}
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 transform translate-x-6"></div>
                                )}

                                <div className="relative">
                                    <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-3xl transition-all duration-300 group-hover:scale-110">
                                        <step.icon className="h-12 w-12 text-white" />
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-blue-600 font-bold text-sm">{step.step}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                                    <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section
                id="cta"
                ref={ctaRef}
                className={`py-16 sm:py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-1000 ${isVisible.cta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <div className="relative">
                        {/* Animated Elements */}
                        <div className="absolute -top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float-slow"></div>
                        <div className="absolute -bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-float-medium"></div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">Ready to Explore the World?</h2>
                        <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                            Join over 2 million travelers who have discovered their perfect flights with FlightFinder. Your next
                            adventure awaits!
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={openSignUp}
                                className="group px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1"
                            >
                                <span className="flex items-center justify-center">
                                    Start Your Journey Today
                                    <TrendingUp className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                                </span>
                            </button>
                            <button
                                onClick={openSignIn}
                                className="group px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl hover:bg-white/10 font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                            >
                                <span className="flex items-center justify-center">
                                    Already a Member?
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Company Info */}
                    <div className="mb-8">
                        <div className="flex justify-center items-center mb-4">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg mr-3">
                                <Plane className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <span className="text-xl sm:text-2xl font-bold">FlightFinder</span>
                                <div className="text-sm text-gray-400">Your Journey Starts Here</div>
                            </div>
                        </div>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Making travel accessible and affordable for everyone. Discover the world with confidence, knowing you're
                            getting the best deals and service.
                        </p>
                    </div>

                    {/* Copyright */}
                    <div className="border-t border-gray-800 pt-6">
                        <p className="text-gray-500 text-sm">
                            © 2025 FlightFinder. All rights reserved. Built with ❤️ for travelers worldwide.
                        </p>
                    </div>
                </div>
            </footer>


            {/* Auth Modal */}
            {showAuthModal && (
                <AuthModal
                    mode={authMode}
                    onClose={() => setShowAuthModal(false)}
                    onSuccess={handleAuthSuccess}
                    onSwitchMode={(mode) => setAuthMode(mode)}
                />
            )}

            {/* Toast */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
            />

            {/* Custom Styles */}
            <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(10px); }
          75% { transform: translateY(-15px) translateX(5px); }
        }
        
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-8px) translateX(-5px); }
          66% { transform: translateY(-12px) translateX(8px); }
        }
        
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(-10px); }
        }
        
        @keyframes fly {
          0%, 100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
          25% { transform: translateX(10px) translateY(-5px) rotate(5deg); }
          50% { transform: translateX(20px) translateY(-10px) rotate(10deg); }
          75% { transform: translateX(10px) translateY(-5px) rotate(5deg); }
        }
        
        @keyframes dash {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 3s ease-in-out infinite; }
        .animate-fly { animation: fly 8s ease-in-out infinite; }
        .animate-dash { animation: dash 3s linear infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
        </div>
    )
}

export default Landing

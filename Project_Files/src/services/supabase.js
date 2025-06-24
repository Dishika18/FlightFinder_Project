import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "your-supabase-url"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-supabase-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signUp = async (email, password, role) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Insert user profile with role
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          email: data.user.email,
          role: role,
        },
      ])

      if (profileError) throw profileError
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Flight helper functions
export const getAllFlights = async () => {
  try {
    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .eq("status", "active")
      .order("departure_time", { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getFlightById = async (flightId) => {
  try {
    const { data, error } = await supabase.from("flights").select("*").eq("id", flightId).single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get unique cities from flights
// export const getFlightCities = async () => {
//   try {
//     const { data, error } = await supabase.from("flights").select("source, destination").eq("status", "active")

//     if (error) throw error

//     const cities = new Set()
//     data?.forEach((flight) => {
//       if (flight.source) cities.add(flight.source)
//       if (flight.destination) cities.add(flight.destination)
//     })

//     return { data: Array.from(cities).sort(), error: null }
//   } catch (error) {
//     return { data: [], error }
//   }
// }

// Search flights by route
export const searchFlights = async (source, destination) => {
  try {
    let query = supabase.from("flights").select("*").eq("status", "active").order("departure_time", { ascending: true })

    if (source && source !== "all") {
      query = query.eq("source", source)
    }
    if (destination && destination !== "all") {
      query = query.eq("destination", destination)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Booking helper functions
export const getUserBookings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        flights!bookings_flight_id_fkey (
          flight_number,
          source,
          destination,
          departure_time,
          arrival_time,
          status,
          price
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    const validBookings = (data || []).filter((booking) => booking.flights !== null)

    return { data: validBookings, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export const getBookedSeats = async (flightId) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("seat_number, user_id")
      .eq("flight_id", flightId)
      .neq("status", "cancelled")

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export const createMultipleBookings = async (userId, flightId, seatNumbers) => {
  try {
    // Check if any seats are already booked
    const { data: existingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("seat_number")
      .eq("flight_id", flightId)
      .in("seat_number", seatNumbers)
      .neq("status", "cancelled")

    if (checkError) throw checkError

    if (existingBookings && existingBookings.length > 0) {
      const bookedSeats = existingBookings.map((b) => b.seat_number)
      throw new Error(`Seats ${bookedSeats.join(", ")} are already booked`)
    }

    // Create bookings for all selected seats
    const bookingData = seatNumbers.map((seatNumber) => ({
      user_id: userId,
      flight_id: flightId,
      seat_number: seatNumber,
      status: 'confirmed', // Explicitly set status
      booking_date: new Date().toISOString(), // Add booking_date if your schema requires it
    }))

    const { data, error } = await supabase.from("bookings").insert(bookingData).select()

    if (error) throw error

    // Update available seats count - check if this RPC function exists
    try {
      const { error: updateError } = await supabase.rpc("decrement_available_seats_multiple", {
        flight_id: flightId,
        seat_count: seatNumbers.length,
      })

      if (updateError) {
        console.warn("RPC function not found, updating manually:", updateError.message)
        // Fallback: manually decrement seats
        const { data: flight } = await supabase
          .from("flights")
          .select("available_seats")
          .eq("id", flightId)
          .single()
        
        if (flight) {
          await supabase
            .from("flights")
            .update({ available_seats: flight.available_seats - seatNumbers.length })
            .eq("id", flightId)
        }
      }
    } catch (rpcError) {
      console.warn("RPC error, using manual update:", rpcError)
      // Manual fallback
      const { data: flight } = await supabase
        .from("flights")
        .select("available_seats")
        .eq("id", flightId)
        .single()
      
      if (flight) {
        await supabase
          .from("flights")
          .update({ available_seats: flight.available_seats - seatNumbers.length })
          .eq("id", flightId)
      }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const cancelBooking = async (bookingId) => {
  try {
    // Get booking details first
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("flight_id")
      .eq("id", bookingId)
      .single()

    if (fetchError) throw fetchError

    // Update booking status
    const { data, error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)

    if (error) throw error

    // Increment available seats
    try {
      const { error: updateError } = await supabase.rpc("increment_available_seats", {
        flight_id: booking.flight_id,
      })

      if (updateError) {
        // Fallback: manually increment seats
        const { data: flight } = await supabase
          .from("flights")
          .select("available_seats")
          .eq("id", booking.flight_id)
          .single()
        
        if (flight) {
          await supabase
            .from("flights")
            .update({ available_seats: flight.available_seats + 1 })
            .eq("id", booking.flight_id)
        }
      }
    } catch (rpcError) {
      // Manual fallback
      const { data: flight } = await supabase
        .from("flights")
        .select("available_seats")
        .eq("id", booking.flight_id)
        .single()
      
      if (flight) {
        await supabase
          .from("flights")
          .update({ available_seats: flight.available_seats + 1 })
          .eq("id", booking.flight_id)
      }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const cancelMultipleBookings = async (bookingIds) => {
  try {
    // Get booking details first
    const { data: bookings, error: fetchError } = await supabase
      .from("bookings")
      .select("flight_id")
      .in("id", bookingIds)

    if (fetchError) throw fetchError

    // Update booking statuses
    const { data, error } = await supabase.from("bookings").update({ status: "cancelled" }).in("id", bookingIds)

    if (error) throw error

    // Group by flight_id and increment seats
    const flightCounts = bookings.reduce((acc, booking) => {
      acc[booking.flight_id] = (acc[booking.flight_id] || 0) + 1
      return acc
    }, {})

    // Update seat counts for each flight
    for (const [flightId, count] of Object.entries(flightCounts)) {
      try {
        const { error: updateError } = await supabase.rpc("increment_available_seats_multiple", {
          flight_id: flightId,
          seat_count: count,
        })

        if (updateError) {
          // Fallback: manually increment seats
          const { data: flight } = await supabase
            .from("flights")
            .select("available_seats")
            .eq("id", flightId)
            .single()
          
          if (flight) {
            await supabase
              .from("flights")
              .update({ available_seats: flight.available_seats + count })
              .eq("id", flightId)
          }
        }
      } catch (rpcError) {
        // Manual fallback
        const { data: flight } = await supabase
          .from("flights")
          .select("available_seats")
          .eq("id", flightId)
          .single()
        
        if (flight) {
          await supabase
            .from("flights")
            .update({ available_seats: flight.available_seats + count })
            .eq("id", flightId)
        }
      }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Admin-specific functions
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getAllFlightsAdmin = async () => {
  try {
    const { data, error } = await supabase.from("flights").select("*").order("departure_time", { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const createFlight = async (flightData) => {
  try {
    const { data, error } = await supabase.from("flights").insert([flightData]).select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const updateFlight = async (flightId, flightData) => {
  try {
    const { data, error } = await supabase.from("flights").update(flightData).eq("id", flightId).select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const deleteFlight = async (flightId) => {
  try {
    const { data, error } = await supabase.from("flights").delete().eq("id", flightId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getAdminStats = async () => {
  try {
    console.log("Fetching admin stats...")

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      console.error("Users count error:", usersError)
      throw usersError
    }

    console.log("Total users:", totalUsers)

    // Get active flights
    const { count: activeFlights, error: flightsError } = await supabase
      .from("flights")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (flightsError) {
      console.error("Flights count error:", flightsError)
      throw flightsError
    }

    console.log("Active flights:", activeFlights)

    // Get today's bookings - fix date filter
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const { count: todayBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString())
      .neq("status", "cancelled")

    if (bookingsError) {
      console.error("Bookings count error:", bookingsError)
      throw bookingsError
    }

    console.log("Today's bookings:", todayBookings)

    // Get total revenue - fix the relationship issue
    const { data: revenueData, error: revenueError } = await supabase
      .from("bookings")
      .select(`
        id,
        flights!bookings_flight_id_fkey (
          price
        )
      `)
      .neq("status", "cancelled")

    if (revenueError) {
      console.error("Revenue error:", revenueError)
      // If the specific foreign key doesn't work, try a different approach
      const { data: alternativeRevenueData, error: altRevenueError } = await supabase
        .from("bookings")
        .select("flight_id")
        .neq("status", "cancelled")

      if (altRevenueError) {
        console.error("Alternative revenue error:", altRevenueError)
        // If all else fails, calculate manually
        const totalRevenue = 0 // Fallback
        return {
          data: {
            totalUsers: totalUsers || 0,
            activeFlights: activeFlights || 0,
            todayBookings: todayBookings || 0,
            totalRevenue: totalRevenue,
          },
          error: null,
        }
      }

      // Manual calculation if needed
      let totalRevenue = 0
      if (alternativeRevenueData) {
        const flightIds = [...new Set(alternativeRevenueData.map(b => b.flight_id))]
        const { data: flightPrices } = await supabase
          .from("flights")
          .select("id, price")
          .in("id", flightIds)

        const priceMap = {}
        flightPrices?.forEach(flight => {
          priceMap[flight.id] = flight.price
        })

        totalRevenue = alternativeRevenueData.reduce((sum, booking) => {
          return sum + (priceMap[booking.flight_id] || 0)
        }, 0)
      }

      return {
        data: {
          totalUsers: totalUsers || 0,
          activeFlights: activeFlights || 0,
          todayBookings: todayBookings || 0,
          totalRevenue: totalRevenue,
        },
        error: null,
      }
    }

    const totalRevenue = revenueData?.reduce((sum, booking) => {
      return sum + (booking.flights?.price || 0)
    }, 0) || 0

    console.log("Total revenue:", totalRevenue)

    return {
      data: {
        totalUsers: totalUsers || 0,
        activeFlights: activeFlights || 0,
        todayBookings: todayBookings || 0,
        totalRevenue: totalRevenue,
      },
      error: null,
    }
  } catch (error) {
    console.error("getAdminStats error:", error)
    return { data: null, error }
  }
}

// Get flight bookings for admin
export const getFlightBookings = async (flightId) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        seat_number,
        status,
        booking_date,
        user_id,
        profiles!inner (
          email
        )
      `)
      .eq("flight_id", flightId)
      .neq("status", "cancelled")
      .order("seat_number", { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// export const getFlightBookings = async (flightId) => {
//   try {
//     const { data: bookings, error: bookingsError } = await supabase
//       .from("bookings")
//       .select("id, seat_number, status, created_at, booking_date, user_id")
//       .eq("flight_id", flightId)
//       .neq("status", "cancelled")
//       .order("seat_number", { ascending: true })

//     if (bookingsError) throw bookingsError

//     if (!bookings?.length) return { data: [], error: null }

//     const userIds = [...new Set(bookings.map(b => b.user_id))]
    
    
//     // Add error handling for profiles fetch
//     const { data: profiles, error: profilesError } = await supabase
//       .from("profiles")
//       .select("id, email")
//       .in("id", userIds)

//     // Don't throw error if profiles fetch fails, just log it
//     if (profilesError) {
//       console.warn('Failed to fetch profiles:', profilesError)
//     }

//     const emailMap = {}
//     profiles?.forEach(p => emailMap[p.id] = p.email)

//     const result = bookings.map(booking => ({
//       ...booking,
//       profiles: { email: emailMap[booking.user_id] || 'Unknown' }
//     }))
// console.log('User IDs:', userIds)
// console.log('Profiles fetched:', profiles)
// console.log('Email map:', emailMap)

//     return { data: result, error: null }
//   } catch (error) {
//     return { data: null, error }
//   }
// }

// Get all bookings with flight details for admin
export const getAllBookingsAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles!inner  (
          email
        ),
        flights!bookings_flight_id_fkey (
          flight_number,
          source,
          destination,
          departure_time,
          arrival_time,
          status,
          price
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Update flight status
export const updateFlightStatus = async (flightId, status) => {
  try {
    const { data, error } = await supabase
      .from("flights")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", flightId)
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Notification functions
export const getUserNotifications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const createNotification = async (userId, title, message, type = "info", flightId = null) => {
  try {
    const { data, error } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        title,
        message,
        type,
        flight_id: flightId,
      },
    ])

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Real-time subscriptions
export const subscribeToFlights = (callback) => {
  return supabase
    .channel("flights")
    .on("postgres_changes", { event: "*", schema: "public", table: "flights" }, callback)
    .subscribe()
}

export const subscribeToBookings = (callback) => {
  return supabase
    .channel("bookings")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, callback)
    .subscribe()
}

export const subscribeToNotifications = (userId, callback) => {
  return supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      callback,
    )
    .subscribe()
}

export const unsubscribeFromChannel = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
}
// Popular Indian cities and international destinations
export const CITIES = [
  // Major Indian Cities
  "Mumbai (BOM)",
  "Delhi (DEL)",
  "Bangalore (BLR)",
  "Chennai (MAA)",
  "Kolkata (CCU)",
  "Hyderabad (HYD)",
  "Pune (PNQ)",
  "Ahmedabad (AMD)",
  "Kochi (COK)",
  "Goa (GOI)",
  "Jaipur (JAI)",
  "Lucknow (LKO)",
  "Chandigarh (IXC)",
  "Bhubaneswar (BBI)",
  "Indore (IDR)",
  "Coimbatore (CJB)",
  "Nagpur (NAG)",
  "Vadodara (BDQ)",
  "Thiruvananthapuram (TRV)",
  "Srinagar (SXR)",

  // International Destinations
  "Dubai (DXB)",
  "Singapore (SIN)",
  "London (LHR)",
  "New York (JFK)",
  "Bangkok (BKK)",
  "Kuala Lumpur (KUL)",
  "Hong Kong (HKG)",
  "Tokyo (NRT)",
  "Paris (CDG)",
  "Frankfurt (FRA)",
  "Amsterdam (AMS)",
  "Toronto (YYZ)",
  "Sydney (SYD)",
  "Doha (DOH)",
  "Abu Dhabi (AUH)",
  "Muscat (MCT)",
  "Colombo (CMB)",
  "Kathmandu (KTM)",
  "Male (MLE)",
  "Dhaka (DAC)",
]

// Format price in Indian Rupees
export const formatPrice = (price) => {
  if (!price) return "₹0"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

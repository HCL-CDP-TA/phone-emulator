/**
 * Industry Profiles Configuration
 * Professional industry logos for WhatsApp tester
 */

import { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { industryIcons } from "./industryIcons"

export interface IndustryProfile {
  id: string
  name: string
  icon: ReactElement
  color: string
  colorHex: string
  defaultCompanyName: string
}

export const industryProfiles: IndustryProfile[] = [
  {
    id: "retail",
    name: "Retail / E-commerce",
    icon: industryIcons.retail,
    color: "bg-blue-600",
    colorHex: "#2563eb",
    defaultCompanyName: "Shop Plus",
  },
  {
    id: "restaurant",
    name: "Restaurant / Food",
    icon: industryIcons.restaurant,
    color: "bg-orange-500",
    colorHex: "#f97316",
    defaultCompanyName: "Tasty Bites",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: industryIcons.healthcare,
    color: "bg-green-600",
    colorHex: "#16a34a",
    defaultCompanyName: "Health Hub",
  },
  {
    id: "finance",
    name: "Finance / Banking",
    icon: industryIcons.finance,
    color: "bg-emerald-700",
    colorHex: "#047857",
    defaultCompanyName: "SecureBank",
  },
  {
    id: "travel",
    name: "Travel / Hotel",
    icon: industryIcons.travel,
    color: "bg-sky-500",
    colorHex: "#0ea5e9",
    defaultCompanyName: "Travel Co",
  },
  {
    id: "fitness",
    name: "Fitness / Gym",
    icon: industryIcons.fitness,
    color: "bg-red-500",
    colorHex: "#ef4444",
    defaultCompanyName: "FitLife",
  },
  {
    id: "education",
    name: "Education",
    icon: industryIcons.education,
    color: "bg-indigo-600",
    colorHex: "#4f46e5",
    defaultCompanyName: "LearnHub",
  },
  {
    id: "technology",
    name: "Technology / SaaS",
    icon: industryIcons.technology,
    color: "bg-purple-600",
    colorHex: "#9333ea",
    defaultCompanyName: "TechCo",
  },
  {
    id: "realestate",
    name: "Real Estate",
    icon: industryIcons.realestate,
    color: "bg-teal-600",
    colorHex: "#0d9488",
    defaultCompanyName: "HomeFind",
  },
  {
    id: "delivery",
    name: "Delivery / Logistics",
    icon: industryIcons.delivery,
    color: "bg-amber-600",
    colorHex: "#d97706",
    defaultCompanyName: "FastShip",
  },
  {
    id: "professional",
    name: "Professional Services",
    icon: industryIcons.professional,
    color: "bg-slate-600",
    colorHex: "#475569",
    defaultCompanyName: "ConsultPro",
  },
  {
    id: "beauty",
    name: "Beauty / Salon",
    icon: industryIcons.beauty,
    color: "bg-pink-500",
    colorHex: "#ec4899",
    defaultCompanyName: "GlamSpa",
  },
]

/**
 * Generates a data URL for an industry logo
 * Creates a circular colored background with white icon overlay
 */
export function generateIndustryLogoUrl(industryId: string): string {
  const industry = industryProfiles.find((i) => i.id === industryId)
  if (!industry) return ""

  try {
    // Render icon to SVG string
    const iconMarkup = renderToStaticMarkup(industry.icon)

    // Extract the inner SVG content (paths, etc.)
    const pathMatch = iconMarkup.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
    const iconContent = pathMatch ? pathMatch[1] : ""

    // Create circular avatar with colored background and white icon
    const avatarSvg = `
      <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
        <circle cx="48" cy="48" r="48" fill="${industry.colorHex}" />
        <g transform="translate(32, 32)" fill="white" stroke="white">
          <svg viewBox="0 0 24 24" width="32" height="32">
            ${iconContent}
          </svg>
        </g>
      </svg>
    `.trim()

    // Convert to base64 data URL
    const base64 = Buffer.from(avatarSvg).toString("base64")
    return `data:image/svg+xml;base64,${base64}`
  } catch (error) {
    console.error("Error generating industry logo:", error)
    return ""
  }
}

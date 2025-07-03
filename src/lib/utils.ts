import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for Kenyan Shillings
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format date for display
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

// Format date and time
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Calculate mood score percentage
export function calculateMoodPercentage(score: number): number {
  return ((score - 1) / 4) * 100 // Convert 1-5 scale to 0-100%
}

// Get mood color based on score
export function getMoodColor(score: number): string {
  if (score >= 4) return 'text-green-600'
  if (score >= 3) return 'text-yellow-600'
  if (score >= 2) return 'text-orange-600'
  return 'text-red-600'
}

// Get mood emoji based on score
export function getMoodEmoji(score: number): string {
  if (score >= 4.5) return '😄'
  if (score >= 3.5) return '😊'
  if (score >= 2.5) return '😐'
  if (score >= 1.5) return '😟'
  return '😢'
}

// Validate WhatsApp number format
export function validateWhatsAppNumber(number: string): boolean {
  // Basic validation for international format
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(number)
}

// Format WhatsApp number for display
export function formatWhatsAppNumber(number: string): string {
  if (number.startsWith('whatsapp:')) {
    return number.replace('whatsapp:', '')
  }
  return number
}

// Generate random color for charts
export function generateChartColors(count: number): string[] {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
  ]
  
  const result = []
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length])
  }
  return result
}

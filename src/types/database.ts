export interface Venue {
  id: string
  name: string
  region: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  background_gradient_start?: string
  background_gradient_end?: string
  text_color?: string
}

export interface Team {
  id: string
  session_id: string
  venue_id: string
  team_name: string
  entry_answer?: number
  round1_score: number
  round2_score: number
  bonus_score: number
  total_score: number
  round1_submitted: boolean
  round2_submitted: boolean
  bonus_submitted: boolean
}

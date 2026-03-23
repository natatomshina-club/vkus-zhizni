export type WebinarState = 'locked' | 'can_select' | 'pending' | 'has_access'

export interface WebinarRow {
  id: string
  slug: string
  title: string
  short_desc: string
  full_desc: string
  price: number
  emoji: string
  color_from: string
  color_to: string
  video_id: string | null
  sort_order: number
  is_published: boolean
  content_type: 'webinar' | 'course'
  created_at: string
}

export interface WebinarLesson {
  id: string
  webinar_id: string
  title: string
  video_id: string | null
  sort_order: number
}

export interface WebinarMaterial {
  id: string
  webinar_id: string
  lesson_id: string | null
  type: 'pdf' | 'audio' | 'text'
  title: string
  url: string | null
  content: string | null
  sort_order: number
}

export interface WebinarAccess {
  id: string
  member_id: string
  webinar_id: string
  granted_by: 'status' | 'purchase' | 'admin'
  granted_at: string
}

export interface WebinarSelection {
  id: string
  member_id: string
  webinar_id: string
  status: 'pending' | 'granted'
  selected_at: string
}

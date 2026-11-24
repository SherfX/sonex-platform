export type SocialLink = {
  id: string
  platform: string
  url: string
  label?: string | null
  sort_order?: number | null
}

export const PLACEHOLDER_SOCIAL_LINKS: SocialLink[] = [
  { id: '1', platform: 'whatsapp', url: 'https://wa.me/263700000000', label: 'WhatsApp', sort_order: 1 },
  { id: '2', platform: 'facebook', url: 'https://facebook.com/sonexcontractors', label: 'Facebook', sort_order: 2 },
  { id: '3', platform: 'tiktok', url: 'https://tiktok.com/@sonexcontractors', label: 'TikTok', sort_order: 3 },
  { id: '4', platform: 'x', url: 'https://x.com/sonexcontractors', label: 'X', sort_order: 4 },
  { id: '5', platform: 'linkedin', url: 'https://linkedin.com/company/sonexcontractors', label: 'LinkedIn', sort_order: 5 },
]
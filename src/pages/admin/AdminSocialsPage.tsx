import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { buttonPrimaryClassName, inputClassName } from '../../components/ui/inputStyles'
import { PLACEHOLDER_SOCIAL_LINKS } from '../../lib/social'

const PLATFORMS = ['whatsapp', 'facebook', 'tiktok', 'x', 'linkedin'] as const

type SocialRow = {
  id: string
  platform: string
  url: string
  label: string | null
  sort_order: number
  is_active: boolean
}

export function AdminSocialsPage() {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<SocialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('social_links').select('*').order('sort_order')
    if (data?.length) {
      setRows(data as SocialRow[])
    } else {
      setRows(
        PLACEHOLDER_SOCIAL_LINKS.map((p, i) => ({
          id: p.id,
          platform: p.platform,
          url: p.url,
          label: p.label ?? p.platform,
          sort_order: p.sort_order ?? i + 1,
          is_active: true,
        })),
      )
    }
    setLoading(false)
  }

  function updateRow(id: string, patch: Partial<SocialRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function saveAll() {
    setSaving(true)
    for (const row of rows) {
      if (row.id.length < 30) {
        await supabase.from('social_links').insert({
          platform: row.platform,
          url: row.url,
          label: row.label,
          sort_order: row.sort_order,
          is_active: row.is_active,
        })
      } else {
        await supabase
          .from('social_links')
          .update({
            url: row.url,
            label: row.label,
            sort_order: row.sort_order,
            is_active: row.is_active,
          })
          .eq('id', row.id)
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['social_links'] })
    setSaving(false)
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Public website"
        title="Social links"
        description="URLs for header and footer icons. Changes appear on the public site after save."
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="space-y-3">
          {rows
            .filter((r) => PLATFORMS.includes(r.platform as (typeof PLATFORMS)[number]))
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((row) => (
              <AppCard key={row.platform}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-28 shrink-0">
                    <p className="font-semibold capitalize">{row.platform}</p>
                    <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) => updateRow(row.id, { is_active: e.target.checked })}
                      />
                      Visible
                    </label>
                  </div>
                  <input
                    value={row.url}
                    onChange={(e) => updateRow(row.id, { url: e.target.value })}
                    placeholder="https://…"
                    className={inputClassName}
                  />
                  <input
                    value={row.label || ''}
                    onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    placeholder="Label"
                    className={`${inputClassName} sm:max-w-[10rem]`}
                  />
                </div>
              </AppCard>
            ))}

          <button type="button" onClick={saveAll} disabled={saving} className={buttonPrimaryClassName}>
            {saving ? 'Saving…' : 'Save social links'}
          </button>
        </div>
      )}
    </div>
  )
}
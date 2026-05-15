import { supabase } from '@/lib/supabase'

export const CANDIDATE_PHOTOS_BUCKET = 'candidate-photos'

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  return 'jpg'
}

export function publicUrlFromStoragePath(bucket: string, storagePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  return data.publicUrl
}

/** Extract storage object path after `/object/public/{bucket}/`. */
export function storagePathFromPublicUrl(url: string, bucket = CANDIDATE_PHOTOS_BUCKET): string | null {
  const marker = `/object/public/${bucket}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  try {
    return decodeURIComponent(url.slice(i + marker.length).split('?')[0] ?? '')
  } catch {
    return null
  }
}

/** Upload replaces any prior file at this logical key (candidate id + election folder). */
export async function uploadCandidatePortrait(
  electionId: string,
  candidateId: string,
  file: File,
): Promise<string> {
  const mime = file.type || 'application/octet-stream'
  const ext = extFromMime(mime)
  const storagePath = `${electionId}/${candidateId}.${ext}`

  const { error } = await supabase.storage
    .from(CANDIDATE_PHOTOS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: mime === 'application/octet-stream' ? 'image/jpeg' : mime,
    })

  if (error) throw new Error(error.message)
  return publicUrlFromStoragePath(CANDIDATE_PHOTOS_BUCKET, storagePath)
}

export async function removeCandidatePortrait(publicUrlOrPath: string | null): Promise<void> {
  if (!publicUrlOrPath?.trim()) return
  const trimmed = publicUrlOrPath.trim()
  const path = trimmed.includes('/') && !trimmed.startsWith('http')
    ? trimmed
    : storagePathFromPublicUrl(trimmed, CANDIDATE_PHOTOS_BUCKET)
  if (!path) return

  const { error } = await supabase.storage.from(CANDIDATE_PHOTOS_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

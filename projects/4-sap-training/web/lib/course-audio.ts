const COURSE_AUDIO_LOCAL_PREFIX = "/audio";

function normalizeBaseUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

const courseAudioBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_COURSE_AUDIO_BASE_URL);

export function resolveCourseAudioSrc(src: string | null | undefined) {
  if (!src) return undefined;
  if (!courseAudioBaseUrl) return src;
  if (/^(https?:|blob:|data:)/.test(src)) return src;
  if (src === COURSE_AUDIO_LOCAL_PREFIX) return courseAudioBaseUrl;
  if (src.startsWith(`${COURSE_AUDIO_LOCAL_PREFIX}/`)) {
    return `${courseAudioBaseUrl}${src.slice(COURSE_AUDIO_LOCAL_PREFIX.length)}`;
  }
  return src;
}

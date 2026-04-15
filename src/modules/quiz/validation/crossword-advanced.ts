/** Ảnh gợi ý advanced — tối thiểu 500 KB (spec task-003). */
export const ADVANCED_IMAGE_MIN_BYTES = 500 * 1024;

export function advancedImageTooSmallMessage(): string {
  return `Ảnh gợi ý phải từ ${ADVANCED_IMAGE_MIN_BYTES / 1024} KB trở lên.`;
}

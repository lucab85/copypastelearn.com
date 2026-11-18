/**
 * The free lesson of a course is its first published lesson: the one with the
 * lowest sortOrder, whatever number the course starts at. (Until Nov 2026 the
 * rule was `sortOrder === 0`, which locked the first lesson of the courses
 * whose lessons are numbered from 1.)
 *
 * Pass the course's PUBLISHED lessons, in any order.
 */
export function freeLessonId(
  lessons: readonly { id: string; sortOrder: number }[]
): string | null {
  let first: { id: string; sortOrder: number } | null = null;
  for (const lesson of lessons) {
    if (first === null || lesson.sortOrder < first.sortOrder) first = lesson;
  }
  return first?.id ?? null;
}

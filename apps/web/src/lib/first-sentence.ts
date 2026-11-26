/** Abbreviations whose period does not end a sentence. */
const ABBREVIATIONS = /(?:^|[\s(])(?:e\.g|i\.e|vs|etc|approx|incl|no|fig|mr|mrs|ms|dr|st)\.$/i;

/**
 * The first sentence of a text: what a course page prints under its title.
 * A sentence ends at ".", "!" or "?" followed by a space or the end of the
 * first paragraph, so "Node.js", "v1.36" and "kagent 1.0" do not end one.
 * A text with no sentence end is returned whole (first paragraph).
 */
export function firstSentence(text: string): string {
  const paragraph = text.trim().split(/\n\s*\n/)[0]?.replace(/\s+/g, " ") ?? "";
  const end = /[.!?]["')\]]?(?=\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = end.exec(paragraph)) !== null) {
    const cut = match.index + match[0].length;
    const sentence = paragraph.slice(0, cut);
    if (match[0][0] === "." && ABBREVIATIONS.test(sentence)) continue;
    return sentence;
  }
  return paragraph;
}

/**
 * One identity for Luca Berton and Open Empower in structured data, shared by
 * all of Luca's sites (lucaberton.com, openempower.com, kubernetes.recipes,
 * copypastelearn.com, udienza.com). Keep LUCA_BERTON and OPEN_EMPOWER identical
 * to the copies on the other sites: same @id, name, url, jobTitle and sameAs.
 * Search engines and AI assistants merge nodes by @id, so a different jobTitle
 * or an extra handle here splits the person into two entities.
 */

export const OPEN_EMPOWER = {
  "@type": "Organization",
  "@id": "https://www.openempower.com/#organization",
  name: "Open Empower",
  url: "https://www.openempower.com/",
};

export const LUCA_BERTON = {
  "@type": "Person",
  "@id": "https://lucaberton.com/#person",
  name: "Luca Berton",
  url: "https://lucaberton.com/",
  jobTitle: "Founder and CEO",
  worksFor: { "@id": OPEN_EMPOWER["@id"] },
  sameAs: [
    "https://www.linkedin.com/in/lucaberton/",
    "https://github.com/lucab85",
    "https://bsky.app/profile/lucaberton.bsky.social",
    "https://www.youtube.com/@BertonLuca",
    "https://x.com/TheLucaBerton",
  ],
};

/**
 * CopyPasteLearn as course provider and blog publisher: founded by Luca, with
 * Open Empower as its parent organization. Fixed to the canonical www host so
 * the @id is the same in every environment. The logo is a file that exists
 * (/logo.png, /images/logo.png and /icon-512.png all return 404).
 */
export const COPYPASTELEARN = {
  "@type": "Organization",
  "@id": "https://www.copypastelearn.com/#organization",
  name: "CopyPasteLearn",
  url: "https://www.copypastelearn.com",
  logo: "https://www.copypastelearn.com/icons/icon-512.png",
  sameAs: [
    "https://twitter.com/copypastelearn",
    "https://discord.com/invite/copypastelearn",
  ],
  founder: LUCA_BERTON,
  parentOrganization: OPEN_EMPOWER,
};

/** A post's author: Luca's canonical Person for his name, otherwise a plain Person. */
export function authorEntity(name: string | undefined) {
  if (!name || name === LUCA_BERTON.name) return LUCA_BERTON;
  return { "@type": "Person", name };
}

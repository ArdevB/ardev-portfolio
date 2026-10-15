/**
 * Single source of truth for personal details. Edit this file to change
 * copy, links and skills — every section and SEO tag reads from here.
 */
export const site = {
  name: "Ardev Bajracharya",
  shortName: "ARDEV",
  role: "Full-Stack Developer & AI/ML",
  url: "https://ardevbajracharya.com.np",
  email: "contact@ardevbajracharya.com.np",
  location: "Dharan, Nepal",
  description:
    "Ardev Bajracharya is a full-stack developer from Nepal working across web and AI/ML — building fast, considered products from interface and motion to APIs, databases and models.",
  githubUsername: process.env.GITHUB_USERNAME ?? "ArdevB",
  /** Portrait used in About. Replace with "/portrait.jpg" (in /public) for a custom photo. */
  portrait: `https://avatars.githubusercontent.com/${process.env.GITHUB_USERNAME ?? "ArdevB"}?s=800`,
  socials: [
    { label: "GitHub", href: "https://github.com/ArdevB" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ardev-bajracharya-6076a2314" },
    { label: "Instagram", href: "https://www.instagram.com/bjrchardev/" },
    { label: "Facebook", href: "https://www.facebook.com/ardev.bajracharya.2025" },
  ],
  about:
    "I'm Ardev — a full-stack developer studying Computer Science & Information Technology at Birendra Memorial College, Dharan. I design and build products end to end: interfaces with intent, motion that means something, and the APIs and databases underneath. Lately I'm pulling AI and machine learning into the work, because the best tools feel like they already know you.",
  /** Chronological — the timeline draws top to bottom and ends at "Now". */
  education: [
    {
      mark: "SEE",
      period: "School",
      title: "Schooling up to Grade 10",
      place: "Gyanodaya Secondary English Boarding School",
      chips: ["Grade 10", "SEE"],
    },
    {
      mark: "+2",
      period: "Higher secondary",
      title: "Science — Biology + Mathematics",
      place: "Shree Public High School",
      chips: ["Biology", "Mathematics"],
    },
    {
      mark: "BSc",
      period: "Now",
      title: "BSc. Computer Science & Information Technology",
      place: "Birendra Memorial College, Dharan",
      chips: ["Tribhuvan University", "3rd year"],
      progress: { label: "Semester", current: 6, total: 8 },
    },
  ] as {
    mark: string;
    period: string;
    title: string;
    place: string;
    chips: string[];
    progress?: { label: string; current: number; total: number };
  }[],
  skills: [
    { group: "Frontend", items: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "React Native", "Next.js"] },
    { group: "Backend", items: ["Node.js", "Express", "PHP", "MongoDB", "MySQL", "Firebase"] },
    { group: "Languages", items: ["C", "C++", "C#", "Python"] },
    { group: "Data / ML", items: ["NumPy", "Pandas", "Matplotlib", "scikit-learn"] },
    { group: "Ship", items: ["Git", "GitHub", "Vercel", "cPanel", "WordPress"] },
    { group: "AI tools", items: ["Claude", "Codex", "ChatGPT", "Gemini"] },
    { group: "Business", items: ["Digital Marketing", "Facebook Marketplace", "Excel", "Word"] },
  ],
} as const;

export type Site = typeof site;

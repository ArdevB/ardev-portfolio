import { Suspense } from "react";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { About } from "@/components/sections/About";
import { Education } from "@/components/sections/Education";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { GitHubProjects, GitHubProjectsShell, ProjectsGridSkeleton } from "@/components/sections/GitHubProjects";
import { Activity, ActivityShell, ActivitySkeleton } from "@/components/sections/Activity";
import { Skills } from "@/components/sections/Skills";
import { getProjects } from "@/lib/projects";
import { site } from "@/lib/site";

// ISR: the page is static, re-generated at most hourly or on demand from /admin.
export const revalidate = 3600;

async function Featured() {
  const { featured } = await getProjects();
  return <FeaturedWork projects={featured} />;
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  alternateName: "Ardev",
  url: site.url,
  image: site.portrait,
  email: `mailto:${site.email}`,
  jobTitle: site.role,
  description: site.description,
  address: { "@type": "PostalAddress", addressLocality: "Dharan", addressCountry: "NP" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Birendra Memorial College" },
  knowsAbout: site.skills.flatMap((g) => g.items).slice(0, 20),
  sameAs: site.socials.map((s) => s.href),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <Marquee />
      <About />
      <Education />
      <Suspense fallback={null}>
        <Featured />
      </Suspense>
      <GitHubProjectsShell>
        <Suspense fallback={<ProjectsGridSkeleton />}>
          <GitHubProjects />
        </Suspense>
      </GitHubProjectsShell>
      <ActivityShell>
        <Suspense fallback={<ActivitySkeleton />}>
          <Activity />
        </Suspense>
      </ActivityShell>
      <Skills />
    </>
  );
}

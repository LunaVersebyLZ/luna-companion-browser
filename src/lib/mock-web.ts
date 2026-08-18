export type MockPage = {
  url: string;
  domain: string;
  title: string;
  favicon: string;
  category: string;
  hero?: string;
  sections: { heading: string; body: string }[];
};

export const MOCK_PAGES: MockPage[] = [
  {
    url: "wikipedia.org/wiki/Quantum_mechanics",
    domain: "wikipedia.org",
    title: "Quantum mechanics — Wikipedia",
    favicon: "W",
    category: "Study",
    hero: "Quantum mechanics",
    sections: [
      {
        heading: "Overview",
        body: "Quantum mechanics is a fundamental theory that describes the behaviour of nature at and below the scale of atoms. It is the foundation of all quantum physics, including quantum chemistry, quantum field theory, quantum technology and quantum information science. Classical physics, the collection of theories that existed before quantum mechanics, describes many aspects of nature at an ordinary scale, but is not sufficient for describing them at very small scales.",
      },
      {
        heading: "Wave–particle duality",
        body: "Quantum systems can behave like particles in some experiments and like waves in others. The double-slit experiment shows that a single electron passing through two slits produces an interference pattern over many runs, as though it travelled through both slits at once. Measuring which slit the electron went through destroys the interference pattern — observation changes the outcome.",
      },
      {
        heading: "Superposition and measurement",
        body: "Before measurement, a quantum state can be a superposition of several possible outcomes, each with an amplitude. The Born rule turns those amplitudes into probabilities. Measurement collapses the superposition into a single definite result, and this apparent discontinuity is the core of the measurement problem that interpretations of quantum mechanics try to explain.",
      },
      {
        heading: "Uncertainty principle",
        body: "Heisenberg's uncertainty principle states that the more precisely the position of a particle is known, the less precisely its momentum can be known, and vice versa. This is not a limitation of instruments but a property of the wave-like nature of quantum objects.",
      },
    ],
  },
  {
    url: "arxiv.org/abs/entanglement-review",
    domain: "arxiv.org",
    title: "A Practical Review of Entanglement — arXiv",
    favicon: "A",
    category: "Research",
    hero: "A Practical Review of Entanglement",
    sections: [
      {
        heading: "Abstract",
        body: "We review entanglement as a resource for computation and communication. Two particles are entangled when their joint state cannot be written as a product of individual states; measuring one instantly constrains the other, no matter the distance between them, without transmitting information faster than light.",
      },
      {
        heading: "Bell inequalities",
        body: "Bell's theorem shows that no local hidden-variable theory can reproduce every prediction of quantum mechanics. Experiments consistently violate Bell inequalities, ruling out local realism within the tested loopholes.",
      },
      {
        heading: "Applications",
        body: "Entanglement powers quantum teleportation, dense coding, device-independent cryptography, and the speedups in several quantum algorithms. Preserving entanglement against decoherence remains the central engineering challenge.",
      },
    ],
  },
  {
    url: "notes.luna/study-plan",
    domain: "notes.luna",
    title: "My study plan",
    favicon: "N",
    category: "Study",
    hero: "Study plan — Physics finals",
    sections: [
      {
        heading: "Week 1",
        body: "Wave–particle duality, double-slit experiment, and the Born rule. Do problem set 3. Re-read lecture notes on operators and eigenvalues.",
      },
      {
        heading: "Week 2",
        body: "Entanglement, Bell inequalities, and decoherence. Watch the recorded seminar. Write a one-page summary for each topic and quiz yourself on Friday.",
      },
    ],
  },
  {
    url: "designsystems.dev/soft-ui",
    domain: "designsystems.dev",
    title: "Soft interfaces that still feel precise",
    favicon: "D",
    category: "Work",
    hero: "Soft interfaces that still feel precise",
    sections: [
      {
        heading: "Softness is a hierarchy tool",
        body: "Rounded corners and low-contrast surfaces are not decoration — they tell the eye which elements are containers and which are actions. Keep exactly one high-contrast element per view and let everything else recede.",
      },
      {
        heading: "Motion budget",
        body: "Give each screen a motion budget. Ambient motion should stay under 10% opacity change and 4px of travel; anything larger must be a direct response to an action the user took.",
      },
    ],
  },
  {
    url: "recipes.luna/weeknight-ramen",
    domain: "recipes.luna",
    title: "20-minute weeknight ramen",
    favicon: "R",
    category: "Personal",
    hero: "20-minute weeknight ramen",
    sections: [
      {
        heading: "Ingredients",
        body: "Fresh noodles, chicken stock, miso paste, soy sauce, garlic, ginger, soft-boiled eggs, scallions, chilli oil, and whatever greens are in the fridge.",
      },
      {
        heading: "Method",
        body: "Bloom the garlic and ginger in oil, whisk in miso and stock, simmer for eight minutes. Cook noodles separately so the broth stays clear. Top with eggs, scallions and chilli oil.",
      },
    ],
  },
  {
    url: "launchplan.luna/q3-roadmap",
    domain: "launchplan.luna",
    title: "Q3 roadmap — internal",
    favicon: "L",
    category: "Projects",
    hero: "Q3 roadmap",
    sections: [
      {
        heading: "Milestones",
        body: "Ship the onboarding rewrite by week 4, close the billing migration by week 7, and run the beta with twenty design partners in week 9. Each milestone needs an owner and a written exit criterion.",
      },
      {
        heading: "Risks",
        body: "The billing migration depends on a vendor API that is still in preview. Keep the old path behind a flag until the new one has run clean for two weeks.",
      },
    ],
  },
];

export function findPage(query: string): MockPage {
  const q = query.trim().toLowerCase();
  const hit = MOCK_PAGES.find(
    (p) => p.url.toLowerCase().includes(q) || p.title.toLowerCase().includes(q),
  );
  if (hit) return hit;
  const words = MOCK_PAGES.find((p) =>
    q.split(/\s+/).some((w) => w.length > 3 && p.title.toLowerCase().includes(w)),
  );
  return words ?? MOCK_PAGES[0];
}

export function pageText(page: MockPage) {
  return page.sections.map((s) => `${s.heading}. ${s.body}`).join("\n\n");
}

export type GlossaryEntry = {
  term: string;
  meaning: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Area Manager",
    meaning:
      "Front-line warehouse people leader. You run the shift: safety, quality, rate, coaching, and handoff.",
  },
  {
    term: "3PL (third-party logistics)",
    meaning:
      "A company that runs warehousing and shipping for other brands. This demo uses a fictional Canadian 3PL site.",
  },
  {
    term: "SQDC",
    meaning:
      "Safety, Quality, Delivery (hitting volume on time), Cost. In that order. You do not buy rate with injuries or bad quality.",
  },
  {
    term: "Min 15 / huddle",
    meaning:
      "A short stand-up at the start of the shift (about 10 to 15 minutes): today's goal, safety focus, who is missing, what carried over.",
  },
  {
    term: "Handoff",
    meaning:
      "The note you leave the next Area Manager: what is open, what is risky, what they should do first.",
  },
  {
    term: "PIT (powered industrial truck)",
    meaning:
      "Forklifts and powered pallet jacks. Only designated, trained people can work a live dock door.",
  },
  {
    term: "WHMIS",
    meaning:
      "Canada's chemical-hazard training. Required before handling certain freight on the dock.",
  },
  {
    term: "ESA overtime",
    meaning:
      "Ontario Employment Standards Act: most warehouse staff get 1.5x pay after 44 hours in a week.",
  },
  {
    term: "UPH",
    meaning:
      "Units per hour. How fast a path processes work. This demo uses realistic mixed 3PL rate bands.",
  },
  {
    term: "Call-out",
    meaning:
      "Someone scheduled does not show. Volume stays the same. You solve it with labor moves.",
  },
  {
    term: "Gemba walk",
    meaning:
      "Go look on the actual floor. The warning list on the right is your Gemba checklist.",
  },
  {
    term: "5-why / RCA",
    meaning:
      "Root-cause analysis: ask why until you get past the surface. Containment now, corrective action tomorrow.",
  },
  {
    term: "Dock / stow / pick / pack",
    meaning:
      "Dock = trucks in. Stow = put away. Pick = pull for orders. Pack = box for ship. Inbound-heavy areas live on dock and stow.",
  },
];

export const TOUR_STEPS = [
  {
    title: "1. Start on the Floor tab",
    body: "Four paths show headcount vs need. Red numbers mean you are short for this hour's volume.",
  },
  {
    title: "2. Read the SQDC strip",
    body: "Safety, then Quality, then Delivery, then Cost. If Safety is red, fix people placement before chasing rate.",
  },
  {
    title: "3. Use the hour slider",
    body: "Move to 10:00 on the sample shift. Trucks bunch and Door 4 has damaged freight.",
  },
  {
    title: "4. Move people",
    body: "Click a name, then click a path header. The tool warns if PIT or training rules break.",
  },
  {
    title: "5. Open Huddle and Handoff",
    body: "Those tabs are generated from the board. Change the floor and the text updates.",
  },
  {
    title: "6. Read How it was made",
    body: "See the real data sources and what was simulated for this fictional warehouse demo.",
  },
];

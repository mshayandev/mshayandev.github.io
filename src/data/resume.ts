export interface TimelineItem {
  title: string;
  org?: string;
  period?: string;
  points: string[];
}

export const education: TimelineItem[] = [
  {
    title: "B.E. Telecommunication Engineering",
    org: "NED University of Engineering & Technology, Karachi",
    period: "Sep 2022 — Aug 2026",
    points: [
      "Final-year project: SHARC (Self-Healing Anti-Jamming Radio Communication) using AI cognitive defense.",
    ],
  },
  {
    title: "Advanced Diploma in Software Engineering (ACCP Prime 2.0)",
    org: "Aptech, Karachi",
    period: "Sep 2022 — Sep 2025",
    points: ["Programming, AI foundations, and full-stack development."],
  },
  {
    title: "Intermediate in Computer Science",
    org: "Habib Public School, Karachi",
    period: "Aug 2020 — Aug 2022",
    points: [],
  },
];

export const experience: TimelineItem[] = [
  {
    title: "IoT Web Development Intern",
    org: "Azfam Technologies, Karachi",
    period: "Dec 2025 — Jan 2026",
    points: [
      "Engineered an IoT-based AC system that cut on-site interventions by 60% and enabled 24/7 remote access.",
      "Built a real-time Firebase dashboard with sub-second latency across 10+ connected devices.",
      "Shipped a responsive UI that brought average response time from 15 minutes to under 2 minutes.",
    ],
  },
  {
    title: "Technical Leadership",
    points: [
      "Manager Technical — TE LINKS.",
      "Mentor, Web Development — SENTEC NED Chapter.",
      "Co-Director — NED Evolve '25 & '26 (Esports events).",
      "Technical Manager — CLIMATECH 2025 (2nd International Conference on Technology-Driven Climate Action).",
    ],
  },
  {
    title: "Freelance — Web & Design",
    org: "Fiverr",
    points: [
      "Delivered web and design work (social graphics, logo design) using Adobe tools, with clear client communication end to end.",
    ],
  },
];

export const achievements: string[] = [
  "TechWiz 5 — IoT Competition Winner (2024)",
  "TechWiz 6 — IoT Competition 2nd Runner-Up (2025)",
  "TechWiz 4 — Data Science Competition, Top 6 Team (2023)",
  "Industrial visit — RADAR ACC, Pakistan Airports Authority (CNS, radar & ATC systems)",
];

export const certifications: string[] = [
  "Innovating with Google Cloud Artificial Intelligence — Google Cloud",
  "Introduction to Front-End Development — Meta",
  "AI & Deep Learning Concepts and Applications — SimpliLearn",
];

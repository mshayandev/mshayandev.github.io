export type Category = "iot" | "web" | "design";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  title: string;
  category: Category;
  /** Short kicker shown on the card, e.g. "AI · Wireless" */
  domain: string;
  status?: string;
  /** One- or two-line card summary */
  summary: string;
  /** Longer paragraphs for the detail page */
  description: string[];
  /** Concrete, verifiable outcomes — the numbers that prove the work */
  highlights?: string[];
  tech: string[];
  award?: string;
  role?: string;
  org?: string;
  /** Public image under /public, or null to render the generated placeholder */
  image: string | null;
  url?: ProjectLink | null;
  repo?: string | null;
  featured?: boolean;
  /** Whether to generate a /projects/<slug>/ detail page */
  hasDetail?: boolean;
}

export const projects: Project[] = [
  {
    slug: "sharc",
    title: "SHARC — Self-Healing Anti-Jamming Radio",
    category: "iot",
    domain: "AI · Wireless",
    status: "Final year project · ongoing",
    summary:
      "A cognitive radio framework that detects jamming and adapts its link parameters on the fly to stay connected in contested RF conditions.",
    description: [
      "SHARC is my final year project: a self-healing anti-jamming radio communication framework. It uses AI-driven cognitive defense to detect interference, adapt communication parameters in real time, and keep the link alive when the spectrum is being attacked.",
      "The system continuously senses the channel, classifies interference patterns, and reconfigures its transmission strategy to route around jamming — the kind of resilience that matters for safety-critical and defense wireless systems.",
    ],
    highlights: [
      "Real-time interference detection and channel sensing",
      "Adaptive parameter switching to maintain link reliability",
      "Cognitive-defense approach grounded in wireless communications research",
    ],
    tech: ["Python", "Machine Learning", "SDR", "Wireless Comms", "Signal Processing"],
    image: null,
    featured: true,
    hasDetail: true,
  },
  {
    slug: "doorcam",
    title: "DoorCam — Smart Security System",
    category: "iot",
    domain: "IoT · Computer Vision",
    summary:
      "Facial-recognition door security with multi-sensor fusion and instant SMS/push alerts.",
    description: [
      "A facial-recognition based smart security system that identifies known users at the door and raises an instant alert on anyone it doesn't recognise.",
      "It fuses PIR, ultrasonic, and LDR sensors to cut false triggers, and wires up Twilio plus push notifications so incidents reach you within seconds.",
    ],
    highlights: [
      "97% recognition accuracy across 50+ enrolled users",
      "Sub-2s identification time",
      "Multi-sensor fusion reduced false positives by 80%",
      "Twilio SMS + push alerts delivered within 3 seconds",
    ],
    tech: ["Python", "OpenCV", "Flask", "Firebase", "Twilio", "Raspberry Pi 4B"],
    award: "2nd Runner-Up — International IoT Ignite 2025 (APTECH)",
    image: null,
    repo: "https://github.com/TechWizardsTechwiz6/Wavebell",
    featured: true,
    hasDetail: true,
  },
  {
    slug: "weatherninja",
    title: "WeatherNinja — Smart Monitoring Station",
    category: "iot",
    domain: "IoT · Sensors",
    summary:
      "A five-sensor weather station with automated logging and extreme-weather SMS alerts.",
    description: [
      "A smart monitoring station built around five sensors tracking temperature, humidity, pressure, rain, and light.",
      "It replaced manual logging with a reliable automated pipeline and pushes extreme-weather alerts over SMS, so nobody has to watch a dashboard to stay safe.",
    ],
    highlights: [
      "99.9% data-capture uptime",
      "Extreme-weather alerts delivered within 5 seconds via SMS",
      "Five-sensor array: temperature, humidity, pressure, rain, light",
    ],
    tech: ["Python", "Firebase", "Raspberry Pi 4B", "DHT11", "BMP280", "YL-83"],
    award: "Winner — Global IoT Solution Development (APTECH 2024)",
    image: null,
    repo: "https://github.com/MohammadShayan1/techwiz",
    featured: true,
    hasDetail: true,
  },
  {
    slug: "iot-ac-control",
    title: "IoT-Based AC Control System",
    category: "iot",
    domain: "IoT · Internship",
    summary:
      "An ESP32 + Firebase system that automates office climate control with a real-time web dashboard.",
    description: [
      "Built during my internship at Azfam Technologies: an IoT-based AC control system that automates manual climate operations and adds full remote access.",
      "The focus was real-time monitoring, low response time, and a responsive dashboard that operators can drive from any device across multiple connected units.",
    ],
    highlights: [
      "Cut on-site interventions by 60% with 24/7 remote access",
      "Sub-second sensor latency across 10+ connected devices",
      "Average response time dropped from 15 minutes to under 2 minutes",
    ],
    tech: ["ESP32", "Firebase", "IoT", "Web Dashboard", "JavaScript"],
    org: "Azfam Technologies, Karachi",
    image: null,
    featured: true,
    hasDetail: true,
  },
  {
    slug: "ned-dil",
    title: "NED DIL — Industry Liaison Platform",
    category: "web",
    domain: "Full-Stack Web",
    summary:
      "A university–industry platform handling internship applications and final-year project submissions at scale.",
    description: [
      "A full-stack platform for NED's Directorate of Industrial Liaison that connects students with industry.",
      "It streamlined internship intake and final-year project (FYDP) submissions, with SEO work to make opportunities discoverable.",
    ],
    highlights: [
      "Processed 500+ internship applications",
      "Reduced administrative workload by 70%",
      "Supported 200+ final-year project submissions",
    ],
    tech: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
    image: null,
    repo: "https://github.com/MohammadShayan1/NEDDIL-main",
    featured: true,
    hasDetail: true,
  },
  {
    slug: "telinks",
    title: "TE Links — Society Website",
    category: "web",
    domain: "Organization Web",
    summary:
      "A responsive 7-page society website I led the technical build for as Manager Technical.",
    description: [
      "As Manager Technical at TE LINKS, I led development of the society's responsive website.",
      "It scaled how the society communicates with members and supported activities for an active student community.",
    ],
    highlights: [
      "7-page responsive site",
      "Supported activities for 100+ active students",
      "Improved online engagement and member communication",
    ],
    tech: ["HTML", "Bootstrap", "JavaScript", "PHP", "MySQL", "AOS"],
    role: "Manager Technical",
    image: null,
    url: { label: "telinks.org", href: "https://telinks.org" },
    hasDetail: true,
  },
  {
    slug: "nedmun",
    title: "NEDMUN-VI — Registration Platform",
    category: "web",
    domain: "Event System",
    summary:
      "A delegate registration system with dual flows, admin analytics, and CSV export.",
    description: [
      "A digital registration platform for NEDMUN-VI with dual delegate flows and a real-time admin view.",
      "It cut the manual overhead of running registrations and gave organisers live numbers plus CSV export.",
    ],
    highlights: [
      "Processed 300+ registrations with zero data loss",
      "Real-time admin analytics + CSV export",
      "Cut registration management overhead by 50%",
    ],
    tech: ["HTML", "Bootstrap", "PHP", "MySQL"],
    image: null,
    url: { label: "nedmun.telinks.org", href: "https://nedmun.telinks.org" },
    hasDetail: true,
  },
  {
    slug: "pleasant-tours",
    title: "Pleasant Tours",
    category: "web",
    domain: "Web · Freelance",
    summary:
      "A tourism services website connecting travellers with destinations worldwide.",
    description: [
      "A website for Pleasant Tours, a tourism services brand, linking customers with destinations across the globe.",
    ],
    tech: ["HTML", "CSS", "JavaScript"],
    image: "/assets/img/portfolio/pleasant-tours-black.webp",
    url: {
      label: "View site",
      href: "https://mshayandev.github.io/PORTFOLIO1/websites/Eproject/index.html",
    },
    hasDetail: true,
  },
  {
    slug: "weather-app",
    title: "Weather App",
    category: "web",
    domain: "Web",
    summary:
      "A browser-based app for real-time weather conditions and forecasts.",
    description: [
      "A web-based weather app that surfaces real-time conditions and forecasts straight in the browser, built to practise API integration and clean UI.",
    ],
    tech: ["HTML", "CSS", "JavaScript", "Weather API"],
    image: null,
    url: { label: "Open app", href: "https://mshayandev.github.io/weather-app/" },
    hasDetail: true,
  },
  {
    slug: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    category: "web",
    domain: "Web · Game",
    summary: "A simple two-player Tic-Tac-Toe game built for the web.",
    description: [
      "A classic two-player Tic-Tac-Toe game — a small project for practising game state and DOM interaction.",
    ],
    tech: ["HTML", "CSS", "JavaScript"],
    image: "/assets/img/portfolio/tic-tac-toe.webp",
    hasDetail: true,
  },
  {
    slug: "web-portfolio-collection",
    title: "Web Development Collection",
    category: "web",
    domain: "Multi-Project",
    summary:
      "A growing collection of responsive front-end builds from learning, freelance, and volunteer work.",
    description: [
      "A growing collection of web projects built for learning, freelance delivery, and practical problem solving — responsive UIs, interactive features, and front-end implementations across different domains.",
    ],
    tech: ["HTML", "CSS", "JavaScript", "Bootstrap"],
    image: null,
    hasDetail: true,
  },
  {
    slug: "chris-hemsworth",
    title: "Chris Hemsworth — Digital Painting",
    category: "design",
    domain: "Digital Art",
    summary: "A digital portrait painting.",
    description: [],
    tech: ["Adobe Photoshop"],
    image: "/assets/img/portfolio/Chris.webp",
    hasDetail: false,
  },
  {
    slug: "skull-illustration",
    title: "Skull — Digital Illustration",
    category: "design",
    domain: "Illustration",
    summary: "A digital skull illustration.",
    description: [],
    tech: ["Adobe Illustrator"],
    image: "/assets/img/portfolio/Skull.webp",
    hasDetail: false,
  },
  {
    slug: "eid-tag",
    title: "Eid Mubarak — Greeting Tag",
    category: "design",
    domain: "Graphic Design",
    summary: "A festive Eid greeting tag design.",
    description: [],
    tech: ["Adobe Photoshop"],
    image: "/assets/img/portfolio/tag.webp",
    hasDetail: false,
  },
];

export const categoryLabels: Record<Category, string> = {
  iot: "IoT & Hardware",
  web: "Web",
  design: "Design",
};

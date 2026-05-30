export const profile = {
  name: "Mohammad Shayan",
  /** Short role line used in the hero and meta */
  role: "IoT & Full-Stack Developer",
  location: "Karachi, Pakistan",
  email: "mohammadshayan105@gmail.com",
  resume: "/assets/Mohammad%20Shayan.pdf",
  portrait: "/assets/img/cvpic.webp",
  birthday: "2004-09-30",

  /** Hero headline + supporting line — written in a plain, first-person voice */
  headline: "I build things that connect the physical and digital worlds.",
  intro:
    "Final-year Telecommunication Engineering student at NED University. I work across IoT and embedded systems, full-stack web, and the AI side of wireless communications — turning sensors, boards, and back-ends into systems people actually use.",

  /** About-section body */
  about: [
    "I'm a final-year Telecommunication Engineering undergraduate at NED University, Karachi. Most of what I build sits at the seam between hardware and software — an ESP32 reading sensors, a Firebase dashboard showing the data, a web app tying it together.",
    "I've taken IoT projects from breadboard to award-winning prototypes, shipped full-stack platforms that handle hundreds of real users, and I'm now spending my final year on SHARC — an AI-driven anti-jamming radio system. I like problems where the answer has to work in the real world, not just on a slide.",
  ],

  /** Real, defensible numbers — no filler counters */
  stats: [
    { value: "10+", label: "Projects shipped" },
    { value: "3", label: "IoT competition podiums" },
    { value: "4+", label: "Years building" },
    { value: "5+", label: "Leadership & volunteer roles" },
  ],

  socials: {
    github: "https://github.com/mshayandev",
    linkedin: "https://www.linkedin.com/in/mohammad-shayan786",
    instagram: "https://www.instagram.com/mohd_shayan_official",
  },
};

export interface FocusArea {
  title: string;
  body: string;
  icon: string; // emoji or short glyph; swap for SVG later if desired
}

export const focusAreas: FocusArea[] = [
  {
    title: "IoT & Embedded Systems",
    icon: "⚡",
    body: "ESP32, Raspberry Pi, and STM32 builds — multi-sensor fusion, real-time dashboards, and devices that do something useful in the physical world.",
  },
  {
    title: "Full-Stack Web",
    icon: "</>",
    body: "Responsive front-ends with PHP/MySQL or Firebase back-ends — from society sites to registration systems that handle hundreds of real users.",
  },
  {
    title: "AI for Wireless",
    icon: "📡",
    body: "Applying machine learning to wireless communications: interference detection, adaptive radio, and the signal-processing side of my final-year work.",
  },
];

export interface SkillGroup {
  group: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  { group: "Languages", items: ["C", "C++", "Python", "JavaScript", "PHP", "Dart", "Embedded C", "Verilog"] },
  { group: "Frontend", items: ["HTML5", "CSS3", "React", "Bootstrap"] },
  { group: "Backend & Data", items: ["PHP", "Django", "MySQL", "MongoDB", "SQL Server", "Firebase"] },
  { group: "IoT & Hardware", items: ["ESP32", "STM32", "FPGA", "Raspberry Pi", "Arduino", "Quartus"] },
  { group: "Tools & Cloud", items: ["Git", "Linux", "Azure", "MATLAB", "Chart.js"] },
  { group: "Design", items: ["Figma", "Photoshop", "Illustrator", "Adobe XD"] },
];

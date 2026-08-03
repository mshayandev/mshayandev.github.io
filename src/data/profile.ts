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
    "IoT and embedded systems, and the full-stack web apps that drive them — sensors and boards on one end, dashboards and back-ends on the other. Final-year Telecommunication Engineering at NED University, with a research year on AI for wireless.",

  /** About-section body */
  about: [
    "I'm a final-year Telecommunication Engineering undergraduate at NED University, Karachi. Most of what I build sits at the seam between hardware and software — an ESP32 reading sensors, a Firebase dashboard showing the data, a web app tying it together.",
    "I've taken IoT projects from breadboard to award-winning prototypes, shipped full-stack platforms that handle hundreds of real users, and I'm now spending my final year on SHARC — an AI-driven anti-jamming radio system. I like problems where the answer has to work in the real world, not just on a slide.",
  ],

  /** Real, defensible numbers — no filler counters */
  stats: [
    { value: "10+", label: "Projects shipped" },
    { value: "2", label: "IoT competition podiums" },
    { value: "4+", label: "Years building" },
    { value: "5+", label: "Leadership & volunteer roles" },
  ],

  socials: {
    github: "https://github.com/mshayandev",
    linkedin: "https://www.linkedin.com/in/mshayandev",
    instagram: "https://www.instagram.com/mohd_shayan_official",
  },
};

export interface FocusArea {
  title: string;
  body: string;
  /** Key into the Icon component's sprite. */
  icon: "chip" | "code" | "signal";
}

export const focusAreas: FocusArea[] = [
  {
    title: "IoT & Embedded Systems",
    icon: "chip",
    body: "ESP32, STM32 and Raspberry Pi builds — multi-sensor fusion, firmware, and devices that hold up outside the lab. Two of these placed at national and international IoT competitions.",
  },
  {
    title: "Full-Stack Web",
    icon: "code",
    body: "The software layer around the hardware, and platforms in their own right — PHP/MySQL and Firebase back-ends, responsive front-ends, and systems that have processed 500+ real applications.",
  },
  {
    title: "Research — AI for Wireless",
    icon: "signal",
    body: "My final year: machine learning applied to interference detection and adaptive radio, running on-device as part of SHARC.",
  },
];

export interface SkillGroup {
  group: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  { group: "IoT & Hardware", items: ["ESP32", "STM32", "Raspberry Pi", "Arduino", "LoRa", "RTOS"] },
  { group: "Languages", items: ["C", "C++", "Embedded C", "Python", "JavaScript", "PHP", "Dart"] },
  { group: "Frontend", items: ["HTML5", "CSS3", "React", "Bootstrap"] },
  { group: "Backend & Data", items: ["PHP", "Django", "MySQL", "MongoDB", "SQL Server", "Firebase"] },
  { group: "Tools & Cloud", items: ["Git", "Linux", "Azure", "MATLAB", "Chart.js"] },
  { group: "Design", items: ["Figma", "Photoshop", "Illustrator", "Adobe XD"] },
];

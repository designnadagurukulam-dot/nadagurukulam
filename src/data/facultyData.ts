import directorImg from "@/assets/founders/SmtRevathiRamachandran.webp";
import drNeelamPatel from "@/assets/faculty/Dr-Neelam-Patel.jpg";
import msNayanaShivaram from "@/assets/faculty/Ms-Nayana-Shivaram.jpg";
import msRanjaniVenkatesh from "@/assets/faculty/Ms-Ranjani-Venkatesh.jpg";
import mrMangaliTirumala from "@/assets/faculty/Mr-Mangali-Tirumala.jpg";
import mrPranavKashyap from "@/assets/faculty/Mr-Pranav-Kashyap.jpg";
import mrSujanHN from "@/assets/faculty/Mr-Sujan-H-N.jpg";
import msShailajaKumari from "@/assets/faculty/Ms-Shailaja-Kumari-A.jpg";
import mrAbhiramaBode from "@/assets/faculty/Mr-Abhirama-Bode.jpg";
import mrPrafullaKumar from "@/assets/faculty/Mr-Prafulla-Kumar-Meher.jpg";
import mrShreeramaBhat from "@/assets/faculty/Mr-Shreerama-Bhat.jpg";

export interface FacultyMember {
  id: string;
  name: string;
  title: string;
  specialization: string;
  category: string;
  experience: string;
  bio: string;
  education: string[];
  awards: string[];
  image: string;
}

export const facultyMembers: FacultyMember[] = [
  {
    id: "revathi-ramachandran",
    name: "Smt. Revathi Ramachandran",
    title: "Director & Lead Faculty",
    specialization: "Carnatic Vocal",
    category: "carnatic",
    experience: "25+ years",
    bio: "A distinguished Carnatic vocalist and educator, Smt. Revathi Ramachandran has dedicated her life to preserving and propagating the rich tradition of South Indian classical music. As the Director of Nada Gurukulam, she brings unparalleled depth of knowledge and a nurturing teaching philosophy rooted in the Guru-Shishya Parampara.",
    education: ["B.A. Music — University of Madras", "M.A. Carnatic Music — Sri Venkateswara University", "Ph.D. — Musicology"],
    awards: ["Sangeet Natak Akademi Award", "Kalaimamani Title"],
    image: directorImg,
  },
  {
    id: "neelam-patel",
    name: "Dr. Neelam Patel",
    title: "Senior Faculty",
    specialization: "Carnatic Vocal",
    category: "carnatic",
    experience: "20+ years",
    bio: "Dr. Neelam Patel is a seasoned Carnatic vocalist and musicologist whose research and performance have enriched the classical music landscape. Her methodical approach to raga exploration and her ability to connect ancient texts with modern pedagogy make her classes deeply insightful.",
    education: ["M.A. Music — University of Madras", "Ph.D. in Musicology"],
    awards: ["Best Researcher Award — Music Academy"],
    image: drNeelamPatel,
  },
  {
    id: "nayana-shivaram",
    name: "Ms. Nayana Shivaram",
    title: "Faculty",
    specialization: "Bharatanatyam",
    category: "bharatanatyam",
    experience: "15+ years",
    bio: "Ms. Nayana Shivaram is a graceful Bharatanatyam dancer whose performances blend traditional Tanjore-style abhinaya with expressive contemporary choreography. She is passionate about instilling discipline and devotion in her students through the ancient temple dance form.",
    education: ["B.F.A. Bharatanatyam — Kalakshetra", "M.A. Performing Arts"],
    awards: ["Natya Shiromani Award", "Young Artist Fellowship"],
    image: msNayanaShivaram,
  },
  {
    id: "ranjani-venkatesh",
    name: "Ms. Ranjani Venkatesh",
    title: "Faculty",
    specialization: "Carnatic Vocal",
    category: "carnatic",
    experience: "12+ years",
    bio: "Ms. Ranjani Venkatesh brings a vibrant energy to Carnatic vocal instruction. Trained under renowned masters, she has a deep understanding of raga aesthetics and tala patterns, making complex musical concepts accessible to learners at all levels.",
    education: ["B.Mus — University of Mysore", "M.Mus — Carnatic Vocal"],
    awards: ["A-Grade Artist — All India Radio"],
    image: msRanjaniVenkatesh,
  },
  {
    id: "mangali-tirumala",
    name: "Mr. Mangali Tirumala",
    title: "Faculty",
    specialization: "Mridangam",
    category: "instrumental",
    experience: "18+ years",
    bio: "Mr. Mangali Tirumala is a consummate mridangam artist known for his rhythmic precision, dynamic stage presence, and innovative approach to percussion pedagogy. His classes emphasize both technical mastery and the spiritual dimension of laya.",
    education: ["Diploma in Mridangam — Karnataka College of Percussion", "M.Mus — University of Mysore"],
    awards: ["Best Accompanist Award — Music Academy", "CCRT Fellowship"],
    image: mrMangaliTirumala,
  },
  {
    id: "pranav-kashyap",
    name: "Mr. Pranav Kashyap",
    title: "Faculty",
    specialization: "Hindustani Vocal",
    category: "hindustani",
    experience: "10+ years",
    bio: "Mr. Pranav Kashyap is a dynamic Hindustani vocalist trained in the Gwalior Gharana tradition. His powerful renditions of khayal and his ability to connect emotionally with audiences make him an inspiring teacher and performer.",
    education: ["Sangeet Visharad — Gandharva Mahavidyalaya", "M.A. Music — SNDT University"],
    awards: ["Kumar Gandharva Samman Nominee"],
    image: mrPranavKashyap,
  },
  {
    id: "sujan-h-n",
    name: "Mr. Sujan H N",
    title: "Faculty",
    specialization: "Instrumental",
    category: "instrumental",
    experience: "12+ years",
    bio: "Mr. Sujan H N is a versatile instrumentalist whose mastery spans multiple classical instruments. His teaching style emphasizes the meditative quality of instrumental music and helps students develop a deep personal connection with their chosen instrument.",
    education: ["B.Mus — Karnataka University", "Advanced Diploma in Instrumental Music"],
    awards: ["Young Talent Award"],
    image: mrSujanHN,
  },
  {
    id: "shailaja-kumari",
    name: "Ms. Shailaja Kumari A",
    title: "Faculty",
    specialization: "Bharatanatyam",
    category: "bharatanatyam",
    experience: "14+ years",
    bio: "Ms. Shailaja Kumari A is an accomplished Bharatanatyam artist whose performances are marked by exquisite grace and emotional depth. She is committed to preserving the purity of the Tanjore tradition while making the art form accessible to a new generation of dancers.",
    education: ["B.F.A. Bharatanatyam", "M.A. Dance — University of Hyderabad"],
    awards: ["Natya Kala Acharya"],
    image: msShailajaKumari,
  },
  {
    id: "abhirama-bode",
    name: "Mr. Abhirama Bode",
    title: "Faculty",
    specialization: "Tabla",
    category: "instrumental",
    experience: "10+ years",
    bio: "Mr. Abhirama Bode is a dynamic tabla artist of the Benares Gharana, bringing energy, innovation, and deep rhythmic understanding to traditional tabla pedagogy. His classes are lively and focus on building both technique and musical sensitivity.",
    education: ["B.Mus Tabla — Banaras Hindu University", "M.Mus — Delhi University"],
    awards: ["Ustad Bismillah Khan Yuva Puraskar Nominee"],
    image: mrAbhiramaBode,
  },
  {
    id: "prafulla-kumar-meher",
    name: "Mr. Prafulla Kumar Meher",
    title: "Faculty",
    specialization: "Hindustani Vocal",
    category: "hindustani",
    experience: "15+ years",
    bio: "Mr. Prafulla Kumar Meher is a soulful Hindustani vocalist whose music reflects deep devotion and technical refinement. His patient and encouraging teaching approach helps students of all backgrounds discover the beauty of raga-based music.",
    education: ["M.A. Hindustani Music", "Sangeet Prabhakar"],
    awards: ["State Music Award"],
    image: mrPrafullaKumar,
  },
  {
    id: "shreerama-bhat",
    name: "Mr. Shreerama Bhat",
    title: "Faculty",
    specialization: "Carnatic Vocal",
    category: "carnatic",
    experience: "16+ years",
    bio: "Mr. Shreerama Bhat is an esteemed Carnatic vocalist known for his melodious renditions and deep understanding of raga bhava. His structured teaching methodology ensures students build a strong foundation in sruti, laya, and sahitya.",
    education: ["B.Mus — University of Mysore", "M.Mus — Carnatic Music"],
    awards: ["Sangeetha Seva Ratna"],
    image: mrShreeramaBhat,
  },
];

export const categories = [
  { value: "all", label: "All Faculty" },
  { value: "carnatic", label: "Carnatic" },
  { value: "hindustani", label: "Hindustani" },
  { value: "bharatanatyam", label: "Bharatanatyam" },
  { value: "instrumental", label: "Instrumental" },
];

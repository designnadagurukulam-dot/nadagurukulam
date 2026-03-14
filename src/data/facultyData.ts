import directorImg from "@/assets/founders/SmtRevathiRamachandran.webp";
import drNeelamPatel from "@/assets/faculty/Dr-Neelam-Patel.jpg";
import msNayanaShivaram from "@/assets/faculty/Ms-Nayana-Shivaram.jpg";
import msRanjaniVenkatesh from "@/assets/faculty/Ms-Ranjani-Venkatesh.jpg";
import mrMangaliTirumala from "@/assets/faculty/Mr-Mangali-Tirumala.jpg";
import mrPranavKashyap from "@/assets/faculty/Mr-Pranav-Kashyap.jpg";
import mrSujanHN from "@/assets/faculty/Mr-Sujan-H-N.jpg";
import msShailajaKumari from "@/assets/faculty/Ms-Shailaja-Kumari-A.jpg";

import mrPrafullaKumar from "@/assets/faculty/Mr-Prafulla-Kumar-Meher.jpg";
import mrShreeramaBhat from "@/assets/faculty/Mr-Shreerama-Bhat.jpg";
import msManasvini from "@/assets/faculty/Ms-Manasvini-Ramachandran.webp";
import drDundayya from "@/assets/faculty/Dr-Dundayya-Pujer.jpg";
import mrSrinivas from "@/assets/faculty/Mr-Srinivas-Viswanadha.webp";

export interface FacultyMember {
  id: string;
  name: string;
  title: string;
  specialization: string;
  category: string;
  experience: string;
  bio: string;
  education: string[];
  experienceDetails: string[];
  specialities: string[];
  awards: string[];
  image: string;
}

export const facultyMembers: FacultyMember[] = [
  {
    id: "revathi-ramachandran",
    name: "Smt Revathi Ramachandran",
    title: "Director, Nada Gurukulam",
    specialization: "Dance - Bharatanatyam",
    category: "dance",
    experience: "50+ years",
    bio: "Revathi Ramachandran is an acclaimed Bharatanatyam dancer, Guru, choreographer, scholar, and arts administrator, celebrated as a torchbearer of the Melattur bani. A direct disciple of Guru Mangudi Dorairaja Iyer, she has over 50 years in the art, with parallel training as a Vainika (Veena), Kuchipudi dancer, and Nattuvanar. She is ICCR-empanelled and Graded \"A\" by Doordarshan, with performances across the USA, UK, Europe, Australia, Singapore, and Armenia. She founded and leads Kala Sadhanalaya (1987–Present), dedicated to training and research in the Melattur tradition, and is a student of Swami Dayananda Saraswati in Advaita Vedanta. Her work consistently advances the preservation, pedagogy, and propagation of India's cultural heritage.",
    education: [
      "M.F.A. (Bharatanatyam) – SASTRA University",
      "M.A. (Economics) – University of Madras",
      "Government of Tamil Nadu Technical Diplomas (Lower & Higher Grades): Bharatanatyam; Carnatic Music (Veena)",
      "Bharatanatyam (Melattur bani) – Guru Mangudi Dorairaja Iyer",
      "Nattuvangam – Guru Bhagavatula Sitarama Sharma",
      "Veena – Smt. Kalpagam Swaminathan",
      "Kuchipudi – Guru Vempati Chinna Satyam",
      "Junior Research Fellowship (GoI, MHRD, 1989) – Research in Bhagavata Mela",
    ],
    experienceDetails: [
      "Director, Kalakshetra Foundation (Apr 2018 – Oct 2023) — Revitalised founder Rukmini Devi Arundale's vision; curated the Annual Art Festival (2018–2022). Conceived \"Shanti Sutra\" (Gandhi 150) and large-scale outreach. Led national initiatives: Amritam Gamaya (multi-city AKAM festival), Vitasta (Kashmir heritage festival). Cultural diplomacy highlights: Presentations before Hon'ble PM of India & President of China (Mahabalipuram, 2019). Infrastructure & archives: renovation of Bharata Kalakshetra Auditorium; revival of palm-leaf diploma; craft & textile projects.",
      "Founder–Principal, Kala Sadhanalaya (1987–Present) — Gurukula-style training in Melattur bani; scholarships, internships, residencies. Annual initiatives: Bhaavaarpanam (tribute to Guru Dorairaja Iyer); Kala Shibiram (Thanjavur immersion). International pedagogy bridges (e.g., Slippery Rock University, USA).",
      "Performer–Choreographer — 30+ original productions, including Jagat Pāvani Gangā, Laya Nirupanam, Tamizh Arasi Kuravanji, Daayinee, Brahmātma Chakram, Om Saravana Bhava, and more. Major circuits: Music Academy (Spirit of Youth winner; Main Season), Narada Gana Sabha, Krishna Gana Sabha, Mahabalipuram Dance Festival, Chidambaram Natyanjali, SPIC MACAY tours.",
      "Research & Curation — Reconstruction and revival in Melattur tradition and Suddha Nrittam; collaborations with Dr. T.S. Parthasarathy, Dr. R. Nagaswamy, Dr. Arudra. Conferences/lectures on Natya, Agamas, Suddha Nrittam, wellness. Editorial/documentation projects including forthcoming book on Kalamkari at Kalakshetra.",
    ],
    specialities: [
      "Melattur bani of Bharatanatyam; revival & performance of Suddha Nrittam",
      "Large-format choreography, curation, and arts administration",
      "Nattuvangam, Veena, Kuchipudi; integrative pedagogy",
      "Heritage crafts & textiles interfacing with performing arts; festival conception and cultural diplomacy",
    ],
    awards: [
      "Kalaimamani – Govt. of Tamil Nadu",
      "Vani Kala Sudhakara – Tyaga Brahma Gana Sabha (2005)",
      "Singar Mani (1983)",
      "Best Dancer – Spirit of Youth – The Music Academy (1988)",
      "Yuva Kala Bharati (1992); Isai Kalai Chelvar (1993)",
      "Shriram Award for Excellence in Dance",
      "Acharya Kala Bharathi – Bharat Kalachar",
      "Bhagavata Mela Nataka Pitamaha Kittappa Pillai Memorial Award",
      "Arsha Kala Bhushanam",
    ],
    image: directorImg,
  },
  {
    id: "manasvini-ramachandran",
    name: "Ms Manasvini Korukkai Ramachandran",
    title: "Faculty",
    specialization: "Dance - Bharatanatyam",
    category: "dance",
    experience: "27+ years",
    bio: "Ms Manasvini Korukkai Ramachandran is the daughter and disciple of Smt Revathi Ramachandran and has been trained in the Melattur bani of Bharatanatyam for over 27 years. She has also trained in Carnatic Vocal under Vidushi Suguna Purushothaman and Dr K. Gayatri Prasanna, and studied art history and epigraphy under Dr R. Nagaswamy. A versatile artist, she has worked with several stalwarts, including Dr Padma Subrahmanyam, Smt Chitra Visweswaran, Sri Lalgudi GJR Krishnan, Sri Sheejith Krishna, and Sri Jaikishore Mosalikanti. Since 2018, she has been serving as the Principal and Director of Kala Sadhanalaya, continuing the institution's legacy of promoting the Melattur tradition.",
    education: [
      "M.A. (Conservation) – National Museum Institute, Delhi",
      "M.F.A. (Bharatanatyam) – SASTRA University, Thanjavur (Research guided by Dr. Padma Subrahmanyam)",
      "B.Tech. (Biotechnology) – Anna University, Guindy",
    ],
    experienceDetails: [
      "Principal & Director – Kala Sadhanalaya (2018–Present)",
      "Performer & Choreographer – Extensive solo and group presentations in India and abroad; conceptualised and presented original productions (Pluti, 2023; Maathe, 2024).",
      "International Tours — USA: 16-city tour (Om Saravana Bhava, 2004); AIM for Seva tour (Jagat Pavani Ganga, 2018); Solo tour (Pluti, 2024). France & Germany: 28 shows (2007). Singapore, Armenia (ICCR tour, 2012), Australia (2017).",
      "National Performances — Music Academy, Narada Gana Sabha, Krishna Gana Sabha, NCPA Mumbai, IIC Delhi, Shanmukhananda Mumbai, Margazhi Festival circuits.",
      "Social Outreach – Founder of Kadhir Foundation, teaching Bharatanatyam to underprivileged children in Chennai schools.",
    ],
    specialities: [
      "Bharatanatyam – Melattur bani (solo, group, and thematic productions)",
      "Choreography & Conceptual Productions (Pluti, Laya Nirupanam, Jagat Pavani Ganga)",
      "Carnatic Vocal Music – trained under eminent gurus",
      "Art History, Epigraphy & Conservation",
      "Nattuvangam & Music Collaboration",
    ],
    awards: [
      "HCL Best Dancer Award – The Music Academy (2023)",
      "Natya Chudar – Kartik Fine Arts (2017)",
      "Yuva Kala Bharati – Bharat Kalachar (2014)",
      "Yuva Kala Vipanchee – Vipanchee Trust (2013)",
      "Bala Saraswathy Award – Krishna Gana Sabha (2007)",
      "Doordarshan Graded Artist; ICCR Empanelled Artist",
    ],
    image: msManasvini,
  },
  {
    id: "dundayya-pujer",
    name: "Dr Dundayya Pujer",
    title: "Faculty",
    specialization: "Instrumental Music - Tabla",
    category: "instrumental",
    experience: "15+ years",
    bio: "Dr Dundayya Pujer is an accomplished Hindustani Classical Musician, Tabla performer, and educator with a strong academic and performance background. He received his foundational training under eminent Gurus Pt Suraj Purandare and Dr Rachayya Hiremath of Dharwad. He is a graded artist of All India Radio in Classical Tabla and has performed widely as both a soloist and accompanist. His concerts include prestigious platforms such as the Sawai Gandharva Festival (Kundagol) and Mysore Dasara, where he has accompanied legendary musicians like Pt M. Venkatesh Kumar, Pt Chandrashekar Puranikamath, Pt B.S. Math, Ustad Faiyaz Khan, Vid. Purnima Bhat, Vid Sangeeta Katti, and Ustad Chote Rehmat Khan.",
    education: [
      "Ph.D. in Music – Karnataka University, Dharwad",
      "Master of Music (Tabla) – Indira Kala Sangeet Vishwavidyalaya",
      "Bachelor of Music (Gold Medalist) – Karnataka University, Dharwad",
    ],
    experienceDetails: [
      "Assistant Professor & HOD, Department of Performing Arts – Sri Sathya Sai University for Human Excellence, Kalaburagi, Muddenahalli Campus (Present)",
      "Assistant Professor, Department of Tabla – Karnataka State Dr Gangubai Hangal Music and Performing Arts University, Mysore (2014 onwards). Taught PG, UG, and Diploma courses. Appointed as NSS Coordinator for 5 years; University awarded 'Swachh Campus' by MHRD, Government of India (2019). Served as Academic Coordinator (2019).",
      "Tabla Instructor (Certificate Courses) – KSGH Music and Performing Arts University, Mysore",
      "Accompanist (PG Department of Music & Fine Arts) – Karnataka University, Dharwad (2008–2012)",
      "Visiting Guest Lecturer – Centre for Performing Arts, Women's University, Vijayapur",
      "Author: Bharatiya Tabala Mantrikaru and contributor of multiple research papers in international and national journals.",
    ],
    specialities: [
      "Tabla performance and pedagogy (solo and accompaniment)",
      "Learning and performing on Sarod under Padmashri Pt Rajeev Tharanath",
      "Working knowledge of Sitar and Harmonium",
    ],
    awards: [
      "National Scholarship for Young Artist (2008) – Ministry of Culture, Government of India",
      "Sangeet Nritya Academy Yuva Pratibha Puraskar (2007)",
      "Pt Basavaraj Bendigeri Gold Medal (2007) – Outstanding Performance in Music Studies",
      "Best Performer Award (2009) – Narayan Tabla Institute, Belgaum",
    ],
    image: drDundayya,
  },
  {
    id: "srinivas-viswanadha",
    name: "Mr Srinivas Viswanadha",
    title: "Faculty",
    specialization: "Vocal Music - Carnatic",
    category: "carnatic",
    experience: "14+ years",
    bio: "Born into a family of music, Mr Srinivas V began learning music at the tender age of 3. With a strong foundation in Carnatic music, he trained for over 7 years under Smt. Vedavati Ganesh Garu, and later continued his advanced learning under the guidance of Late Vidwan Pudukkottai R. Krishna Murthy Garu at the Sri Sathya Sai Mirpuri College of Music, Puttaparthi. From his school days, he actively participated in cultural competitions—particularly patriotic and devotional singing—at Ramakrishna Mission institutions, winning several prizes.",
    education: [
      "M. Music (Carnatic Vocal) – Institute of Distance Education, Madras University, Chennai (Graduated 2022)",
      "Certificate & Diploma Courses in Music – Potti Sriramulu Telugu University, Hyderabad",
      "Foundation Course in Music – Sri Sathya Sai Mirpuri College of Music, Puttaparthi",
      "B.Sc. (M.E.Cs) – Aditya Degree College, Visakhapatnam (2007–2011)",
    ],
    experienceDetails: [
      "Secretary to the Director's Office (Nada Gurukulam), Lecturer in Music (Carnatic Vocal) – Nada Gurukulam, Sri Sathya Sai University for Human Excellence (Since Sep 2025)",
      "Music Educator & Trainer – Sri Sathya Sai Loka Seva Group of Institutions (2015–2023). Trained ensembles of up to 175 students in Indian instruments and vocal music. Directed large-scale performances for Annual Sports & Cultural Meets.",
      "Music Teacher – Delhi Public School, Visakhapatnam (2014–2015)",
      "Music Teacher – Sri Prakash Vidyaniketan Schools, Visakhapatnam (2011–2014). Composed original songs and trained students to win state-level competitions.",
      "Corporate Experience – IBM, HSBC (prior to music teaching career)",
    ],
    specialities: [
      "Carnatic Vocal (classical and semi-classical)",
      "Devotional genres: Bhajans, Abhangs, Spiritual songs",
      "Western genres: Carols and choral music",
      "Pedagogy & Leadership – nurturing student talent and cultural coordination across campuses",
    ],
    awards: [
      "Best Teacher Award – Sri Prakash Vidyanikethan, Visakhapatnam (2012)",
      "Best Teacher Award – Delhi Public School, Visakhapatnam North Campus (2014)",
      "Multiple prizes in cultural competitions during schooling",
      "Prize-winning performances at Andhra University Youth Festivals (2007–2011)",
    ],
    image: mrSrinivas,
  },
  {
    id: "shreerama-bhat",
    name: "Mr Shreerama Bhat",
    title: "Faculty",
    specialization: "Vocal Music - Carnatic",
    category: "carnatic",
    experience: "16+ years",
    bio: "Shreerama Bhat B is a Carnatic Classical Vocalist, accompanist, and educator who has contributed significantly to the field of music both as a performer and teacher. He trained under renowned Gurus including Vidwan Kanchana Narayana Bhat, Vidushi Savithri Bhat Amai, Vidwan Bellary M. Venkateshachar, and Vidwan Bellary M. Raghavendra in Carnatic music, as well as Pandith Yogish Baliga, Pandith Veerabhadrayya Hiremath, and Pandith M. Venkatesh Kumar in Hindustani music traditions.",
    education: [
      "Vidwath in Carnatic Classical Music (Vocal)",
      "Diploma in Civil Engineering",
    ],
    experienceDetails: [
      "Assistant Professor of Music – Sri Sathya Sai University for Human Excellence (Since November 2020)",
      "Performer at prestigious Sabhas: Ganabharathi (Mysore), Thyagaraja Sangeetha Sabha (Mysore), Shruthimanjari (Mysore), Swarasankula (Mysore), Raagadhaana (Udupi), Sangeetha Parishath (Mangalore), Gana Sudha (Hubli)",
      "Conducted several music workshops in and around Mysore, nurturing the next generation of musicians",
    ],
    specialities: [
      "Carnatic Vocal performance (solo and accompaniment)",
      "Percussion and Harmonium accompaniment for senior artists",
      "Music composition for audio cassettes and CDs",
      "Workshop facilitation for spreading musical knowledge",
    ],
    awards: [
      "B-High Grade Artist at All India Radio (Carnatic Vocal)",
      "Composer of music for several recorded works",
      "Winner of multiple prizes at state-level competitions including Raga-Tana-Pallavi competitions (Bangalore Gayana Samaja, Shruthimanjari Mysore)",
    ],
    image: mrShreeramaBhat,
  },
  {
    id: "prafulla-kumar-meher",
    name: "Mr Prafulla Kumar Meher",
    title: "Faculty",
    specialization: "Vocal Music - Hindustani",
    category: "hindustani",
    experience: "22+ years",
    bio: "Prafulla Kumar Meher is an accomplished Hindustani Classical Vocalist and dedicated educator with over 22 years of teaching experience. His musical journey has been shaped by the guidance of eminent Gurus: Prof Dilip Kumar Karmakar (Visva-Bharati University), Smt Kaveri Kaur and Prof Sunirmal Bhattacharya (Dhrupad and Dhamar), Acharya Jayanta Bose, Sri Subrata Das (disciple of Pt Rajan and Pt Sajan Mishra), Abhijith Shenoy K (disciple of Pt D. B. Harindra Ji), and Prof Dr T. Unnikrishnan (Voice Culture). Through this diverse training, he has mastered both the khyal and dhrupad traditions.",
    education: [
      "Ph.D. (Pursuing) – Panjab University, Chandigarh: Music Education under Educare system",
      "UGC-NET in Music (2019)",
      "M. Music, B. Music, and Diploma in Hindustani Vocal (1995–2003) – Visva-Bharati University, Santiniketan",
      "Sangeet Visharad (5th Year, 2002) – Pracheen Kala Kendra, Chandigarh",
      "Grade 4 Piano (2009–2012) – Trinity College London",
      "B.A. (Hons.) (1990–1993) – Sonepur College, Odisha",
    ],
    experienceDetails: [
      "Assistant Professor (Hindustani Vocal) (2023–Present) – Sri Sathya Sai University for Human Excellence, Kalaburagi",
      "Assistant Professor (2018–2023) – Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam",
      "Assistant Lecturer (2013–2018) – Sathya Sai Mirpuri College of Music, Prasanthi Nilayam",
      "Head of Department (2006–2013) – Delhi Public School, Gandhidham, Gujarat",
      "Music Teacher (2004–2006) – Swarnaprastha Public School, Sonepat, Haryana",
      "Music Teacher (2003–2004) – RAN Public School, Rudrapur, Uttarakhand",
    ],
    specialities: [
      "Hindustani Vocal: Khyal, Dhrupad, Dhamar, and Thumri",
      "Integration of voice culture techniques into performance and teaching",
      "Nurturing students to excel in competitions and stage performances",
      "Bridging traditional pedagogy with contemporary teaching methods",
    ],
    awards: [
      "Best Teacher Award – Delhi Public School, Gandhidham, Gujarat (2012)",
      "Judge – 4th Music Competition, Apollo International School, Sonepat (2006)",
      "Music Secretary – Sonepur College, Odisha (1993)",
      "Multiple prizes in vocal competitions at school and college levels",
    ],
    image: mrPrafullaKumar,
  },
  {
    id: "pranav-kashyap",
    name: "Mr Pranav Kashyap",
    title: "Faculty",
    specialization: "Vocal Music - Hindustani",
    category: "hindustani",
    experience: "15+ years",
    bio: "Pranav Kashyap R is a dedicated Hindustani Classical Vocalist with over 15 years of rigorous training under the guidance of esteemed Gurus: Ustad Fayaz Khan Ji, Vidwan Shreerama Bhat, and Dr Pandit Venkatesh Kumar Ji. Specialising in Khayal Gayaki, he has showcased his artistry at prestigious platforms both in India and abroad. Alongside his grounding in classical tradition, he has also cultivated versatility in light music genres such as Bhajans, Abhangs, Vachanas, and Dasara Padas.",
    education: [
      "Primary to Senior Secondary Education – Sri Sathya Sai Loka Seva Gurukulam, Muddenahalli",
      "B.A. in Humanities – Sri Sathya Sai Centre for Human Excellence, affiliated with Mysore University",
      "Junior & Senior Grade Certifications – Hindustani Vocals, Harmonium, and Carnatic Vocals (Karnataka Education Board)",
      "M.A. in Hindustani Vocals – Sri Sathya Sai University for Human Excellence, Muddenahalli",
    ],
    experienceDetails: [
      "Assistant Professor (Hindustani Vocals) – Department of Performing Arts, Sri Sathya Sai University for Human Excellence, Muddenahalli (Present)",
      "Performer in India: Kala Kshetra (Chennai), Vittala Temple (Pandharpur), Nadopasana Concert (Muddenahalli), Premamrutham Auditorium (Muddenahalli)",
      "International performances: Heart of Love Foundation (Brisbane, Australia), Sai Anandam (Singapore), Sai Prema Foundation (Suva, Fiji), Casa Del Divino (Assisi, Italy), Chamber Concerts (Batticaloa & Hatton, Sri Lanka), Anugraham Foundation (London, UK)",
    ],
    specialities: [
      "Hindustani Vocal – Khayal Gayaki",
      "Light music: Bhajans, Abhangs, Vachanas, and Dasara Padas",
    ],
    awards: [],
    image: mrPranavKashyap,
  },
  {
    id: "sujan-h-n",
    name: "Mr Sujan H N",
    title: "Faculty",
    specialization: "Vocal Music - Carnatic",
    category: "carnatic",
    experience: "5+ years",
    bio: "Sujan H N is a dynamic Carnatic Vocalist and Music Educator with a strong foundation in both performance and teaching. He initially trained under Vidwan R.K. Padmanabha and is currently receiving advanced guidance from Vid Shreerama Bhat and Vid Abhirama Bode. Known for his patient and supportive teaching style, he adapts his pedagogy to diverse learning styles, fostering an inclusive and inspiring environment that nurtures both musical excellence and personal growth.",
    education: [
      "Master of Arts in Music (Carnatic Vocal) (2021–2023) – Sri Sathya Sai University for Human Excellence, Kalaburagi — Gold Medalist",
      "Dissertation: \"A Comparative Study on The Sociological Perspectives in The Keerthanas of Purandaradasa and Kanakadasa\"",
      "Bachelor of Arts (HES) (2017–2020) – Sri Sathya Sai Centre for Human Excellence, Muddenahalli, under Mysore University",
    ],
    experienceDetails: [
      "Assistant Professor of Music (July 2025 – Present) – Department of Performing Arts, Sri Sathya Sai University for Human Excellence, Muddenahalli",
      "Teaching Assistant (July 2024 – June 2025) – Department of Performing Arts, SSSUHE, Muddenahalli",
      "Deputy Chairperson & Deputy Warden (April 2023 – June 2024) – Sri Sathya Sai Sharadaniketanam, Mandya",
      "Intern (Nov 2020 – May 2022) – Sri Sathya Sai Sharadaniketanam, Mandya. Assisted in organisational duties, conducted Para-Vidya classes, prepared reports and facilitated staff meetings.",
    ],
    specialities: [
      "Carnatic Vocal Performance: Classical, semi-classical, and light music",
      "Bhajans, Abhangs, Vachanas, and Dasara Padas",
      "Research interest in musicology and sociological perspectives in Keerthanas",
      "Pedagogical expertise in creating inclusive teaching environments",
    ],
    awards: [
      "UGC-NET (June 2024) – Qualified for Assistant Professor & Ph.D. admission",
      "K-SET (Nov 2024) – Qualified Eligibility for Assistant Professor",
      "Certificate of Merit: 1st Prize in Group Song at 36th Inter-University National Youth Festival (2023)",
      "Awards at zonal and national inter-university competitions (AIU) in Hindustani Vocal and Group Singing",
    ],
    image: mrSujanHN,
  },
  {
    id: "mangali-tirumala",
    name: "Mr Mangali Tirumala",
    title: "Faculty",
    specialization: "Instrumental Music - Tabla",
    category: "instrumental",
    experience: "10+ years",
    bio: "Mr. Mangali Tirumala is a dedicated Tabla artist and instrument accompanist. Trained under the guidance of respected Gurus, with a deep-rooted passion for Indian classical percussion, he continues to uphold the tradition of Tabla both as a soloist and as an accompanist.",
    education: [
      "Advanced learning and performance exposure through participation in cultural and music events at Sirisi University, Mysore University, and Bagalkot University",
      "Strong foundation in Tabla through rigorous practice and formal training, complemented by competitive performance experience",
    ],
    experienceDetails: [
      "Experienced Tabla Solo performer, having represented Andhra Pradesh State and Kurnool District in prestigious competitions",
      "Active as an instrument accompanist, supporting various musicians in classical and contemporary performances",
      "Featured in the National Program (Lucknow, Uttar Pradesh), showcasing his artistry on a recognized stage",
    ],
    specialities: [
      "Expertise in Tabla Solo performances, with strength in rhythm, clarity, and improvisation",
      "Skilled accompanist for classical and semi-classical music",
      "Ability to adapt across stages ranging from district competitions to national programs",
    ],
    awards: [
      "Sirisi University, First Rank – Tabla Solo",
      "Bagalkot University, First Rank – Tabla Solo",
      "Mysore University, Third Rank – Tabla Solo",
      "Award of Recognition by Karnataka Music Director Hansalek for excellence in Tabla",
      "National Program Performer – Tabla Solo, Lucknow (Uttar Pradesh Capital)",
    ],
    image: mrMangaliTirumala,
  },
  {
    id: "shailaja-kumari",
    name: "Ms Shailaja Kumari A",
    title: "Faculty",
    specialization: "Vocal Music - Carnatic",
    category: "carnatic",
    experience: "15+ years",
    bio: "Shailaja Kumari A. is a dedicated Carnatic Classical Vocalist and educator with a strong foundation in both performance and research. Trained under the guidance of her mother Vidushi Savithri Bhat Amai (Bangalore) and Dr R.N. Sreelatha (Mysore), she has cultivated a rich musical lineage that blends tradition with academic pursuit.",
    education: [
      "Vidwath in Karnatak Classical Music (Vocal)",
      "M.A. in Music (University of Mysore) – 1st Rank with Gold Medal",
      "Ph.D. (Pursuing) – Specialization in Music Therapy",
    ],
    experienceDetails: [
      "Assistant Professor in Music – Department of Performing Arts, Sri Sathya Sai University for Human Excellence (Since November 2020)",
      "Guest Lecturer – Department of Music, Fine Arts College, University of Mysore",
      "Concert Performances at prestigious sabhas: Ganabharathi (Mysore), Thyagaraja Sangeetha Sabha (Mysore), Raagadhaana (Udupi), Sangeetha Parishath (Mangalore), Kalyanapuri Vaidika Sabha (Bangalore), and Akashavani (All India Radio)",
      "Participated in recording projects including audio cassettes and discs",
    ],
    specialities: [],
    awards: [],
    image: msShailajaKumari,
  },
  {
    id: "neelam-patel",
    name: "Dr Neelam Patel",
    title: "Faculty",
    specialization: "Vocal Music - Hindustani",
    category: "hindustani",
    experience: "8+ years",
    bio: "Dr. Neelam Patel is a Hindustani Classical Vocalist, Musicologist, and dedicated Guru whose artistry blends tradition with scholarship. Her musical journey began under the guidance of Dr. Sunita Bhale at Indira Kala Sangeet Vishwavidyalaya, Khairagarh and further blossomed under the tutelage of the legendary Padma Vibhushan Dr. Girija Devi Ji of the Banaras Gharana at the Sangeet Research Academy, Kolkata. She continues to refine her art under the revered mentorship of Pt. Prabhakar and Pt. Diwakar Kashyap (Kashyap Bandhu).",
    education: [
      "B.A. & M.A. in Hindustani Classical Vocal Music (2011–2015) – Indira Kala Sangeet Vishwavidyalaya (IKSVV), Khairagarh",
      "Doctorate (Ph.D.) in Music (2024) – Raja Mansingh Tomar Music and Arts University, Gwalior",
    ],
    experienceDetails: [
      "Assistant Professor (Present) – Faculty of Performing Arts, Sri Sathya Sai University for Human Excellence, Muddenahalli Campus",
      "Founder & Guru (2021–2023) – Sai Spandana Sangeet Gurukul",
      "Guest Faculty (2019–2021) – Raja Mansingh Tomar University, Gwalior",
      "Vocal Guru (2017) – Sangeet Gurukul, Indore",
    ],
    specialities: [
      "Deep expertise in the Banaras Gharana tradition",
      "Widely admired for her Thumri singing",
      "Soulful renditions of folk songs from Uttar Pradesh and Madhya Pradesh",
      "Strong command over musicology and theory",
      "Inspiring pedagogy bridging tradition and modern academic perspectives",
    ],
    awards: [
      "Doctorate (2024) – Raja Mansingh Tomar Music and Arts University, Gwalior",
    ],
    image: drNeelamPatel,
  },
  {
    id: "nayana-shivaram",
    name: "Ms Nayana Shivaram",
    title: "Faculty",
    specialization: "Dance - Bharatanatyam",
    category: "dance",
    experience: "30+ years",
    bio: "Ms Nayana Shivaram is a Bharatanatyam artist, teacher, and choreographer with nearly three decades of experience in teaching and performing. Trained under Guru Natyacharya Late Shri K. Muralidhara Rao (Shantala Awardee, 2000), a direct disciple of Chokkalingam Pillai in the Pandanallur style, she has carried forward the classical tradition with devotion and creativity. A Doordarshan B+ grade artiste, her performances have been featured on DD Bangalore Kendra and Shankara TV. She is widely admired for her choreographed dance ballets such as Sapta Thandava, Dasaru Kanda Krishna, Bhavayami Raghuramam, Dashavatara, and many more.",
    education: [
      "Ph.D. (Pursuing) – Bharatanatyam, Sri Sathya Sai University for Human Excellence",
      "M.A. in Bharatanatyam (2013) – K.S.G.H. Music and Performing Arts University, Mysore – Gold Medalist",
      "UGC-NET (2016) – Qualified in Bharatanatyam",
      "Vidwat in Bharatanatyam (1996) – KSEEB, Karnataka – First Class",
      "B.Sc. (1994) – Mangalore University – First Class",
    ],
    experienceDetails: [
      "Faculty of Bharatanatyam, SSSUHE (2023–Present) – Teaching, choreographing, and coordinating major dance events. Coordinator for AIU dance competitions (Mysuru & Ludhiana). Team Manager for AIU competitions, Christ University, Bangalore. Deputy Superintendent of Examinations (2023 & 2024).",
      "Faculty of Bharatanatyam (2014–2023) – KSGH Music and Performing Arts University, Mysuru. Teaching and mentoring students, anchoring cultural programs, serving as NSS Coordinator and Sports & Cultural Coordinator.",
      "Independent Performer & Choreographer (Since 1995) – Over 30 years of teaching. Presented acclaimed dance ballets across India. Performed at Mysore Dasara Festival (2010) – live telecast by Shankara TV.",
    ],
    specialities: [
      "Bharatanatyam performance and choreography in the Pandanallur style",
      "Creation and presentation of dance ballets rooted in classical tradition",
      "Pedagogy in Bharatanatyam with nearly 30 years of teaching expertise",
      "Academic contributions through research papers and publications",
      "Event coordination and cultural leadership in academic institutions",
    ],
    awards: [
      "Gold Medalist in M.A. Bharatanatyam – KSGH Music and Performing Arts University (2013)",
      "Doordarshan B+ Grade Artiste (Carnatic Dance)",
      "Performance featured at Dasara Festival (2010), live telecast on Shankara TV",
      "Multiple research papers published in ISBN publications and international journals",
    ],
    image: msNayanaShivaram,
  },
  {
    id: "ranjani-venkatesh",
    name: "Ms Ranjani Venkatesh",
    title: "Faculty",
    specialization: "Vocal Music - Carnatic",
    category: "carnatic",
    experience: "30+ years",
    bio: "Smt. Ranjani Venkatesh hails from a family steeped in music. Her grandfather, (Late) Vidwan V.V. Ranganathan, was a renowned Mridangam artiste with All India Radio, Bangalore. She began her musical journey under Late Shri Rama Murthy and Late Vid. Smt. H.N. Sharada. Since 1994, she has been passionately engaged in teaching Carnatic Classical Vocal music while also performing on prestigious stages, including in the physical presence of Bhagawan Sri Sathya Sai Baba and Sadguru Sri Madhusudana Sai.",
    education: [
      "Vidwat Examination in Carnatic Classical Vocal (1994) – KSEEB",
      "M.A. in Sanskrit (1998) – Sahyadri College, Shimoga (Kuvempu University)",
      "B.Ed. (1999) – Sri Sathya Sai Institute of Higher Learning, Anantapur",
      "B.L.I.S. (2007) – Karnataka State Open University, Bangalore",
      "B.Sc. (CBZ, 1996) – Sir M.V. Science College, Bhadravathi (Kuvempu University)",
    ],
    experienceDetails: [
      "Faculty of Carnatic Vocal (2021–Present) – Shri Sathya Sai University for Human Excellence, teaching students of BPA–Sangeetha and Bharatanatya Nrutya.",
      "Seva Assignments (2019–2020) – Carnatic music teaching for girl students at Nallakadirenahalli campus, under the guidance of Sadguru Sri Madhusudana Sai.",
      "Online Teaching (2021–Present) – Conducted diploma courses; previously taught for Shankar Mahadevan Academy (2013–2016) to students in India and abroad.",
      "Regular performer at Sai Anandam, Muddenahalli (2011–2012). Solo concert for One with Sai music program, Brindavan, Bangalore. Contributed vocals for Shri Sathya Sai Geethamulu audio CD.",
      "Production Assistant – All India Radio, Bangalore (2009–2010). Assistant Librarian – Secretariat Library, Vidhana Soudha (2008). Sanskrit Lecturer – Sri Adichunchanagiri PU College, Bhadravathi (2001–2002).",
    ],
    specialities: [
      "Carnatic Classical Vocal – traditional and light classical genres",
      "Teaching across all age groups with over 25 years of experience",
      "Regular performances on All India Radio and Doordarshan",
      "Strong communication, presentation, and leadership skills",
    ],
    awards: [
      "B-High Grade Artiste (AIR, 2000) – Classical & Light Classical Vocal",
      "First Rank – Junior Exam in Carnatic Vocal, KSEEB (1987)",
      "First Class – Vidwat Exam in Carnatic Vocal, KSEEB (1994)",
      "State Government Scholarship Recipient (1990)",
      "Performed at Tirupati (2007) as part of the Daasa Sahithya Project, TTD",
    ],
    image: msRanjaniVenkatesh,
  },
];

export const categories = [
  { value: "all", label: "All Faculty" },
  { value: "carnatic", label: "Carnatic" },
  { value: "hindustani", label: "Hindustani" },
  { value: "dance", label: "Dance" },
  { value: "instrumental", label: "Instrumental" },
];

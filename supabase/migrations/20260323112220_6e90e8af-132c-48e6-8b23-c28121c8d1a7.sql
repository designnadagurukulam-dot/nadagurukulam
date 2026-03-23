
-- Create curriculum_modules table
CREATE TABLE public.curriculum_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester integer NOT NULL CHECK (semester >= 1 AND semester <= 8),
  subject_name text NOT NULL,
  course_code text NOT NULL,
  module_name text NOT NULL,
  description text,
  hours integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create curriculum_sections table
CREATE TABLE public.curriculum_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('youtube', 'text')),
  youtube_url text,
  text_content text,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curriculum_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_sections ENABLE ROW LEVEL SECURITY;

-- curriculum_modules policies
CREATE POLICY "Anyone can view curriculum modules" ON public.curriculum_modules FOR SELECT USING (true);
CREATE POLICY "Admins can insert curriculum modules" ON public.curriculum_modules FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update curriculum modules" ON public.curriculum_modules FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete curriculum modules" ON public.curriculum_modules FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- curriculum_sections policies
CREATE POLICY "Authenticated users can view sections" ON public.curriculum_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and instructors can insert sections" ON public.curriculum_sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instructor'));
CREATE POLICY "Admins and instructors can update sections" ON public.curriculum_sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instructor'));
CREATE POLICY "Admins and instructors can delete sections" ON public.curriculum_sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instructor'));

-- Updated_at triggers
CREATE TRIGGER update_curriculum_modules_updated_at BEFORE UPDATE ON public.curriculum_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_curriculum_sections_updated_at BEFORE UPDATE ON public.curriculum_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed data for all 8 semesters
INSERT INTO public.curriculum_modules (semester, subject_name, course_code, module_name, description, hours, sort_order) VALUES
-- Semester 1
(1, 'Foundation Course in Carnatic Music', 'BCVP110', 'Recapitulation of fundamentals', 'Review of basic concepts in Carnatic music', 20, 1),
(1, 'Foundation Course in Carnatic Music', 'BCVP110', 'Adi Tala Varna 2 - Single speed', 'Two Adi Tala Varnas at single speed', 20, 2),
(1, 'Foundation Course in Carnatic Music', 'BCVP110', 'Madhyamakala Kriti (2)', 'Two Madhyamakala Kritis', 20, 3),
(1, 'Foundation Course in Carnatic Music', 'BCVP110', 'Devotional compositions', 'Study of devotional compositions', 15, 4),
(1, 'History of Indian Music', 'BCVT130', 'Origin and development of Indian music - The Veda period', 'Study of music origins from the Vedic period', 10, 1),
(1, 'History of Indian Music', 'BCVT130', 'Life and Contributions', 'Biographies and contributions of key musicians', 10, 2),
(1, 'History of Indian Music', 'BCVT130', 'Types of Carnatic Compositions - Compositional Forms', 'Study of various compositional forms in Carnatic music', 10, 3),
(1, 'History of Indian Music', 'BCVT130', 'Raga Lakshanas', 'Study of Raga characteristics', 15, 4),

-- Semester 2
(2, 'Carnatic Compositions I', 'BCVP210', 'Svarajathi - Any two', 'Harikambhoji, Hamsadhwani, Khamach', 15, 1),
(2, 'Carnatic Compositions I', 'BCVP210', 'Varna in Adi Tala - Two', 'Abhogi, Shree', 25, 2),
(2, 'Carnatic Compositions I', 'BCVP210', 'Madhyamakala Kritis - Three', 'Shuddhasaveri, Hindola, Chakravaka, Saraswati', 25, 3),
(2, 'Theory of Indian Music', 'BCVT230', 'Technical Terms of Indian Music', 'Sangeetha, Nada, Shruti, Swara, Adharashruti, Raga, Tala, Sthayi', 15, 1),
(2, 'Theory of Indian Music', 'BCVT230', 'Raga - Origin and development', 'Origin of concept of Raga, Pre-Raga era (Jathi), Concept of Mela, Classification of Ragas', 10, 2),
(2, 'Theory of Indian Music', 'BCVT230', 'Biography - Life and contributions', 'Life history and contributions of Muthuswamy Dikshitar and Syama Sastry', 10, 3),
(2, 'Theory of Indian Music', 'BCVT230', 'Ragalakshanas', 'Ragalakshanas of Harikambhoji, Hamsadhwani, Khamach, Abhogi, Shree, Shuddhasaveri, Hindola, Chakravaka, Saraswati, Shankarabharana', 10, 4),

-- Semester 3
(3, 'Carnatic Compositions II', 'BCVP310', 'Tana Varna - Adi Tala', 'Kalyani Varna and Vasanta Varna', 20, 1),
(3, 'Carnatic Compositions II', 'BCVP310', 'Madhyamakala Kritis', 'Kritis in Shuddha Dhanyasi, Pantuvarali, Bilahari, and Malayamaruta', 20, 2),
(3, 'Carnatic Compositions II', 'BCVP310', 'Nottuswara - Two', 'Any two Nottuswaras of Muthuswamy Dikshitar', 10, 3),
(3, 'Theory of Indian Music II', 'BCVT330', 'Technical Terms of Indian Music', 'Advanced technical terminology', 15, 1),
(3, 'Theory of Indian Music II', 'BCVT330', 'Raga - Origin and development', 'Deeper study of Raga evolution', 10, 2),
(3, 'Theory of Indian Music II', 'BCVT330', 'Biography - Life and contributions', 'Advanced biographical studies', 10, 3),
(3, 'Theory of Indian Music II', 'BCVT330', 'Ragalakshanas', 'Extended Raga characteristics study', 10, 4),

-- Semester 4
(4, 'Carnatic Compositions III', 'BCVP410', 'Tana Varna - Adi Tala (Any 3)', 'Three Adi Tala Varnas', 20, 1),
(4, 'Carnatic Compositions III', 'BCVP410', 'Madhyamakala Kritis', 'Kritis in Hamsanada, Charukesi, Keeravani, Naata', 20, 2),
(4, 'Carnatic Compositions III', 'BCVP410', 'Vilambakala Kriti (3)', 'Vilambakala Kritis in Bilahari, Khamas, and Kalyani', 20, 3),
(4, 'Carnatic Compositions III', 'BCVP410', 'Devotional Compositions of Thyagaraja (2)', 'Divanama Sankeerthana-1, Utsava Sampradaya Keerthana-1', 15, 4),
(4, 'Theory of Carnatic Music III', 'BCVT430', 'Technical Terms - Musical Instruments', 'Study of Tambura, Veena, and Flute', 15, 1),
(4, 'Theory of Carnatic Music III', 'BCVT430', 'Notation System in Carnatic Music', 'Single, double, and multi-speed notation; Notation of Anu-Swaras', 10, 2),
(4, 'Theory of Carnatic Music III', 'BCVT430', 'Life & contribution of Post Trinity Composers', 'Mysore Vasudevachar and Ramnad Srinivasa Iyengar', 10, 3),
(4, 'Theory of Carnatic Music III', 'BCVT430', 'Raga Lakshanas', 'Extended Raga Lakshanas study', 10, 4),

-- Semester 5
(5, 'Carnatic Compositions IV', 'BCVP510', 'Varna in Adi Tala - 3', 'Three Adi Tala Varnas', 20, 1),
(5, 'Carnatic Compositions IV', 'BCVP510', 'Madhyamakala Kritis - 4', 'Four Madhyamakala Kritis', 20, 2),
(5, 'Carnatic Compositions IV', 'BCVP510', 'Vilambakala Kritis - 3', 'Three Vilambakala Kritis', 20, 3),
(5, 'Carnatic Compositions IV', 'BCVP510', 'Devotional Compositions', 'Devotional compositions study', 10, 4),
(5, 'Carnatic Compositions IV', 'BCVP510', 'Thyagaraja''s Utsava Sampradaya', 'Utsava Sampradaya compositions', 10, 5),
(5, 'Manodharma Sangeetha I', 'BCVP520', 'Raga Alapana', 'Raga Lakshanas for Kambhoji, Bahudari, Kalyani, Hamsanada, Charukeshi, Keeravani, Naata, Bilahari, and Khamas', 20, 1),
(5, 'Manodharma Sangeetha I', 'BCVP520', 'Indian Classical Music - Comparative study', 'Comparing Carnatic and Hindustani styles', 15, 2),
(5, 'Theory of Carnatic Music IV', 'BCVT530', 'Melakarta system', 'Study of Melakarta system', 15, 1),
(5, 'Theory of Carnatic Music IV', 'BCVT530', 'Study of Musical Instruments', 'Detailed study of musical instruments', 10, 2),
(5, 'Theory of Carnatic Music IV', 'BCVT530', 'Life and Contribution of Post Trinity Composers', 'Post Trinity composers study', 10, 3),
(5, 'Theory of Carnatic Music IV', 'BCVT530', 'Gamakas in Carnatic Music', 'Study of Gamakas', 10, 4),

-- Semester 6
(6, 'Practical Carnatic Compositions V', 'UCVP610', 'Varna in Adi Tala - 2', 'Two Adi Tala Varnas', 15, 1),
(6, 'Practical Carnatic Compositions V', 'UCVP610', 'Varna in Atta Tala - 2', 'Two Atta Tala Varnas', 15, 2),
(6, 'Practical Carnatic Compositions V', 'UCVP610', 'Madhyamakala Kritis - 5', 'Five Madhyamakala Kritis', 20, 3),
(6, 'Practical Carnatic Compositions V', 'UCVP610', 'Vilambakala Kritis - 3', 'Three Vilambakala Kritis', 15, 4),
(6, 'Practical Carnatic Compositions V', 'UCVP610', 'Javali and Thillana', 'Study of Javali and Thillana forms', 10, 5),
(6, 'Manodharma Sangeetha II', 'UBCVP620', 'Raga Alapana (4 Ragas)', 'Raga Alapana in four ragas', 20, 1),
(6, 'Manodharma Sangeetha II', 'UBCVP620', 'Neraval (4 Ragas)', 'Neraval in four ragas', 15, 2),
(6, 'Manodharma Sangeetha II', 'UBCVP620', 'Kalpanaswaras (4 Ragas)', 'Kalpanaswaras in four ragas', 15, 3),
(6, 'Samudaya Kriti', 'UCVP620', 'Tyagaraja''s Ghanaraga Pancharatna Kriti-1', 'Study of Pancharatna Kriti', 10, 1),
(6, 'Samudaya Kriti', 'UCVP620', 'Sathya Sai Geethamulu - 1', 'Study of Sathya Sai Geethamulu', 10, 2),
(6, 'Samudaya Kriti', 'UCVP620', 'Muthuswamy Dikshitar''s Navagraha Kriti-1', 'Navagraha Kriti study', 10, 3),
(6, 'Samudaya Kriti', 'UCVP620', 'Swati Tirunal''s Navaratri Kriti-1', 'Navaratri Kriti study', 10, 4),
(6, 'Samudaya Kriti', 'UCVP620', 'Thyagaraja''s Pancharatna Krithi-1', 'Lalgudi/Kovur/Tiruvottiyur Pancharatna Krithi', 10, 5),
(6, 'Samudaya Kriti', 'UCVP620', 'Syama Sastry''s Meenakshi Navaratnamalika Kriti-1', 'Navaratnamalika Kriti study', 10, 6),
(6, 'Theory of Carnatic Music V', 'UCVT630', 'Qualities of a singer', 'Study of vocal qualities and requirements', 10, 1),
(6, 'Theory of Carnatic Music V', 'UCVT630', 'Decorative aspects of Carnatic Compositions', 'Ornamentation and decorative elements', 10, 2),
(6, 'Theory of Carnatic Music V', 'UCVT630', 'Music Performance - evolution and contemporary trends', 'Evolution and modern trends in performance', 10, 3),
(6, 'Theory of Carnatic Music V', 'UCVT630', 'Life & contribution of 20th Century composers', 'Modern composer biographies', 10, 4),
(6, 'Theory of Carnatic Music V', 'UCVT630', 'Music Therapy', 'Introduction to music therapy', 10, 5),

-- Semester 7
(7, 'Carnatic Compositions VI', 'UCVP710', 'Adi Tala Varna (2 out of 3)', 'Two out of three Adi Tala Varnas', 15, 1),
(7, 'Carnatic Compositions VI', 'UCVP710', 'Atta Tala Varna - 2', 'Two Atta Tala Varnas', 15, 2),
(7, 'Carnatic Compositions VI', 'UCVP710', 'Madhyamakala Kritis - 4', 'Four Madhyamakala Kritis', 20, 3),
(7, 'Carnatic Compositions VI', 'UCVP710', 'Vilambakala Kritis - 3 out of 4', 'Three out of four Vilambakala Kritis', 15, 4),
(7, 'Carnatic Compositions VI', 'UCVP710', 'Bhadrachala Ramadasu Kirtana - 1', 'Study of Ramadasu Kirtana', 10, 5),
(7, 'Carnatic Compositions VI', 'UCVP710', 'Narayana Teertha Taranga - 1', 'Study of Narayana Teertha Taranga', 10, 6),
(7, 'Carnatic Compositions VI', 'UCVP710', 'Thillana - 1', 'Study of Thillana', 10, 7),
(7, 'Samudaya Kriti', 'UCVP730', 'Tyagaraja''s Ghanaraga Pancharatna Kriti-1', 'Advanced Pancharatna Kriti study', 10, 1),
(7, 'Samudaya Kriti', 'UCVP730', 'Sathya Sai Geethamulu - 1', 'Advanced Sathya Sai Geethamulu', 10, 2),
(7, 'Samudaya Kriti', 'UCVP730', 'Muthuswamy Dikshitar''s Navagraha Kriti-1', 'Advanced Navagraha Kriti', 10, 3),
(7, 'Samudaya Kriti', 'UCVP730', 'Swati Tirunal''s Navaratri Kriti-1', 'Advanced Navaratri Kriti', 10, 4),
(7, 'Samudaya Kriti', 'UCVP730', 'Thyagaraja''s Pancharatna Krithi-1', 'Advanced Pancharatna Krithi', 10, 5),
(7, 'Samudaya Kriti', 'UCVP730', 'Syama Sastry''s Meenakshi Navaratnamalika Kriti-1', 'Advanced Navaratnamalika Kriti', 10, 6),

-- Semester 8
(8, 'Carnatic Compositions VII', 'UCVP810', 'Tana Varna - Adi Tala', 'Kalyani Varna and Vasanta Varna', 20, 1),
(8, 'Carnatic Compositions VII', 'UCVP810', 'Madhyamakala Kritis - 4', 'Kritis in Anandabhairavi, Poorvikalyani, Kedaragoula, and Shanmukhapriya', 20, 2),
(8, 'Carnatic Compositions VII', 'UCVP810', 'Vilambakala Kritis (3 out of 4)', 'Kritis in Bhairavi, Madhyamavati, Kambhoji, or Todi', 20, 3),
(8, 'Carnatic Compositions VII', 'UCVP810', 'Bhadrachala Ramadasu Kirtana - 1', 'Advanced Ramadasu Kirtana study', 10, 4),
(8, 'Carnatic Compositions VII', 'UCVP810', 'Narayana Teertha Taranga - 1', 'Advanced Taranga study', 10, 5),
(8, 'Carnatic Compositions VII', 'UCVP810', 'Thillana - 1', 'Advanced Thillana study', 10, 6),
(8, 'Samudaya Kriti', 'UCVP830', 'Tyagaraja''s Ghanaraga Pancharatna Kriti-1', 'Final Pancharatna Kriti', 10, 1),
(8, 'Samudaya Kriti', 'UCVP830', 'Sathya Sai Geethamulu - 1', 'Final Sathya Sai Geethamulu', 10, 2),
(8, 'Samudaya Kriti', 'UCVP830', 'Muthuswamy Dikshitar''s Navagraha Kriti-1', 'Final Navagraha Kriti', 10, 3),
(8, 'Samudaya Kriti', 'UCVP830', 'Swati Tirunal''s Navaratri Kriti-1', 'Final Navaratri Kriti', 10, 4),
(8, 'Samudaya Kriti', 'UCVP830', 'Thyagaraja''s Pancharatna Krithi-1', 'Final Pancharatna Krithi', 10, 5),
(8, 'Samudaya Kriti', 'UCVP830', 'Syama Sastry''s Meenakshi Navaratnamalika Kriti-1', 'Final Navaratnamalika Kriti', 10, 6);

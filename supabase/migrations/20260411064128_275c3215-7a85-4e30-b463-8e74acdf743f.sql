
-- 1. Create is_super_or_admin helper function
CREATE OR REPLACE FUNCTION public.is_super_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin')
  )
$$;

-- 2. Update handle_new_user to set is_verified
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'student'
  );

  INSERT INTO public.profiles (user_id, display_name, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE WHEN _role IN ('super_admin', 'admin') THEN true ELSE false END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;

-- 3. Super admin can update roles
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Super admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- === activity_logs ===
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === assignment_submissions ===
DROP POLICY IF EXISTS "Admins can update all submissions" ON public.assignment_submissions;
CREATE POLICY "Admins can update all submissions" ON public.assignment_submissions
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all submissions" ON public.assignment_submissions;
CREATE POLICY "Admins can view all submissions" ON public.assignment_submissions
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === assignments ===
DROP POLICY IF EXISTS "Admins can delete assignments" ON public.assignments;
CREATE POLICY "Admins can delete assignments" ON public.assignments
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
CREATE POLICY "Admins can manage assignments" ON public.assignments
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update assignments" ON public.assignments;
CREATE POLICY "Admins can update assignments" ON public.assignments
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Students can view assignments" ON public.assignments;
CREATE POLICY "Students can view assignments" ON public.assignments
FOR SELECT TO authenticated
USING (public.is_super_or_admin(auth.uid()) OR EXISTS (
  SELECT 1 FROM enrollments WHERE enrollments.user_id = auth.uid() AND enrollments.course_id = assignments.course_id
));

-- === categories ===
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories" ON public.categories
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" ON public.categories
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === certificates ===
DROP POLICY IF EXISTS "Admins can delete certificates" ON public.certificates;
CREATE POLICY "Admins can delete certificates" ON public.certificates
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates" ON public.certificates
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update certificates" ON public.certificates;
CREATE POLICY "Admins can update certificates" ON public.certificates
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" ON public.certificates
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()));

-- === class_log_confirmations ===
DROP POLICY IF EXISTS "Admins can manage class log confirmations" ON public.class_log_confirmations;
CREATE POLICY "Admins can manage class log confirmations" ON public.class_log_confirmations
FOR ALL TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === class_logs ===
DROP POLICY IF EXISTS "Admins can manage class logs" ON public.class_logs;
CREATE POLICY "Admins can manage class logs" ON public.class_logs
FOR ALL TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === content_reviews ===
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.content_reviews;
CREATE POLICY "Admins can delete reviews" ON public.content_reviews
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update reviews" ON public.content_reviews;
CREATE POLICY "Admins can update reviews" ON public.content_reviews
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Instructors can view own course reviews" ON public.content_reviews;
CREATE POLICY "Instructors can view own course reviews" ON public.content_reviews
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = content_reviews.course_id AND courses.instructor_id = auth.uid()) OR public.is_super_or_admin(auth.uid()));

-- === coupons ===
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
CREATE POLICY "Admins can delete coupons" ON public.coupons
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
CREATE POLICY "Admins can insert coupons" ON public.coupons
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
CREATE POLICY "Admins can update coupons" ON public.coupons
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons
FOR SELECT USING (is_active = true OR public.is_super_or_admin(auth.uid()));

-- === course_lessons ===
DROP POLICY IF EXISTS "Instructors can delete own lessons" ON public.course_lessons;
CREATE POLICY "Instructors can delete own lessons" ON public.course_lessons
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM course_modules cm JOIN courses c ON c.id = cm.course_id WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()) OR public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Instructors can insert own lessons" ON public.course_lessons;
CREATE POLICY "Instructors can insert own lessons" ON public.course_lessons
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM course_modules cm JOIN courses c ON c.id = cm.course_id WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()) OR public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Instructors can update own lessons" ON public.course_lessons;
CREATE POLICY "Instructors can update own lessons" ON public.course_lessons
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM course_modules cm JOIN courses c ON c.id = cm.course_id WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()) OR public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "View lessons for enrolled or preview" ON public.course_lessons;
CREATE POLICY "View lessons for enrolled or preview" ON public.course_lessons
FOR SELECT TO authenticated
USING (is_preview = true OR public.is_super_or_admin(auth.uid()) OR EXISTS (SELECT 1 FROM course_modules cm JOIN courses c ON c.id = cm.course_id WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()) OR EXISTS (SELECT 1 FROM course_modules cm JOIN enrollments e ON e.course_id = cm.course_id WHERE cm.id = course_lessons.module_id AND e.user_id = auth.uid()));

-- === course_modules ===
DROP POLICY IF EXISTS "Anyone can view published course modules" ON public.course_modules;
CREATE POLICY "Anyone can view published course modules" ON public.course_modules
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND (courses.status = 'approved' OR courses.instructor_id = auth.uid())) OR public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Instructors can delete own course modules" ON public.course_modules;
CREATE POLICY "Instructors can delete own course modules" ON public.course_modules
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND courses.instructor_id = auth.uid()) OR public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Instructors can insert own course modules" ON public.course_modules;
CREATE POLICY "Instructors can insert own course modules" ON public.course_modules
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND courses.instructor_id = auth.uid()) OR public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Instructors can update own course modules" ON public.course_modules;
CREATE POLICY "Instructors can update own course modules" ON public.course_modules
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND courses.instructor_id = auth.uid()) OR public.is_super_or_admin(auth.uid()));

-- === courses ===
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
CREATE POLICY "Admins can delete courses" ON public.courses
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
CREATE POLICY "Admins can insert courses" ON public.courses
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
CREATE POLICY "Admins can update courses" ON public.courses
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === curriculum_modules ===
DROP POLICY IF EXISTS "Admins can delete curriculum modules" ON public.curriculum_modules;
CREATE POLICY "Admins can delete curriculum modules" ON public.curriculum_modules
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert curriculum modules" ON public.curriculum_modules;
CREATE POLICY "Admins can insert curriculum modules" ON public.curriculum_modules
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update curriculum modules" ON public.curriculum_modules;
CREATE POLICY "Admins can update curriculum modules" ON public.curriculum_modules
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === curriculum_section_links ===
DROP POLICY IF EXISTS "Admins and instructors can delete section links" ON public.curriculum_section_links;
CREATE POLICY "Admins and instructors can delete section links" ON public.curriculum_section_links
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors can insert section links" ON public.curriculum_section_links;
CREATE POLICY "Admins and instructors can insert section links" ON public.curriculum_section_links
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors can update section links" ON public.curriculum_section_links;
CREATE POLICY "Admins and instructors can update section links" ON public.curriculum_section_links
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

-- === curriculum_sections ===
DROP POLICY IF EXISTS "Admins and instructors can delete sections" ON public.curriculum_sections;
CREATE POLICY "Admins and instructors can delete sections" ON public.curriculum_sections
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors can insert sections" ON public.curriculum_sections;
CREATE POLICY "Admins and instructors can insert sections" ON public.curriculum_sections
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors can update sections" ON public.curriculum_sections;
CREATE POLICY "Admins and instructors can update sections" ON public.curriculum_sections
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

-- === enrollments ===
DROP POLICY IF EXISTS "Admins can delete enrollments" ON public.enrollments;
CREATE POLICY "Admins can delete enrollments" ON public.enrollments
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.enrollments
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update enrollments" ON public.enrollments;
CREATE POLICY "Admins can update enrollments" ON public.enrollments
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
CREATE POLICY "Admins can view all enrollments" ON public.enrollments
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === events ===
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events" ON public.events
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events" ON public.events
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events" ON public.events
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
CREATE POLICY "Anyone can view active events" ON public.events
FOR SELECT USING (is_active = true OR public.is_super_or_admin(auth.uid()));

-- === job_postings ===
DROP POLICY IF EXISTS "Admins can delete jobs" ON public.job_postings;
CREATE POLICY "Admins can delete jobs" ON public.job_postings
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert jobs" ON public.job_postings;
CREATE POLICY "Admins can insert jobs" ON public.job_postings
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update jobs" ON public.job_postings;
CREATE POLICY "Admins can update jobs" ON public.job_postings
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.job_postings;
CREATE POLICY "Anyone can view active jobs" ON public.job_postings
FOR SELECT USING (is_active = true OR public.is_super_or_admin(auth.uid()));

-- === lesson_progress ===
DROP POLICY IF EXISTS "Admins can view all progress" ON public.lesson_progress;
CREATE POLICY "Admins can view all progress" ON public.lesson_progress
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own progress" ON public.lesson_progress;
CREATE POLICY "Users can view own progress" ON public.lesson_progress
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()));

-- === orders ===
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()));

-- === profiles ===
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === program_inquiries ===
DROP POLICY IF EXISTS "Admins can delete inquiries" ON public.program_inquiries;
CREATE POLICY "Admins can delete inquiries" ON public.program_inquiries
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update inquiries" ON public.program_inquiries;
CREATE POLICY "Admins can update inquiries" ON public.program_inquiries
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.program_inquiries;
CREATE POLICY "Admins can view all inquiries" ON public.program_inquiries
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === schedules ===
DROP POLICY IF EXISTS "Admins can delete schedules" ON public.schedules;
CREATE POLICY "Admins can delete schedules" ON public.schedules
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage schedules" ON public.schedules;
CREATE POLICY "Admins can manage schedules" ON public.schedules
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update schedules" ON public.schedules;
CREATE POLICY "Admins can update schedules" ON public.schedules
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own schedules" ON public.schedules;
CREATE POLICY "Users can view own schedules" ON public.schedules
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_or_admin(auth.uid()));

-- === student_projects ===
DROP POLICY IF EXISTS "Admins and instructors can view all projects" ON public.student_projects;
CREATE POLICY "Admins and instructors can view all projects" ON public.student_projects
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

-- === subject_allocations ===
DROP POLICY IF EXISTS "Admins can manage allocations" ON public.subject_allocations;
CREATE POLICY "Admins can manage allocations" ON public.subject_allocations
FOR ALL TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === user_roles ===
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()));

-- === volunteer_applications ===
DROP POLICY IF EXISTS "Admins can delete volunteer applications" ON public.volunteer_applications;
CREATE POLICY "Admins can delete volunteer applications" ON public.volunteer_applications
FOR DELETE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update volunteer applications" ON public.volunteer_applications;
CREATE POLICY "Admins can update volunteer applications" ON public.volunteer_applications
FOR UPDATE TO authenticated USING (public.is_super_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view volunteer applications" ON public.volunteer_applications;
CREATE POLICY "Admins can view volunteer applications" ON public.volunteer_applications
FOR SELECT TO authenticated USING (public.is_super_or_admin(auth.uid()));

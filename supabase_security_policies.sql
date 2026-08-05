-- Enable RLS on all tables
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Teacher view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teacher manage own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Student view own attendance" ON public.attendance;

DROP POLICY IF EXISTS "Teacher view own fees" ON public.fees;
DROP POLICY IF EXISTS "Teacher manage own fees" ON public.fees;
DROP POLICY IF EXISTS "Student view own fees" ON public.fees;

DROP POLICY IF EXISTS "Teacher view own marks" ON public.marks;
DROP POLICY IF EXISTS "Teacher manage own marks" ON public.marks;
DROP POLICY IF EXISTS "Student view own marks" ON public.marks;

DROP POLICY IF EXISTS "Teacher view own students" ON public.students;
DROP POLICY IF EXISTS "Teacher manage own students" ON public.students;
DROP POLICY IF EXISTS "Student view own profile" ON public.students;

DROP POLICY IF EXISTS "Teacher manage study materials" ON public.study_materials;
DROP POLICY IF EXISTS "Student view study materials" ON public.study_materials;

DROP POLICY IF EXISTS "Teacher manage syllabus" ON public.syllabus;
DROP POLICY IF EXISTS "Student view syllabus" ON public.syllabus;

DROP POLICY IF EXISTS "Teacher view own profile" ON public.teachers;
DROP POLICY IF EXISTS "Teacher update own profile" ON public.teachers;

--------------------------------------------------------------------------------
-- 1. TEACHERS TABLE POLICIES
-- Teachers can view and update only their own profile
--------------------------------------------------------------------------------
CREATE POLICY "Teacher view own profile" ON public.teachers
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teacher update own profile" ON public.teachers
FOR UPDATE USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 2. STUDENTS TABLE POLICIES
-- Teachers can see all students linked to them
-- Students can see their own profile
--------------------------------------------------------------------------------
CREATE POLICY "Teacher view own students" ON public.students
FOR SELECT USING (
  exists (
    select 1 from teachers
    where teachers.id = students.teacher_id
    and teachers.user_id = auth.uid()
  )
);

CREATE POLICY "Teacher manage own students" ON public.students
FOR ALL USING (
  exists (
    select 1 from teachers
    where teachers.id = students.teacher_id
    and teachers.user_id = auth.uid()
  )
);

CREATE POLICY "Student view own profile" ON public.students
FOR SELECT USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 3. ATTENDANCE TABLE POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Teacher manage own attendance" ON public.attendance
FOR ALL USING (
  exists (
    select 1 from students
    join teachers on students.teacher_id = teachers.id
    where students.id = attendance.student_id
    and teachers.user_id = auth.uid()
  )
);

CREATE POLICY "Student view own attendance" ON public.attendance
FOR SELECT USING (
  exists (
    select 1 from students
    where students.id = attendance.student_id
    and students.user_id = auth.uid()
  )
);

--------------------------------------------------------------------------------
-- 4. MARKS TABLE POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Teacher manage own marks" ON public.marks
FOR ALL USING (
  exists (
    select 1 from students
    join teachers on students.teacher_id = teachers.id
    where students.id = marks.student_id
    and teachers.user_id = auth.uid()
  )
);

CREATE POLICY "Student view own marks" ON public.marks
FOR SELECT USING (
  exists (
    select 1 from students
    where students.id = marks.student_id
    and students.user_id = auth.uid()
  )
);

--------------------------------------------------------------------------------
-- 5. FEES TABLE POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Teacher manage own fees" ON public.fees
FOR ALL USING (
  exists (
    select 1 from students
    join teachers on students.teacher_id = teachers.id
    where students.id = fees.student_id
    and teachers.user_id = auth.uid()
  )
);

CREATE POLICY "Student view own fees" ON public.fees
FOR SELECT USING (
  exists (
    select 1 from students
    where students.id = fees.student_id
    and students.user_id = auth.uid()
  )
);

--------------------------------------------------------------------------------
-- 6. STUDY MATERIALS POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Teacher manage study materials" ON public.study_materials
FOR ALL USING (
  exists (
    select 1 from teachers
    where teachers.id = study_materials.teacher_id
    and teachers.user_id = auth.uid()
  )
);

CREATE POLICY "Student view study materials" ON public.study_materials
FOR SELECT USING (
  exists (
    select 1 from students
    where students.teacher_id = study_materials.teacher_id
    and students.user_id = auth.uid()
  )
);

--------------------------------------------------------------------------------
-- 7. SYLLABUS POLICIES (Assuming similar structure to materials)
--------------------------------------------------------------------------------
-- If you update syllabus schema to match, use this:
CREATE POLICY "Teacher manage syllabus" ON public.syllabus
FOR ALL USING (
  exists (
    select 1 from teachers
    where teachers.id = syllabus.teacher_id
    and teachers.user_id = auth.uid()
  )
);

CREATE POLICY "Student view syllabus" ON public.syllabus
FOR SELECT USING (
  exists (
    select 1 from students
    where students.teacher_id = syllabus.teacher_id
    and students.user_id = auth.uid()
  )
);

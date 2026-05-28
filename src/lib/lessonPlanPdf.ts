import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type LessonPlanPdfData = {
  plan: any;
  module: any;
  teacher?: any;
  outcomes?: any[];
  sections?: any[];
  entries?: any[];
  program?: any;
  allocation?: any;
  topics?: any[];
};

const listText = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).join("; ") : value ? String(value) : "—";
const semParity = (sem?: number) => (sem ? (sem % 2 === 1 ? "Odd Semester" : "Even Semester") : "—");

export const downloadLessonPlanPdf = ({ plan, module, teacher, outcomes = [], sections = [], entries = [], program, allocation, topics = [] }: LessonPlanPdfData) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const maroon: [number, number, number] = [125, 30, 36];
  const gold: [number, number, number] = [196, 154, 60];
  const cream: [number, number, number] = [250, 246, 238];
  const ink: [number, number, number] = [61, 46, 34];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const header = () => {
    doc.setFillColor(...cream); doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setTextColor(...maroon); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text("NADA GURUKULAM — LESSON PLAN", 40, 38);
    doc.setDrawColor(...gold); doc.setLineWidth(1.5); doc.line(40, 48, pageWidth - 40, 48);
  };
  header();

  // Header table (2 cols of label/value pairs across 3 columns of pairs = 6 cells per row)
  autoTable(doc, {
    startY: 62, theme: "grid",
    styles: { fontSize: 8, cellPadding: 4, textColor: ink, lineColor: [235, 227, 204] },
    body: [
      ["Academic Semester", semParity(module?.semester), "Academic Year", allocation?.academic_year || "—", "Semester No.", String(module?.semester ?? "—")],
      ["Program", program?.name || "—", "Course Code", module?.course_code || "—", "Course Name", module?.subject_name || module?.module_name || "—"],
      ["Contact Hrs/week", String(plan?.contact_hours_per_week ?? module?.teaching_hours ?? "—"), "No. of Credits", String(module?.credits ?? "—"), "Exam Hours", module?.exam_hours || module?.cie_exam_hours || module?.see_exam_hours || "—"],
      ["Faculty Name", teacher?.display_name || "—", "Designation", teacher?.designation || "—", "CIE / SEE Marks", `${module?.assessment_cie_marks ?? "—"} / ${module?.assessment_see_marks ?? "—"}`],
    ],
  });

  // Prerequisites + Content Delivery + Syllabus + COs as separate labeled sections
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10, theme: "grid",
    head: [["Prerequisites (if any)", "Content Delivery Methods"]],
    body: [[module?.prerequisites || "—", plan?.content_delivery_methods || module?.pedagogy || "—"]],
    headStyles: { fillColor: maroon, textColor: cream },
    styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
  });

  const syllabusParts: string[] = [];
  if (module?.description) syllabusParts.push(module.description);
  if (Array.isArray(module?.course_objectives) && module.course_objectives.length) syllabusParts.push("Objectives: " + module.course_objectives.join("; "));
  if (topics.length) syllabusParts.push("Topics: " + topics.map((t: any) => t.title).join("; "));

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6, theme: "grid",
    head: [["Course Syllabus (As prescribed by SSSUHE)"]],
    body: [[syllabusParts.join("\n") || "—"]],
    headStyles: { fillColor: maroon, textColor: cream },
    styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["CO#", "Description", "RBT Levels", "Hours"]],
    body: outcomes.length ? outcomes.map((o) => [`CO${o.co_number}`, o.description, o.rbt_levels || "—", String(o.hours || "—")]) : [["—", "No course outcomes recorded", "—", "—"]],
    headStyles: { fillColor: maroon, textColor: cream },
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    columnStyles: { 1: { cellWidth: 520 } },
  });

  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const rows = Array.from({ length: plan?.total_periods || 60 }, (_, index) => {
    const lecture = index + 1;
    const entry = entries.find((e) => e.lecture_number === lecture) || ({} as any);
    const section = sectionMap.get(entry.curriculum_section_id);
    return [
      String(lecture),
      module?.module_name || "",
      entry.topic_title || section?.title || "",
      entry.rbt_level || section?.rbt_levels || "",
      entry.co_mapping || "",
      entry.actual_date || "",
      entry.actual_date ? (teacher?.display_name || "") : "",
      entry.faculty_remarks || "",
    ];
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Period", "Module Name", "Topic", "RBT Levels", "CO Mapping", "Actual Date", "Faculty Sign", "Remarks"]],
    body: rows,
    headStyles: { fillColor: maroon, textColor: cream },
    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    columnStyles: { 2: { cellWidth: 180 }, 7: { cellWidth: 135 } },
    didDrawPage: (data) => { if (data.pageNumber > 1) header(); },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setTextColor(...maroon); doc.setFontSize(9); doc.text(`Page ${i} of ${pageCount}`, pageWidth - 90, pageHeight - 20); }
  doc.setPage(pageCount); doc.setFontSize(10); doc.text("Teacher's sign ____________________     HOD's sign ____________________     Principal's sign ____________________", 40, pageHeight - 34);
  doc.save(`lesson-plan-${module?.course_code || "course"}.pdf`);
};

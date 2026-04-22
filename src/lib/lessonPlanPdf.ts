import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type LessonPlanPdfData = { plan: any; module: any; teacher?: any; outcomes?: any[]; sections?: any[]; entries?: any[] };

const listText = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).join("; ") : value ? String(value) : "—";

export const downloadLessonPlanPdf = ({ plan, module, teacher, outcomes = [], sections = [], entries = [] }: LessonPlanPdfData) => {
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

  autoTable(doc, { startY: 62, theme: "grid", styles: { fontSize: 8, cellPadding: 4, textColor: ink, lineColor: [235, 227, 204] }, body: [
    ["Department", teacher?.department || "Performing Arts", "Academic Semester", plan?.academic_semester || `Semester ${module?.semester || ""}`, "Section", plan?.section || "—"],
    ["Course Code", module?.course_code || "—", "Course Name", module?.subject_name || module?.module_name || "—", "Module", module?.module_name || "—"],
    ["Teacher", teacher?.display_name || "—", "Designation", teacher?.designation || "—", "Contact Hrs/week", String(plan?.contact_hours_per_week || 3)],
    ["CIE Marks", String(module?.assessment_cie_marks ?? "—"), "SEE Marks", String(module?.assessment_see_marks ?? "—"), "Exam Hours", module?.exam_hours || "—"],
  ] });

  autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 10, theme: "grid", head: [["Course Objectives", "Pedagogy", "References"]], body: [[listText(module?.course_objectives), module?.pedagogy || "—", listText(module?.references_list)]], headStyles: { fillColor: maroon, textColor: cream }, styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" }, columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 220 }, 2: { cellWidth: 260 } } });

  autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 10, head: [["CO#", "Description", "RBT Levels", "Hours"]], body: outcomes.length ? outcomes.map((o) => [`CO${o.co_number}`, o.description, o.rbt_levels || "—", String(o.hours || "—")]) : [["—", "No course outcomes recorded", "—", "—"]], headStyles: { fillColor: maroon, textColor: cream }, styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" }, columnStyles: { 1: { cellWidth: 520 } } });

  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const rows = Array.from({ length: plan?.total_periods || 60 }, (_, index) => {
    const lecture = index + 1;
    const entry = entries.find((e) => e.lecture_number === lecture) || {};
    const section = sectionMap.get(entry.curriculum_section_id);
    return [String(lecture), String(entry.module_number || module?.sort_order || ""), entry.topic_title || section?.title || "", entry.rbt_level || section?.rbt_levels || "", entry.co_mapping || section?.co_mapping || "", entry.actual_date || "", entry.faculty_remarks || "", ""];
  });

  autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 10, head: [["Period", "Module", "Topic", "RBT", "CO", "Actual Date", "Faculty Remarks", "Sign"]], body: rows, headStyles: { fillColor: maroon, textColor: cream }, styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" }, columnStyles: { 2: { cellWidth: 190 }, 6: { cellWidth: 135 } }, didDrawPage: (data) => { if (data.pageNumber > 1) header(); } });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setTextColor(...maroon); doc.setFontSize(9); doc.text(`Page ${i} of ${pageCount}`, pageWidth - 90, pageHeight - 20); }
  doc.setPage(pageCount); doc.setFontSize(10); doc.text("Teacher's sign ____________________     HOD's sign ____________________     Principal's sign ____________________", 40, pageHeight - 34);
  doc.save(`lesson-plan-${module?.course_code || "course"}.pdf`);
};

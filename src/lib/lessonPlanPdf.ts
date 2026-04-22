import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type LessonPlanPdfData = {
  plan: any;
  module: any;
  teacher?: any;
  outcomes?: any[];
  sections?: any[];
  entries?: any[];
};

export const downloadLessonPlanPdf = ({ plan, module, teacher, outcomes = [], sections = [], entries = [] }: LessonPlanPdfData) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const maroon: [number, number, number] = [126, 35, 32];
  const gold: [number, number, number] = [224, 172, 39];
  const cream: [number, number, number] = [255, 253, 233];

  doc.setFillColor(...cream);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
  doc.setTextColor(...maroon);
  doc.setFontSize(20);
  doc.text("LESSON PLAN", 40, 42);
  doc.setDrawColor(...gold);
  doc.setLineWidth(2);
  doc.line(40, 50, 800, 50);

  autoTable(doc, {
    startY: 66,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 4, textColor: [71, 5, 0] },
    body: [
      ["Department", teacher?.department || "Performing Arts", "Academic Semester", plan?.academic_semester || "ODD Sem 2024-25", "Semester", String(module?.semester || "")],
      ["Course Code", module?.course_code || "—", "Course Name", module?.subject_name || module?.module_name || "—", "Section", plan?.section || "—"],
      ["Teacher's Name", teacher?.display_name || "—", "Designation", teacher?.designation || "—", "Contact Hrs/week", String(plan?.contact_hours_per_week || 3)],
      ["CIE Marks", String(module?.assessment_cie_marks || 20), "SEE Marks", String(module?.assessment_see_marks || 30), "Exam Hours", module?.exam_hours || "—"],
    ],
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 14,
    head: [["Module No", "Contents", "Hours", "COs"]],
    body: [[String(module?.sort_order || 1), module?.module_name || module?.subject_name || "—", String(module?.hours || "—"), outcomes.map((o) => `CO${o.co_number}`).join(", ") || "—"]],
    headStyles: { fillColor: maroon, textColor: [255, 253, 233] },
    styles: { fontSize: 9, cellPadding: 5 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 14,
    head: [["CO#", "Description", "RBT Levels", "Hours"]],
    body: outcomes.length ? outcomes.map((o) => [`CO${o.co_number}`, o.description, o.rbt_levels || "—", String(o.hours || "—")]) : [["—", "No course outcomes recorded", "—", "—"]],
    headStyles: { fillColor: maroon, textColor: [255, 253, 233] },
    styles: { fontSize: 8, cellPadding: 4 },
  });

  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const rows = Array.from({ length: plan?.total_periods || 60 }, (_, index) => {
    const lecture = index + 1;
    const entry = entries.find((e) => e.lecture_number === lecture) || {};
    const section = sectionMap.get(entry.curriculum_section_id);
    return [String(lecture), String(entry.module_number || module?.sort_order || ""), entry.topic_title || section?.title || "", entry.rbt_level || section?.rbt_levels || "", entry.co_mapping || section?.co_mapping || "", entry.actual_date || "", entry.faculty_remarks || "", ""];
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 14,
    head: [["Period", "Module", "Topic", "RBT", "CO", "Actual Date", "Remarks", "Sign"]],
    body: rows,
    headStyles: { fillColor: maroon, textColor: [255, 253, 233] },
    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    columnStyles: { 2: { cellWidth: 170 }, 6: { cellWidth: 120 } },
  });

  const y = Math.min((doc as any).lastAutoTable.finalY + 28, doc.internal.pageSize.getHeight() - 28);
  doc.setTextColor(...maroon);
  doc.setFontSize(10);
  doc.text("Teacher's sign ____________________     HOD's sign ____________________", 40, y);
  doc.save(`lesson-plan-${module?.course_code || "course"}.pdf`);
};

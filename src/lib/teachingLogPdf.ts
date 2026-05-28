import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type TeachingLogRow = {
  serial: number;
  date: string;
  day: string;
  time: string;
  batchSem: string;
  topic: string;
  T: boolean;
  Th: boolean;
  P: boolean;
  remarks: string;
};

export type TeachingLogPdfData = {
  facultyName: string;
  designation: string;
  weekLabel: string;
  rows: TeachingLogRow[];
};

export const downloadTeachingLogPdf = ({ facultyName, designation, weekLabel, rows }: TeachingLogPdfData) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const maroon: [number, number, number] = [125, 30, 36];
  const gold: [number, number, number] = [196, 154, 60];
  const cream: [number, number, number] = [250, 246, 238];
  const ink: [number, number, number] = [61, 46, 34];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...cream); doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setTextColor(...maroon); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("NADA GURUKULAM — WEEKLY TEACHING LOG", 40, 38);
  doc.setDrawColor(...gold); doc.setLineWidth(1.5); doc.line(40, 48, pageWidth - 40, 48);

  doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`Name of the Faculty: ${facultyName}`, 40, 68);
  doc.text(`Designation: ${designation || "—"}`, pageWidth - 40, 68, { align: "right" });
  doc.text(`Week: ${weekLabel}`, 40, 84);

  autoTable(doc, {
    startY: 96,
    theme: "grid",
    headStyles: { fillColor: maroon, textColor: 255, fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 4, textColor: ink, lineColor: [235, 227, 204] },
    head: [["S.No", "Date", "Day", "Time", "Batch & Sem", "Topic", "T", "Th", "P", "Remarks"]],
    body: rows.length
      ? rows.map((r) => [
          String(r.serial),
          r.date,
          r.day,
          r.time,
          r.batchSem,
          r.topic,
          r.T ? "✓" : "",
          r.Th ? "✓" : "",
          r.P ? "✓" : "",
          r.remarks || "",
        ])
      : [["—", "—", "—", "—", "—", "No classes logged for this week", "", "", "", ""]],
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      6: { cellWidth: 28, halign: "center" },
      7: { cellWidth: 28, halign: "center" },
      8: { cellWidth: 28, halign: "center" },
    },
  });

  const endY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(9); doc.setTextColor(...ink);
  doc.text("Faculty Signature: ____________________", 40, endY);
  doc.text("HOD Signature: ____________________", pageWidth / 2 - 80, endY);
  doc.text("Principal Signature: ____________________", pageWidth - 240, endY);

  doc.save(`teaching-log-${weekLabel.replace(/\s+/g, "-")}.pdf`);
};

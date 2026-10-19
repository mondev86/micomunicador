import { jsPDF } from "jspdf";
import { SessionEntry, ReportRange, getRangeLabel } from "./therapistUtils";
import { calculatePhraseUsage, calculateWordUsage } from "./reportStats";

export type ReportPdfParams = {
	entries: SessionEntry[];
	profileName: string;
	reportRange: ReportRange;
	scopeLabel?: string;
	filenameSuffix?: string;
	therapistName: string;
	therapistLicense: string;
	therapistNotes: string;
};

// Genera PDF clínico con resumen, métricas y firma.
export function downloadSessionReportPdf({
	entries,
	profileName,
	reportRange,
	scopeLabel,
	filenameSuffix,
	therapistName,
	therapistLicense,
	therapistNotes,
}: ReportPdfParams): void {
	if (entries.length === 0) {
		window.alert("No hay frases en el registro para exportar.");
		return;
	}

	const now = new Date();
	const dateLabel = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(now);
	const generatedAt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(now);
	const localPhraseUsage = calculatePhraseUsage(entries);
	const localWordUsage = calculateWordUsage(entries);
	const topPhrases = localPhraseUsage.slice(0, 3).map(([phrase]) => phrase);
	const topWords = localWordUsage.slice(0, 8);

	const doc = new jsPDF({ unit: "pt", format: "a4" });
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const marginX = 40;
	const contentWidth = pageWidth - marginX * 2;
	const subtleBorder = [226, 232, 240] as const;
	const bodyText = [15, 23, 42] as const;
	const mutedText = [71, 85, 105] as const;

	doc.setFillColor(29, 78, 216);
	doc.rect(0, 0, pageWidth, 98, "F");

	doc.setTextColor(255, 255, 255);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(23);
	doc.text("Mi Comunicador", marginX, 45);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(12);
	doc.text("Reporte clínico de sesión", marginX, 66);
	doc.setFontSize(9.5);
	doc.text(`Generado: ${generatedAt}`, marginX, 83);

	doc.setFillColor(247, 249, 252);
	doc.setDrawColor(...subtleBorder);
	doc.roundedRect(marginX, 114, contentWidth, 100, 10, 10, "F");
	doc.roundedRect(marginX, 114, contentWidth, 100, 10, 10, "S");
	doc.setTextColor(...bodyText);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(11.5);
	doc.text("Resumen de sesión", marginX + 14, 134);
	doc.setDrawColor(29, 78, 216);
	doc.line(marginX + 14, 142, marginX + 92, 142);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(9.8);
	doc.text(`Perfil: ${profileName}`, marginX + 14, 157);
	doc.text(`Fecha: ${dateLabel}`, marginX + 14, 173);
	const rangeText = `Rango: ${scopeLabel ?? getRangeLabel(reportRange)}`;
	doc.text(rangeText, marginX + 14, 189);
	doc.setFontSize(8.6);
	doc.setTextColor(...mutedText);
	const criteriaText = "Criterio de conteo: frases = pulsaciones de Hablar; frases únicas = textos exactos distintos; vocabulario activo = palabras normalizadas únicas.";
	const criteriaLines = doc.splitTextToSize(criteriaText, contentWidth - 28);
	doc.text(criteriaLines, marginX + 14, 201);

	const cardTop = 228;
	const cardGap = 12;
	const cardWidth = (contentWidth - cardGap * 2) / 3;
	const drawMetricCard = (index: number, title: string, value: string) => {
		const x = marginX + index * (cardWidth + cardGap);
		doc.setFillColor(250, 250, 250);
		doc.setDrawColor(...subtleBorder);
		doc.roundedRect(x, cardTop, cardWidth, 74, 8, 8, "F");
		doc.roundedRect(x, cardTop, cardWidth, 74, 8, 8, "S");
		doc.setDrawColor(37, 99, 235);
		doc.line(x + 10, cardTop + 10, x + 44, cardTop + 10);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(9.2);
		doc.setTextColor(...mutedText);
		doc.text(title.toUpperCase(), x + 12, cardTop + 26);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(20);
		doc.setTextColor(...bodyText);
		doc.text(value, x + 12, cardTop + 54);
	};

	drawMetricCard(0, "Frases", String(entries.length));
	drawMetricCard(1, "Frases únicas", String(localPhraseUsage.length));
	drawMetricCard(2, "Vocabulario activo", String(localWordUsage.length));

	const summaryY = 322;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(11);
	doc.setTextColor(...bodyText);
	doc.text("Lectura clínica", marginX, summaryY);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(10);
	const summaryText = `${profileName} comunicó ${entries.length} frases en el período seleccionado. Frases más usadas:`;
	const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
	doc.text(summaryLines, marginX, summaryY + 18);
	let summaryYOffset = 18 + summaryLines.length * 13 + 8;
	topPhrases.forEach((phrase, idx) => {
		const line = `${idx + 1}. ${phrase}`;
		doc.text(line, marginX + 8, summaryY + summaryYOffset);
		summaryYOffset += 13;
	});
	const totalSummaryLines = summaryLines.length + topPhrases.length;
	let nextY = summaryY + 18 + totalSummaryLines * 13 + 18;
	if (therapistNotes.trim()) {
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		doc.setTextColor(...bodyText);
		doc.text("Observaciones del logopeda", marginX, nextY);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		const notesLines = doc.splitTextToSize(therapistNotes.trim(), contentWidth);
		doc.text(notesLines, marginX, nextY + 18);
		nextY += 18 + notesLines.length * 13 + 14;
	}

	const sectionY = nextY;
	doc.setDrawColor(...subtleBorder);
	doc.line(marginX, sectionY, pageWidth - marginX, sectionY);

	doc.setFont("helvetica", "bold");
	doc.setFontSize(11);
	doc.setTextColor(...bodyText);
	doc.text("Top frases", marginX, sectionY + 24);
	doc.text("Palabras más usadas", pageWidth / 2 + 8, sectionY + 24);

	doc.setFont("helvetica", "normal");
	doc.setFontSize(10);
	let leftY = sectionY + 46;
	for (const [phrase, count] of localPhraseUsage.slice(0, 10)) {
		const phraseLines = doc.splitTextToSize(`- ${phrase} (${count})`, contentWidth / 2 - 22);
		doc.text(phraseLines, marginX, leftY);
		leftY += phraseLines.length * 13;
	}

	let rightY = sectionY + 46;
	for (const [word, count] of topWords) {
		doc.text(`- ${word} (${count})`, pageWidth / 2 + 8, rightY);
		rightY += 14;
	}

	doc.setDrawColor(...subtleBorder);
	doc.line(pageWidth / 2, sectionY, pageWidth / 2, Math.max(leftY, rightY) - 6);

	const listsBottomY = Math.max(leftY, rightY) + 12;
	let signatureBlockTop: number;
	if (listsBottomY + 150 > pageHeight) {
		doc.addPage();
		signatureBlockTop = 40;
	} else {
		signatureBlockTop = listsBottomY;
	}
	doc.setDrawColor(...subtleBorder);
	doc.line(marginX, signatureBlockTop, pageWidth - marginX, signatureBlockTop);

	doc.setFont("helvetica", "bold");
	doc.setFontSize(11);
	doc.setTextColor(...bodyText);
	doc.text("Validación profesional", marginX, signatureBlockTop + 22);

	doc.setFont("helvetica", "normal");
	doc.setFontSize(9.8);
	doc.text(`Logopeda: ${therapistName.trim() || "____________________________"}`, marginX, signatureBlockTop + 40);
	doc.text(`Colegiado: ${therapistLicense.trim() || "____________________________"}`, marginX, signatureBlockTop + 56);
	doc.text(`Fecha de firma: ${new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(now)}`, pageWidth / 2 + 8, signatureBlockTop + 40);
	doc.text("Firma", pageWidth / 2 + 8, signatureBlockTop + 56);
	doc.line(pageWidth / 2 + 48, signatureBlockTop + 58, pageWidth - marginX, signatureBlockTop + 58);

	doc.setFont("helvetica", "italic");
	doc.setFontSize(8.8);
	doc.setTextColor(100, 116, 139);
	doc.text("Mi Comunicador - reporte generado automáticamente para seguimiento terapéutico.", marginX, pageHeight - 20);

	const safeName = profileName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "perfil";
	const fileDate = now.toISOString().slice(0, 10);
	doc.save(`reporte-sesion-${safeName}-${filenameSuffix ?? reportRange}-${fileDate}.pdf`);
}

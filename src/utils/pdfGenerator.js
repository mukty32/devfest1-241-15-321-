import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generatePdfPackage = async (tenderData, requirements, matches, expiryDates) => {
  const mergedPdf = await PDFDocument.create();
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Cover Page Creation
  const coverPage = mergedPdf.addPage([595.28, 841.89]);
  const { height } = coverPage.getSize();

  coverPage.drawText("TENDER DOCUMENT PACKAGE", { x: 50, y: height - 60, size: 20, font: boldFont, color: rgb(0.1, 0.2, 0.5) });
  coverPage.drawText(`Tender ID: ${tenderData.tender_id}`, { x: 50, y: height - 100, size: 11, font });
  coverPage.drawText(`Title: ${tenderData.title}`, { x: 50, y: height - 120, size: 11, font });
  coverPage.drawText(`Procuring Entity: ${tenderData.procuring_entity}`, { x: 50, y: height - 140, size: 11, font });
  coverPage.drawText(`Bidder: ${tenderData.bidder}`, { x: 50, y: height - 160, size: 11, font });
  coverPage.drawText(`Submission Deadline: ${tenderData.submission_deadline}`, { x: 50, y: height - 180, size: 11, font });
  coverPage.drawText(`Generated Date: ${new Date().toISOString().split('T')[0]}`, { x: 50, y: height - 200, size: 11, font });

  coverPage.drawText("Included Documents (In Order):", { x: 50, y: height - 240, size: 13, font: boldFont });

  let yPos = height - 270;
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);

  for (const req of sortedReqs) {
    const file = matches[req.id];
    if (file) {
      const exp = expiryDates[req.id] ? ` (Expires: ${expiryDates[req.id]})` : '';
      coverPage.drawText(`${req.order}. ${req.title_en} - File: ${file.name}${exp}`, { x: 60, y: yPos, size: 10, font });
      yPos -= 20;

      const fileBuffer = await file.rawFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
  }

  // Footer (<tender_id> | Page X of Y)
  const totalPages = mergedPdf.getPageCount();
  const pages = mergedPdf.getPages();

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const footerText = `${tenderData.tender_id} | Page ${i + 1} of ${totalPages}`;
    
    page.drawText(footerText, {
      x: 50,
      y: 20,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};
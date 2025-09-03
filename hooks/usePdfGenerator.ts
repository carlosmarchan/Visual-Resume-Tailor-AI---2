
import { useCallback } from 'react';

// This assumes jspdf is loaded from a CDN and available globally.
declare var jspdf: any;

export const usePdfGenerator = () => {
  const downloadImagesAsPdf = useCallback((images: string[], fileName: string = 'resume.pdf') => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
      });
    };

    const generatePdf = async () => {
      try {
        const { jsPDF } = jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const loadedImages = await Promise.all(images.map(loadImage));

        loadedImages.forEach((img, index) => {
          if (index > 0) {
            doc.addPage();
          }
          
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          
          const widthRatio = pageWidth / img.width;
          const heightRatio = pageHeight / img.height;
          const ratio = Math.min(widthRatio, heightRatio);

          const imgWidth = img.width * ratio;
          const imgHeight = img.height * ratio;
          
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;

          doc.addImage(images[index], 'PNG', x, y, imgWidth, imgHeight);
        });

        doc.save(fileName);
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert(`Sorry, there was an error generating the PDF. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    generatePdf();
  }, []);

  const downloadTextAsPdf = useCallback((text: string, fileName: string = 'cover-letter.pdf') => {
    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF('p', 'pt', 'a4');
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - (margin * 2);
      
      const lines = doc.splitTextToSize(text, usableWidth);
      doc.text(lines, margin, margin);
      
      doc.save(fileName);
    } catch (error) {
      console.error("Failed to generate text PDF:", error);
      alert(`Sorry, there was an error generating the PDF. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  return { downloadImagesAsPdf, downloadTextAsPdf };
};
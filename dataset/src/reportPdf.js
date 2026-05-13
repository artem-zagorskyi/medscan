import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '..', 'fonts');

export function reportToPdf(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      // Регистрируем шрифты с кириллицей
      doc.registerFont('Regular', path.join(FONTS_DIR, 'DejaVuSans-Regular.ttf'));
      doc.registerFont('Bold',    path.join(FONTS_DIR, 'DejaVuSans-Bold.ttf'));

      const stream = fs.createWriteStream(outputPath);
      stream.on('finish', () => resolve());
      stream.on('error', reject);
      doc.on('error', reject);
      doc.pipe(stream);

      // ── Шапка ──
      doc.fontSize(16).fillColor('#1a3a5c').font('Bold')
         .text(data.lab, 50, 50);
      doc.fontSize(9).fillColor('#666').font('Regular')
         .text(`№ звіту: ${data.reportNo}`, 400, 50, { align: 'right' })      // ← было Report No
         .text(`Дата звіту: ${data.reportDate}`, 400, 64, { align: 'right' });

      doc.moveTo(50, 90).lineTo(545, 90).strokeColor('#1a3a5c').lineWidth(2).stroke();

      // ── Заголовок ──
      doc.fontSize(13).fillColor('#222').font('Bold')
         .text('ЛАБОРАТОРНИЙ ЗВІТ', 50, 105, { align: 'center', width: 495 });

      // ── Дані пацієнта ──
      const infoY = 140;
      doc.fontSize(9).fillColor('#000').font('Bold');
      doc.text('ID пацієнта:', 50, infoY);
      doc.text('ID зразка:', 50, infoY + 16);
      doc.text('Тип зразка:', 50, infoY + 32);
      doc.text('Дата забору:', 300, infoY);
      doc.text('Лікар:', 300, infoY + 16);

      doc.font('Regular');
      doc.text(data.patientId,  130, infoY);
      doc.text(data.sampleId,   130, infoY + 16);
      doc.text(data.sampleType, 130, infoY + 32);
      doc.text(data.collection, 380, infoY);
      doc.text(data.physician,  380, infoY + 16);

      // ── Замовлене дослідження ──
      const orderedY = infoY + 60;
      doc.fontSize(9).fillColor('#000').font('Bold')
         .text('Замовлене дослідження:', 50, orderedY);
      doc.font('Regular')
         .text(data.parameters[0].name, 200, orderedY, { width: 345 });

      // ── Заголовок таблиці ──
      const tableY = orderedY + 30;
      doc.fontSize(10).fillColor('#1a3a5c').font('Bold')
         .text('РЕЗУЛЬТАТИ ДОСЛІДЖЕНЬ', 50, tableY);

      // ── Таблиця ──
      const rowY = tableY + 20;
      const cols = [
        { key: 'name',     label: 'Показник',       x: 50,  w: 160 }, // ← было 185
        { key: 'result',   label: 'Результат',       x: 210, w: 90  },
        { key: 'unit',     label: 'Одиниці',         x: 300, w: 55  },
        { key: 'refRange', label: 'Реф. діапазон',   x: 355, w: 85  },
        { key: 'status',   label: 'Статус',          x: 440, w: 105 }, // ← было 65
      ];

      // Хедер таблиці
      doc.rect(50, rowY, 495, 18).fill('#1a3a5c');
      doc.fillColor('#fff').fontSize(9).font('Bold');
      cols.forEach(c =>
        doc.text(c.label, c.x + 4, rowY + 5, { width: c.w - 8 })
      );

      // Рядки
      let y = rowY + 18;
      doc.font('Regular').fontSize(9);
      data.parameters.forEach((p, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f6f6f6';
        doc.rect(50, y, 495, 28).fill(bg);
        const isAbnormal = ['HIGH', 'LOW', 'ABNORMAL',
                            'ВИСОКИЙ', 'НИЗЬКИЙ', 'АБНОРМАЛЬНИЙ',
                            'АБОВІННОСТ'].includes(p.status);
        cols.forEach(c => {
          const color = (c.key === 'status' && isAbnormal) ? '#c0392b' : '#000';
          const font  = (c.key === 'status' && isAbnormal) ? 'Bold' : 'Regular';
          doc.fillColor(color).font(font)
             .text(String(p[c.key] ?? ''), c.x + 4, y + 9,
                   { width: c.w - 8, ellipsis: true });
        });
        y += 28;
      });

      doc.strokeColor('#ccc').lineWidth(0.5)
         .rect(50, rowY, 495, y - rowY).stroke();

      // ── Підвал ──
      y += 30;
      doc.fontSize(8).fillColor('#888').font('Regular')
         .text('Примітка: результати слід інтерпретувати в клінічному контексті.', 50, y)
         .text('Аналіз виконано відповідно до стандартів ISO 15189.', 50, y + 12);

      doc.fontSize(8).fillColor('#666').font('Regular')
         .text(`Авторизовано: ${data.physician}  |  ${data.lab}`,
               50, y + 40, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
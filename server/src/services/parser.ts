import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import sax from 'sax';
import { Transform } from 'stream';

interface HealthRecord {
  type: string;
  startDate: Date;
  value: number;
  unit: string;
}

export const parseHealthExport = (zipPath: string, days: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();
      const xmlEntry = zipEntries.find(entry => entry.entryName.endsWith('export.xml') || entry.entryName.endsWith('apple_health_export/export.xml'));

      if (!xmlEntry) {
        return reject(new Error('export.xml not found in zip file'));
      }

      // We need to extract it to a temp file to stream it, or use a buffer stream
      // Using buffer stream for simplicity if memory allows, but for large files extraction is better.
      // Let's extract to a temp folder.
      const tempDir = path.dirname(zipPath);
      zip.extractEntryTo(xmlEntry, tempDir, false, true);
      const xmlPath = path.join(tempDir, xmlEntry.name);

      const stream = fs.createReadStream(xmlPath);
      const parser = sax.createStream(true, { trim: true });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const metrics: Record<string, { total: number; count: number; avg: number; unit: string }> = {};

      parser.on('opentag', (node) => {
        if (node.name === 'Record') {
          const type = node.attributes.type as string;
          const startDateStr = node.attributes.startDate as string;
          const valueStr = node.attributes.value as string;
          const unit = node.attributes.unit as string;

          if (type && startDateStr && valueStr) {
            const startDate = new Date(startDateStr);
            if (startDate >= cutoffDate) {
              const value = parseFloat(valueStr);
              if (!isNaN(value)) {
                // Simplify type name (HKQuantityTypeIdentifierStepCount -> StepCount)
                const simpleType = type.replace('HKQuantityTypeIdentifier', '');
                
                if (!metrics[simpleType]) {
                  metrics[simpleType] = { total: 0, count: 0, avg: 0, unit: unit || '' };
                }
                
                metrics[simpleType].total += value;
                metrics[simpleType].count += 1;
              }
            }
          }
        }
      });

      parser.on('end', () => {
        // Calculate averages
        Object.keys(metrics).forEach(key => {
          metrics[key].avg = metrics[key].total / metrics[key].count;
        });
        
        // Cleanup extracted file
        fs.unlinkSync(xmlPath);
        resolve(metrics);
      });

      parser.on('error', (err) => {
        reject(err);
      });

      stream.pipe(parser);

    } catch (err) {
      reject(err);
    }
  });
};

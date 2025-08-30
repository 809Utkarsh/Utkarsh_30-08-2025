import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateReport } from '../services/reportService.js';
import db from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const triggerReport = async (req, res) => {
  const reportId = uuidv4();
  await db.Report.create({
    report_id: reportId,
    status: 'Running',
    created_at: new Date(),
  });
  res.json({ report_id: reportId });
  generateReport(reportId).catch(console.error);
};

export const getReport = async (req, res) => {
  const { report_id } = req.params;
  const report = await db.Report.findOne({ where: { report_id } });

  if (!report) return res.status(404).json({ error: 'Not found' });

  if (report.status === 'Running') {
    return res.json({ status: 'Running' });
  } else {
    const filePath = path.join(
      __dirname,
      '..',
      'public',
      'reports',
      `${report_id}.csv`
    );
    return res.download(filePath);
  }
};

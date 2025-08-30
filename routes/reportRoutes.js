import express from 'express';
import { triggerReport, getReport } from '../controllers/reportController.js';

const router = express.Router();

router.post('/trigger_report', triggerReport);
router.get('/get_report/:report_id', getReport);

export default router;

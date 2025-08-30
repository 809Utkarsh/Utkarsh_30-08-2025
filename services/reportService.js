import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import db from '../models/index.js';

const DEFAULT_TIMEZONE = 'America/Chicago';

const getBusinessHoursInUTC = (storeId, timezone, day) => {
  return db.BusinessHour.findAll({
    where: { store_id: storeId, dayofweek: day },
  }).then((rows) => {
    if (rows.length === 0) {
      if (process.env.VERBOSE_LOGS === 'true') {
        console.warn(` No business hours for store: ${storeId}, assuming 24x7`);
      }
      return [
        {
          start: moment.tz({ hour: 0, minute: 0 }, timezone).utc(),
          end: moment.tz({ hour: 23, minute: 59 }, timezone).utc(),
        },
      ];
    }

    return rows.map((row) => {
      const start = moment.tz(row.start_time_local, 'HH:mm:ss', timezone).utc();
      const end = moment.tz(row.end_time_local, 'HH:mm:ss', timezone).utc();
      return { start, end };
    });
  });
};

const interpolate = (logs, fromTime, toTime) => {
  let totalUptime = 0;
  let totalDowntime = 0;

  if (logs.length === 0) {
    totalDowntime += toTime.diff(fromTime, 'minutes');
    return { uptime: totalUptime, downtime: totalDowntime };
  }

  logs.sort((a, b) => moment(a.timestamp_utc).diff(moment(b.timestamp_utc)));
  let prevTime = fromTime.clone();
  let prevStatus = logs[0].status;

  for (const log of logs) {
    const logTime = moment.utc(log.timestamp_utc);
    const duration = logTime.diff(prevTime, 'minutes');
    if (prevStatus === 'active') totalUptime += duration;
    else totalDowntime += duration;

    prevTime = logTime;
    prevStatus = log.status;
  }

  const finalDuration = toTime.diff(prevTime, 'minutes');
  if (prevStatus === 'active') totalUptime += finalDuration;
  else totalDowntime += finalDuration;

  return { uptime: totalUptime, downtime: totalDowntime };
};

export const computeMetricsForStore = async (storeId) => {
  if (process.env.VERBOSE_LOGS === 'true') {
    console.log(` Computing metrics for store: ${storeId}`);
  }

  const timezoneRow = await db.StoreTimezone.findOne({
    where: { store_id: storeId },
  });
  const timezone = timezoneRow?.timezone_str || DEFAULT_TIMEZONE;

  const maxTimestamp = await db.StoreStatus.max('timestamp_utc');
  const now = moment.utc(maxTimestamp);
  const oneHourAgo = now.clone().subtract(1, 'hour');
  const oneDayAgo = now.clone().subtract(1, 'day');
  const oneWeekAgo = now.clone().subtract(7, 'days');

  const durations = [
    { label: 'last_hour', from: oneHourAgo },
    { label: 'last_day', from: oneDayAgo },
    { label: 'last_week', from: oneWeekAgo },
  ];

  const result = {
    store_id: storeId,
    uptime_last_hour: 0,
    downtime_last_hour: 0,
    uptime_last_day: 0,
    downtime_last_day: 0,
    uptime_last_week: 0,
    downtime_last_week: 0,
  };

  for (const { label, from } of durations) {
    if (process.env.VERBOSE_LOGS === 'true') {
      console.log(`Calculating for duration: ${label}`);
    }

    const logs = await db.StoreStatus.findAll({
      where: {
        store_id: storeId,
        timestamp_utc: {
          [db.Sequelize.Op.between]: [from.toDate(), now.toDate()],
        },
      },
      order: [['timestamp_utc', 'ASC']],
    });

    if (process.env.VERBOSE_LOGS === 'true') {
      console.log(`Logs fetched: ${logs.length} records`);
    }

    let totalUptime = 0;
    let totalDowntime = 0;
    const startDay = from.clone();

    while (startDay.isBefore(now)) {
      const dayOfWeek = startDay.day();
      const bhList = await getBusinessHoursInUTC(storeId, timezone, dayOfWeek);

      for (const { start, end } of bhList) {
        const bhStart = moment.max(start, from);
        const bhEnd = moment.min(end, now);
        if (bhStart.isSameOrAfter(bhEnd)) continue;

        const sliceLogs = logs.filter((log) =>
          moment.utc(log.timestamp_utc).isBetween(bhStart, bhEnd, null, '[)')
        );

        const { uptime, downtime } = interpolate(sliceLogs, bhStart, bhEnd);
        totalUptime += uptime;
        totalDowntime += downtime;
      }

      startDay.add(1, 'day');
    }

    result[`uptime_${label}`] =
      label === 'last_hour' ? totalUptime : (totalUptime / 60).toFixed(2);
    result[`downtime_${label}`] =
      label === 'last_hour' ? totalDowntime : (totalDowntime / 60).toFixed(2);
  }

  return result;
};

export const generateReport = async (reportId) => {
  try {
    console.log(`Generating report for: ${reportId}`);
    const stores = await db.StoreStatus.findAll({
      attributes: ['store_id'],
      group: ['store_id'],
    });

    console.log(`📊 Found ${stores.length} stores to compute`);
    const results = [];
    let counter = 0;

    for (const store of stores) {
      try {
        const metric = await computeMetricsForStore(store.store_id);
        results.push(metric);
        counter++;

        if (counter % 100 === 0) {
          console.log(`Progress: ${counter}/${stores.length} stores done`);
        }
      } catch (err) {
        console.error(
          ` Failed to compute for store ${store.store_id}:`,
          err.message
        );
      }
    }

    const csvRows = results.map(
      (row) =>
        `${row.store_id},${row.uptime_last_hour},${row.uptime_last_day},${row.uptime_last_week},${row.downtime_last_hour},${row.downtime_last_day},${row.downtime_last_week}`
    );

    const headers = `store_id,uptime_last_hour,uptime_last_day,uptime_last_week,downtime_last_hour,downtime_last_day,downtime_last_week`;
    const content = [headers, ...csvRows].join('\n');

    const dirPath = path.join(__dirname, '..', 'public', 'reports');
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const filePath = path.join(dirPath, `${reportId}.csv`);
    fs.writeFileSync(filePath, content);

    console.log(` Report generated for: ${reportId}`);
    console.log(` Saved CSV to: ${filePath}`);
    console.log(` Report ready! Download at /api/get_report/${reportId}`);

    await db.Report.update(
      { status: 'Complete', file_path: filePath },
      { where: { report_id: reportId } }
    );
  } catch (error) {
    console.error(`Report generation failed for ${reportId}:`, error);
    await db.Report.update(
      { status: 'Failed' },
      { where: { report_id: reportId } }
    );
  }
};

import Sequelize from 'sequelize';
import StoreStatus from './storeStatus.js';
import Report from './report.js'; // you need to create this model
import BusinessHour from './businessHour.js'; // also needs to be created
import StoreTimezone from './storeTimezone.js'; // also needs to be created

const db = {};

db.Sequelize = Sequelize;
db.StoreStatus = StoreStatus;
db.Report = Report;
db.BusinessHour = BusinessHour;
db.StoreTimezone = StoreTimezone;

export default db;

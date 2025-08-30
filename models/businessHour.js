import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BusinessHour = sequelize.define(
  'BusinessHour',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    store_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      field: 'dayofweek',
      allowNull: false,
    },
    start_time_local: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time_local: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    tableName: 'business_hours',
    timestamps: false,
  }
);

export default BusinessHour;

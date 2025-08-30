import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StoreTimezone = sequelize.define(
  'StoreTimezone',
  {
    store_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    timezone_str: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'store_timezones',
    timestamps: false,
  }
);

export default StoreTimezone;

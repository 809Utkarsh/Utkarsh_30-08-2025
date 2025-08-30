import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StoreStatus = sequelize.define(
  'StoreStatus',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    store_id: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false },
    timestamp_utc: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'store_status',
    timestamps: false,
  }
);

export default StoreStatus;

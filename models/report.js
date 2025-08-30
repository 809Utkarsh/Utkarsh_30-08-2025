import { DataTypes } from 'sequelize';
import Sequelize from '../config/database.js';

const Report = Sequelize.define(
  'Report',
  {
    report_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('Running', 'Complete', 'Failed'),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'reports',
    timestamps: false,
  }
);

export default Report;

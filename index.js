import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import reportRoutes from './routes/reportRoutes.js'; // if you're using a routes folder
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', reportRoutes); // example route

sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Connected to DB');
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' DB connection error:', err);
  });

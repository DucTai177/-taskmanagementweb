import express from 'express';
const router = express.Router();

import categoryRouter from './controllers/category.controller.js'

router.use("/categories", categoryRouter);

export default router
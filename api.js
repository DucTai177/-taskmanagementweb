import express from 'express';
const router = express.Router();

import categoryRouter from './controllers/category.controller.js'
import productRouter from './controllers/product.controller.js'

router.use("/categories", categoryRouter);
router.use("/products", productRouter)

export default router
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "mongodb+srv://nsohoainiem_db_user:pLq2bZAZA9lUTd6b@cluster0.4yg0ecd.mongodb.net/my_product_mng", // Uses connection string from PlanetScale
  },
});
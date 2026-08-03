import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "mysql://root:@127.0.0.1:3306/test_express_db", // Uses connection string from PlanetScale
  },
});
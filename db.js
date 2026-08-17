import { PrismaClient } from "./generated/client.js";
// import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// const adapter = new PrismaMariaDb({
//   host: "localhost",
//   port: 3306,
//   user: "root",
//   password: "",
//   database: "test_express_db"
// });


const prisma = new PrismaClient();

export  default prisma

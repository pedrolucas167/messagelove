import { Sequelize } from "sequelize";
import { env } from "../lib/env";

let sequelize: Sequelize | undefined;

export function getSequelize(): Sequelize {
  if (!sequelize) {
    const isLocal = env.DATABASE_URL.includes("localhost");
    const isRender = env.DATABASE_URL.includes("render.com");
    
    if (isLocal) {
      // Para conexão local via socket Unix
      const dbName = env.DATABASE_URL.split("/").pop() || "messagelove_dev";
      const username = env.DATABASE_URL.split("://")[1]?.split("@")[0] || "";
      
      sequelize = new Sequelize(dbName, username, "", {
        dialect: "postgres",
        host: "/var/run/postgresql",
        logging: false,
      });
    } else {
      sequelize = new Sequelize(env.DATABASE_URL, {
        dialect: "postgres",
        logging: false,
        dialectOptions: isRender
          ? { ssl: { require: true } }
          : undefined,
      });
    }
  }
  return sequelize;
}

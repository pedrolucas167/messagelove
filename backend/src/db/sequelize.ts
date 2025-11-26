import { Sequelize } from "sequelize";
import { env } from "../lib/env";

let sequelize: Sequelize | undefined;

export function getSequelize(): Sequelize {
  if (!sequelize) {
    sequelize = new Sequelize(env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: env.DATABASE_URL.includes("render.com")
        ? { ssl: { require: true } }
        : undefined,
    });
  }
  return sequelize;
}

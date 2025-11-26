import { getSequelize } from "./sequelize";
import { initUserModel } from "./models/user";
import { initCardModel } from "./models/card";
import { initPasswordResetTokenModel } from "./models/password-reset-token";

let initialized = false;

export async function ensureDatabaseConnection() {
  const sequelize = getSequelize();
  if (!initialized) {
    initUserModel();
    initCardModel();
    initPasswordResetTokenModel();
    await sequelize.authenticate();
    initialized = true;
  }
  return sequelize;
}

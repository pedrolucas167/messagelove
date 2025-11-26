import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { getSequelize } from "../sequelize";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare password: CreationOptional<string | null>;
  declare name: string;
  declare googleId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUserModel() {
  const sequelize = getSequelize();
  if (sequelize.models.User) {
    return sequelize.models.User as typeof User;
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for OAuth users
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: "google_id",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "users",
      modelName: "User",
      underscored: true,
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
    }
  );

  return User;
}

export function getUserModel() {
  return initUserModel();
}

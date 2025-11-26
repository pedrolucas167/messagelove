import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { getSequelize } from "../sequelize";

export class PasswordResetToken extends Model<InferAttributes<PasswordResetToken>, InferCreationAttributes<PasswordResetToken>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initPasswordResetTokenModel() {
  const sequelize = getSequelize();
  if (sequelize.models.PasswordResetToken) {
    return sequelize.models.PasswordResetToken as typeof PasswordResetToken;
  }

  PasswordResetToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      tokenHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "token_hash",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "used_at",
        defaultValue: null,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "password_reset_tokens",
      modelName: "PasswordResetToken",
      underscored: true,
    }
  );

  return PasswordResetToken;
}

export function getPasswordResetTokenModel() {
  return initPasswordResetTokenModel();
}

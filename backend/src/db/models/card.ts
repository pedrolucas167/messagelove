import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  literal,
} from "sequelize";
import { getSequelize } from "../sequelize";
import { User, initUserModel } from "./user";

export class Card extends Model<InferAttributes<Card>, InferCreationAttributes<Card>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare de: string;
  declare para: string;
  declare mensagem: string;
  declare fotoUrl: string | null;
  declare youtubeVideoId: string | null;
  declare youtubeStartTime: number | null;
  declare audioUrl: string | null;
  declare audioDuration: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
}

export function initCardModel() {
  const sequelize = getSequelize();
  if (sequelize.models.Card) {
    return sequelize.models.Card as typeof Card;
  }

  Card.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal("gen_random_uuid()"),
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      de: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      para: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      mensagem: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fotoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "foto_url",
        defaultValue: null,
      },
      youtubeVideoId: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: "youtube_video_id",
        defaultValue: null,
      },
      youtubeStartTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "youtube_start_time",
        defaultValue: null,
      },
      audioUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "audio_url",
        defaultValue: null,
      },
      audioDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "audio_duration",
        defaultValue: null,
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
      tableName: "cards",
      modelName: "Card",
      underscored: true,
    }
  );

  const UserModel = initUserModel();
  if (!Card.associations.user) {
    Card.belongsTo(UserModel, { as: "user", foreignKey: "userId" });
  }
  if (!UserModel.associations.cards) {
    UserModel.hasMany(Card, { as: "cards", foreignKey: "userId" });
  }

  return Card;
}

export function getCardModel() {
  return initCardModel();
}

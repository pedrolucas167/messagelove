import "dotenv/config";
import { createApp, allowedOrigins } from "./app";
import { ensureDatabaseConnection } from "./db";
import { logger } from "./config/logger";

const PORT = Number(process.env.PORT) || 3001;

async function bootstrap() {
  try {
    const sequelize = await ensureDatabaseConnection();
    logger.info("Database connection established");

    // Sync database schema - use alter:true to add new columns without losing data
    try {
      await sequelize.sync({ alter: true });
      logger.info("Database synced successfully");
    } catch (syncError) {
      logger.warn("Database sync warning (may be normal for existing tables)", { syncError });
    }

    const app = createApp();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info("Allowed CORS origins", { allowedOrigins });
    });

    const shutdown = async () => {
      logger.info("Shutdown signal received. Closing gracefully...");
      try {
        await sequelize.close();
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown", { error });
        process.exit(1);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

void bootstrap();

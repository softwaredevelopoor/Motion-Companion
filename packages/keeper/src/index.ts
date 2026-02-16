import { MotionKeeperBot, loadKeeperConfig } from './keeper';
import { Logger } from '@motion-companion/common';
import * as path from 'path';

async function main() {
  const configPath = process.env.KEEPER_CONFIG || path.join(__dirname, '../config.json');
  const keypairPath = process.env.KEYPAIR_PATH || path.join(process.env.HOME || '/root', '.config/solana/id.json');
  const xApiKey = process.env.X_API_KEY;

  try {
    Logger.info('Loading keeper configuration', { configPath });
    const { treasury, allocation } = await loadKeeperConfig(configPath);

    const keeper = new MotionKeeperBot(treasury, allocation, keypairPath, xApiKey);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      Logger.info('Received SIGINT, shutting down gracefully...');
      await keeper.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      Logger.info('Received SIGTERM, shutting down gracefully...');
      await keeper.stop();
      process.exit(0);
    });

    // Start keeper
    await keeper.start();
  } catch (error) {
    Logger.error('Fatal error in keeper bot', error);
    process.exit(1);
  }
}

main();

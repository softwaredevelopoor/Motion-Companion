import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

export class SolanaUtils {
  static loadKeypair(filepath: string): Keypair {
    const secret = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    return Keypair.fromSecretKey(Buffer.from(secret));
  }

  static async getBalance(connection: Connection, pubkey: PublicKey): Promise<bigint> {
    const balance = await connection.getBalance(pubkey);
    return BigInt(balance);
  }

  static lamportsToSol(lamports: bigint | number): number {
    const value = typeof lamports === 'bigint' ? Number(lamports) : lamports;
    return value / LAMPORTS_PER_SOL;
  }

  static solToLamports(sol: number): bigint {
    return BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
  }

  static formatAmount(amount: bigint, decimals: number = 6): string {
    const str = amount.toString().padStart(decimals + 1, '0');
    const intPart = str.slice(0, -decimals) || '0';
    const decPart = str.slice(-decimals).padEnd(decimals, '0');
    return `${intPart}.${decPart}`;
  }

  static parseAmount(amount: string, decimals: number = 6): bigint {
    const [intPart = '0', decPart = '0'] = amount.split('.');
    const normalizedDecPart = decPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(intPart + normalizedDecPart);
  }
}

export class DateUtils {
  static getNowUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString();
  }

  static getElapsedTime(startTimestamp: number, endTimestamp?: number): number {
    const end = endTimestamp || this.getNowUnixTimestamp();
    return end - startTimestamp;
  }
}

export class Logger {
  static info(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, data || '');
  }

  static error(message: string, error?: unknown): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, error || '');
  }

  static debug(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] DEBUG: ${message}`, data || '');
  }

  static warn(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, data || '');
  }
}

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await delay(delayMs * Math.pow(2, i));
      }
    }
  }

  throw lastError || new Error('Retry failed');
};

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {
  TreasuryState,
  AllocationConfig,
  TreasuryConfig,
  KeeperState,
  AllocationRecord,
  AllocationData,
  Logger,
  SolanaUtils,
  DateUtils,
} from '@motion-companion/common';

export class TreasuryClient {
  private connection: Connection;
  private program: anchor.Program;
  private provider: anchor.AnchorProvider;
  private config: TreasuryConfig;
  private treasuryPubkey?: PublicKey;

  constructor(config: TreasuryConfig, keypair: Keypair) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl);

    const wallet = new anchor.Wallet(keypair);
    this.provider = new anchor.AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });

    // Initialize program (requires IDL - would be imported in real setup)
    this.program = new anchor.Program(
      {} as any, // IDL would be imported
      new PublicKey(config.programId),
      this.provider
    );
  }

  async getTreasuryState(): Promise<TreasuryState | null> {
    try {
      if (!this.treasuryPubkey) {
        const [pda] = PublicKey.findProgramAddressSync(
          [Buffer.from('treasury')],
          this.program.programId
        );
        this.treasuryPubkey = pda;
      }

      const account = await this.program.account.treasury.fetch(this.treasuryPubkey);

      return {
        publicKey: this.treasuryPubkey.toBase58(),
        bump: account.bump,
        feeToken: account.feeToken.toBase58(),
        owner: account.owner.toBase58(),
        totalFeesCollected: BigInt(account.totalFeesCollected),
        totalAllocated: BigInt(account.totalAllocated),
        allocationCount: BigInt(account.allocationCount),
        rulesHash: account.rulesHash,
        createdAt: account.createdAt,
        lastAllocationAt: account.lastAllocationAt,
      };
    } catch (error) {
      Logger.error('Error fetching treasury state', error);
      return null;
    }
  }

  async recordFee(
    feeSourcePubkey: PublicKey,
    treasuryVaultPubkey: PublicKey,
    feeCollectorKeypair: Keypair,
    amount: bigint,
    source: string
  ): Promise<string | null> {
    try {
      if (!this.treasuryPubkey) {
        const [pda] = PublicKey.findProgramAddressSync(
          [Buffer.from('treasury')],
          this.program.programId
        );
        this.treasuryPubkey = pda;
      }

      const tx = await this.program.methods
        .recordFee(new anchor.BN(amount.toString()), source)
        .accounts({
          treasury: this.treasuryPubkey,
          treasuryVault: treasuryVaultPubkey,
          feeSource: feeSourcePubkey,
          feeCollector: feeCollectorKeypair.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        })
        .signers([feeCollectorKeypair])
        .rpc();

      Logger.info(`Fee recorded: ${SolanaUtils.formatAmount(amount)} from ${source}`, {
        signature: tx,
      });

      return tx;
    } catch (error) {
      Logger.error('Error recording fee', error);
      return null;
    }
  }

  async executeAllocation(
    allocationId: bigint,
    allocationData: AllocationData,
    allocatorKeypair: Keypair
  ): Promise<string | null> {
    try {
      if (!this.treasuryPubkey) {
        const [pda] = PublicKey.findProgramAddressSync(
          [Buffer.from('treasury')],
          this.program.programId
        );
        this.treasuryPubkey = pda;
      }

      const [allocationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('allocation'), new anchor.BN(allocationId.toString()).toBuffer('le', 8)],
        this.program.programId
      );

      const destinationAccountPubkey = new PublicKey(allocationData.destinationAccount);

      const tx = await this.program.methods
        .executeAllocation(
          new anchor.BN(allocationId.toString()),
          {
            allocationType: allocationData.allocationType,
            destination: allocationData.destination,
            destinationAccount: destinationAccountPubkey,
          }
        )
        .accounts({
          treasury: this.treasuryPubkey,
          allocation: allocationPda,
          treasuryVault: new PublicKey(this.config.treasuryOwner), // Would be proper vault
          allocator: allocatorKeypair.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        })
        .signers([allocatorKeypair])
        .rpc();

      Logger.info(
        `Allocation executed: ${allocationData.allocationType} - ${SolanaUtils.formatAmount(allocationData.amount)}`,
        { signature: tx }
      );

      return tx;
    } catch (error) {
      Logger.error('Error executing allocation', error);
      return null;
    }
  }

  async getAllocation(allocationId: bigint): Promise<AllocationRecord | null> {
    try {
      const [allocationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('allocation'), new anchor.BN(allocationId.toString()).toBuffer('le', 8)],
        this.program.programId
      );

      const account = await this.program.account.allocation.fetch(allocationPda);

      return {
        id: BigInt(account.id),
        treasury: account.treasury.toBase58(),
        allocationType: account.allocationType,
        amount: BigInt(account.amount),
        destination: account.destination,
        status: account.status,
        executedAt: account.executedAt,
        bump: account.bump,
      };
    } catch (error) {
      Logger.error('Error fetching allocation', error);
      return null;
    }
  }
}

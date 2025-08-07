import crypto from 'crypto';

export function generateHash(roundId: number): { hash: string; salt: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const data = `${roundId}:${salt}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  return { hash, salt };
}

export function verifyHash(roundId: number, salt: string, expectedHash: string): boolean {
  const data = `${roundId}:${salt}`;
  const computedHash = crypto.createHash('sha256').update(data).digest('hex');
  
  return computedHash === expectedHash;
}

export function generateGameSeed(roundId: number): string {
  const serverSeed = process.env.SERVER_SEED || 'default_server_seed_for_development';
  const data = `${serverSeed}:${roundId}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

import bcrypt from "bcryptjs";

const COST = 12;
export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

let dummy: Promise<string> | null = null;
/** Compare against a throwaway hash so login timing doesn't reveal whether an account exists. */
export async function burnPasswordCheck(plain: string): Promise<void> {
  dummy ??= bcrypt.hash("timing-equalizer", COST);
  await bcrypt.compare(plain, await dummy);
}

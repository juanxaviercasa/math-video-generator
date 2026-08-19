declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: unknown);
    user: any;
    video: any;
    $disconnect(): Promise<void>;
  }
}

declare module 'bcryptjs' {
  export function hash(value: string, saltOrRounds: number): Promise<string>;
  export function compare(value: string, hash: string): Promise<boolean>;
}

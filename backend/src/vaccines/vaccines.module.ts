import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VaccinesService } from './vaccines.service';
import { VaccinesResolver } from './vaccines.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '15m' }, // Default for this module
    }),
  ],
  providers: [VaccinesResolver, VaccinesService],
})
export class VaccinesModule { }

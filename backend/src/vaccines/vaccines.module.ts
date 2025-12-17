import { Module } from '@nestjs/common';
import { VaccinesService } from './vaccines.service';
import { VaccinesResolver } from './vaccines.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VaccinesResolver, VaccinesService],
})
export class VaccinesModule { }

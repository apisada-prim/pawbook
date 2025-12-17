import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyResolver } from './family.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [FamilyResolver, FamilyService],
    exports: [FamilyService],
})
export class FamilyModule { }

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginInput } from './dto/login.input';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<User | null> {
        const user = await this.usersService.findOne(email);
        // Cast to any to access password because password field might not be in User entity exposed to GraphQL but is in Prisma model
        // Actually User entity in src/users/entities/user.entity.ts doesn't have password.
        // PrismaService returns the full object including password.
        if (user && (await bcrypt.compare(pass, (user as any).password))) {
            const { password, ...result } = user as any;
            return result;
        }
        return null;
    }

    async login(loginInput: LoginInput) {
        const user = await this.validateUser(loginInput.email, loginInput.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }
}

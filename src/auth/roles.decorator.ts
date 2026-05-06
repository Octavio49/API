import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/enum/role';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
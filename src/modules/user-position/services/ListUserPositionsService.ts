import { getCustomRepository } from 'typeorm';
import UserPosition from '../typeorm/entities/UserPosition';
import { UserPositionRepository } from '../typeorm/repositories/UserPositionRepository';
import {
  ALL_PERMISSION_KEYS,
  ROLE_DEFAULT_PERMISSIONS,
} from '@modules/user/constants/permissions';

class ListUserPositionsService {
  public async execute(): Promise<UserPosition[]> {
    const repository = getCustomRepository(UserPositionRepository);
    let positions = await repository.find({
      order: { name: 'ASC' },
    });

    const defaultRoles = [
      { name: 'Administrador', permissions: [...ALL_PERMISSION_KEYS] },
      { name: 'Gerente', permissions: ROLE_DEFAULT_PERMISSIONS['Gerente'] },
      {
        name: 'Engenheiro Agrônomo',
        permissions: ROLE_DEFAULT_PERMISSIONS['Engenheiro Agrônomo'],
      },
      {
        name: 'Operador de Campo',
        permissions: ROLE_DEFAULT_PERMISSIONS['Operador de Campo'],
      },
      { name: 'Financeiro', permissions: ROLE_DEFAULT_PERMISSIONS['Financeiro'] },
      { name: 'Analista', permissions: ROLE_DEFAULT_PERMISSIONS['Analista'] },
    ];

    let hasCreated = false;
    for (const def of defaultRoles) {
      const found = positions.find(
        (p) => p.name.trim().toLowerCase() === def.name.toLowerCase(),
      );
      if (!found) {
        try {
          const newPos = repository.create({
            name: def.name,
            status: true,
            permissions: def.permissions as any,
          });
          await repository.save(newPos);
          positions.push(newPos);
          hasCreated = true;
        } catch {
          // ignore concurrency conflict
        }
      } else if (!found.permissions || found.permissions.length === 0) {
        try {
          found.permissions = def.permissions as any;
          await repository.save(found);
        } catch {
          // ignore
        }
      }
    }

    if (hasCreated) {
      positions.sort((a, b) => a.name.localeCompare(b.name));
    }

    return positions;
  }
}

export default ListUserPositionsService;


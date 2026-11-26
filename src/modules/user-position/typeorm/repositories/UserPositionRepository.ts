import { EntityRepository, Repository } from "typeorm";
import UserPosition from "../entities/UserPosition";

@EntityRepository(UserPosition)
export class UserPositionRepository extends Repository<UserPosition> {
  public async findByName(name: string): Promise<UserPosition | undefined> {
    return this.findOne({
      where: { name },
    });
  }
}

export default UserPositionRepository;

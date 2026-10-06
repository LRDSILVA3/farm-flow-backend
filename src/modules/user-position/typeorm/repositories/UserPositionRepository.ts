import { EntityRepository, Repository } from "typeorm";
import UserPosition from "../entities/UserPosition";

@EntityRepository(UserPosition)
export class PersonRepository extends Repository<UserPosition> {

}
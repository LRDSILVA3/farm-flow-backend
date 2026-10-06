import { EntityRepository, Repository } from 'typeorm';
import ServiceGroup from '../entities/ServiceGroup';

@EntityRepository(ServiceGroup)
export class ServiceGroupsRepository extends Repository<ServiceGroup> {}

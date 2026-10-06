import { EntityRepository, Repository } from 'typeorm';
import Service from '../entities/Service';

@EntityRepository(Service)
export class ServicesRepository extends Repository<Service> {}

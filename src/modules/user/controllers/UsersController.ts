import { Request, Response } from 'express';
import CreateUserService from '../services/CreateUserService';

export default class UsersController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { name, email, password, role } = request.body;
    const createUserService = new CreateUserService();
    const user = await createUserService.execute({ name, email, password, role });
    return response.json(user);
  }
}

import { BaseRepository } from './base.repository.js';

export class UserRepository extends BaseRepository {
  async findByUsername(username) {
    return this.getOne('SELECT * FROM users WHERE username = ?', [username]);
  }

  async findById(id) {
    return this.getOne('SELECT id, username, role, name, email FROM users WHERE id = ?', [id]);
  }
}

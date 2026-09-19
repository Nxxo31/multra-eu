import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas';

export class AuthService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async login({ username, password }) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      await bcrypt.compare(password, '$2a$10$invalidsaltinvalidsaltinvalidsalti');
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

    const token = this.#signToken(user);
    return {
      token,
      user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email },
    };
  }

  async me(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError();
    return user;
  }

  #signToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        jti: crypto.randomUUID(),
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN, algorithm: 'HS256' }
    );
  }
}

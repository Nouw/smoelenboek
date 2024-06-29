import { Role, User } from "smoelenboek-types";
import jwt from "jsonwebtoken";
import moment from "moment";
import { Database } from "../Database";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import OAuth2Strategy, { VerifyCallback } from "passport-oauth2";
import { Request, Response } from "express";

const encryptionKey = process.env.ENCRYPTION_KEY ?? "secret";

// #region passport strategies
const opts = { jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: encryptionKey };

passport.use(new JwtStrategy(opts, async (payload, cb) => {
  try {
    const user = await Database.manager.findOne(User, {
      where: {
        email: payload.email, id: payload.id
      },
      relations: {
        roles: true
      }
    });

    // Throw some error if no user can be found with the given email
    if (!user) {
      return cb(null, false);
    }

    return cb(null, user);

  } catch (e) {
    return cb(e);
  }
}));

passport.use(new OAuth2Strategy({
  authorizationURL: "https://login.deploy.nevobo.nl/oauth/v2/auth",
  tokenURL: "https://login.deploy.nevobo.nl/oauth/v2/token",
  clientID: "smoelenboek",
  clientSecret: "secret"
}, (accessToken: string, refreshToken: string, cb: VerifyCallback) => {
  console.log(accessToken, refreshToken);
  cb(null, null);
}));
// TODO: Add integration for NeVoBo "https://www.passportjs.org/packages/passport-oauth2/"

// #endregion

interface Token {
  exp: number;
  id: number;
  email: string;
  refresh: boolean;
  iat: number;
}

export default class AuthService {
  generateAccessToken(user: User): string {
    const token = jwt.sign({
      id: user.id,
      email: user.email,
    }, encryptionKey, { expiresIn: moment().add(5, "m").unix() });

    return token;
  }

  generateRefreshToken(user: User): string {
    const token = jwt.sign({
      id: user.id,
      email: user.email,
    }, encryptionKey, { expiresIn: moment().add(6, "M").unix() });

    return token;
  }

  getTokens(user: User) {
    return { accessToken: this.generateAccessToken(user), refreshToken: this.generateRefreshToken(user) };
  }

  getRoles(user: User) {
    return Database.manager.findBy(Role, { user });
  }

  getCommittees(user: User) {
    
  }
}

export function asyncJwtAuthentication(req: Request, res: Response): Promise<User> {
  return new Promise((resolve, reject) => {
    passport.authenticate("jwt", (err, user, info) => {
      if (err) {
        return reject(err);
      }

      return resolve(user);
    })(req, res)
  })
}


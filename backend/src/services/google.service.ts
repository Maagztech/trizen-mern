import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from '../config/env';
import { authService } from './auth.service';

export function configureGoogleAuth(): void {
  if (!env.google.clientId || !env.google.clientSecret) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email from Google account'), undefined);
          }

          const result = await authService.findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            name: profile.displayName || 'Google User',
            avatar: profile.photos?.[0]?.value,
          });

          return done(null, result as unknown as Express.User);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export const googleService = {
  isConfigured(): boolean {
    return Boolean(env.google.clientId && env.google.clientSecret);
  },
};

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { google } from "googleapis";

declare global {
  namespace Express {
    interface User {
      id: number;
      googleId: string;
      email: string;
      name: string;
      picture?: string;
      accessToken?: string;
      refreshToken?: string;
    }
  }
}

export function setupGoogleAuth(app: Express) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/auth/google/callback",
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (user) {
        // Update tokens
        user = await storage.updateUserTokens(user.id, accessToken, refreshToken);
      } else {
        // Create new user
        user = await storage.createGoogleUser({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          picture: profile.photos?.[0]?.value,
          accessToken,
          refreshToken
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, undefined);
    }
  }));

  // Serialize/deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Auth routes
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.redirect('/');
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Get Google Calendar events
export async function getGoogleCalendarEvents(user: Express.User) {
  if (!user.accessToken) {
    throw new Error('No access token available');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items?.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      date: event.start?.date || event.start?.dateTime?.split('T')[0] || '',
      time: event.start?.dateTime?.split('T')[1]?.substring(0, 5) || 'All day'
    })) || [];
  } catch (error) {
    console.error('Calendar API error:', error);
    throw new Error('Failed to fetch calendar events');
  }
}
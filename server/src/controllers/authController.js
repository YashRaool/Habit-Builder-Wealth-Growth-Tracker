const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized } = require('../utils/response');

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Generate a signed JWT for a user */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/** Sanitise and build the token+user response payload */
const authPayload = (user, token) => {
  const u = user.toJSON ? user.toJSON() : { ...user._doc };
  delete u.passwordHash;
  return { token, user: u };
};

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, currency } = req.body;

  // — field-level validation —
  if (!name || !email || !password) {
    return sendBadRequest(res, 'Name, email, and password are required.');
  }
  if (name.trim().length < 2) {
    return sendBadRequest(res, 'Name must be at least 2 characters.');
  }
  if (!EMAIL_RE.test(email)) {
    return sendBadRequest(res, 'Please provide a valid email address.');
  }
  if (password.length < 8) {
    return sendBadRequest(res, 'Password must be at least 8 characters.');
  }
  if (!PASSWORD_RE.test(password)) {
    return sendBadRequest(res, 'Password must contain at least one uppercase letter, one lowercase letter, and one number.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return sendBadRequest(res, 'An account with this email already exists.');
  }

  const user = await User.create({
    name: name.trim(),
    email,
    passwordHash: password, // pre-save hook hashes it
    currency: currency || 'USD',
  });

  const token = signToken(user._id);
  sendCreated(res, authPayload(user, token), 'Account created successfully.');
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendBadRequest(res, 'Email and password are required.');
  }
  if (!EMAIL_RE.test(email)) {
    return sendBadRequest(res, 'Please provide a valid email address.');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    return sendUnauthorized(res, 'Invalid email or password.');
  }

  if (!user.isActive) {
    return sendUnauthorized(res, 'This account has been deactivated. Contact support.');
  }

  const token = signToken(user._id);
  sendSuccess(res, authPayload(user, token), 'Login successful.');
});

/** GET /api/auth/me */
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user }, 'User profile retrieved.');
});

/** PUT /api/auth/me or PUT /api/auth/profile — update profile of logged-in user */
const updateMe = asyncHandler(async (req, res) => {
  const { name, currency, avatar, picture, tagline, bio, savingsRate, monthlySavingsTarget } = req.body;
  const updates = {};
  if (name !== undefined) {
    if (name.trim().length < 2) return sendBadRequest(res, 'Name must be at least 2 characters.');
    updates.name = name.trim();
  }
  if (currency !== undefined) {
    const curr = currency.toUpperCase().slice(0, 3);
    if (!['USD', 'INR', 'EUR'].includes(curr)) {
      return sendBadRequest(res, 'Currency must be USD, INR, or EUR.');
    }
    updates.currency = curr;
  }
  if (avatar !== undefined) {
    updates.avatar = avatar.trim();
    updates.picture = avatar.trim();
  } else if (picture !== undefined) {
    updates.avatar = picture.trim();
    updates.picture = picture.trim();
  }
  if (bio !== undefined) {
    updates.bio = bio.trim();
    updates.tagline = bio.trim();
  } else if (tagline !== undefined) {
    updates.bio = tagline.trim();
    updates.tagline = tagline.trim();
  }
  if (monthlySavingsTarget !== undefined) {
    const val = Number(monthlySavingsTarget);
    updates.monthlySavingsTarget = val;
    updates.savingsRate = val;
  } else if (savingsRate !== undefined) {
    const val = Number(savingsRate);
    updates.monthlySavingsTarget = val;
    updates.savingsRate = val;
  }
  if (Object.keys(updates).length === 0) {
    return sendBadRequest(res, 'No fields to update.');
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  sendSuccess(res, { user }, 'Profile updated.');
});

/** PUT /api/auth/password — change own password */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return sendBadRequest(res, 'Current password and new password are required.');
  }
  if (newPassword.length < 8) {
    return sendBadRequest(res, 'New password must be at least 8 characters.');
  }
  if (!PASSWORD_RE.test(newPassword)) {
    return sendBadRequest(res, 'New password must contain at least one uppercase letter, one lowercase letter, and one number.');
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.comparePassword(currentPassword))) {
    return sendBadRequest(res, 'Current password is incorrect.');
  }

  user.passwordHash = newPassword;
  await user.save();
  sendSuccess(res, {}, 'Password updated successfully.');
});

/** POST /api/auth/google — authenticate via Google OAuth token or credential */
const googleLogin = asyncHandler(async (req, res) => {
  const { token, credential, idToken } = req.body;

  let profile = null;

  if (token) {
    // 1. Verify access token with Google userinfo API
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return sendUnauthorized(res, 'Failed to verify Google access token.');
    }
    profile = await response.json();
  } else if (credential || idToken) {
    // 2. Verify ID token with Google tokeninfo API
    const tokenToVerify = credential || idToken;
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenToVerify)}`
    );
    if (!response.ok) {
      return sendUnauthorized(res, 'Failed to verify Google credential.');
    }
    profile = await response.json();

    // Verify audience matches GOOGLE_CLIENT_ID if configured
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      const validAud = profile.aud === process.env.GOOGLE_CLIENT_ID || profile.azp === process.env.GOOGLE_CLIENT_ID;
      if (profile.aud && !validAud) {
        return sendUnauthorized(res, 'Google token audience mismatch.');
      }
    }
  } else {
    return sendBadRequest(res, 'Google authentication token or credential is required.');
  }

  if (!profile || !profile.email) {
    return sendUnauthorized(res, 'Invalid Google account data. Email address is missing.');
  }

  const email = profile.email.toLowerCase().trim();
  const name = profile.name || profile.given_name || email.split('@')[0];
  const avatarUrl = profile.picture || profile.avatar || '';
  const sub = profile.sub || '';

  // Find or create the user in MongoDB using real Google email
  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString('hex') + 'A1!';
    user = await User.create({
      name,
      email,
      passwordHash: randomPassword,
      currency: 'USD',
      avatar: avatarUrl,
      picture: avatarUrl,
      googleId: sub,
    });
  } else {
    let modified = false;
    if (avatarUrl && (!user.avatar || !user.picture)) {
      user.avatar = avatarUrl;
      user.picture = avatarUrl;
      modified = true;
    }
    if (sub && user.googleId !== sub) {
      user.googleId = sub;
      modified = true;
    }
    if (name && (!user.name || user.name === 'Google User')) {
      user.name = name;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  }

  const jwtToken = signToken(user._id);
  const payload = authPayload(user, jwtToken);
  if (avatarUrl) {
    payload.user.avatar = payload.user.avatar || avatarUrl;
    payload.user.picture = payload.user.picture || avatarUrl;
  }
  sendSuccess(res, payload, 'Google sign-in successful.');
});

module.exports = { register, login, googleLogin, getMe, updateMe, updatePassword };

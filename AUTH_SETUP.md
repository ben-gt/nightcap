# Auth0 setup for nightcap / roadside-rooms

This app uses Auth0 with PKCE Authorization Code flow.

## Required URLs in your Auth0 Application

In [Auth0 Dashboard → Applications → your app → Settings](https://manage.auth0.com/), set:

**Allowed Callback URLs**

```
https://roadside-rooms.fly.dev/auth/callback,
http://localhost:8081/auth/callback,
roadsiderooms://auth/callback
```

**Allowed Logout URLs**

```
https://roadside-rooms.fly.dev,
http://localhost:8081
```

**Allowed Web Origins**

```
https://roadside-rooms.fly.dev,
http://localhost:8081
```

(Add any additional dev/staging URLs as needed.)

The `roadsiderooms://` entry is for the native app. Web traffic uses
`https://...auth/callback`. Both are needed because `expo-auth-session` picks
the right one per platform.

## Roles model

Roles live as an array on the user object:

- `admin` — can manage listings, bookings, **and other users' roles**
- `vendor` — can access the Vendor tab to manage their own listings

The vendor tab is hidden from non-vendor / non-admin users. The `/admin`
section is gated to admins only.

### Role storage (today)

Roles are stored in the browser's `localStorage` keyed by Auth0 `sub`.
The first user to sign in is auto-promoted to admin. Subsequent role
changes are made via the in-app **Admin → Users & Roles** page.

This works fine for a single-device admin experience but does **not**
sync across browsers/devices. Two options to upgrade:

### Option 1 — Auth0 Post-Login Action (recommended)

Source roles from Auth0 `app_metadata` so they're tied to the user, not
the browser. The app already reads the custom claim
`https://api.roadsiderooms.com/roles` if present.

In Auth0 Dashboard → Actions → Library → **Build Custom**, create a
Post-Login action with this code:

```js
exports.onExecutePostLogin = async (event, api) => {
  const NAMESPACE = 'https://api.roadsiderooms.com/roles';
  const roles = event.user.app_metadata?.roles ?? [];

  // Add the role list as a custom claim on both ID and access tokens.
  api.idToken.setCustomClaim(NAMESPACE, roles);
  api.accessToken.setCustomClaim(NAMESPACE, roles);
};
```

Deploy the Action and add it to the **Login** flow.

Then to assign roles, edit the user in Auth0 Dashboard → User Management →
Users → select user → **app_metadata** tab and add:

```json
{
  "roles": ["admin"]
}
```

### Option 2 — backend with Auth0 Management API

If you want admins to manage roles from inside the app across all users
and devices, you need a backend that can call the Auth0 Management API
(it has secrets that can't live in the client bundle). That's outside the
scope of this PR — happy to add it when you're ready.

## After changing Auth0 config

You don't need to redeploy the app for Auth0 dashboard changes — they
take effect immediately. Just sign out and sign back in.

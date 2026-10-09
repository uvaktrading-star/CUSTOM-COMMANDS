// api/index.js
// This is just a health check endpoint.
// Static HTML files are served automatically by Vercel.

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'CUSTOM-COMMANDS',
    endpoints: [
      'POST /api/auth',
      'GET  /api/add-cmd?id=..&password=..',
      'POST /api/add-cmd',
      'DELETE /api/add-cmd',
      'POST /api/api-validator'
    ]
  });
}

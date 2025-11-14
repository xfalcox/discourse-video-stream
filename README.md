# Discourse Video Stream

Discourse Video Stream adds a Cloudflare Stream-powered workflow for uploading and embedding long‑form video in the composer. Editors can upload large files directly from the composer toolbar and the plugin injects an iframe embed once Cloudflare receives the file.

## Features

- Optional composer toolbar button gated by the `video_stream_enabled` site setting
- Direct-upload modal with client-side validation for file size and extension
- Resumable Cloudflare Stream uploads powered by the global `tus-js-client` build for files well beyond 200 MB
- Secure server endpoint that proxies short‑lived Cloudflare Stream upload URLs
- Configurable iframe embeds that respect your Cloudflare Stream subdomain

## Setup

1. Install the plugin (add it to your `app.yml` or check it out into `plugins/`).
2. Enable the **Video streaming** category of site settings and provide:
   - `video_stream_account_id`: Cloudflare account identifier
   - `video_stream_api_token`: API token with Stream permissions
   - `video_stream_customer_subdomain`: Domain used for iframe playback (for example, `example.cloudflarestream.com`)
   - Optional: adjust allowed extensions and max file size (MB)
3. Grant users appropriate upload permissions (`can_upload_external?` governs access to the endpoint).
4. Ensure the tus client script is available on every page. The plugin expects `window.tus` to exist, so add the CDN build to your head tag (via a theme component or customization):

   ```html
   <script src="https://cdn.jsdelivr.net/npm/tus-js-client@latest/dist/tus.min.js"></script>
   ```

Once configured, staff (or any user that can upload externally) will see a camcorder icon in the composer toolbar. Uploading a file will render a responsive iframe in the composer so it can be included in the post body.

## Development

- JavaScript linting: `bin/lint plugins/discourse-video-stream`
- Ruby tests: `bin/rspec plugins/discourse-video-stream/spec`
- QUnit tests (if added): `bin/rake qunit:test FILTER='Video Stream'`

## Testing Notes

The server specs mock the Cloudflare API, so no external credentials are needed. The modal relies on the Discourse toast service; for manual testing you can run `bin/ember-cli` and visit `/latest` with video streaming enabled.

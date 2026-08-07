Below is the consolidated Claude Cowork prompt. It tells Claude to request all foreseeable permissions at the beginning, then work autonomously while you are away.

```text
Act as a senior web engineer, technical SEO specialist, UX designer, PDF/document specialist and career-branding editor.

Audit and improve my personal website, chrisdemetriou.com, so it:

- Accurately reflects my latest CV
- Positions me clearly across ETOM and Media
- Supports my search for permanent and contract opportunities
- Has strong technical and on-page SEO
- Produces the correct social-sharing preview image
- Has a secure, reliable contact form
- Protects contact details from basic automated harvesting
- Provides a public, PII-redacted CV
- Is tested, committed and pushed safely to main

Work autonomously through the repository and complete the implementation rather than stopping after an audit.

Repository:

/Volumes/01 PROJECTS/Claude/fuzzy-parakeet

Authoritative CV:

/Volumes/01 PROJECTS/Claude/fuzzy-parakeet/docs/Chris-Demetriou-ETOM-CV.pdf

Production domain:

https://chrisdemetriou.com

Contact email:

techopsmgmt@chrisdemetriou.com

LinkedIn profile:

https://uk.linkedin.com/in/chrisademetriou

## Permission preparation before I leave

Before beginning lengthy work, inspect the project sufficiently to identify every permission or approval you are likely to require.

Ask me immediately, in one consolidated batch where possible, for any necessary permission relating to:

- Reading or changing project files
- Editing and rendering the CV PDF
- Running package installation
- Running build, lint, test or development commands
- Accessing the internet
- Using Git or GitHub
- Pulling, committing or pushing
- Accessing deployment or hosting services
- Inspecting the live website
- Configuring an email or form provider
- Creating environment variables
- Using image-processing or PDF tools
- Any other action likely to interrupt autonomous completion

Do this before I go to eat dinner. Avoid waiting until midway through the task to request predictable permissions.

Once permission has been granted, work autonomously. Make reasonable, conservative decisions based on the repository and these instructions. Do not pause for minor preferences.

Only interrupt me later if:

- An action creates a meaningful security or privacy risk
- Two conflicting options would materially affect the outcome
- Credentials or approval are genuinely unavailable
- The repository or remote is in a state where continuing could overwrite work
- A destructive operation would be required

Never bypass a permission boundary or security restriction.

## General working rules

- Inspect the repository, stack, routes, components, content, styling, configuration and deployment setup before editing.
- Preserve the existing visual identity and architecture unless a change has a clear benefit.
- Reuse existing components, design tokens and conventions.
- Make responsive, accessible, production-quality changes.
- Use UK English.
- Do not fabricate employers, dates, qualifications, clients, technologies, metrics or achievements.
- Use the specified CV as the source of truth.
- Where the website conflicts with the CV, follow the CV and report the discrepancy.
- Complete everything possible locally before requiring external services.
- Never expose credentials or commit secrets.
- Avoid unnecessary dependencies and third-party scripts.
- Preserve unrelated user changes.
- Do not reset, discard, overwrite or force-push user work.
- Run applicable formatting, linting, type checking, tests and production builds.
- Do not merely provide code snippets when you can implement and verify the change.
- Report honestly what was implemented, tested, deployed or left awaiting configuration.

Complete the work in the following order.

# 1. Initial audit

Inspect:

- The specified CV
- All public pages and routes
- Reusable website copy and data
- Navigation and footer
- Existing images and their dimensions
- Contact-form implementation
- Light/dark theme implementation
- Metadata and social-preview configuration
- robots.txt and XML sitemap configuration
- Canonical URLs
- Structured data
- Analytics and Search Console integration, if present
- Hosting and deployment configuration
- Environment-variable documentation
- Existing tests and build commands
- Git status, current branch and remote state

Create a concise internal plan and then implement it. Do not stop after reporting the audit.

# 2. Create the redacted public CV locally

Use this exact file as the authoritative content source:

/Volumes/01 PROJECTS/Claude/fuzzy-parakeet/docs/Chris-Demetriou-ETOM-CV.pdf

Update the locally stored, website-facing CV by redacting unnecessary personally identifiable information shown at the top of the CV.

Remove from the public version:

- Telephone number
- Directly exposed email address
- Street address
- Full postcode, if present
- Any other overly precise personal location
- Any other unnecessary personal identifier appearing in the contact header

Retain:

- Chris Demetriou
- Professional title or positioning
- A general location such as “Salford, Greater Manchester, UK”, if appropriate
- Website URL
- LinkedIn URL
- Professional history and achievements

Replace the removed contact details with a clear contact route:

Contact: chrisdemetriou.com/contact

The redaction must genuinely remove the information. Do not merely cover text with rectangles or place new content over it.

Verify that the removed information is absent from:

- The visible pages
- The PDF text layer
- Annotations
- Form fields
- Embedded files
- Bookmarks
- Document properties and metadata
- Accessibility content
- Other extractable PDF objects

Extract and search the finished PDF’s text for the removed values. Render every page to images and inspect them visually for layout errors, unintended remnants, clipping and poor-quality output.

Preserve the existing design and formatting as closely as practical.

Keep a private, unredacted source only if it can be stored safely outside the publicly served site and excluded from Git. Do not create an unredacted copy inside a public asset directory or commit a new private copy to the repository.

If the unredacted PDF is already committed in Git history, report this explicitly. Redacting the current version does not remove PII from earlier commits. Do not rewrite shared Git history or force-push without my explicit approval.

Use a clear local distinction between the private source and public document. The PDF ultimately committed and published must contain the redacted version only.

# 3. Publish the redacted CV on the website

Make the redacted CV available for viewing and downloading at a stable URL, preferably:

https://chrisdemetriou.com/documents/Chris-Demetriou-ETOM-CV.pdf

Requirements:

- Store it in the correct publicly served assets location for the existing framework.
- Publish only the PII-redacted version.
- Keep the unredacted source outside the public asset directory.
- Avoid duplicate public CV URLs.
- Add accessible “View CV” and “Download CV” actions in suitable ETOM locations.
- State that it is a PDF and show its approximate file size where useful.
- Preserve a descriptive download filename.
- Allow ordinary browser viewing and downloading.
- Use safe new-tab behaviour when appropriate.
- Configure application/pdf and X-Content-Type-Options: nosniff where supported.
- Use sensible caching.
- Document how future CV updates should be published without stale caching.

Prefer the ETOM HTML page as the principal Google landing page. Do not automatically add the PDF itself to the sitemap if doing so could make it compete with the ETOM page.

Verify:

- The website copy was based on the specified CV
- The published file is the redacted version
- The production build includes it
- Local production preview serves it correctly
- View and Download links work
- No unredacted CV was accidentally copied into public output

# 4. Synchronise website copy with the CV

Compare all relevant website content with the authoritative CV and amend affected copy.

Review:

- Homepage and hero
- Biography
- ETOM content
- Media content
- Employment dates and titles
- Career history
- Skills
- Projects and case studies
- GraceCast and Genesis
- Training and volunteering
- Customer and delivery-partner references
- Calls to action
- Footer and metadata

Position me primarily for:

- Enterprise Technology Operations Management
- Technical Operations
- Operational Readiness
- Service Transition
- Technical Delivery
- Cloud Transformation
- Enterprise SaaS Operations

Retain a credible distinction between coordinating or leading technical delivery and directly implementing technical work.

Avoid generic management clichés, inflated claims, dense prose and keyword stuffing.

# 5. Establish two distinct website areas: ETOM and Media

Organise the website around two clearly differentiated but connected areas:

1. Enterprise Technology Operations Management — ETOM
2. Media — GraceCast, live-streaming, video/media technology and related development

When somebody searches for “Chris Demetriou”, I would ideally like Google to communicate both areas through distinct results or sitelinks.

Do not claim that a sitemap can guarantee this. Google decides search-result grouping and sitelinks algorithmically.

Use clear site architecture, navigation, metadata, internal links and structured data to maximise the likelihood.

Prefer top-level destinations such as:

- /etom/
- /media/

Retain existing URLs instead if changing them would cause unnecessary redirects or loss of existing search equity.

## ETOM area

Make ETOM my principal career destination. Cover:

- Enterprise Technology Operations Management
- Technical Operations
- Operational Readiness
- Service Transition
- Technical Delivery
- Cloud transformation and migration
- Enterprise SaaS operations
- Cross-functional technical coordination
- Relevant CV achievements and case studies
- Recruiter-facing CV and contact calls to action

## Media area

Use Media for genuine, evidenced work involving:

- GraceCast
- Church live-stream production
- Single-operator production workflows
- Video and broadcast technology
- Media-related software development
- Relevant demonstrations and projects

Do not allow Media to dilute my primary ETOM career positioning.

Implement:

- Clearly labelled navigation for “Enterprise Technology” and “Media”
- An understandable homepage introduction to both areas
- Dedicated titles, descriptions and H1 headings
- Separate keyword targets and search intent
- Strong homepage-to-hub internal links
- Contextual project and case-study links
- Self-referencing canonicals
- Breadcrumbs where useful
- Accurate structured data
- Descriptive anchor text

On first use, write “Enterprise Technology Operations Management (ETOM)”. Do not rely on the acronym alone where users or search engines might not understand it.

# 6. Technical and on-page SEO

Build a focused SEO strategy around genuine experience and realistic UK recruiter searches.

Consider keyword clusters such as:

- Enterprise Technology Operations Manager
- Technical Operations Manager
- Operational Readiness Manager
- Service Transition Manager
- Technical Delivery Manager
- Cloud Migration Technical Delivery
- Enterprise SaaS Operations
- Oracle Cloud Infrastructure Migration
- Enterprise technology operations Manchester
- Enterprise technology operations Salford
- UK permanent and contract technical operations roles

Validate keywords against the CV and actual page content. Map a primary intent to each important page and avoid keyword cannibalisation.

Implement or improve:

- Unique page titles
- Persuasive meta descriptions
- One clear H1 per page
- Logical heading hierarchy
- Human-readable, search-focused copy
- Canonical URLs
- Open Graph metadata
- X/Twitter metadata
- robots.txt
- XML sitemap
- Correct index/noindex behaviour
- Semantic HTML
- Descriptive internal links
- Image filenames and alt text
- Accessible controls
- Person structured data
- WebSite structured data
- ProfilePage or CreativeWork structured data where justified
- sameAs links to genuine public profiles
- Breadcrumb structured data where appropriate
- A custom 404 page if missing
- Efficient image, font and script loading

Do not create:

- Fake reviews
- Ratings
- Unsupported claims
- Thin SEO landing pages
- Duplicate pages targeting trivial keyword variants
- Structured data that does not match visible content

Check for:

- Broken links
- Duplicate metadata
- Missing alt text
- Incorrect heading structure
- Oversized assets
- Render-blocking resources
- Mobile usability problems
- Core Web Vitals risks
- Inaccessible controls or contrast

# 7. Sitemap structure

Make ETOM and Media clearly discoverable.

If the site contains enough indexable pages to justify it, use a sitemap index with logical child sitemaps such as:

- sitemap-etom.xml
- sitemap-media.xml
- sitemap-pages.xml

If the site is small, use one clean sitemap. Do not create separate sitemaps merely for appearance.

Include only canonical, indexable production URLs. Exclude:

- Redirects
- Duplicate routes
- Development routes
- Form-success pages
- noindex pages
- Private files

Use accurate last-modified dates only where reliable.

Confirm that every canonical, indexable ETOM and Media page appears in the correct sitemap and returns a valid response.

Explain in the final report that sitemap structure cannot force Google to show two sitelinks.

# 8. Social-sharing image

I want chrisdemetriou.com to be associated with the photograph of me looking at a Jira screen.

Locate the photograph by inspecting repository assets. If multiple images plausibly match, use visual evidence and existing context. Ask me only if its identity remains genuinely ambiguous.

Create an optimised social-sharing version:

- Approximately 1200 × 630 pixels
- Sensible focal point
- No awkward cropping
- Efficient, widely supported format
- Accurate alt description
- Absolute production URL

Add:

- og:image
- og:image:width
- og:image:height
- og:image:type
- og:image:alt
- twitter:card using summary_large_image
- twitter:image
- Relevant page-specific overrides where useful

Make metadata server-rendered and visible to social crawlers.

Do not assume that changing a favicon changes social previews.

Explain how to refresh cached previews after deployment and make clear that Google and social platforms may retain old cached images temporarily.

# 9. Repair the contact form

Diagnose why the form currently tells visitors to use email instead of sending successfully.

Make it genuinely send messages using the most appropriate method for the existing stack and hosting platform.

Requirements:

- Send submissions to techopsmgmt@chrisdemetriou.com
- Retain a usable fallback contact route
- Add client-side and server-side validation
- Validate and sanitise input
- Prevent header injection
- Prevent arbitrary recipient or sender selection
- Prevent double submissions
- Add accessible loading, success and error states
- Use a honeypot
- Add sensible rate limiting where supported
- Do not expose API keys to the client
- Use an appropriate verified sender
- Use the visitor’s validated email as Reply-To where permitted
- Log useful errors without logging unnecessary personal message contents
- Add tests where supported
- Document required environment variables without including secrets

If an external provider is required, implement everything possible first. Then provide the smallest exact configuration checklist.

Do not claim email delivery works unless it has been tested end-to-end.

# 10. Protect email and phone details from basic scraping

No code can guarantee that information visible to a browser will never be scraped. Implement proportionate protection and explain this limitation accurately.

Contact hierarchy:

1. Working contact form
2. Protected “Reveal email” action
3. Protected “Reveal phone number” action, only if intentionally public
4. Redacted public CV directing users to the contact page

Keep raw email and telephone values out of:

- Initial server-rendered HTML
- Client-side JavaScript bundles
- Metadata
- JSON-LD
- Hidden elements
- HTML comments
- CSS content
- data attributes
- aria-label attributes
- Source maps
- Analytics events

Do not hard-code the raw details into publicly shipped code. Do not treat Base64, reversed strings or CSS obfuscation as security.

Prefer a same-origin server or serverless endpoint that returns a contact detail only after deliberate user action.

Requirements:

- Use “Reveal email” and “Reveal phone number” buttons
- Retrieve details only after an intentional interaction
- Keep controls keyboard accessible
- Provide loading, success and failure states
- Offer mailto:, tel: and copy actions after reveal
- Store values in secure server-side configuration or environment variables
- Add rate limiting where supported
- Set reveal responses to Cache-Control: no-store
- Prevent indexing
- Avoid unnecessary logging
- Do not send revealed details to analytics
- Ensure the endpoint cannot retrieve arbitrary environment variables
- Add suitable security headers where supported

Search the final production build for literal contact values and report every occurrence.

The PII-redacted public PDF should not contain the removed email or phone number.

# 11. LinkedIn integration

Use this profile:

https://uk.linkedin.com/in/chrisademetriou

The supplied official badge is:

<script src="https://platform.linkedin.com/badges/js/profile.js" async defer type="text/javascript"></script>

<div class="badge-base LI-profile-badge" data-locale="en_US" data-size="large" data-theme="dark" data-type="VERTICAL" data-vanity="chrisademetriou" data-version="v1"><a class="badge-base__link LI-simple-link" href="https://uk.linkedin.com/in/chrisademetriou?trk=profile-badge">Chris Demetriou</a></div>

Assess whether the official badge or a lightweight first-party LinkedIn profile button is better for:

- Privacy
- Performance
- Accessibility
- Responsiveness
- Reliability
- Visual consistency

Prefer the footer unless another location clearly works better.

If using the official badge:

- Load its script only once
- Load asynchronously
- Avoid hydration errors
- Support client-side navigation
- Use data-theme="dark" in dark mode
- Use data-theme="light" in light mode
- Respond to live theme changes
- Avoid duplicate script injection
- Provide a standard fallback link
- Ensure a responsive layout

If the badge is unreliable or harms privacy/performance materially, implement a polished profile button instead and explain the decision.

# 12. Contact ribbon decision

Decide whether a slim ribbon above the navbar improves the site.

Consider:

- Recruiter usability
- Mobile screen space
- Privacy
- Spam exposure
- Visual hierarchy
- Duplication with the contact page and footer
- Accessibility

Do not display raw contact details in initial HTML.

If implemented:

- Use protected contact actions
- Prefer one compact Contact action on mobile
- Support keyboard navigation
- Maintain sufficient contrast
- Support light and dark themes

If the ribbon adds clutter, do not implement it. Strengthen the navbar or footer contact call to action instead.

Explain the decision in the final report.

# 13. Draft updated LinkedIn content

Do not edit LinkedIn directly. Produce ready-to-paste recommendations for:

- Headline
- About
- Founder & Developer — GraceCast / Genesis
- Senior Applications Specialist (Technical Delivery – Cloud) — E2open

Use the CV and final website positioning as sources of truth.

Requirements:

- Credible and recruiter-searchable
- Front-load target positioning
- Use keywords naturally
- Preserve verified metrics
- Explain enterprise scale
- Explain GraceCast and Genesis without obscuring my enterprise career
- Avoid AI hype
- Make permanent and contract availability clear
- Fit current LinkedIn limits
- Use UK English

For the headline, provide:

- One recommended version
- Two alternatives
- Character count for each

For About, provide one polished ready-to-paste version.

For each Experience entry, provide concise introductory copy and achievement bullets where appropriate.

Use my current LinkedIn content as a baseline, but improve it based on the authoritative CV and final website.

# 14. Testing and verification

Before completing:

- Review the full diff
- Confirm no unrelated work was overwritten
- Run formatting checks
- Run linting
- Run type checking
- Run tests
- Run the production build
- Test desktop and mobile layouts
- Test light and dark modes
- Test keyboard navigation and visible focus
- Test contact-form validation
- Test contact-form success and failure behaviour where credentials permit
- Test protected reveal controls
- Confirm raw contact details are absent from public build output
- Confirm metadata appears in generated HTML
- Confirm the social image uses an absolute production URL
- Confirm LinkedIn does not inject duplicate scripts
- Validate structured-data JSON
- Check sitemap and robots output
- Check internal and external links
- Confirm the redacted PDF is included
- Render and visually inspect every PDF page
- Extract PDF text and search for the removed PII
- Confirm no private CV has entered the public build
- Report anything that could not be verified

# 15. Commit and push safely to main

The completed changes, including the locally updated redacted CV, must be committed and pushed to main.

Proceed carefully:

- Inspect Git status, current branch and remotes.
- Preserve existing user changes.
- Review changes for secrets and private files.
- Ensure the committed CV is the redacted public version.
- Do not commit a newly created unredacted backup.
- Reconcile remote updates safely if required.
- Run verification before committing.
- Use a clear commit message.
- Push to main only after reviewing the intended commit.
- Never force-push.
- Do not rewrite Git history without explicit permission.
- Respect branch protection.
- If a pull request is required, create a suitable branch and PR instead.
- If remote changes cannot be reconciled safely, stop and explain.
- If authentication prevents pushing, leave the work safely committed and provide the exact remaining step.

After pushing:

- Confirm the commit exists on remote main.
- Identify whether deployment was triggered.
- Inspect deployment status where access permits.
- Verify the live website if deployment completes.
- Verify the live public CV URL.
- Verify the live metadata, sitemap, robots.txt and contact functionality where possible.

Do not say the website is live merely because the push succeeded.

# Final report

Conclude with a concise but complete report containing:

1. Summary of changes
2. Files changed
3. CV redaction:
   - What was removed
   - How genuine removal was verified
   - Public CV path and URL
   - Whether the unredacted version exists in Git history
4. Verification commands and results
5. ETOM and Media architecture
6. SEO strategy:
   - Keyword clusters
   - Page and search-intent mapping
   - Technical changes
   - Worthwhile future content
7. Social-preview implementation
8. Contact-form status
9. Contact anti-scraping implementation and remaining limitations
10. LinkedIn integration decision
11. Contact-ribbon decision
12. Ready-to-paste LinkedIn copy
13. External actions still required, in exact order
14. Git:
   - Commit identifier
   - Branch
   - Remote
   - Push result
15. Deployment:
   - Whether triggered
   - Whether completed
   - Whether independently verified
16. Clear separation between:
   - Completed locally
   - Pushed to main
   - Deployed
   - Verified in production
   - Awaiting credentials or third-party cache refresh

Do not claim that rankings, social previews, email delivery, deployment or external integrations work unless actually verified.
```

One important safeguard is included: if the original unredacted CV has already been committed, replacing it on `main` will not remove the PII from Git history. Claude will flag that separately instead of silently rewriting shared history.

One important safeguard is included: if the original unredacted CV has already been committed, replacing it on main will not remove the PII from Git history. Claude will you flag that separately instead of silently rewriting shared history?
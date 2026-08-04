02_IMPLEMENTATION_BRIEF.md

Implementation Brief

Purpose

This document defines how ChrisDemetriou.com Version 2 should be implemented.

It follows the approved strategy defined in:

* 00_PROJECT_VISION.md
* 01_CREATIVE_BRIEF.md

This document focuses on engineering quality, architecture, maintainability and delivery workflow.

Implementation should never change the approved creative direction without discussion.

⸻

Role

Act as a senior software engineer, UX engineer and front-end architect.

Your responsibility is not simply to build pages.

Your responsibility is to build a premium digital product.

Every engineering decision should support the user experience.

⸻

Development Workflow

Always work incrementally.

Never perform large undocumented rewrites.

Every milestone should be:

* reviewed
* committed
* documented

⸻

Git Workflow

Never work directly on the default branch.

Create a dedicated feature branch.

Recommended:

feature/v2

If work becomes large:

feature/v2-homepage
feature/v2-design-system
feature/v2-content
feature/v2-accessibility

Commits should remain focused.

Examples:

feat(hero): redesign homepage hero
feat(nav): implement dual-career navigation
feat(diagrams): add enterprise information flow
feat(theme): implement theme switching
feat(accessibility): add Focus Mode
docs(ai): update implementation notes

⸻

Repository Standards

Prefer improving existing architecture.

Avoid unnecessary dependencies.

Prefer reusable components over duplication.

Every component should have a clear purpose.

⸻

Engineering Principles

Prioritise:

* readability
* maintainability
* accessibility
* performance
* scalability
* consistency

Avoid clever code that reduces clarity.

Future contributors should understand the project quickly.

⸻

Component Philosophy

Every reusable UI element should become a component.

Examples:

* Hero
* Navigation
* Theme Toggle
* Reading Controls
* Information Flow Diagram
* Timeline
* Enterprise Diagram
* CTA
* Testimonials
* Tabs
* Cards
* Metrics
* Footer

No duplicated UI.

⸻

Design Tokens

Create reusable design tokens for:

Typography

Spacing

Colours

Radius

Elevation

Animation timing

Animation easing

Breakpoints

Container widths

Transitions

Never hardcode visual values where reusable tokens make sense.

⸻

Responsive Design

Mobile first.

Desktop enhanced.

Every interaction should work on:

Mobile

Tablet

Laptop

Desktop

Ultra-wide displays

Desktop-only interactions should gracefully adapt to touch devices.

⸻

Performance Budget

Performance is a feature.

Target:

* Lighthouse Performance 95+
* Accessibility 100
* Best Practices 100
* SEO 100

Core Web Vitals should remain green.

Optimise:

* fonts
* images
* JavaScript
* animation
* hydration
* lazy loading

Avoid unnecessary client-side rendering.

⸻

Accessibility

Minimum target:

WCAG 2.2 AA

Requirements include:

* keyboard navigation
* semantic HTML
* focus states
* ARIA where appropriate
* reduced motion support
* colour contrast
* screen reader compatibility

Accessibility should never be treated as optional.

⸻

Theme System

Dark Mode is the primary experience.

Light Mode is fully supported.

Requirements:

* instant switching
* smooth transition
* remember preference
* system preference detection
* manual override

Both themes must feel intentionally designed.

⸻

Reading Experience

Implement:

Focus Mode

Reduce visual noise.

Hide decorative elements.

Increase reading comfort.

⸻

Read Aloud

Implement browser speech synthesis where appropriate.

Support:

* Play
* Pause
* Resume
* Stop

Highlight current text where practical.

⸻

Reading Preferences

Support:

* text size
* line spacing
* paragraph spacing
* reading width
* reduced motion

Persist preferences between sessions.

⸻

Motion Design

Motion should communicate.

Never distract.

Examples:

* portrait reveal
* section transitions
* information flow
* dependency activation
* card interactions
* page transitions

Animations should remain smooth.

Target 60fps.

⸻

Enterprise Information Flow

One of the signature components.

Illustrate:

Technical Teams

↓

Chris analyses context

↓

Relevant information flows onward

↓

Business

Leadership

Change

Release

Vendors

Only relevant paths should activate.

Avoid decorative node graphs.

Communicate understanding.

⸻

Photography

Use placeholders until final photography exists.

Preferred style:

* editorial
* authentic
* premium
* documentary

Avoid obvious stock imagery.

⸻

Privacy

Implement:

Cookie Banner

Cookie Preferences

Privacy Policy

Cookie Policy

Accessibility Statement

Analytics should respect consent.

⸻

SEO

Implement:

* metadata
* canonical URLs
* sitemap
* robots.txt
* Open Graph
* X Cards
* JSON-LD
* semantic HTML

Optimise for both traditional search engines and AI search.

⸻

ATS Optimisation

Ensure page structure clearly communicates:

Primary role:

Enterprise Technology Operations Manager

Avoid accidental classification as:

* Project Manager
* Programme Manager
* IT Support
* Customer Success

Use semantic headings and natural language.

Avoid keyword stuffing.

⸻

Documentation

Significant architectural decisions should be documented.

When introducing new components:

Explain:

* why they exist
* when to use them
* accessibility considerations
* responsive behaviour

⸻

Milestones

Milestone 1

Foundation

Navigation

Theme

Hero

Typography

⸻

Milestone 2

Enterprise Technology homepage

Information flow

Enterprise diagrams

Animations

⸻

Milestone 3

Creative Media experience

⸻

Milestone 4

Accessibility

Focus Mode

Read Aloud

Reading Preferences

Cookie consent

⸻

Milestone 5

SEO

Performance

Testing

Final polish

⸻

Reporting

After every milestone provide:

Summary

What changed?

Why?

Files

Which files changed?

Commits

Which commits were created?

Risks

Any technical concerns?

Recommendations

Suggested next milestone.

Pause for review before continuing.

⸻

Definition of Done

Implementation is complete only when:

* the approved creative vision has been faithfully realised
* performance targets are met
* accessibility targets are met
* responsive behaviour is complete
* Git history is clean
* documentation is updated
* the experience feels like a premium SaaS product rather than a traditional personal website

Engineering quality should always reinforce the brand.

Never compromise the user experience for implementation convenience.
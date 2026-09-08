# ADR-035: The website is not the app, and says so

Status: accepted · September 2026 · Implements the review in `03-scope.md`, extends ADR-009

## Context

The regulatory review of September 2026 found exactly one place in this project
where a data protection obligation actually attaches, and it is not the app:

> The app processes no personal data on anybody's behalf but the person's own…
> The exception is the site that distributes the app. Serving `adnotia.com`
> involves processing IP addresses and request logs, which are personal data, and
> that processing has a controller whoever operates the origin. The privacy
> commitments in this document are about the app; the distribution site needs its
> own short, accurate statement, and it is the only place a data protection
> obligation actually attaches.

The same reasoning is what makes the UK Children's Code bite. Section 123 needs
an information society service that **processes personal data** and is likely to
be accessed by children. The app fails the first limb and the site meets both.

There is also an honesty problem, and it is the sharper one. The About page
promises "no analytics of any kind, and no third-party request of any kind".
That is true, and it is about the app. Fetching the page is a request, and a web
server sees requests. Somebody who read that list and concluded no record of them
exists anywhere would have been misled by a page whose whole purpose is not to
mislead them — and `03-scope.md` asks this app to be "honest about limits,
including the app's own".

## Decision

**The About page gains a section that separates the two.** The website sees what
every web server sees: the address asked for, roughly when, the address it was
asked from, and which browser asked. Nothing is switched on that records more.
The app sets no cookie of its own and asks the network for nothing once the page
has loaded. And the one-file build answers the question completely, because a
file on your own disk makes no request at all.

**Every claim in it is either verifiable from this source or true of every web
server.** Nothing is asserted about what a particular host retains, how long it
keeps it, or whether it sets a cookie of its own, because those are deployment
facts this code cannot check and a privacy statement that guesses is worse than
one that is narrow.

That narrowness is deliberate and it is the same position ADR-009 already took:
"Whatever access logs a host keeps by default it keeps; this project does not opt
into more."

## What the operator must confirm before launch

The statement is accurate as written. These are the things that could make it
inaccurate, and none of them is checkable from inside the repository:

1. **Cookies.** The app sets none. A CDN may set its own for bot management.
   If `adnotia.com` sets any cookie, the sentence "the app sets no cookie of its
   own" is still true but is no longer the whole truth, and the section needs a
   line saying what the host sets and why.
2. **Log retention.** How long the host keeps access logs, and who can read them.
   The statement says a server sees requests; it does not say for how long,
   because that is the operator's to answer.
3. **Every content-rewriting feature stays off**, per ADR-009 — Web Analytics,
   Rocket Loader, Email Obfuscation, Bot Fight Mode, Zaraz, HTML optimisation.
   Any of them would make "no tracking script" false.
4. **The fifteen Children's Code standards**, assessed against the site. The
   review calls this "a short one for a static site with no analytics", and short
   is not the same as done.

## Consequences

The About page now describes two things where it described one, and the second is
the one a careful reader would otherwise have caught it out on.

The one-file build gains a purpose it always had and never stated: it is the
answer to the only privacy question this project could not otherwise answer. That
is worth knowing when weighing whether to keep building it.

Nothing here is legal advice, and the review it implements says the same about
itself. It was written by the author, on the author's own product, and the four
items above are the ones a qualified person should be handed rather than told
about in general terms.

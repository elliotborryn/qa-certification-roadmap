# Placement rules

How to decide where a certification goes on the roadmap and how to fill in its fields. Every entry in `data/certifications.json` should follow these rules so placements stay consistent over time.

## 1. Should it be added at all?

- **Only certifications that are currently offered.** A retired certification is not added. Instead, name it in the footer's "Not included" note in `index.html`, and remove its entry if one exists. A certification that has a successor and is in its sunset period (for example ISTQB CTFL-AT, replaced by CTAL-AT v2.0) is also left out and listed under "Not included".
- **It must be about software testing or quality assurance.** It has to certify testing skills: designing, automating, running or managing tests, or testing a quality characteristic such as performance, security or accessibility. General development, cloud or project-management certifications don't qualify.
- **Security certifications only if they test software,** such as web, API or mobile application testing. General network and infrastructure penetration testing certifications (for example OSCP, PenTest+ or CEH) are left out.
- **Tool certifications only with an exam or assessment from the tool's maintainer.** Course-completion badges and third-party "certifications" for a tool (for example for Cypress or Playwright, which have no official certification) are left out.
- **AI certifications only if they are about testing,** such as ISTQB CT-AI and CT-GenAI. Other AI certifications belong on the [AI Certification Roadmap](https://elliotborryn.github.io/ai-certification-roadmap/).
- One exception: a non-testing certification that is a formal prerequisite for a testing certification on the roadmap can be shown for context with `"status": "prereq"`. Prerequisites aren't counted in the header or domain totals. None are shown at the moment; if you add one, also add the legend item `<li><span class="dash"></span>Prerequisite, not testing-specific</li>` back to `index.html`.

## 2. Domain (the column)

Pick the domain for **what the certification proves**, not who issues it.

| key | Domain | Goes here |
|---|---|---|
| `ana` | Test Analysis & Design | General testing foundations, test design techniques, test analysis, model-based and acceptance testing |
| `auto` | Test Automation | Automation tools and frameworks, automation engineering and strategy, API test automation |
| `agile` | Agile & DevOps Testing | Testing in agile teams, DevOps pipelines and continuous delivery, agile test leadership |
| `spec` | Specialist Testing | Performance and load testing, mobile testing, and industry domains (automotive, games, gambling, finance) |
| `sec` | Security Testing | Security testing, penetration testing, vulnerability assessment |
| `a11y` | Accessibility & Usability | Accessibility (WCAG, assistive technology) and usability testing |
| `ai` | AI Testing | Testing AI-based systems, or using AI to test |
| `mgmt` | Test Management & Leadership | Test management, test strategy and planning, test process improvement, leading test teams |

### Tie-breakers

1. **Automating tests goes in `auto`,** even when the thing being tested is specific. For example, API test automation or a tool vendor's automation certification goes in `auto`, not `spec`.
2. **Performance goes in `spec`,** including performance-testing tool certifications (for example JMeter or NeoLoad), because the skill proven is load and performance testing. A certification that is mainly about scripting a general automation framework still goes in `auto`.
3. **Penetration testing goes in `sec`,** even when the vendor frames it as a hacking or red team certification. Any certification whose exam is mainly about finding or exploiting security weaknesses belongs in `sec`.
4. **Anything that tests AI or uses AI to test goes in `ai`,** even if it also covers automation or test management.
5. **Leading or organising testing across several teams goes in `agile`** when the certification is about agile or DevOps ways of working (for example CT-ATLaS), and in `mgmt` otherwise.
6. **The certification that everything else builds on (ISTQB CTFL) goes in `ana`,** because its syllabus is mostly test analysis and design.
7. If it still spans two domains, choose the one that covers **the majority of the exam objectives** in the vendor's published syllabus or outline, and say why in the commit message.

## 3. Level (the row)

| Level | Name | Meaning |
|---|---|---|
| 1 | Foundation | Where everyone starts. No experience needed. |
| 2 | Specialist | One focused topic, built on the foundation. |
| 3 | Advanced | Experienced testers deepening a role. |
| 4 | Expert | Senior testers and test leaders. Several years of experience required. |

### ISTQB certifications

ISTQB certifications follow ISTQB's own structure. Don't second-guess it with the experience rules below.

| ISTQB level | Codes | Roadmap level |
|---|---|---|
| Foundation Level | `CTFL` | L1 |
| Specialist | `CT-…` (for example CT-PT, CT-SEC, CT-AI) | L2 |
| Advanced Level | `CTAL-…` (for example CTAL-TA, CTAL-TAE) | L3 |
| Expert Level | `CTEL-…` | L4 |

Some Specialist certifications ask for practical experience (for example CT-SEC asks for 3 years). They still go at L2; put the requirement in `before`.

An Expert Level certification that ISTQB splits into several module exams (for example CTEL-TM-SM, -OTM and -MTT) is **one entry** for the full certification. Name the modules in `what`.

### Other certifications

Everything else is placed by **the recommended experience** the vendor states, not by the title.

| Level | Rule |
|---|---|
| 1 | No experience or prerequisites required. If the vendor accepts people new to the field (for example "1 year of experience, or a new role"), the lowest accepted route decides. |
| 2 | Some hands-on experience recommended (up to about 2 years), **or** a practical exam aimed at people starting out in the topic |
| 3 | 2–5 years of hands-on experience recommended, **or** a practical exam aimed at working practitioners |
| 4 | Requires an L3 certification first, **or** 5+ years of experience, **or** targets senior and lead roles |

A certification that requires another one first goes **at least one level above** that prerequisite. For example, in a vendor path Tosca AS2 (requires AS1, L1) goes at L2 and Tosca AE1 (requires AS2) at L3. A strong recommendation ("we advise getting X first") is not a requirement.

Check from the top: if L4 applies, stop there. Otherwise check L3, then L2. Anything left is L1. If the vendor's title ("Foundation", "Professional", "Expert") and the recommended experience disagree, go by the experience.

## 4. Fields

| Field | Rule |
|---|---|
| `code` | The vendor's exam code or abbreviation (for example `CTAL-TAE`, `CPACC`). Use a short, recognisable name if there is no code (for example `Tosca AS1`), or if the code is only a number that says nothing about the product (for example OpenText `5-5730` becomes `LoadRunner Pro`, with the code kept in `name`). **Must be unique.** Don't put the version in the code. Keep it short enough to fit a tile; join a trailing number with a non-breaking space (`\u00a0`) so it doesn't wrap onto its own line. |
| `name` | The full official name, as written on the vendor's page. Prefix ISTQB names with `ISTQB` and add the version when ISTQB shows one in the title (for example `ISTQB Certified Tester Advanced Level Test Analyst (CTAL-TA) v4.0`). |
| `vendor` | The issuing organisation, using the spelling already in the file (for example `ISTQB`, `IAAP`, `INE Security`). |
| `domain` | One of the keys above. |
| `level` | A number from 1 to 4, not a string. |
| `price` | The exam fee in **US dollars**, written with `$` and digits so the page's currency picker can convert it: `"$150"`, `"$510 ($410 for IAAP members)"`. Use `"Free"` when it is free. If the vendor only prices in another currency, give the approximate USD amount and say so, for example `"About $250 (priced in GBP)"`. Never write `€`, `£` or other symbols. **ISTQB fees are set by national exam boards, so ISTQB entries use `"Varies by exam board"`** unless ISTQB itself publishes a single price. Use `"No separate exam"` for a credential awarded for holding other certifications. **Use `"See vendor"` if you don't know the fee. Never guess a fee.** |
| `status` | `"new"` if first launched in 2025 or later (a new version of an existing certification doesn't count, a new certification that replaces others does) · `"beta"` if the exam is in beta (no entry uses it now; if you add one, put `<li><span class="dot beta"></span>Beta exam</li>` back in the legend in `index.html`) · `"prereq"` only for a non-testing prerequisite shown for context · otherwise `"active"`. |
| `source` | `"vendor"` only if every detail was checked on the vendor's official page. Otherwise `"reports"`; the tile then shows an amber "From industry reports" marker. |
| `url` | The vendor's official page for this certification, starting with `https://`. If there is no dedicated page, use the vendor's certification landing page. Never make up a URL. |
| `what` | One or two plain sentences on what the certification covers. Mention anything it replaced ("Replaced v3.1.") or a notable launch date. |
| `before` | The prerequisites and recommended experience, as the vendor states them. If there are none, write `"No prerequisites."` or `"No formal prerequisites."` Say "Reported to…" if the information came from reports rather than the vendor. |

### Order in the file

Entries are grouped by domain, in the same order as `domains`, and by level from low to high within each domain. Within a level, the file order is the order shown on the page, so put a new entry next to related ones.

### After a check pass

When you re-check the data, update `meta.lastChecked` (`"YYYY-MM"`). The page footer shows it.

## 5. Template

```json
{
  "code": "CT-XYZ",
  "name": "ISTQB Certified Tester Full Official Name (CT-XYZ)",
  "vendor": "ISTQB",
  "domain": "spec",
  "level": 2,
  "price": "Varies by exam board",
  "status": "active",
  "source": "vendor",
  "url": "https://istqb.org/certifications/certification-page/",
  "what": "What the exam covers, in one or two sentences.",
  "before": "Requires ISTQB CTFL."
}
```

## 6. Checklist

- [ ] Currently offered (not retired or being phased out) and about software testing, or a formal prerequisite of one on the roadmap
- [ ] Domain chosen from what it proves, with the tie-breakers applied
- [ ] Level from ISTQB's structure for ISTQB certifications, from the recommended experience for everything else
- [ ] Price, prerequisites and URL come from a real source; unknown price is `"See vendor"`
- [ ] `source` is honest about where the details came from
- [ ] `node scripts/validate.mjs` passes

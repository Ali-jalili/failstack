/** @format */

import Link from "next/link";

const analysisSteps = [
  {
    number: "01",
    title: "Reconstruct the sequence",
    detail: "Timeline",
    text: "Put the trigger, propagation, impact, and mitigation in order.",
    mark: "analysis-timeline",
  },
  {
    number: "02",
    title: "Make causality legible",
    detail: "Root cause",
    text: "Connect contributing conditions to the failures they set in motion.",
    mark: "analysis-cause",
  },
  {
    number: "03",
    title: "Record what changes",
    detail: "Prevention",
    text: "Turn the explanation into a concrete action against recurrence.",
    mark: "analysis-prevention",
  },
];

export default function Home() {
  return (
    <div className="home-page relative isolate overflow-hidden bg-[#080d16] text-slate-100">
      <div aria-hidden="true" className="home-grid" />
      <div aria-hidden="true" className="home-orbit home-orbit-one" />
      <div aria-hidden="true" className="home-orbit home-orbit-two" />

      <div className="relative">
        <section
          aria-labelledby="home-heading"
          className="home-hero mx-auto grid max-w-[1440px] gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-28 lg:pt-24"
        >
          <div className="home-intro">
            <p className="home-kicker">
              <span className="home-kicker-mark" aria-hidden="true" />
              Engineering knowledge, recovered from failure
            </p>

            <h1 id="home-heading" className="home-headline">
              The failure
              <br />
              ends.
              <br />
              <span>What we learn</span>
              <br />
              stays.
            </h1>

            <p className="home-lede">
              FailStack is a peer-reviewed incident archive for the details
              worth keeping: what happened, why it spread, and what changes
              next.
            </p>

            <div className="home-actions">
              <Link href="/incidents" className="home-primary-action">
                Read the incident archive
                <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/incidents/new" className="home-secondary-action">
                Contribute a postmortem
              </Link>
            </div>
            <p className="home-action-note">
              Contributions require sign-in and enter reviewer assessment.
            </p>

            <div className="home-principles" aria-label="FailStack principles">
              <span>Structured evidence</span>
              <span>Human review</span>
              <span>Reusable lessons</span>
            </div>
          </div>

          <figure
            className="investigation-visual"
            aria-labelledby="investigation-visual-heading"
          >
            <figcaption className="visual-caption">
              <span>THE FAILSTACK METHOD</span>
              <span>REPORT → KNOWLEDGE</span>
            </figcaption>
            <h2 id="investigation-visual-heading">
              Make the failure
              <br />
              useful.
            </h2>
            <p className="visual-intro">
              A considered investigation turns a single report into lessons
              other engineers can use.
            </p>

            <ol className="investigation-steps">
              <li className="investigation-step evidence-step">
                <span className="investigation-step-index">01</span>
                <span className="investigation-step-mark evidence-mark" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <div>
                  <span className="investigation-step-label">EVIDENCE</span>
                  <h3>What happened</h3>
                  <p>Build a clear account of the incident.</p>
                </div>
              </li>
              <li className="investigation-step explanation-step">
                <span className="investigation-step-index">02</span>
                <span className="investigation-step-mark explanation-mark" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <div>
                  <span className="investigation-step-label">EXPLANATION</span>
                  <h3>Why it happened</h3>
                  <p>Connect the sequence to its contributing causes.</p>
                </div>
              </li>
              <li className="investigation-step prevention-step">
                <span className="investigation-step-index">03</span>
                <span className="investigation-step-mark prevention-mark" aria-hidden="true">
                  <i />
                </span>
                <div>
                  <span className="investigation-step-label">PREVENTION</span>
                  <h3>What changes next</h3>
                  <p>Keep a corrective action attached to the lesson.</p>
                </div>
              </li>
            </ol>
            <p className="visual-footnote">
              A product principle, not a live incident feed.
            </p>
          </figure>
        </section>

        <section
          aria-labelledby="method-heading"
          className="home-method-section"
        >
          <div className="home-method-inner">
            <div className="home-method-heading">
              <p className="home-section-kicker">An incident, made useful</p>
              <h2 id="method-heading">
                Not just what broke.
                <br />
                <em>What it taught.</em>
              </h2>
            </div>
            <ol className="home-analysis-steps">
              {analysisSteps.map((step) => (
                <li key={step.number} className="home-analysis-step">
                  <div className={`analysis-mark ${step.mark}`} aria-hidden="true">
                    {step.mark === "analysis-timeline" && (
                      <>
                        <i />
                        <i />
                        <i />
                      </>
                    )}
                    {step.mark === "analysis-cause" && (
                      <>
                        <i />
                        <i />
                        <i />
                      </>
                    )}
                    {step.mark === "analysis-prevention" && <i />}
                  </div>
                  <div className="analysis-copy">
                    <span className="analysis-number">{step.number}</span>
                    <span className="analysis-detail">{step.detail}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="review-heading"
          className="home-review-section mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12"
        >
          <div className="review-intro">
            <p className="home-section-kicker">A considered path to publication</p>
            <h2 id="review-heading">
              Shared knowledge
              <br />
              needs <em>good review.</em>
            </h2>
            <p>
              Every contribution enters a reviewer queue before it becomes part
              of the public archive.
            </p>
          </div>
          <ol className="review-path">
            <li>
              <span>01 / AUTHOR</span>
              <h3>Document</h3>
              <p>Submit a structured account of the incident.</p>
            </li>
            <li>
              <span>02 / REVIEW</span>
              <h3>Challenge</h3>
              <p>Reviewers can approve the report or request changes.</p>
            </li>
            <li>
              <span>03 / ARCHIVE</span>
              <h3>Preserve</h3>
              <p>Approved reports join the published incident archive.</p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}

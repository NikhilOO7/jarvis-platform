import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { agentModules, automationStack, executionSteps, targetUsers, technologyStack } from "@/lib/agent-features";

export default function AgentsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Agents // Business Automation"
        title="Not just chat. Actual task execution."
        description="Jarvis evolves into a multi-agent executive assistant that can understand, remember, delegate, execute approved actions, and respond through text or voice."
      />

      <section className="grid content-grid">
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Automation Core</div>
              <h2>What Jarvis 2.0 can handle</h2>
            </div>
            <span className="pill">Execution Layer</span>
          </div>
          <div className="module-grid two-column">
            {agentModules.map((module) => (
              <article className="module-card tall" key={module.title}>
                <div className="module-icon">
                  <module.icon size={22} />
                </div>
                <div>
                  <h3>{module.title}</h3>
                  <p className="muted">{module.description}</p>
                  <div className="capability-list">
                    {module.capabilities.map((capability) => (
                      <span key={capability}>{capability}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Command Interface</h2>
          <div className="timeline-list">
            {automationStack.map((item, index) => (
              <div className="timeline-item" key={item.title}>
                <div className="timeline-index">{index + 1}</div>
                <div className="module-icon compact">
                  <item.icon size={18} />
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid content-grid" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>How The Automation Works</h2>
          <div className="timeline-list">
            {executionSteps.map((step, index) => (
              <div className="timeline-item" key={step}>
                <div className="timeline-index">{index + 1}</div>
                <div>
                  <strong>Step {index + 1}</strong>
                  <p className="muted">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Who This Is For</h2>
          <div className="capability-list large">
            {targetUsers.map((user) => (
              <span key={user}>{user}</span>
            ))}
          </div>

          <h2 style={{ marginTop: 24 }}>Technologies Used</h2>
          <div className="capability-list large">
            {technologyStack.map((technology) => (
              <span key={technology}>{technology}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Safety Gates</div>
            <h2>Automate the work. Keep control of the blast radius.</h2>
          </div>
          <span className="pill">Required</span>
        </div>
        <div className="module-grid">
          <div className="list-item">Emails are drafted automatically but sent only after explicit approval.</div>
          <div className="list-item">Calendar changes show attendees, time, title, and description before execution.</div>
          <div className="list-item">Contact edits, financial records, and sensitive data transfers require confirmation.</div>
          <div className="list-item">Internet research separates saved knowledge, external sources, and uncertain claims.</div>
          <div className="list-item">Every workflow step should be logged for review, debugging, and memory updates.</div>
          <div className="list-item">Personality stays useful and original, without imitating real people or copyrighted voices.</div>
        </div>
      </section>
    </AppShell>
  );
}

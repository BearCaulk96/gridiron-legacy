interface Props {
  hasSave: boolean;
  onContinue: () => void;
  onNew: () => void;
}

export function Landing({ hasSave, onContinue, onNew }: Props) {
  return (
    <div className="app-shell">
      <section className="hero-field">
        <p className="tag anim-fade-up">Free forever · No pay-to-win</p>
        <h1 className="brand-mark anim-fade-up anim-delay-1" style={{ fontSize: 'clamp(4.5rem, 14vw, 8.5rem)', margin: '0.2rem 0' }}>
          GRIDIRON
          <br />
          LEGACY
        </h1>
        <p className="anim-fade-up anim-delay-2" style={{ maxWidth: 460, fontSize: '1.05rem', color: 'var(--chalk-dim)' }}>
          Build a dynasty across 32 cities. Draft, trade, manage the cap, and win the Gridiron Cup — earned on the field, never bought.
        </p>
        <div className="anim-fade-up anim-delay-3" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" onClick={onNew}>
            Start Franchise
          </button>
          {hasSave && (
            <button className="btn btn-ghost" onClick={onContinue}>
              Continue Dynasty
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

/** Soft animated colour blobs + grid behind the glass surfaces. */
export function Ambient() {
  return (
    <div className="ambient" aria-hidden>
      <div className="blob" style={{ width: '42vw', height: '42vw', left: '-10vw', top: '-12vw', background: 'var(--blob-1)' }} />
      <div
        className="blob"
        style={{ width: '36vw', height: '36vw', right: '-8vw', top: '8vh', background: 'var(--blob-3)', animationDelay: '-7s' }}
      />
      <div
        className="blob"
        style={{ width: '34vw', height: '34vw', left: '22vw', bottom: '-16vw', background: 'var(--blob-2)', animationDelay: '-14s' }}
      />
      <div
        className="blob"
        style={{ width: '28vw', height: '28vw', right: '12vw', bottom: '-8vw', background: 'var(--blob-4)', animationDelay: '-18s' }}
      />
      <div className="grid" />
      <div className="noise" />
    </div>
  );
}

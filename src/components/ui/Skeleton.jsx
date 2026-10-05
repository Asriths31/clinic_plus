export function Skeleton({ width, height = '1rem', className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="table-skeleton">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="table-skeleton__row">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${60 + Math.random() * 40}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card stat-card--skeleton">
          <Skeleton width="48px" height="48px" className="skeleton--circle" />
          <div>
            <Skeleton width="3rem" height="1.75rem" />
            <Skeleton width="5rem" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

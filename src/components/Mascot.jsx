export default function Mascot({ mood = 'neutral', label = '오망로그 캐릭터' }) {
  return (
    <div className={`mascot mascot-${mood}`} aria-label={label}>
      <span className="ear left" />
      <span className="ear right" />
      <span className="face">
        <span className="eye left" />
        <span className="eye right" />
        <span className="mouth" />
      </span>
    </div>
  );
}

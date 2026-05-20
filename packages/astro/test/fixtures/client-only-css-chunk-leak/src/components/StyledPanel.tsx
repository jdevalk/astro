import './StyledPanel.css';

export default function StyledPanel({ children }: { children: React.ReactNode }) {
  return <div className="styled-panel">{children}</div>;
}

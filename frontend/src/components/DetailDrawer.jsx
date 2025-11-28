import './DetailDrawer.css';

const DetailDrawer = ({ title, isOpen, onClose, children }) => {
  return (
    <div className={`drawer ${isOpen ? 'drawer--open' : ''}`}>
      <div className="drawer__backdrop" onClick={onClose} role="presentation" />
      <aside className="drawer__panel">
        <header className="drawer__header">
          <h2>{title}</h2>
          <button type="button" className="drawer__close" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="drawer__body">{children}</div>
      </aside>
    </div>
  );
};

export default DetailDrawer;

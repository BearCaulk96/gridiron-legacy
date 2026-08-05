import type { Screen } from '../hooks/useLeague';

export type MenuDestination =
  | Extract<
      Screen,
      'hub' | 'roster' | 'freeAgency' | 'contracts' | 'trade' | 'draft' | 'coaches' | 'standings' | 'cap'
    >
  | 'title';

interface Item {
  id: MenuDestination;
  label: string;
  blurb: string;
}

const ITEMS: Item[] = [
  { id: 'hub', label: 'Head Office', blurb: 'Calendar, news, and weekly actions' },
  { id: 'roster', label: 'My Team', blurb: 'Roster, depth, and cuts' },
  { id: 'freeAgency', label: 'Free Agency', blurb: 'Available players and signings' },
  { id: 'contracts', label: 'Contracts', blurb: 'Re-sign expiring players' },
  { id: 'trade', label: 'Trade Block', blurb: 'Offers, picks, and swaps' },
  { id: 'draft', label: 'Draft Board', blurb: 'Scouting and draft night' },
  { id: 'coaches', label: 'Coaches', blurb: 'Staff and schemes' },
  { id: 'standings', label: 'Standings', blurb: 'Division and conference race' },
  { id: 'cap', label: 'Salary Cap', blurb: 'Contracts and space' },
];

interface Props {
  open: boolean;
  current?: Screen;
  onClose: () => void;
  onNavigate: (id: MenuDestination) => void;
}

export function GameMenu({ open, current, onClose, onNavigate }: Props) {
  if (!open) return null;

  return (
    <div className="game-menu" role="dialog" aria-modal="true" aria-label="Game menus">
      <header className="game-menu-top">
        <div>
          <p className="game-menu-eyebrow">Navigate</p>
          <h2>MENUS</h2>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </header>

      <nav className="game-menu-list" aria-label="Game sections">
        {ITEMS.map((item) => {
          const active = current === item.id || (item.id === 'hub' && current === 'hub');
          return (
            <button
              key={item.id}
              type="button"
              className={`game-menu-item ${active ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.blurb}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="game-menu-item game-menu-item-muted"
          onClick={() => onNavigate('title')}
        >
          <strong>Title Screen</strong>
          <span>Save stays — return to the main menu</span>
        </button>
      </nav>
    </div>
  );
}

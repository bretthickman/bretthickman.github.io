import { Menu } from '@base-ui/react/menu';
import { Check, Palette } from 'lucide-react';
import { themes, type Theme } from '../theme';

interface ThemeMenuProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeMenu({ theme, onChange }: ThemeMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger className="header-action theme-trigger" aria-label="Choose a theme">
        <span className="header-action-icon"><Palette size={19} strokeWidth={2} aria-hidden="true" /></span>
        <span className="header-action-label" aria-hidden="true"><span>theme</span></span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={12} align="end" alignOffset={10} className="menu-positioner">
          <Menu.Popup className="theme-menu">
            <Menu.RadioGroup value={theme} onValueChange={onChange}>
              {themes.map((option) => (
                <Menu.RadioItem key={option.id} value={option.id} className="theme-option" closeOnClick>
                  <span className="theme-swatches" aria-hidden="true">
                    {option.colors.map((color) => <i key={color} style={{ background: color }} />)}
                  </span>
                  <span className="theme-copy">
                    <span>{option.name}</span>
                    <small>{option.description}</small>
                  </span>
                  <Menu.RadioItemIndicator><Check size={16} /></Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

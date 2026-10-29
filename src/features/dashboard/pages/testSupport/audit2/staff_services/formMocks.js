// Plain-DOM stand-ins for the Radix checkbox, switch and dropdown menu.
const React = require('react');

const checkbox = {
  Checkbox: ({ checked, onCheckedChange, disabled }) => React.createElement('input', {
    type: 'checkbox', 'data-mock-checkbox': '1', checked: !!checked, disabled: !!disabled,
    onChange: () => onCheckedChange && onCheckedChange(!checked),
  }),
};
const sw = {
  Switch: ({ checked, onCheckedChange, disabled }) => React.createElement('input', {
    type: 'checkbox', 'data-mock-switch': '1', checked: !!checked, disabled: !!disabled,
    onChange: () => onCheckedChange && onCheckedChange(!checked),
  }),
};
function Pass({ children }) { return React.createElement(React.Fragment, null, children); }
const dropdown = {
  DropdownMenu: Pass, DropdownMenuTrigger: Pass,
  DropdownMenuContent: ({ children }) => React.createElement('div', { 'data-mock-menu': '1' }, children),
  DropdownMenuItem: ({ children, onClick, disabled }) => React.createElement('button', { type: 'button', role: 'menuitem', disabled: !!disabled, onClick }, children),
  DropdownMenuSeparator: () => null, DropdownMenuLabel: Pass, DropdownMenuGroup: Pass,
};
module.exports = { checkbox, sw, dropdown };

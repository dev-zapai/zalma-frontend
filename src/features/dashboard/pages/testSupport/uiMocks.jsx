// Plain-DOM stand-ins for the Radix wrappers so probes can drive selects,
// dialogs and tabs with ordinary DOM events in jsdom.
const React = require('react');

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement(node)) return textOf(node.props.children);
  return '';
}

function SelectItem() { return null; }
function Pass({ children }) { return React.createElement(React.Fragment, null, children); }
function Div({ children, ...rest }) {
  const safe = {};
  if (rest.className) safe.className = rest.className;
  if (rest['data-testid']) safe['data-testid'] = rest['data-testid'];
  return React.createElement('div', safe, children);
}

function Select({ value, onValueChange, children, disabled }) {
  const items = [];
  const walk = (nodes) => React.Children.forEach(nodes, (n) => {
    if (!React.isValidElement(n)) return;
    if (n.type === SelectItem) items.push({ value: n.props.value, label: textOf(n.props.children), disabled: !!n.props.disabled });
    else if (n.props && n.props.children) walk(n.props.children);
  });
  walk(children);
  const known = items.some(i => i.value === value);
  return React.createElement('select',
    { 'data-mock-select': '1', value: known ? value : '', disabled: !!disabled,
      onChange: (e) => onValueChange && onValueChange(e.target.value) },
    React.createElement('option', { value: '' }, '-'),
    ...items.map(i => React.createElement('option', { key: i.value, value: i.value, disabled: i.disabled }, i.label)));
}

const select = {
  Select, SelectItem, SelectTrigger: Pass, SelectValue: () => null, SelectContent: Pass,
  SelectGroup: Pass, SelectLabel: Pass, SelectSeparator: () => null,
};

const dialog = {
  Dialog: ({ open, children }) => (open ? React.createElement('div', { 'data-mock-dialog': '1' }, children) : null),
  DialogContent: Div, DialogHeader: Div, DialogTitle: Div, DialogFooter: Div, DialogDescription: Div,
  DialogTrigger: Pass, DialogClose: Pass, DialogPortal: Pass, DialogOverlay: () => null,
};

const TabsCtx = React.createContext({});
const tabs = {
  Tabs: ({ value, onValueChange, children }) => React.createElement(TabsCtx.Provider, { value: { value, onValueChange } }, React.createElement('div', null, children)),
  TabsList: Div,
  TabsTrigger: ({ value, children }) => {
    const ctx = React.useContext(TabsCtx);
    return React.createElement('button', { type: 'button', role: 'tab', 'data-state': ctx.value === value ? 'active' : 'inactive', onClick: () => ctx.onValueChange(value) }, children);
  },
  TabsContent: ({ value, children }) => {
    const ctx = React.useContext(TabsCtx);
    return ctx.value === value ? React.createElement('div', { 'data-tab': value }, children) : null;
  },
};

module.exports = { select, dialog, tabs, textOf };

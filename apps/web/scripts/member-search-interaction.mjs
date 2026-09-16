import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Render the real component with deterministic query and hook adapters. Browser
// event ordering is supplied explicitly; this is not a WebKit emulation.
export async function evaluateMemberSearchInteraction() {
  const source = await readFile(
    new URL('../components/member-search.tsx', import.meta.url),
    'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const results = [];
  for (const pointerType of ['touch', 'pen', 'mouse']) {
    const state = ['Ada', 'Ada', true, -1];
    let cursor = 0;
    const navigations = [];
    const jsx = (type, props) => ({ type, props });
    const dependencies = {
      'react/jsx-runtime': { jsx, jsxs: jsx },
      react: {
        useState: () => {
          const index = cursor++;
          return [
            state[index],
            (value) => {
              state[index] =
                typeof value === 'function' ? value(state[index]) : value;
            },
          ];
        },
        useId: () => 'search',
        useEffect: () => {},
      },
      'next/link': { default: 'a' },
      'next/navigation': {
        useRouter: () => ({ push: (href) => navigations.push(href) }),
      },
      '@/app/trpc': {
        trpc: {
          user: {
            search: {
              useQuery: () => ({
                data: [{ id: 'ada', name: 'Ada', email: 'ada@example.test' }],
              }),
            },
          },
        },
      },
      '@/lib/i18n': { useI18n: () => ({ t: (key) => key }) },
      '@repo/ui/components/input': { Input: 'input' },
      '@repo/ui/components/avatar': {
        Avatar: 'span',
        AvatarFallback: 'span',
        AvatarImage: 'img',
      },
      'lucide-react': { Loader2: 'svg', Search: 'svg', UserRound: 'svg' },
    };
    const exports = {};
    vm.runInNewContext(compiled, {
      exports,
      require: (name) => {
        assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
        return dependencies[name];
      },
    });
    const render = () => {
      cursor = 0;
      return exports.MemberSearch();
    };
    const find = (node, type) => {
      if (!node || typeof node !== 'object') return undefined;
      if (node.type === type) return node;
      return [node.props?.children]
        .flat(Infinity)
        .map((child) => find(child, type))
        .find(Boolean);
    };
    let tree = render();
    let link = find(tree, 'a');
    assert.ok(link, 'Search must display a result');
    let pointerCancelled = false;
    link.props.onPointerDown?.({
      pointerType,
      preventDefault: () => {
        pointerCancelled = true;
      },
    });
    assert.equal(
      pointerCancelled,
      false,
      `${pointerType}: pointerdown must preserve native activation and scrolling`,
    );
    let mouseCancelled = false;
    link.props.onMouseDown?.({
      preventDefault: () => {
        mouseCancelled = true;
      },
    });
    // Mouse-down (including compatibility events after a tap) precedes the
    // focus change. Safari may report no relatedTarget for that focus change.
    if (!mouseCancelled)
      tree.props.onBlur({
        currentTarget: { contains: () => false },
        relatedTarget: null,
      });
    tree = render();
    link = find(tree, 'a');
    assert.ok(link, `${pointerType}: result must remain mounted until click`);
    link.props.onClick();
    navigations.push(link.props.href);
    assert.deepEqual(navigations, ['/profile/ada']);
    assert.equal(
      find(render(), 'a'),
      undefined,
      'Selection closes the dropdown',
    );
    state.splice(0, 4, 'Ada', 'Ada', true, -1);
    tree = render();
    find(tree, 'input').props.onKeyDown({
      key: 'ArrowDown',
      preventDefault() {},
    });
    find(render(), 'input').props.onKeyDown({
      key: 'Enter',
      preventDefault() {},
    });
    assert.deepEqual(
      navigations,
      ['/profile/ada', '/profile/ada'],
      'Keyboard selection still navigates',
    );
    state.splice(0, 4, 'Ada', 'Ada', true, -1);
    tree = render();
    tree.props.onBlur({
      currentTarget: { contains: () => false },
      relatedTarget: null,
    });
    assert.equal(
      find(render(), 'a'),
      undefined,
      'Outside blur dismisses results',
    );
    results.push([
      `${pointerType} selection preserves profile navigation`,
      true,
    ]);
  }
  return results;
}

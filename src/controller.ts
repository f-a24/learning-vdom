import { ActionTree } from './action';
import { View, VNode, createElement, updateElement } from './view';

type AppConstructor<State, Actions extends ActionTree<State>> = {
  /** メインNode */
  el: Element | string;
  /** Viewの定義 */
  view: View<State, Actions>;
  /** 状態管理 */
  state: State;
  /** Actionの定義 */
  actions: Actions;
};

export default <State, Actions extends ActionTree<State>>(
  params: AppConstructor<State, Actions>
) => {
  /**
   * リアルDOMに反映する
   */
  const render = (): void => {
    if (oldNode) {
      updateElement(el as HTMLElement, oldNode, newNode);
    } else {
      el.appendChild(createElement(newNode));
    }

    oldNode = newNode;
    skipRender = false;
  };

  /**
   * renderのスケジューリングを行う
   */
  const scheduleRender = (): void => {
    if (!skipRender) {
      skipRender = true;
      // setTimeoutを使うことで非同期になり、かつ実行を数ミリ秒遅延できる
      setTimeout(render);
    }
  };

  /**
   * 仮想DOMを構築する
   */
  const resolveNode = (): void => {
    // 仮想DOMを再構築する
    newNode = view(state, actions);
    scheduleRender();
  };

  /**
   * ユーザが定義したActionsに仮想DOM再構築用のフックを仕込む
   * @param actions
   */
  const dispatchAction = (actions: Actions): Actions => {
    const dispatched: ActionTree<State> = {};

    Object.keys(actions).forEach(key => {
      const action = actions[key];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatched[key] = (s: State, ...data: any): any => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
        const ret = action(s, ...data);
        resolveNode();
        return ret;
      };
    });
    return dispatched as Actions;
  };

  const el =
    typeof params.el === 'string'
      ? document.querySelector(params.el)!
      : params.el;
  const { view, state } = params;
  const actions = dispatchAction(params.actions);
  let oldNode: VNode | null = null;
  let newNode: VNode = view(state, actions);
  let skipRender = false;

  scheduleRender();
};

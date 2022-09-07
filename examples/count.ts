import { View, h } from '../src/view';
import { ActionTree } from '../src/action';
import app from '../src/controller';

type State = typeof initialState;
type Actions = typeof actions;

const initialState = {
  count: 0,
};

const actions: ActionTree<State> = {
  increment: (state: State): void => {
    state.count += 1;
  },
  decrement: (state: State): void => {
    state.count -= 1;
  },
};

const view: View<State, Actions> = (state, { increment, decrement }) =>
  h(
    'div',
    null,
    h('p', null, state.count),
    h(
      'button',
      {
        type: 'button',
        onclick: () => {
          increment(state);
        },
      },
      'count up'
    ),
    h(
      'button',
      {
        type: 'button',
        onclick: () => {
          decrement(state);
        },
      },
      'count down'
    )
  );

app({ el: '#app', state: initialState, view, actions });

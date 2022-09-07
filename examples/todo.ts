import { View, h } from '../src/view';
import { ActionTree } from '../src/action';
import app from '../src/controller';

type State = typeof initialState;
type Actions = typeof actions;

const initialState = {
  tasks: ['virtual dom', '完全に理解する'],
  form: {
    input: '',
    hasError: false,
  },
};

const actions: ActionTree<State> = {
  validate: (state, input: string) => {
    if (!input || input.length < 3 || input.length > 20) {
      state.form.hasError = true;
    } else {
      state.form.hasError = false;
    }

    return !state.form.hasError;
  },
  createTask: (state, title: string) => {
    state.tasks.push(title);
    state.form.input = '';
  },
  removeTask: (state, index: number) => {
    state.tasks.splice(index, 1);
  },
};

const view: View<State, Actions> = (
  state,
  { validate, createTask, removeTask }
) =>
  h(
    'div',
    { style: 'padding: 20px;' },
    h(
      'div',
      { class: 'field' },
      h('label', { class: 'label' }, 'Task Title'),
      h('input', {
        type: 'text',
        class: 'input',
        style: 'width: 200px;',
        value: state.form.input,
        oninput: (ev: Event) => {
          const target = ev.target as HTMLInputElement;
          state.form.input = target.value;
          validate(state, state.form.input);
        },
      }),
      h(
        'button',
        {
          type: 'button',
          class: 'button is-primary',
          style: 'margin-left: 10px;',
          onclick: () => {
            if (validate(state, state.form.input)) {
              createTask(state, state.form.input);
            }
          },
        },
        'create'
      ),
      h(
        'p',
        {
          class: 'notification',
          style: `display: ${state.form.hasError ? 'display' : 'none'}`,
        },
        '3〜20文字で入力してください'
      )
    ),
    h(
      'ul',
      { class: 'panel' },
      ...state.tasks.map((task, i) =>
        h(
          'li',
          { class: 'panel-block' },
          h(
            'button',
            {
              type: 'button',
              class: 'delete',
              style: 'margin-right: 10px;',
              onclick: () => {
                removeTask(state, i);
              },
            },
            'remove'
          ),
          task
        )
      )
    )
  );

app({ el: '#app', state: initialState, view, actions });

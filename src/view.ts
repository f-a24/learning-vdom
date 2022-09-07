type NodeType = VNode | string | number;
type Attributes = { [key: string]: string | Function };

export type View<State, Actions> = {
  (state: State, actions: Actions): VNode;
};

/**
 * 仮想DOM
 */
export type VNode = {
  nodeName: keyof HTMLElementTagNameMap;
  attributes: Attributes | null;
  children: NodeType[];
};

/**
 * 仮想DOMを作成する
 */
export const h = (
  nodeName: keyof HTMLElementTagNameMap,
  attributes: Attributes | null,
  ...children: NodeType[]
): VNode => ({ nodeName, attributes, children });

const isVNode = (node: NodeType): node is VNode =>
  typeof node !== 'string' && typeof node !== 'number';

/**
 * targetに属性を設定する
 */
const setAttributes = (target: HTMLElement, attrs: Attributes): void => {
  Object.keys(attrs).forEach(attr => {
    // onから始まる属性名はイベントとして扱う
    if (/^on/.test(attr)) {
      const eventName = attr.slice(2);
      target.addEventListener(eventName, attrs[attr] as EventListener);
    } else {
      target.setAttribute(attr, attrs[attr] as string);
    }
  });
};

/**
 * リアルDOMを生成する
 */
export const createElement = (node: NodeType): HTMLElement | Text => {
  if (!isVNode(node)) return document.createTextNode(node.toString());

  const el = document.createElement(node.nodeName);
  if (node.attributes) setAttributes(el, node.attributes);
  node.children.forEach(child => el.appendChild(createElement(child)));

  return el;
};

/**
 * None : 差分なし
 * Type : nodeの型が違う
 * Text : テキストノードが違う
 * Node : ノード名(タグ名)が違う
 * Value : inputのvalueが違う
 * Attr : 属性が違う
 */
type ChangedType = 'None' | 'Type' | 'Text' | 'Node' | 'Value' | 'Attr';

/**
 * 受け取った2つの仮想DOMの差分を検知する
 */
const hasChanged = (a: NodeType, b: NodeType): ChangedType => {
  // different type
  if (typeof a !== typeof b) return 'Type';

  // different string
  if (!isVNode(a) && a !== b) return 'Text';

  // 簡易的比較()
  if (isVNode(a) && isVNode(b)) {
    if (a.nodeName !== b.nodeName) return 'Node';
    if (
      a.attributes &&
      b.attributes &&
      a.attributes.value !== b.attributes.value
    )
      return 'Value';
    if (JSON.stringify(a.attributes) !== JSON.stringify(b.attributes))
      return 'Attr';
  }
  return 'None';
};

// NodeをReplaceしてしまうとinputのフォーカスが外れてしまうため
const updateAttributes = (
  target: HTMLElement,
  oldAttrs: Attributes | null,
  newAttrs: Attributes | null
): void => {
  // remove attrs
  Object.keys(oldAttrs || {}).forEach(attr => {
    if (!/^on/.test(attr)) target.removeAttribute(attr);
  });
  // set attrs
  Object.keys(newAttrs || {}).forEach(attr => {
    if (!/^on/.test(attr)) target.setAttribute(attr, newAttrs![attr] as string);
  });
};

/**
 * 仮想DOMの差分を検知し、リアルDOMに反映する
 */
export const updateElement = (
  parent: HTMLElement,
  oldNode: NodeType,
  newNode: NodeType,
  index = 0
): void => {
  // oldNodeがない場合は新しいノード
  if (isVNode(oldNode) && !oldNode) {
    parent.appendChild(createElement(newNode));
    return;
  }

  const target = parent.childNodes[index];

  // newNodeがない場合はそのノードを削除する
  if (isVNode(newNode) && !newNode) {
    parent.removeChild(target);
    return;
  }

  // 両方ある場合は差分検知し、パッチ処理を行う
  const changeType = hasChanged(oldNode, newNode);
  switch (changeType) {
    case 'Type':
    case 'Text':
    case 'Node':
      parent.replaceChild(createElement(newNode), target);
      return;
    case 'Value':
      // valueの変更時にNodeを置き換えてしまうとフォーカスが外れてしまうため
      (target as HTMLInputElement).value = (newNode as VNode).attributes!
        .value as string;
      return;
    case 'Attr':
      // 属性の変更は、Nodeを再作成する必要がないので更新するだけ
      updateAttributes(
        target as HTMLElement,
        (oldNode as VNode).attributes,
        (newNode as VNode).attributes
      );
      return;
    default:
      break;
  }

  // 再帰的にupdateElementを呼び出し、childrenの更新処理を行う
  if (isVNode(oldNode) && isVNode(newNode)) {
    for (
      let i = 0;
      i < newNode.children.length || i < oldNode.children.length;
      i += 1
    ) {
      updateElement(
        target as HTMLElement,
        oldNode.children[i],
        newNode.children[i],
        i
      );
    }
  }
};

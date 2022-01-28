import {
  Fragment,
  Text,
  Comment,
  createBlock,
  openBlock,
  createCommentVNode,
  isVNode,
  camelize,
} from 'vue'
import { hasOwn } from '@vue/shared'
import { debugWarn } from '../error'
import type { VNode, VNodeChild, VNodeNormalizedChildren } from 'vue'

const SCOPE = 'VNode'

export enum PatchFlags {
  TEXT = 1,
  CLASS = 2,
  STYLE = 4,
  PROPS = 8,
  FULL_PROPS = 16,
  HYDRATE_EVENTS = 32,
  STABLE_FRAGMENT = 64,
  KEYED_FRAGMENT = 128,
  UNKEYED_FRAGMENT = 256,
  NEED_PATCH = 512,
  DYNAMIC_SLOTS = 1024,
  HOISTED = -1,
  BAIL = -2,
}

export function isFragment(node: VNode): boolean
export function isFragment(node: unknown): node is VNode
export function isFragment(node: unknown): node is VNode {
  return isVNode(node) && node.type === Fragment
}

export function isText(node: VNode): boolean
export function isText(node: unknown): node is VNode
export function isText(node: unknown): node is VNode {
  return isVNode(node) && node.type === Text
}

export function isComment(node: VNode): boolean
export function isComment(node: unknown): node is VNode
export function isComment(node: unknown): node is VNode {
  return isVNode(node) && node.type === Comment
}

const TEMPLATE = 'template'
export function isTemplate(node: VNode): boolean
export function isTemplate(node: unknown): node is VNode
export function isTemplate(node: unknown): node is VNode {
  return isVNode(node) && node.type === TEMPLATE
}

/**
 * determine if the element is a valid element type rather than fragments and comment e.g. <template> v-if
 * @param node {VNode} node to be tested
 */
export function isValidElementNode(node: VNode): boolean
export function isValidElementNode(node: unknown): node is VNode
export function isValidElementNode(node: unknown): node is VNode {
  return isVNode(node) && !isFragment(node) && !isComment(node)
}

/**
 * get a valid child node (not fragment nor comment)
 * @param node {VNode} node to be searched
 * @param depth {number} depth to be searched
 */
function getChildren(
  node: VNodeNormalizedChildren | VNodeChild,
  depth: number
): undefined | VNodeNormalizedChildren | VNodeChild {
  if (isComment(node)) return
  if (isFragment(node) || isTemplate(node)) {
    return depth > 0 ? getFirstValidNode(node.children, depth - 1) : undefined
  }
  return node
}

export const getFirstValidNode = (
  nodes: VNodeNormalizedChildren,
  maxDepth = 3
): ReturnType<typeof getChildren> => {
  if (Array.isArray(nodes)) {
    return getChildren(nodes[0], maxDepth)
  } else {
    return getChildren(nodes, maxDepth)
  }
}

export function renderIf(
  condition: boolean,
  ...args: Parameters<typeof createBlock>
) {
  return condition ? renderBlock(...args) : createCommentVNode('v-if', true)
}

export function renderBlock(...args: Parameters<typeof createBlock>) {
  openBlock()
  return createBlock(...args)
}

export const getNormalizedProps = (node: VNode) => {
  if (!isVNode(node)) {
    debugWarn(SCOPE, '[getNormalizedProps] must be a VNode')
    return {}
  }

  const raw = node.props || {}
  const type = (isVNode(node.type) ? node.type.props : undefined) || {}
  const props: Record<string, any> = {}

  Object.keys(type).forEach((key) => {
    if (hasOwn(type[key], 'default')) {
      props[key] = type[key].default
    }
  })

  Object.keys(raw).forEach((key) => {
    props[camelize(key)] = raw[key]
  })

  return props
}

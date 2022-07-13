import { computed, toRef } from 'vue';

import {
  useLazyHydration,
  useHydrateWhenIdle,
  useHydrateWhenVisible,
  useHydrateOnInteraction,
  useHydrateWhenTriggered,
} from '../composables';

import { createHydrationWrapper } from '../utils';

const opts = {
  props: {
    whenIdle: {
      default: false,
      type: [Boolean, Number],
    },
    whenVisible: {
      default: false,
      type: [Boolean, Object],
    },
    onInteraction: {
      default: false,
      type: [Array, Boolean, String],
    },
    whenTriggered: {
      default: undefined,
      type: [Boolean, Object],
    },
  },
};

export default createHydrationWrapper(
  null,
  (props) => {
    const result = useLazyHydration();

    if (!result.willPerformHydration) {
      return result;
    }

    if (props.whenIdle) {
      useHydrateWhenIdle(
        result,
        props.whenIdle !== true ? props.whenIdle : undefined
      );
    }

    if (props.whenVisible) {
      useHydrateWhenVisible(
        result,
        props.whenVisible !== true ? props.whenVisible : undefined
      );
    }

    if (props.onInteraction) {
      let events;

      if (props.onInteraction !== true) {
        events = computed(() =>
          Array.isArray(props.onInteraction)
            ? props.onInteraction
            : [props.onInteraction]
        );
      }

      useHydrateOnInteraction(result, events);
    }

    if (props.whenTriggered !== undefined) {
      useHydrateWhenTriggered(result, toRef(props, 'whenTriggered'));
    }

    return result;
  },
  opts
);

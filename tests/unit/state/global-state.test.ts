/**
 * Tests for global state management
 */

import { createState } from '../../../src/state/global-state.js';

describe('global-state', () => {
  interface TestState {
    count: number;
    name: string;
    items: string[];
  }

  const initialState: TestState = {
    count: 0,
    name: 'test',
    items: [],
  };

  describe('createState', () => {
    it('creates state with initial value', () => {
      const state = createState(initialState);
      expect(state.getState()).toEqual(initialState);
    });

    it('setState updates state', () => {
      const state = createState(initialState);
      state.setState({ count: 5 });
      expect(state.getState().count).toBe(5);
    });

    it('setState merges partial updates', () => {
      const state = createState(initialState);
      state.setState({ count: 10 });

      expect(state.getState()).toEqual({
        ...initialState,
        count: 10,
      });
    });

    it('notifies subscribers on state change', () => {
      const state = createState(initialState);
      const callback = jest.fn();

      state.subscribe(callback);
      state.setState({ count: 5 });

      expect(callback).toHaveBeenCalledWith({
        ...initialState,
        count: 5,
      });
    });

    it('supports multiple subscribers', () => {
      const state = createState(initialState);
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      state.subscribe(callback1);
      state.subscribe(callback2);

      state.setState({ count: 10 });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('unsubscribe removes subscriber', () => {
      const state = createState(initialState);
      const callback = jest.fn();

      const unsubscribe = state.subscribe(callback);
      unsubscribe();

      state.setState({ count: 5 });
      expect(callback).not.toHaveBeenCalled();
    });

    it('handles nested object updates', () => {
      interface NestedState {
        user: {
          name: string;
          age: number;
        };
      }

      const nestedState = createState<NestedState>({
        user: { name: 'John', age: 30 },
      });

      nestedState.setState({
        user: { name: 'Jane', age: 25 },
      });

      expect(nestedState.getState().user).toEqual({
        name: 'Jane',
        age: 25,
      });
    });

    it('handles array updates', () => {
      const state = createState(initialState);

      state.setState({ items: ['a', 'b', 'c'] });
      expect(state.getState().items).toEqual(['a', 'b', 'c']);

      state.setState({ items: [...state.getState().items, 'd'] });
      expect(state.getState().items).toEqual(['a', 'b', 'c', 'd']);
    });
  });
});

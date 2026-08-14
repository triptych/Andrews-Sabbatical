/**
 * A single application-wide message channel built on EventTarget.
 *
 * Components never hold references to each other. They publish here and
 * subscribe here, which keeps every component independently removable.
 */
class EventBus extends EventTarget {
  /**
   * Publish a message.
   * @param {string} name  Namespaced message name, e.g. 'places:filter'.
   * @param {*} [detail]   Any payload.
   */
  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /**
   * Subscribe to a message.
   * @param {string} name
   * @param {(event: CustomEvent) => void} callback
   * @returns {() => void} Call to unsubscribe.
   */
  on(name, callback) {
    this.addEventListener(name, callback);
    return () => this.removeEventListener(name, callback);
  }
}

export const bus = new EventBus();

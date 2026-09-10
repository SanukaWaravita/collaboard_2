const previewSocket = {
  connected: false,
  on() {
    return previewSocket;
  },
  off() {
    return previewSocket;
  },
  emit(eventName, _payload, callback) {
    if (eventName === "project:join") {
      callback?.({ ok: false });
    }

    return previewSocket;
  },
  connect() {
    return previewSocket;
  },
};

export function getRealtimeSocket() {
  return previewSocket;
}

export function disconnectRealtimeSocket() {}

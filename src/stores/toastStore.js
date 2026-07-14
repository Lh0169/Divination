import { defineStore } from 'pinia'

let nextId = 0

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [],
  }),

  actions: {
    show(message, type = 'info', duration = 2500) {
      const id = ++nextId
      this.items = [...this.items, { id, message, type }]
      if (duration > 0) {
        setTimeout(() => this.remove(id), duration)
      }
      return id
    },
    success(msg) { return this.show(msg, 'success') },
    error(msg) { return this.show(msg, 'error', 4000) },
    info(msg) { return this.show(msg, 'info') },
    remove(id) {
      this.items = this.items.filter(item => item.id !== id)
    },
  },
})

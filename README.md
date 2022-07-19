# vue-immer-store
A vue plugin that uses immer-js as vue's state manager, redo/undo is supported.

### Usage

#### Install
```bash
npm i --save-dev vue-immer-store
```

#### API

```typescript
import { useImmer } from 'vue-immer-store'

const { state, redo, undo, canRedo, canUndo } = useImmer({ count: 1 })

// update draft state directly  
produce(r => {
  r.count = 1
})

// update by return value, primitive is supported
produce(() => {
  return {
    count: 2,
  }
})

/* template
<template>
    <div>{{state.count}}</div>
<template>
*/
```




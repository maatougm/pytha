<template>
  <router-view />
  <ToastContainer />
</template>

<script setup>
import ToastContainer from './components/ToastContainer.vue'
</script>

<style>
/* Global App Styles */
#app {
  min-height: 100vh;
}

/* Performance: Prevent content shift during load */
* {
  box-sizing: border-box;
}
</style>

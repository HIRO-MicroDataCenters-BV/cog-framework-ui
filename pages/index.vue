<template>
  <div><Button @click="test">fetch</Button></div>
</template>

<script setup>
const { getModels } = useApi();
const test = async () => {
  console.log("test");
  const res = await getModels();
  console.log(res);
};
</script>

<style></style>

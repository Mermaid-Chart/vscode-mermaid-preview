<script lang="ts">
  export let fill: string;
</script>
<style>
  svg {
    width: 25px;
    height: 25px;
    transition: stroke 0.3s, fill 0.3s; 
  }
</style>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <path d="M7 8L3 12L7 16" stroke={fill} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17 8L21 12L17 16" stroke={fill} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 4L10 20" stroke={fill} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

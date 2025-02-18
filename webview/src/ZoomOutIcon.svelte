<script>
    export let stroke;
  </script>
  <style>
    svg {
        width: 25px;
        height: 25px;
        transition: stroke 0.3s, fill 0.3s; 
    }
  </style>
  <svg enable-background="new 0 0 50 50" height="50px" version="1.1" viewBox="0 0 50 50" width="50px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" stroke={stroke}>
    <circle cx="21" cy="20" fill="none" r="16" stroke-linecap="round" stroke-width="2" />
    <line fill="none" stroke-linecap="round" stroke-width="4" x1="32.229" x2="45.5" y1="32.229" y2="45.5" />
    <line fill="none" stroke-linecap="round" stroke-width="2" x1="13" x2="29" y1="20" y2="20" />
  </svg>
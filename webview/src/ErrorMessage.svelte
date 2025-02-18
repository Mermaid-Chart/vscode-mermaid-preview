<script>
    export let errorMessage;
  </script>
  
  <style>
    #error-message {
        background-color: #ffdddd;
        color: #d8000c;
        padding: 10px;
        font-size: 14px;
        text-align: center;
        border: 1px solid #d8000c;
        display: none;
    }

    #error-message.errorVisible {
        display: block;
    }
  </style>
  <div id="error-message" class:errorVisible={!!errorMessage}>
    {#if errorMessage}
      <p>{errorMessage}</p>
    {/if}
  </div>
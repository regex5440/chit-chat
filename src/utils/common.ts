function debounce(function_to_debounce: Function, { duration }) {
  let timer: number | null = null;
  return (...args: any[]) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(() => {
      function_to_debounce(...args);
    }, duration) as any as number;
  };
}

function capitalize(text: string) {
  if (text) {
    return text.charAt(0).toUpperCase() + text.substring(1);
  }
}

export { debounce, capitalize };

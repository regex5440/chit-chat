import axios, { AxiosRequestConfig } from "axios";
import { useCallback, useRef } from "react";

const useUniqueGet = (): Function => {
  /* 
  //* Uses axios under the hood, to provide a data fetching machanism
  //* Does not allow duplicate requests, auto-abort of previous request used with same parameters
  */
  const controller = useRef<AbortController>();
  const callback = useCallback((url: string, config?: AxiosRequestConfig): Promise<Response> => {
    console.log("Requsted");
    if (controller.current) {
      controller.current.abort();
    }
    controller.current = new AbortController();
    const signal = controller.current.signal;
    const options = { ...config, signal };

    return axios.get(url, options);
  }, []);
  return callback;
};

const useDebounce = (function_to_debounce: Function, delay: number): Function => {
  const timeout = useRef<number>();
  const callback = useCallback((...args: any[]) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      function_to_debounce(...args);
    }, delay) as any as number;
  }, []);
  return callback;
};

export { useUniqueGet, useDebounce };

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { useCallback, useRef } from "react";

const useUniqueRequest = (axios_instance?: AxiosInstance): Function => {
  /* 
  //* Uses axios under the hood, to provide a data fetching mechanism
  //* Does not allow duplicate requests, auto-abort of previous request used with same parameters
  */
  const controller = useRef<AbortController>();
  if (axios_instance) {
    const callback = useCallback((url_path: string, method: "GET" | "POST" = "GET", data?: {}): Promise<Response> => {
      if (controller.current) {
        controller.current.abort();
      }
      controller.current = new AbortController();
      if (method === "GET") {
        return axios_instance.get(url_path, {
          signal: controller.current?.signal,
        });
      } else {
        return axios_instance.post(url_path, data, {
          signal: controller.current?.signal,
        });
      }
    }, []);
    return callback;
  } else {
    const callback = useCallback((url: string, config?: AxiosRequestConfig): Promise<Response> => {
      if (controller.current) {
        controller.current.abort();
      }
      controller.current = new AbortController();
      const signal = controller.current.signal;
      const options = { ...config, signal };

      return axios.get(url, options);
    }, []);
    return callback;
  }
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

export { useUniqueRequest, useDebounce };

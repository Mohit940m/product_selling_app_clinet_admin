import { toast, type ToastOptions } from 'react-toastify';
import Toast, { type ToastProps } from './Toast';

/** Fires a Kartly-styled toast through the app's shared react-toastify instance. */
export const showKartlyToast = (
  props: ToastProps,
  options?: ToastOptions,
): ReturnType<typeof toast> => {
  return toast(<Toast {...props} />, {
    className: '!bg-transparent !shadow-none !p-0',
    ...options,
  });
};

import { useToastContext } from '@/context/ToastContext';

export const useToast = () => {
  const { showToast, dismissToast, toasts } = useToastContext();
  return { showToast, dismissToast, toasts };
};

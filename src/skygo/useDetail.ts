import { useRef, useState } from 'react';
export function useDetail<T, Id>(load: (id: Id) => Promise<T>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const sequence = useRef(0);
  const lastId = useRef<Id | undefined>(undefined);
  const show = async (id: Id) => {
    lastId.current = id;
    const seq = ++sequence.current;
    setOpen(true);
    setLoading(true);
    setError(undefined);
    setData(undefined);
    try {
      const value = await load(id);
      if (seq === sequence.current) {
        setData(value);
        return value;
      }
    } catch (e) {
      if (seq === sequence.current) setError(e);
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
    return undefined;
  };
  return {
    open,
    loading,
    data,
    error,
    show,
    close: () => {
      ++sequence.current;
      setOpen(false);
      setLoading(false);
      setData(undefined);
      setError(undefined);
    },
    retry: () => {
      if (lastId.current !== undefined) void show(lastId.current);
    },
  };
}

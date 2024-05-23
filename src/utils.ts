import * as React from "react";
import {  useEffect, useState } from 'react'; 
import { Observable } from 'rxjs'; 

export const useObservable = <A>(fa: Observable<A>, initial: A): A => {
  const [value, setValue] = useState(() => initial);
  useEffect(() => {
    const subscription = fa.subscribe((a) => setValue(() => a));
    return () => subscription.unsubscribe();
  }, [fa]);
  return value;
};
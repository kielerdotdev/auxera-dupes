import { useState, useContext, createContext } from 'react';
import {propNames, useToast} from '@chakra-ui/react'

const Context = createContext();

export var makeToast = null

export function ToastContext(props) {
    makeToast = useToast();

    return <>{props.children}</>
}

//export function makeToast() {
 //   const context = useContext(Context);

   // return context;
//}
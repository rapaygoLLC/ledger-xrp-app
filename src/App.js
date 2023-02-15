import React, {useEffect, useState } from "react"
import { establishConnection, prepareAndSign } from "./XrpLedger"


import "./styles.css";

export function App() {

    useEffect(() => {
        establishConnection()
            .then(xrp => prepareAndSign(xrp, 1))
            .then(result => console.log(result))
            .catch(error => console.log(error));
    }, []);

    return (<div className="text-red-500 p-6 text-2xl">Hello Ledger for XRP</div>)
};
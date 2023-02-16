import React, {useEffect, useState } from "react"
// import { establishConnection, prepareAndSign } from "./XrpLedger"


import "./styles.css";
import { useLedgerNano } from "./hooks/use-ledger-nano";

// Help with autocompletion in VS Code.
const INITIAL_STATE = {
    address: "",
    bip32Path: "",
    chainCode: undefined,
    publicKey: ""
}

export function App() {
    const [ledgerAccount, setLedgerAccount] = useState(INITIAL_STATE)
    const { getXrpAccount } = useLedgerNano()

    const onClickHandler = () => {
        getXrpAccount() 
        .then(account => { 
            setLedgerAccount(account)
        })
        .catch(err => console.error(err))
    }  

    return (
    <>
        <div className="text-red-500 p-6 text-2xl">Hello Ledger for XRP</div>

        <p className="m-4">Pressing the button will give you the details of the account with the following bip path: 44'/144'/0/0/0</p>

        <button className="bg-blue-200 m-4 p-2 rounded-lg" onClick={onClickHandler}>Get Account Details</button>
    
        <p className="m-4">Address: {ledgerAccount.address}</p>
        <p className="m-4">Public Key: {ledgerAccount.publicKey}</p>
    </>
    )
};
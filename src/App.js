import React, {useEffect, useState } from "react"


import "./styles.css";
import { useLedgerNano } from "./hooks/use-ledger-nano";
import { XrpService } from "./service/XrpService";

// Help with autocompletion in VS Code.
const INITIAL_STATE = {
    address: "",
    bip32Path: "",
    chainCode: undefined,
    publicKey: ""
}

const xrpToDrops = (xrp) => {
    return xrp * 1000000;
}

const dropsToXrp = (drops) => {
    return drops / 1000000;
}

const PaymentForm = ({ledgerAccount, accountData}) => {
    const [amount, setAmount] = useState(0);
    const [destination, setDestination] = useState("");
    const [error, setError] = useState(null);
    const [payment, setPayment] = useState(null);
    const [signedTx, setSignedTx] = useState(null);
    const { signTransaction } = useLedgerNano();


    const onSubmitHandler = (e) => {
        e.preventDefault();
        setError(null);
        setSignedTx(null);
        if (!amount || !destination) {
            setError("Please enter an amount and destination address");
            return;
        }
        const payment = {
            TransactionType: "Payment",
            Account: ledgerAccount.address,
            Amount: `${xrpToDrops(parseInt(amount))}`,
            Destination: destination,
            Fee: "12",
            Sequence: accountData.Sequence,
            LastLedgerSequence: accountData.Sequence + 10,
            SigningPubKey: ledgerAccount.publicKey.toUpperCase()
        }
        setPayment(payment);
    }
    
    const onSignHandler = () => {
        setError(null);
        setSignedTx(null);

        // console.log("payment", payment, ledgerAccount);

        signTransaction(transaction=payment)
        .then(signedTx => {
            if (signedTx instanceof Error) {
                setError(`Check that the Ledger Device is unlocked and that you are using the XRP app. Error message from device: ${signedTx.message}`);
            } else {
                console.log("signedTx", signedTx);
                setSignedTx(signedTx);
                setPayment({...payment, TxnSignature: signedTx.txResult});
            }
        })
        .catch((err) => {
            console.error("err",err);
            setError(err.message);
        })
    }

    const onSubmitTxHandler = () => {
        setError(null);
        if (!signedTx) {
            setError("Please sign the transaction first");
            return;
        }
        XrpService.submitAndWait(prepared=payment, signedTransaction=signedTx.txResult)
        .then((txr) => {
            console.log("txr", txr);
            if (txr instanceof Error) {
                setError(`Error submitting transaction: ${txr.message}`);
            } else {
                setError(`Transaction submitted successfully. Transaction hash: ${txr.tx_json.hash}`);
            }
        })
        
    }

    return (
        <>
        <div className="p-1 border-1 bg-slate-200 rounded mb-2">
            {error && <div className="bg-red-200 text-red-800 p-2 rounded">{error}</div>}
            <p className="mb-2">Pay a specific address in XRP and use the ledger to sign.</p>
            <form onSubmit={onSubmitHandler}>
                <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                        Amount XRP
                    </label>             
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="amount" type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="destination">
                        Destination
                    </label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="destination" type="text" placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
                </div>
                <div className="flex items-center justify-end">
                    <button className="bg-blue-300 mb-2 p-2 rounded-lg hover:bg-blue-200" type="submit">
                        Create Payment Tx
                    </button>
                </div>
            </form>
        </div>
        {payment &&
        <div className="mb-2 p-1">
            <div className="mb-2 p-1">
                <div className="text-slate-800 text-lg font-bold">Payment Tx</div>
                <div className="mb-2">
                    <pre className="overflow-x-auto font-mono font-bold p-2 bg-slate-700 text-yellow-400 rounded">
                        {JSON.stringify(payment,null,4)}</pre>
                </div>
            </div>
            <div className="flex flex-row items-center justify-end">
                { signedTx ? 
                    <>
                        <div className="text-green-800 
                        text-lg font-bold m-2 p-2">
                            Signed Tx</div>
                        <button className="bg-blue-300 m-2 p-2 rounded-lg hover:bg-blue-200" type="button" onClick={onSubmitTxHandler}>
                        Submit Signed Tx
                    </button>
                    </>: 
                    <button className="bg-blue-300 m-2 p-2 rounded-lg hover:bg-blue-200" type="button" onClick={onSignHandler}>
                        Sign Payment Tx
                    </button>}
                
            </div>
        </div>
        }
        </>)
}

export function App() {
    const [ledgerAccount, setLedgerAccount] = useState(INITIAL_STATE);
    const { getXrpAccount } = useLedgerNano();
    const [error, setError] = useState(null);
    const [accountInfo, setAccountInfo] = useState(null);

    const onClickHandler = () => {
        setError(null);
        getXrpAccount() 
        .then(account => { 
            if (account instanceof Error) {
                setError(`Check that the Ledger Device is unlocked and that you are using the XRP app. Error message from device: ${account.message}`);
            } else {
                setLedgerAccount(account);
                XrpService.getAccountInfo(account.address)
                .then((info) => {
                    console.log("info", info);
                    setAccountInfo(info);
                });
            }
        })
        .catch((err) => {
            console.error("err",err);
            setError(err.message);
        })
    }  

    return (
    <div className="flex flex-col">
        <div className="text-slate-800 p-6 text-2xl">Hello Ledger for XRP</div>
        <div className="m-4 p-1">
            {error && <div className="bg-red-200 text-red-800 p-2 rounded">{error}</div>}
            <p className="mb-2">This is a simple example of how to use the Ledger Nano S with XRP. Pressing the button will give you the details of the account with the following bip path: 44'/144'/0/0/0</p>

            <button className="bg-blue-300 mb-2 p-2 rounded-lg hover:bg-blue-200" onClick={onClickHandler}>Get Account Details</button>
        </div>
        {ledgerAccount && accountInfo?.account_data &&
        <div className="m-3 p-1">
            <div className="mb-4 p-1">
                <div className="text-slate-800 text-lg font-bold">Account Data</div>
                <div className="mb-2">
                    <pre className="font-mono font-bold 
                        p-2 bg-slate-700 text-yellow-400 rounded">
                        {ledgerAccount && JSON.stringify(accountInfo?.account_data,null,4)}</pre>
                </div>
            
                <p>Address: {ledgerAccount.address}</p>
                <p>Public Key: {ledgerAccount.publicKey}</p>
            </div>
            <div>
                <div className="text-slate-800 text-lg font-bold">Create Payment Tx</div>
                <p className="mb-2">Use the ledger device to sign a payment payload.</p>
                <PaymentForm ledgerAccount={ledgerAccount} accountData={accountInfo?.account_data} />
            </div>
        </div>}


    </div>
    )
};
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
    const [txResult, setTxResult] = useState(null);


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
            LastLedgerSequence: accountData.Sequence + 10000,
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
                // {
                //     "id": 10,
                //     "result": {
                //         "Account": "rp49Enf8TsTrFwxNZAyBcv3F2xUNawz4uQ",
                //         "Amount": "1000000",
                //         "Destination": "rB7jaUK567mGTHKwEGPFFZ4wE3sN2z5Yi4",
                //         "Fee": "12",
                //         "LastLedgerSequence": 77853155,
                //         "Sequence": 77843155,
                //         "SigningPubKey": "029CDF69014B193AEFC9D0BFB5A4AF66AF99DDDF9B6FCB4EB5FD3D4D8B9328A039",
                //         "TransactionType": "Payment",
                //         "TxnSignature": "3043021F60D3F2F60F13F12DFF99630FF194A63A0D3066919738658A990FC101D2E6A4022070E3AC7F7FD45D8C01457633BC550346BF1567E6F5FCDA031A34A1F5A9405677",
                //         "date": 729908712,
                //         "hash": "C404C9E32378D6212A1591C3E77D7B528D224CBE1D74E1BFABC05386001F5168",
                //         "inLedger": 77848443,
                //         "ledger_index": 77848443,
                //         "meta": {
                //             "AffectedNodes": [
                //                 {
                //                     "ModifiedNode": {
                //                         "FinalFields": {
                //                             "Account": "rp49Enf8TsTrFwxNZAyBcv3F2xUNawz4uQ",
                //                             "Balance": "43999988",
                //                             "Flags": 0,
                //                             "OwnerCount": 0,
                //                             "Sequence": 77843156
                //                         },
                //                         "LedgerEntryType": "AccountRoot",
                //                         "LedgerIndex": "C5CC8A3FB486DCEDEFA3E2F782C78B98826F594BBC32DEAB5EE1DF4FEA56688F",
                //                         "PreviousFields": {
                //                             "Balance": "45000000",
                //                             "Sequence": 77843155
                //                         },
                //                         "PreviousTxnID": "92E54802472A6AB10A0606B1BD2274A8CCA7DF5CA8B7A91E4F80A81EAEBC0036",
                //                         "PreviousTxnLgrSeq": 77843155
                //                     }
                //                 },
                //                 {
                //                     "ModifiedNode": {
                //                         "FinalFields": {
                //                             "Account": "rB7jaUK567mGTHKwEGPFFZ4wE3sN2z5Yi4",
                //                             "Balance": "44999985",
                //                             "Flags": 0,
                //                             "OwnerCount": 0,
                //                             "Sequence": 77826492
                //                         },
                //                         "LedgerEntryType": "AccountRoot",
                //                         "LedgerIndex": "CF1E817CA4A1EFFD9680E9EF439B583EF44CFAADB24591DA727B8E2CA12BB6BE",
                //                         "PreviousFields": {
                //                             "Balance": "43999985"
                //                         },
                //                         "PreviousTxnID": "92E54802472A6AB10A0606B1BD2274A8CCA7DF5CA8B7A91E4F80A81EAEBC0036",
                //                         "PreviousTxnLgrSeq": 77843155
                //                     }
                //                 }
                //             ],
                //             "TransactionIndex": 40,
                //             "TransactionResult": "tesSUCCESS",
                //             "delivered_amount": "1000000"
                //         },
                //         "validated": true,
                //         "warnings": [
                //             {
                //                 "id": 1004,
                //                 "message": "This is a reporting server.  The default behavior of a reporting server is to only return validated data. If you are looking for not yet validated data, include \"ledger_index : current\" in your request, which will cause this server to forward the request to a p2p node. If the forward is successful the response will include \"forwarded\" : \"true\""
                //             }
                //         ]
                //     },
                //     "type": "response"
                // }
                // setError(`Transaction submitted successfully. Transaction hash: ${txr.tx_json.hash}`);
                setError(null);
                setSignedTx(null);
                setPayment(null);
                setTxResult(txr.result);
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

        {txResult &&
        <div className="mb-2 p-1">
            <div className="text-slate-800 text-lg font-bold">Transaction Result</div>
            <div className="mb-2">
                <pre className="overflow-x-auto font-mono font-bold p-2 bg-slate-700 text-yellow-400 rounded">
                    {JSON.stringify(txResult,null,4)}</pre>
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
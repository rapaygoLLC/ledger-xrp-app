import React, {useEffect, useState } from "react"
import { Base64 } from 'js-base64';

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

const MintNft = ({ledgerAccount}) => {
    const [minted, setMinted] = useState(false);
    const [mintedNft, setMintedNft] = useState("");
    const { signTransaction } = useLedgerNano();

    const [mintPayload, setMintPayload] = useState(false);
    const [mintSig, setMintSig] = useState(false);

    const onMintHandler = () => {
        const mintPayload = {
        	Account: ledgerAccount.address,
        	TransactionType: "NFTokenMint",
        	Flags: 8,
        	SigningPubKey: "",
        	NFTokenTaxon: 0,
        	TransferFee: 1000,
        	URI: "697066733a2f2f516d626d4e657a4d734536774a786e526272654768474e4c6d524b45744a53346d61427a4d4a4d53754a7068506b"
        }
        setMintPayload(mintPayload);
        signTransaction(mintPayload)
        .then((result) => {
            console.log("signTransaction result", result);
            setMintSig(result.txResult)
        })
        .catch((error) => {
            console.log("signTransaction error", error);
        })
    }

    const onMintSendHandler = () => {
        console.log("sending mintSig", mintSig);
    }

    return (
        <div className="bg-slate-200 rounded p-4">
            <div className="text-slate-800 text-2xl font-bold">Mint NFT</div>
            <div className="flex flex-row items-center justify-end w-full">
                {mintSig?
                <button className="bg-blue-300 mb-2 p-2 rounded-lg hover:bg-blue-200" 
                    onClick={onMintSendHandler}>Send Signed NFT Mint Payload</button>:
                <button className="bg-blue-300 mb-2 p-2 rounded-lg hover:bg-blue-200" 
                    onClick={onMintHandler}>Sign Mint NFT Payload</button>}
            </div>
            {minted && <div>
                <p>Minted NFT:</p>
                <p className="break-all font-mono">{mintedNft}</p>
            </div>}
        </div>
    )
};

const GenerateJwt = ({ledgerAccount}) => {
    const [header, setHeader] = useState({
        "alg": "SECP256K1",
        "typ": "JWT"
    });
    const [signedPayload, setSignedPayload] = useState("");
    const [payload, setPayload] = useState("");
    const [jwt, setJwt] = useState("");
    const { signPayload } = useLedgerNano();

    const onSignHandler = () => {
        const d = new Date();
        const exp = d.getTime() + (1000*60*60*24)
        const jwtb = {
            "pk": ledgerAccount.publicKey,
            "sub": ledgerAccount.address,
            "exp": exp,
            "iat": d.getTime()
        }
        setPayload(jwtb);

        const encodedPayload = `${Base64.encode(JSON.stringify(payload)).replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")}`;

        signPayload(jwtb)
        .then((result) => {
            console.log("signTransaction result", result);
            setSignedPayload(result.signedPayload);
            setJwt(`${encodedPayload}.${result.signedPayload}`);
        })
        .catch((error) => {
            console.log("signTransaction error", error);
        })
    }

    return (
        <div className="bg-slate-200 rounded p-4">
            <div className="text-slate-800 text-2xl font-bold">Generate JWT</div>
            <div className="flex flex-row items-center justify-end w-full">
                <button className="bg-blue-300 mb-2 p-2 rounded-lg hover:bg-blue-200" onClick={onSignHandler}>Sign JWT</button>
            </div>
            {jwt && <div>
                <p>JWT:</p>
                <p className="break-all font-mono">{jwt}</p>
            </div>}
        </div>
    )
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
                setError(null);
                setSignedTx(null);
                setPayment(null);
                setTxResult(txr.result);
            }
        })
        
    }

    return (
        <>
        <div className="bg-slate-200 rounded p-4">
            <div className="text-slate-800 text-2xl font-bold">Sign Payment Tx</div>
                <p className="mb-2">Use the ledger device to sign a payment payload.</p>   
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
                <div className="flex flex-row items-center justify-end w-full">
                    <button className="bg-blue-300 mb-2 p-2 rounded-lg hover:bg-blue-200" type="submit">
                        Create Payment Tx
                    </button>
                </div>
            </form>
        </div>
        {payment &&
        <div className="mb-2 p-1">
            <div className="mb-2 p-1">
                <div className="text-slate-800 text-lg font-bold">Sign Payment Tx</div>
                <div className="mb-2">
                    <pre className="max-w-[800] overflow-x-auto font-mono font-bold p-2 bg-slate-700 text-yellow-400 rounded">
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
                <pre className="max-w-[800] overflow-x-auto font-mono font-bold p-2 bg-slate-700 text-yellow-400 rounded">
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
        <div className="flex flex-row justify-center">
            <div className="flex flex-col max-w-[800] items-center">
                <div className="text-slate-800 p-6 text-3xl font-bold">Hello Ledger for XRP</div>
                <div className="m-4 p-1">
                    {error && <div className="bg-red-200 text-red-800 p-2 rounded">{error}</div>}
                    <p className="mb-2">This is a simple example of how to use the Ledger Nano S with XRP. Pressing the button will give you the details of the account with the following bip path: <span className="font-mono font-bold">44'/144'/0/0/0</span></p>
                    <div className="flex flex-row justify-end">
                        <button className="bg-blue-300 p-2 rounded-lg hover:bg-blue-200" onClick={onClickHandler}>Get Account Details</button>
                    </div>         
                </div>
                {ledgerAccount && accountInfo?.account_data &&
                <div className="m-4 p-1">
                    <div className="mb-4 p-1">
                        <div className="text-slate-800 text-lg font-bold">Account Data</div>
                        <div className="mb-2">
                            <pre className="max-w-[800] overflow-x-auto font-mono font-bold 
                                p-2 bg-slate-700 text-yellow-400 rounded">
                                {ledgerAccount && JSON.stringify(accountInfo?.account_data,null,4)}</pre>
                        </div>
                    
                        <p>Address: <span className="font-mono font-bold">{ledgerAccount.address}</span></p>
                        <p>Public Key: <span className="font-mono font-bold">{ledgerAccount.publicKey}</span></p>
                    </div>
                    <div className="mb-4 p-1">
                        <MintNft ledgerAccount={ledgerAccount}/>
                    </div>
                    <div className="mb-4 p-1">
                        <GenerateJwt ledgerAccount={ledgerAccount} />
                    </div>
                    <div className="mb-4 p-1">        
                        <PaymentForm ledgerAccount={ledgerAccount} accountData={accountInfo?.account_data} />
                    </div>
                </div>}
            </div>
    </div>
    )
};
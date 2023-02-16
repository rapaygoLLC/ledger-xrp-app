import Xrp from "@ledgerhq/hw-app-xrp";
import { encode } from 'ripple-binary-codec';


export const establishConnection = () => {
    return TransportWebUSB.create()
        .then(transport => new Xrp(transport));
}

export const fetchAddress = (xrp) => {
    return xrp.getAddress("44'/144'/0'/0/0");
}

export const signTransaction = (xrp, deviceData, seqNo) => {
    let transactionJSON = {
        TransactionType: "Payment",
        Account: deviceData.address,
        Destination: "rTooLkitCksh5mQa67eaa2JaWHDBnHkpy",
        Amount: "1000000",
        Fee: "15",
        Flags: 2147483648,
        Sequence: seqNo,
        SigningPubKey: deviceData.publicKey.toUpperCase()
    };

    const transactionBlob = encode(transactionJSON);

    console.log('Sending transaction to device for approval...');
    return xrp.signTransaction("44'/144'/0'/0/0", transactionBlob);
}

export const prepareAndSign = (xrp, seqNo) => {
    return fetchAddress(xrp)
        .then(deviceData => signTransaction(xrp, deviceData, seqNo));
}

/**
* Custom Hook to use the Ledger Nano.
*
* @param {Boolean} asAdmin Optional, if false it means this hook is used by a non-admin user. Defaults to true.
* @returns An object containing:
* - getLedgerName: A function to get the Ledger Name.
* - getLedgerTransport: A function to get the Transport object required to communicate with the Ledger Nano.
* - getXrpAccount: A function to retrieve details about a specific XRP Account.
* - getXrpAccountFromLedgerByAddress: A function to retrieve a Ledger Nano account by its address.
* - ledgerDevices: A list of Ledger Nano that were previously authorized by the user.
* - maxAccountIndex: The maximum Ledger index where we fetch an XRP account.
* - removeToasts: A function to remove the toasts which don't disappear automatically (ie. autoDismiss set to 0).
* - signTransaction: A function to sign a transaction.
*/
// export function useLedgerNano(asAdmin = true) {
//     const toast = useToast()
//     const xrpAppNotOpenedToastRef = useRefstring()
//     const ledgerpNotOpenedToastRef = useRefstring()
//     const ledgerUnresponsiveRef = useRefstring()
//     const waitingForSignatureToastRef = useRefstring()
//     const [isDeviceProcessing, setIsDeviceProcessing] = useState(false)
//     const { usersAndKeyPairs } = useAllUsers({ enabled: asAdmin })
//     const { data: accountSetups = [] } = useAccountSetups({ enabled: asAdmin })
//     const { data: acctsMetadata = [] } = useAccountsMetadata({ enabled: asAdmin })
//     const { data: junkyard = [] } = useAccountSetupJunkyard({ enabled: asAdmin })
//     /**
//      * Function to get a {@link Transport} object to communicate with the Ledger Nano.
//      * For most main actions (sign txn or get xrp account details) you need to
//      * use this function first.
//      *
//      * @returns A {@link Promise} with a Transport object.
//      */
//     const getLedgerTransport = async () => {
//       // List the devices previously authorized by the user.
//       const [errDevicesList, devicesList] = await to(TransportWebHID.list())
//       if (errDevicesList) {
//         handleError(errDevicesList)
//         return
//       }
//       if (devicesList.length === 0) {
//         // Trying to connect to the Ledger device with HID protocol
//         // This will open the pop-up next to the URL in the browser.
//         const [err, transport] = await to(TransportWebHID.create())
//         if (err) handleError(err)
//         return transport
//       } else {
//         // TODO: For now we open the first device connected.
//         // We will check with the team if we want to handle multiple devices connected.
//         // Let's do things step by step...
//         const firstDevice = devicesList[0]
//         if (firstDevice.opened) {
//           return new TransportWebHID(firstDevice)
//         } else {
//           const [err, transport] = await to(TransportWebHID.open(firstDevice))
//           if (err) handleError(err)
//           return transport
//         }
//       }
//     }
   
   
   //  /**
   //   * Function to retrieve details about a specific XRP Account.
   //   *
   //   * @param {number} acctIndex To retrieve an address at a specific index in the Ledger Nano.
   //   */
   //  const getXrpAccount = async (
   //    accountIndex: DerivationAccountType,
   //    keyIndex = 0,
   //    ledgerTransport?: Transport,
   //  ) => {
   //    let transport = ledgerTransport
   //    if (!transport) {
   //      transport = await getLedgerTransport()
   //      if (!transport) {
   //        toast.error(TRANSPORT_UNDEFINED_ERROR)
   //        return undefined
   //      }
   //    }
   //    removeToasts()
   //    const xrp = new AppXrp(transport)
   //    try {
   //      // For derivation path, read: https://learnmeabitcoin.com/technical/derivation-paths
   //      const bip32Path = 44'/144'/${accountIndex}'/0/${keyIndex}
   //      const addressDetails = (await Promise.race([
   //        xrp.getAddress(bip32Path),
   //        new Promise((_, reject) =>
   //          setTimeout(
   //            () => reject(new Error(UNRESPONSIVE_DEVICE.error)),
   //            UNRESPONSIVE_DEVICE.timeout,
   //          ),
   //        ),
   //      ])) as AwaitedReturnType<typeof xrp.getAddress>
   //      return { ...addressDetails, bip32Path }
   //    } catch (error) {
   //      if (error instanceof Error) {
   //        handleError(error)
   //      }
   //      return undefined
   //    }
   //  }
   //  /**
   //   * Retrieve a list of Ledger Nano that were previously authorized by the user.
   //   *
   //   * @returns a {@link PromiseHIDDevice[]}
   //   */
   //  const ledgerDevices = () => {
   //    return TransportWebHID.list()
   //  }
   //  /**
   //   * Method to sign a transaction blob.
   //   *
   //   * @param transport
   //   * @param serializedTxnBlob
   //   * @param isEd25519 Optionally enable or not the ed25519 curve (secp256k1 is default)
   //   * @returns The transaction signature
   //   */
   //  const signTransaction = async (
   //    serializedTxnBlob: string,
   //    bip32Path = "44'/144'/0'/0/0",
   //    isEd25519 = false,
   //  ): Promiseundefined => {
   //    const transport = await getLedgerTransport()
   //    if (!transport) {
   //      toast.error(TRANSPORT_UNDEFINED_ERROR)
   //      return
   //    }
   //    removeToasts()
   // //    toast.success(Connected to ${transport.deviceModel?.productName})
   //    const xrp = new AppXrp(transport)
   //    waitingForSignatureToastRef.current = toast.info({
   //      message: 'Check your Ledger device for signing...',
   //      autoDismissAfter: 0,
   //    })
   //    // Attempt to sign the transaction with the Ledger
   //    const [err, signature] = await to(
   //      xrp.signTransaction(bip32Path, serializedTxnBlob, isEd25519),
   //    )
   //    if (err) {
   //      handleError(err)
   //    }
   //    if (waitingForSignatureToastRef.current) {
   //      toast.remove(waitingForSignatureToastRef.current)
   //    }
   //    return signature
   //  }
   //  /**
   //   * Helper to remove some toast notifications. We typically remove them
   //   * once the user has taken an action to go to the next step.
   //   */
   //  const removeToasts = () => {
   //    // Remove the notification to tell the user to open the XRP App on the Ledger Nano.
   //    if (xrpAppNotOpenedToastRef.current) {
   //      toast.remove(xrpAppNotOpenedToastRef.current)
   //    }
   //    // Remove the notification to tell the user to unlock his Ledger Nano and to open the XRP App.
   //    if (ledgerpNotOpenedToastRef.current) {
   //      toast.remove(ledgerpNotOpenedToastRef.current)
   //    }
   //    // Remove the notification to tell the user to open their device and close any unsigned transactions.
   //    if (ledgerUnresponsiveRef.current) {
   //      toast.remove(ledgerUnresponsiveRef.current)
   //    }
   //  }
   
   //  const handleError = (error: Error) => {
   //    switch (error.message) {
   //      case 'Ledger device: UNKNOWN_ERROR (0x650f)': {
   //        // More info about the error if needed in the future:
   //        // statusCode: 25871
   //        // statusText: "UNKNOWN_ERROR"
   //        xrpAppNotOpenedToastRef.current = toast.warning({
   //          message: 'Open the Ledger Nano XRP app and retry.',
   //          autoDismissAfter: 0,
   //        })
   //        break
   //      }
   //     }
   // };
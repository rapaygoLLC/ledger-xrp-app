import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import to from 'await-to-js'
import AppXrp from '@ledgerhq/hw-app-xrp'
import { encode, encodeQuality, decode } from 'ripple-binary-codec';

const UNRESPONSIVE_DEVICE = {
    error: 'UNRESPONSIVE_DEVICE',
    timeout: 5000,
    toastMesssage:
      'Unable to connect to your Ledger Nano. Please unlock your device and clear any unsigned transactions before trying again.',
}

export const useLedgerNano = () => {
    /**
   * Function to get a {@link Transport} object to communicate with the Ledger Nano.
   * For most main actions (sign txn or get xrp account details) you need to
   * use this function first.
   *
   * @returns A {@link Promise} with a Transport object.
   */
  const getLedgerTransport = async () => {
    // List the devices previously authorized by the user.
    const [errDevicesList, devicesList] = await to(TransportWebHID.list())
    if (errDevicesList) {
    //   handleError(errDevicesList) // todo: handleError function to create
      return
    }

    if (devicesList.length === 0) {
      // Trying to connect to the Ledger device with HID protocol
      // This will open the pop-up next to the URL in the browser.
      const [err, transport] = await to(TransportWebHID.create())
     
      if (err) return // handleError(err) todo: handleError function  to create
      return transport
    } else {
      // TODO: For now we open the first device connected.
      // We will check with the team if we want to handle multiple devices connected.
      // Let's do things step by step...
      const firstDevice = devicesList[0]

      if (firstDevice.opened) {
        return new TransportWebHID(firstDevice)
      } else {
        const [err, transport] = await to(TransportWebHID.open(firstDevice))
        if (err) handleError(err)
        return transport
      }
    }
  }

  // secp256k1 is the default curve used by XRP
  const signPayload = async (
    payload,
    accountIndex = 0, // change that to get details of accounts at different indexes
    keyIndex = 0, 
    ledgerTransport) => 
  {
    let transport = ledgerTransport
    if (!transport) {
      transport = await getLedgerTransport()
      if (!transport) {
        return undefined
      }
    }

    const xrp = new AppXrp(transport)
    console.log("sign payload", payload);

    try {
      const bip32Path = `44'/144'/${accountIndex}'/0/${keyIndex}`;
      const txe = encode(payload);
      const signedPayload = await xrp.signTransaction(bip32Path, txe);
      console.log("signTransaction signedPayload", signedPayload);
      return { signedPayload, bip32Path }
    } 
    catch (error) {
      if (error instanceof Error) {
        console.error(error)
        return
        // handleError(error)
      }
      return undefined
    }  
  }



  // secp256k1 is the default curve used by XRP
  const signTransaction = async (
    transaction,
    accountIndex = 0, // change that to get details of accounts at different indexes
    keyIndex = 0, 
    ledgerTransport) => 
  {
    let transport = ledgerTransport
    if (!transport) {
      transport = await getLedgerTransport()
      if (!transport) {
        return undefined
      }
    }

    const xrp = new AppXrp(transport)
    console.log("signTransaction transaction", transaction);

    try {
      const bip32Path = `44'/144'/${accountIndex}'/0/${keyIndex}`;
      const txe = encode(transaction);
      const txResult = await xrp.signTransaction(bip32Path, txe);
      console.log("signTransaction txResult", txResult);
      return { txResult, bip32Path }
    } 
    catch (error) {
      if (error instanceof Error) {
        console.error(error)
        return
        // handleError(error)
      }
      return undefined
    }  
  }

  /**
   * Function to retrieve details about a specific XRP Account.
   *
   * @param {number} acctIndex To retrieve an address at a specific index in the Ledger Nano.
   */
  const getXrpAccount = async (
    accountIndex = 0, // change that to get details of accounts at different indexes
    keyIndex = 0, // change that to get details of accounts at different indexes
    ledgerTransport,
  ) => {
    let transport = ledgerTransport
    if (!transport) {
      transport = await getLedgerTransport()
      if (!transport) {
        return undefined
      }
    }

    const xrp = new AppXrp(transport)

    try {
      // For derivation path, read: https://learnmeabitcoin.com/technical/derivation-paths
      const bip32Path = `44'/144'/${accountIndex}'/0/${keyIndex}`

      const addressDetails = (await Promise.race([
        xrp.getAddress(bip32Path),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(UNRESPONSIVE_DEVICE.error)),
            UNRESPONSIVE_DEVICE.timeout,
          ),
        ),
      ]))

      return { ...addressDetails, bip32Path }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error)
        return error
        // handleError(error)
      }
      return undefined
    }
  }

  return {
    getXrpAccount,
    signTransaction,
    signPayload,
  }
}
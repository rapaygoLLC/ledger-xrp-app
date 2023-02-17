import {Client} from "xrpl";

const rippleServer = 'wss://s1.ripple.com/';

export const XrpService = {
    async getAccountInfo(address) {
        const client = new Client(rippleServer);
        await client.connect();
        const accountInfo = await client.request({
            command: 'account_info',
            account: address,
            ledger_index: 'validated'
        })
        .catch(e=>
        {
            console.log("getAccountInfo error", e);
            return e;
        })
        // .finally(() => client.disconnect());
        console.log("accountInfo", accountInfo.result);
        return accountInfo.result;
    },
    async submitAndWait (prepared, signedTransaction) {
        const client = new Client(rippleServer);
        await client.connect();
        prepared.TxnSignature = signedTransaction.txResult;  
        const txr = await client.submitAndWait(prepared)
        .catch(e=> 
        {
            console.log("submitAndWait error", e);
            return e;
        })
        return txr;
    }
};
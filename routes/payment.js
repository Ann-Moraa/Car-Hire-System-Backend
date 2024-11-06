const express = require("express");
const cors = require('cors');
const app = express();

app.use(cors()); 

const router = express.Router();
const fetch = require('node-fetch');

const MPESA_BASE_URL = 'https://api.safaricom.co.ke';
const businessShortCode = '5343650';
const passkey = 'a847b4de631c15a873c9763c53c43c090a57115582b8e48eb3720cddd8439d84';
const consumerKey = "4IhJFHXCg7XHHDqGDJvyHsDS7AEsIDHgZO5uA81HGlILwh4u"
const consumerSecret = "pJYMh26ZCHO0lBHogG2sBvtcmNrYIbZygZV5GH6MVdHMGZrPA8PftIvSVSniBMSZ"

router.post("/mpesa-stk-push", async (req, res) => {
    const { phone, amount } = req.body;

    // 1. Generate M-Pesa Access Token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch(
        `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
            method: 'GET',
            headers: {
                Authorization: `Basic ${auth}`,
            },
        }
    );
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Prepare STK Push Request Data
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(
        `${businessShortCode}${passkey}${timestamp}`
    ).toString('base64');
    const stkPushData = {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: businessShortCode,
        PhoneNumber: phone,
        CallBackURL: `https://main--ake-riders.netlify.app/`,
        AccountReference: 'Car Hire Payment',
        TransactionDesc: 'Payment for car hire',
    };

    // 3. Make STK Push Request
    try {
        const stkPushResponse = await fetch(
            `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(stkPushData),
            }
        );

        stkPushData = await stkPushResponse.json();
        if (stkPushData.ResponseCode === '0') { // Assuming '0' indicates success
            res.status(200).json({
                status: 'success',
                message: 'STK push initiated successfully',
                data: stkPushData // Include the original response data if needed
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: stkPushData.ResponseDescription || 'STK push failed',
                data: stkPushData // Include the original response data for debugging
            });
        }
    } catch (error) {
        console.error('Error initiating STK push:', error);
        res.status(500).json({ error: 'Failed to initiate STK push' });
    }
});

router.post("/check-transaction-status", async (req, res) => {
    const { checkoutRequestId } = req.body; // Get checkoutRequestId from request

    // 1. Generate M-Pesa Access Token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch(
        `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
            method: 'GET',
            headers: {
                Authorization: `Basic ${auth}`,
            },
        }
    );
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Prepare Transaction Status Request Data
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');
    const transactionStatusData = {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
    };

    // 3. Make Transaction Status Request
    try {
        const transactionStatusResponse = await fetch(
            `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionStatusData),
            }
        );

        const transactionStatusData = await transactionStatusResponse.json();
        res.json(transactionStatusData); // Return transaction status to client
    } catch (error) {
        console.error('Error checking transaction status:', error);
        res.status(500).json({ error: 'Failed to check transaction status' });
    }
});

module.exports = router;
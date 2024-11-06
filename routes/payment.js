const express = require("express");
const router = express.Router();
const fetch = require('node-fetch');
const fs = require('fs');
const axios = require("axios");
const moment = require("moment");


const MPESA_BASE_URL = 'https://api.safaricom.co.ke';
const businessShortCode = '5343650';
const passkey = 'a847b4de631c15a873c9763c53c43c090a57115582b8e48eb3720cddd8439d84';
const consumerKey = "4IhJFHXCg7XHHDqGDJvyHsDS7AEsIDHgZO5uA81HGlILwh4u"
const consumerSecret = "pJYMh26ZCHO0lBHogG2sBvtcmNrYIbZygZV5GH6MVdHMGZrPA8PftIvSVSniBMSZ"

// Sample API route
router.get('/api/home', (req, res) => {
    res.json({ message: 'This is a sample API route.' });
    console.log("This is a sample API route.");
  });

  router.get("/api/access_token", (req, res) => {
    getAccessToken()
      .then((accessToken) => {
        res.json({ message: "😀 Your access token is " + accessToken });
      })
      .catch(console.log);
  });

  async function getAccessToken() {
    const url =
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  
    const auth =
      "Basic " +
      new Buffer.from(consumerKey + ":" + consumerSecret).toString("base64");
  
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: auth,
        },
      });
      const accessToken = response.data.access_token;
      return accessToken;
    } catch (error) {
      throw error;
    }
  }

  router.post('/stkpush', (req, res) => {
    let phoneNumber = req.body.phone;
    const amount = req.body.amount;
  
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.slice(1);
    }
  
    getAccessToken()
      .then((accessToken) => {
        const url =
          "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + accessToken;
        const timestamp = moment().format("YYYYMMDDHHmmss");
        const password = new Buffer.from(
          businessShortCode +
          passkey +
          timestamp
        ).toString("base64");
  
        axios
          .post(
            url,
            {
              BusinessShortCode: businessShortCode,
              Password: password,
              Timestamp: timestamp,
              TransactionType: "CustomerBuyGoodsOnline",
              Amount: amount,
              PartyA: phoneNumber,
              PartyB: businessShortCode,
              PhoneNumber: phoneNumber,
              CallBackURL: `https://main--ake-riders.netlify.app/`,
              AccountReference: 'Car Hire Payment',
              TransactionDesc: 'Payment for car hire',
            },
            {
              headers: {
                Authorization: auth,
              },
            }
          )
          .then((response) => {
            //SEND BACK A JSON RESPONSE TO THE CLIENT
            console.log(response.data);
            res.status(200).json({
              msg: "Request is successful done ✔✔. Please enter mpesa pin to complete the transaction",
              status: true,
            });
  
          })
          .catch((error) => {
            console.log(error);
            //res.status(500).send("❌ Request failed");
            console.log(error);
            res.status(500).json({
              msg: "Request failed",
              status: false,
            });
          });
      })
      .catch(console.log);
  });
  
  
  
  router.post("/api/callback", (req, res) => {
    console.log("STK PUSH CALLBACK");
    const merchantRequestID = req.body.Body.stkCallback.MerchantRequestID;
    const checkoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
    const resultCode = req.body.Body.stkCallback.ResultCode;
    const resultDesc = req.body.Body.stkCallback.ResultDesc;
    const callbackMetadata = req.body.Body.stkCallback.CallbackMetadata;
    const amount = callbackMetadata.Item[0].Value;
    const mpesaReceiptNumber = callbackMetadata.Item[1].Value;
    const transactionDate = callbackMetadata.Item[3].Value;
    const phoneNumber = callbackMetadata.Item[4].Value;
  
    console.log("MerchantRequestID:", merchantRequestID);
    console.log("CheckoutRequestID:", checkoutRequestID);
    console.log("ResultCode:", resultCode);
    console.log("ResultDesc:", resultDesc);
    
    console.log("Amount:", amount);
    console.log("MpesaReceiptNumber:", mpesaReceiptNumber);
    console.log("TransactionDate:", transactionDate);
    console.log("PhoneNumber:", phoneNumber);
  
    var json = JSON.stringify(req.body);
    fs.writeFile("stkcallback.json", json, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("STK PUSH CALLBACK STORED SUCCESSFULLY");
    });
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
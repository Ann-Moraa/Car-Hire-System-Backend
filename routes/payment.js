const express = require("express");
const router = express.Router();
const fs = require('fs');
const axios = require("axios");
const moment = require("moment");

const businessShortCode = '5343650';
const passkey = 'a847b4de631c15a873c9763c53c43c090a57115582b8e48eb3720cddd8439d84';
const consumerKey = "4IhJFHXCg7XHHDqGDJvyHsDS7AEsIDHgZO5uA81HGlILwh4u"
const consumerSecret = "pJYMh26ZCHO0lBHogG2sBvtcmNrYIbZygZV5GH6MVdHMGZrPA8PftIvSVSniBMSZ"

// Sample API route
router.get('/home', (req, res) => {
    res.json({ message: 'This is a sample API route.' });
    console.log("This is a sample API route.");
  });

  router.get("/access_token", (req, res) => {
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

  router.post('/stkpush', async (req, res) => { // Made the route handler async
    try {
        let phoneNumber = req.body.phone;
        const amount = req.body.amount;

        if (!phoneNumber || !amount) {
            return res.status(400).json({
                msg: "Missing phone number or amount in request body.",
                status: false
            });
        }

        if (phoneNumber.startsWith("0")) {
          phoneNumber = "254" + phoneNumber.slice(1);
        }

        // Use await with getAccessToken since it's an async function
        const accessToken = await getAccessToken();

        const url =
          "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + accessToken;
        const timestamp = moment().format("YYYYMMDDHHmmss");
        const password = new Buffer.from(
          businessShortCode +
          passkey +
          timestamp
        ).toString("base64");

        try {
            const response = await axios.post( // Use await with axios.post
                url,
                {
                  BusinessShortCode: businessShortCode,
                  Password: password,
                  Timestamp: timestamp,
                  TransactionType: "CustomerBuyGoodsOnline", // Double-check this if using Paybill
                  Amount: amount,
                  PartyA: phoneNumber,
                  PartyB: businessShortCode,
                  PhoneNumber: phoneNumber,
                  CallBackURL: `https://car-hire-system-backend.onrender.com/api/payment/callback`,
                  AccountReference: 'Car Hire Payment',
                  TransactionDesc: 'Payment for car hire',
                },
                {
                  headers: {
                    Authorization: auth,
                  },
                }
            );

            // SEND BACK A JSON RESPONSE TO THE CLIENT (if Safaricom accepts the request)
            console.log("STK Push request sent to Safaricom:", response.data);
            res.status(200).json({
              msg: "STK Push request successful. Please check your phone to complete the transaction.",
              status: true,
              safaricomResponse: response.data // Optionally include Safaricom's response data
            });

        } catch (axiosError) { // Catch errors specifically from the axios call to Safaricom
            console.error("Error sending STK Push request to Safaricom:", axiosError.response ? axiosError.response.data : axiosError.message);
            res.status(500).json({
              msg: "Failed to initiate STK Push with Safaricom.",
              status: false,
              error: axiosError.response ? axiosError.response.data : axiosError.message // Include Safaricom's error details
            });
        }

    } catch (generalError) { // Catch any other errors in the route handler
        console.error("An unexpected error occurred in /stkpush:", generalError);
        res.status(500).json({
            msg: "An internal server error occurred.",
            status: false,
            error: generalError.message // Include the general error message
        });
    }
});
  
  router.post("/callback", (req, res) => {
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
      
      // Send a 200 OK response back to Safaricom
      res.status(200).json({ message: "Callback received successfully" });
    });
  });

module.exports = router;